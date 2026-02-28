import { NavigationEngine, MatNavItem, buildDomGrid, ensureNavStyleElement, createMatFocusChangeHandler, attachNavMutationObserver } from '../modules/navigation/navigationEngine';
import { Settings } from '../global'

type MainPageKbItem = MatNavItem<{
    episodeHref: string | null;
    datasheetHref: string | null;
}>;

function getWeeklyTopSection(): HTMLElement | null {
    try {
        return (
            Array.from(document.querySelectorAll('section')).find((sec) =>
                /Heti toplista/i.test(
                    (sec.querySelector('h4.gen-heading-title') as HTMLElement)?.textContent || '',
                ),
            ) || null
        )
    } catch {
        return null
    }
}
function getTopMixedSectionItems(): HTMLElement[] {
    try {
        const topSection = Array.from(
            document.querySelectorAll('section.top.sec-mar.gen-section-padding-2'),
        )[0] as HTMLElement | undefined
        if (!topSection) return []

        return Array.from(
            topSection.querySelectorAll('.anime-box.bg-color-black'),
        ) as HTMLElement[]
    } catch {
        return []
    }
}
function collectRawElements(): HTMLElement[] {
    let weeklyTopSection = getWeeklyTopSection()
    const history = Array.from(document.querySelectorAll('#elozmenyek_helye .elozmeny_item')) as HTMLElement[]
    const episodes = Array.from(
        document.querySelectorAll(
            '#epizodLista .gen-movie-contain, #epizodLista .col-xl-2 .gen-movie-contain',
        ),
    ) as HTMLElement[]
    const weekly = weeklyTopSection
        ? (Array.from(
            weeklyTopSection.querySelectorAll('.owl-stage .owl-item .gen-movie-contain'),
        ) as HTMLElement[])
        : []
    const topMixed = getTopMixedSectionItems()
    return [...history, ...weekly, ...episodes, ...topMixed]
}
function getEpisodeLink(el: HTMLElement): string | null {
    const a = el.querySelector(
        '.gen-movie-meta-holder a.badge-primary, .gen-movie-meta-holder a.badge-success',
    ) as HTMLAnchorElement
    if (a?.href) return a.href

    const selfLink = (el as unknown as HTMLAnchorElement).href
    if (selfLink) return selfLink
    const firstLink = el.querySelector('a') as HTMLAnchorElement | null
    if (firstLink?.href && /\/resz\//.test(firstLink.href)) return firstLink.href

    return null
}
function getDatasheetLink(el: HTMLElement): string | null {
    const aTitle = el.querySelector('.gen-movie-info h3 a') as HTMLAnchorElement
    if (aTitle?.href) return aTitle.href
    const btn = el.querySelector('a.gen-button') as HTMLAnchorElement
    if (btn?.href) return btn.href
    const imgParent = el.querySelector('.gen-movie-img') as HTMLElement
    const oc = (imgParent?.getAttribute('onclick') || '').match(/['"](leiras\/\d+\/)['"]/)
    if (oc && oc[1]) return location.origin + '/' + oc[1]
    const selfOC = (el.getAttribute('onclick') || '').match(/['"](leiras\/\d+\/)['"]/)
    if (selfOC && selfOC[1]) return location.origin + '/' + selfOC[1]

    const anyLink = el.querySelector('a') as HTMLAnchorElement | null
    if (anyLink?.href) return anyLink.href

    return null
}

export function initMainPageNavigation(settings: Settings) {
    const styleCSS = `
.elozmenyek_helye_magas {
    height: 330px !important;
    display: flow;
    align-content: center;
    scroll-behavior: smooth;
    padding-left: 4px;
    padding-right: 4px;
}

section .row {
    margin: 0 !important;
}

.mat-focus .gen-movie-img {
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
}

.mat-focus img {
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
}

.mat-focus.anime-box:hover img {
    transform: scale(1.07) !important;
}

.mat-nav-item {
    transition: transform 0.18s ease-out, box-shadow 0.18s ease-out;
}

.mat-nav-item:focus,
.mat-nav-item:focus-within {
    outline: none;
    z-index: 9999;
}

.mat-focus,
.mat-nav-item:focus .gen-movie-contain,
.mat-nav-item:focus-within .gen-movie-contain {
    position: relative;
    outline: none;
}

.mat-focus::before,
.mat-nav-item:focus .gen-movie-contain::before,
.mat-nav-item:focus-within .gen-movie-contain::before {
    content: "";
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 8px;
    border: 2px solid #3F9FFF;
    box-shadow:
        0 0 0 1px rgba(10, 14, 23, 0.7),
        0 10px 24px rgba(10, 14, 23, 0.9);
    pointer-events: none;
    z-index: 10000;
}

.mat-focus,
.mat-nav-item:focus,
.mat-nav-item:focus-within {
    transform: scale(1.04);
    box-shadow: 0 14px 32px rgba(10, 14, 23, 0.85);
}

.mat-focus.elozmeny_item img {
    border-radius: 5px;
}

`;
    ensureNavStyleElement(styleCSS);

    let domItems: MainPageKbItem[] = [];

    const engine = new NavigationEngine<MainPageKbItem>({
        getItems: () => {
            const raw = collectRawElements();
            domItems = buildDomGrid(raw, {
                rowTolerance: 8,
                filterHidden: true,
                mapExtra: (el) => ({
                    episodeHref: getEpisodeLink(el),
                    datasheetHref: getDatasheetLink(el),
                }),
            });
            domItems.forEach((it, idx) => {
                it.el.setAttribute('data-mat-nav-item', idx.toString());
                if (!it.el.classList.contains('mat-nav-item')) it.el.classList.add('mat-nav-item');
                const hasImg = !!it.el.querySelector('.gen-movie-img');
                const hasAction = !!it.el.querySelector('.gen-movie-action');
                if (hasImg && hasAction) it.el.classList.add('mat-adv-hover');
                else it.el.classList.remove('mat-adv-hover');
            });
            return domItems;
        },
        onFocusChange: createMatFocusChangeHandler<MainPageKbItem>(
            () => domItems,
            {
                focusClass: 'mat-focus',
                enableScroll: true,
                scrollIntoViewOptions: {
                    block: 'center',
                    inline: 'center',
                    behavior: 'smooth',
                },
            },
        ),
        onActivate: (_index, item) => {
            if (!item) return;
            const target = item.episodeHref || item.datasheetHref;
            if (target) {
                window.location.href = target;
            }
        },
        settings,
        settingsID: 'mainPage'
    });

    // Attach a general nav mutation observer (keeps items in sync on DOM changes)
    const generalObserver = attachNavMutationObserver(engine, {
        childList: true,
        subtree: true,
        preserveActive: true,
    });

    // Specialized observer: wait for #elozmenyek_helye to have .elozmeny_item children,
    // then recompute everything and reset the nav state fully (clear active index).
    const checkElozmenyek = (): boolean => {
        const container = document.getElementById('elozmenyek_helye') as HTMLElement | null;
        if (!container) return false;
        const items = container.querySelectorAll('.elozmeny_item');
        if (items && items.length > 0) {
            // Recompute and reset navigation state fully
            engine.refreshItems(true);
            return true;
        }
        return false;
    };

    const eloObserver = new MutationObserver(() => {
        if (checkElozmenyek()) {
            eloObserver.disconnect();
        }
    });

    // If items already exist, run immediately; otherwise observe the whole document until they appear
    if (!checkElozmenyek()) {
        eloObserver.observe(document.body, { childList: true, subtree: true });
    }

    engine.init();

    const onPageShow = (e: PageTransitionEvent) => {
        if (e.persisted) {
            if (engine.getActiveIndex() === -1) engine.refreshItems(false);
        }
    };

    const onPageHide = () => {
        eloObserver.disconnect();
        generalObserver.disconnect();
        engine.destroy();
        window.removeEventListener('pageshow', onPageShow);
        window.removeEventListener('pagehide', onPageHide);
    };

    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('pagehide', onPageHide);

    return {
        destroy: () => {
            onPageHide();
        },
    };
}
