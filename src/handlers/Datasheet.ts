import {
    attachNavMutationObserver,
    buildDomGrid,
    createMatFocusChangeHandler,
    ensureNavStyleElement,
    MatNavItem,
    NavigationEngine
} from '../modules/navigation/navigationEngine';
import { Settings } from '../global'

export type DatasheetItem = MatNavItem<{
    episodeHref: string | null;
}>;

export function initDatasheetNav(settings: Settings) {
    const styleCSS = `
.mat-focus .gen-episode-img {
    outline: 2px solid #3F9FFF;
    outline-offset: 3px;
    border-radius: 6px;
}

.mat-focus {
    transform: scale(1.04);
    box-shadow: 0 14px 32px rgba(10, 14, 23, 0.85);
    transition: transform 0.18s ease-out, box-shadow 0.18s ease-out;
}
.owl-stage-outer .owl-stage {
    width: max-content !important;
    display: block;
    align-content: center;
    padding-left: 17px;
    overflow: hidden;
    min-height: 240px;
}

.owl-nav {
    top: 42% !important;
}


`;

    ensureNavStyleElement(styleCSS);

    let domItems: DatasheetItem[] = [];

    function collectEpisodeElements(): HTMLElement[] {
        return Array.from(document.querySelectorAll('.owl-stage .owl-item')) as HTMLElement[];
    }

    function getEpisodeHref(el: HTMLElement): string | null {
        const playButton = el.querySelector('.gen-movie-action a.gen-button') as HTMLAnchorElement | null;
        if (playButton?.href) return playButton.href;

        const titleLink = el.querySelector('.gen-episode-info h3 a') as HTMLAnchorElement | null;
        if (titleLink?.href) return titleLink.href;

        const onClick = el.querySelector('.gen-episode-img')?.getAttribute('onclick') || '';
        const match = onClick.match(/['"](resz\/\d+\/)['"]/);
        if (match && match[1]) return window.location.origin + '/' + match[1];

        return null;
    }

    function buildDatasheetGrid(raw: HTMLElement[]): DatasheetItem[] {
        return buildDomGrid(raw, {
            rowTolerance: 8,
            filterHidden: true,
            mapExtra: (el) => ({
                episodeHref: getEpisodeHref(el),
            }),
        });
    }

    const baseFocusChange = createMatFocusChangeHandler<DatasheetItem>(
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
    );

    const onFocusChange: typeof baseFocusChange = (index, item, opts) => {
        const container = document.querySelector('.owl-stage-outer .owl-stage') as HTMLElement | null;
        let previousTransform: string | null = null;

        if (container && opts.scroll) {
            previousTransform = container.style.transform;
            container.style.transform = 'none';
        }

        baseFocusChange(index, item, opts);

        if (container && opts.scroll) {
            window.requestAnimationFrame(() => {
                setTimeout(() => {
                    if (previousTransform !== null) {
                        container.style.transform = previousTransform;
                    } else {
                        container.style.removeProperty('transform');
                    }
                }, 250);
            });
        }
    };

    const engine = new NavigationEngine<DatasheetItem>({
        getItems: () => {
            const raw = collectEpisodeElements();
            domItems = buildDatasheetGrid(raw);
            domItems.forEach((it, idx) => {
                it.el.setAttribute('data-mat-nav-item', idx.toString());
                if (!it.el.classList.contains('mat-nav-item')) it.el.classList.add('mat-nav-item');
            });
            return domItems;
        },
        onFocusChange,
        onActivate: (_index, item) => {
            if (!item) return;
            const target = item.episodeHref;
            if (target) {
                window.location.href = target;
            }
        },
        settings,
        settingsID: 'episode'
    });

    const observer = attachNavMutationObserver(engine, {
        childList: true,
        subtree: true,
        preserveActive: true,
    });

    engine.init();

    const onPageShow = (e: PageTransitionEvent) => {
        if (e.persisted) {
            if (engine.getActiveIndex() === -1) engine.refreshItems(false);
        }
    };

    const onPageHide = () => {
        observer.disconnect();
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
