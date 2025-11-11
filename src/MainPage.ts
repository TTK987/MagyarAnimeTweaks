/**
 * Main page handler
 *
 * Features:
 * - Arrow keys to navigate through the episodes and datasheets
 * - Enter to play the selected episode or to open the anime datasheet page
 *
 * @returns {void}
 * @since v0.1.9.7
 */
export default function MainPage() {
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
    const weeklyTopSection = getWeeklyTopSection()

    const styleCSS = `
.gen-carousel-movies-style-2 .gen-movie-contain.mat-focus.mat-adv-hover .gen-movie-img:before{opacity:1;}
.gen-carousel-movies-style-2 .gen-movie-contain.mat-focus.mat-adv-hover .gen-movie-img img{-webkit-transform:scale(1.2);transform:scale(1.2);}
.gen-carousel-movies-style-2 .gen-movie-contain.mat-focus.mat-adv-hover .gen-movie-action{opacity:1;}

.gen-movie-contain.mat-focus::before,
.elozmeny_item.mat-focus::before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:11;box-shadow:inset 0 0 0 2px #3F9FFF,0 0 0 3px rgba(63,159,255,.22),0 10px 28px -12px rgba(63,159,255,.38);}

.gen-movie-contain.mat-focus:not(.mat-adv-hover),
.elozmeny_item.mat-focus{outline:2px solid #3F9FFF;outline-offset:-2px;position:relative;}
.gen-movie-contain.mat-focus:not(.mat-adv-hover)::after,
.elozmeny_item.mat-focus::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(63,159,255,.18),rgba(63,159,255,0));pointer-events:none;mix-blend-mode:screen;}
.gen-movie-contain.mat-focus:not(.mat-adv-hover) .gen-movie-img img{transform:none !important;filter:brightness(1.08) contrast(1.04);}

.gen-movie-contain.mat-focus.mat-adv-hover .gen-movie-img:before{opacity:1;}
.gen-movie-contain.mat-focus.mat-adv-hover .gen-movie-img img{-webkit-transform:scale(1.2);transform:scale(1.2);}
.gen-movie-contain.mat-focus.mat-adv-hover .gen-movie-action{opacity:1;}

.gen-movie-contain.mat-focus, .elozmeny_item.mat-focus{box-shadow:0 2px 6px -2px rgba(0,0,0,.45),0 6px 18px -8px rgba(0,0,0,.35);}
`

    const styleEl = document.getElementById('MAT_KB_NAV_STYLE') as HTMLStyleElement | null
    if (styleEl) styleEl.textContent = styleCSS
    else {
        const style = document.createElement('style')
        style.id = 'MAT_KB_NAV_STYLE'
        style.textContent = styleCSS
        document.head.appendChild(style)
    }

    type KBItem = {
        el: HTMLElement
        getEpisodeLink: () => string | null
        getDatasheetLink: () => string | null
        row: number
        col: number
    }

    let items: KBItem[] = []
    let activeIndex = -1

    function collectRawElements(): HTMLElement[] {
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
        return [...history, ...weekly, ...episodes]
    }

    function getEpisodeLink(el: HTMLElement): string | null {
        const a = el.querySelector(
            '.gen-movie-meta-holder a.badge-primary, .gen-movie-meta-holder a.badge-success',
        ) as HTMLAnchorElement
        return a?.href || null
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
        return null
    }

    function buildGrid(raw: HTMLElement[]): KBItem[] {
        const tolerance = 8
        const visible = raw.filter((el) => el.offsetParent !== null)
        const sorted = visible.sort(
            (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
        )
        const rows: HTMLElement[][] = []
        for (const el of sorted) {
            const top = el.getBoundingClientRect().top
            let row = rows.find((r) => Math.abs(r[0].getBoundingClientRect().top - top) <= tolerance)
            if (!row) {
                row = []
                rows.push(row)
            }
            row.push(el)
        }
        const out: KBItem[] = []
        rows.forEach((r, ri) => {
            r.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)
            r.forEach((el, ci) => {
                out.push({
                    el,
                    getEpisodeLink: () => getEpisodeLink(el),
                    getDatasheetLink: () => getDatasheetLink(el),
                    row: ri,
                    col: ci,
                })
            })
        })
        return out
    }

    function refreshItems(preserveActive = true) {
        const raw = collectRawElements()
        items = buildGrid(raw)
        // classify advanced hover structure presence
        items.forEach((it, idx) => {
            it.el.setAttribute('data-mat-kb-item', idx.toString())
            const hasImg = !!it.el.querySelector('.gen-movie-img')
            const hasAction = !!it.el.querySelector('.gen-movie-action')
            if (hasImg && hasAction) it.el.classList.add('mat-adv-hover')
            else it.el.classList.remove('mat-adv-hover')
        })
        if (preserveActive && activeIndex >= 0 && activeIndex < items.length) {
            applyFocus(activeIndex, false)
        }
    }

    function applyFocus(index: number, scroll = true) {
        items.forEach((i) => i.el.classList.remove('mat-focus'))
        const target = items[index]
        if (!target) return
        target.el.classList.add('mat-focus')
        activeIndex = index
        if (scroll) target.el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
    }

    function moveHorizontal(delta: number) {
        if (items.length === 0) return
        if (activeIndex === -1) {
            if (delta < 0) applyFocus(items.length - 1)
            else applyFocus(0)
            return
        }
        let next = activeIndex + delta
        if (next < 0) next = 0
        if (next >= items.length) next = items.length - 1
        applyFocus(next)
    }

    function moveVertical(direction: 'up' | 'down') {
        if (items.length === 0) return
        if (activeIndex === -1) {
            applyFocus(0)
            return
        }
        const current = items[activeIndex]
        const targetRow = direction === 'up' ? current.row - 1 : current.row + 1
        const sameCol = items.find((i) => i.row === targetRow && i.col === current.col)
        if (sameCol) {
            applyFocus(items.indexOf(sameCol))
            return
        }
        const rowItems = items.filter((i) => i.row === targetRow)
        if (rowItems.length === 0) return
        let closest = rowItems[0]
        let best = Math.abs(closest.col - current.col)
        for (const it of rowItems) {
            const d = Math.abs(it.col - current.col)
            if (d < best) {
                best = d
                closest = it
            }
        }
        applyFocus(items.indexOf(closest))
    }

    function moveToEdge(edge: 'start' | 'end') {
        if (items.length === 0) return
        if (edge === 'start') applyFocus(0)
        else applyFocus(items.length - 1)
    }

    function activateCurrent() {
        if (items.length === 0) return
        if (activeIndex === -1) {
            applyFocus(0)
        }
        const current = items[activeIndex]
        if (!current) return
        const ep = current.getEpisodeLink()
        const ds = current.getDatasheetLink()
        const target = ep || ds
        if (target) window.location.href = target
    }

    function onKeyDown(event: KeyboardEvent) {
        if (['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement).tagName)) return
        if (event.altKey || event.metaKey || event.ctrlKey) return
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault(); moveHorizontal(-1); break
            case 'ArrowRight':
                event.preventDefault(); moveHorizontal(1); break
            case 'ArrowUp':
                event.preventDefault(); moveVertical('up'); break
            case 'ArrowDown':
                event.preventDefault(); moveVertical('down'); break
            case 'Home':
                event.preventDefault(); moveToEdge('start'); break
            case 'End':
                event.preventDefault(); moveToEdge('end'); break
            case 'Enter':
            case ' ':
                event.preventDefault(); activateCurrent(); break
            default:
                return
        }
    }

    document.addEventListener('keydown', onKeyDown)

    const observer = new MutationObserver(() => refreshItems(true))
    observer.observe(document.body, { childList: true, subtree: true })

    setTimeout(() => refreshItems(true), 0)

    window.addEventListener('beforeunload', () => {
        document.removeEventListener('keydown', onKeyDown)
        observer.disconnect()
    })
}
