import { Settings } from '../../global'
import { checkShortcut } from '../../lib/shortcuts'
import { addCSS } from '../../lib/dom-utils'
import History, { Anime } from '../../History'
import MagyarAnime from '../../MagyarAnime'

export type NavigationDirection = 'up' | 'down'
export type NavigationEdge = 'start' | 'end'

export interface NavItem {
    row: number
    col: number
}

export interface GridNavEngineConfig<I extends NavItem> {
    getItems: () => I[]
    onFocusChange: (index: number, item: I | null, options: { scroll: boolean }) => void
    onActivate?: (index: number, item: I | null) => void
    settings: Settings
    settingsID?: keyof Settings['nav']
}

export class NavigationEngine<I extends NavItem> {
    private items: I[] = []
    private activeIndex = -1
    private readonly getItemsFn: () => I[]
    private readonly onFocusChange: (index: number, item: I | null, options: { scroll: boolean }) => void
    private readonly onActivate?: (index: number, item: I | null) => void
    private readonly settings: Settings
    private readonly settingsID: keyof Settings['nav']
    private readonly history = History
    private isInitialized = false

    constructor(config: GridNavEngineConfig<I>) {
        this.getItemsFn = config.getItems
        this.onFocusChange = config.onFocusChange
        this.onActivate = config.onActivate
        this.settings = config.settings
        this.settingsID = (config.settingsID ?? 'mainPage') as keyof Settings['nav']
        this.history = History
        this.history.loadData()
    }

    private applyFocus(index: number, scroll: boolean): void {
        const item = index >= 0 && index < this.items.length ? this.items[index] : null
        this.activeIndex = item ? index : -1
        this.onFocusChange(this.activeIndex, item, { scroll })
    }

    init(): void {
        if (!this.isInitialized) {
            document.addEventListener('keydown', this.handleKeyDown)
            this.isInitialized = true
        }
        this.refreshItems(true)
    }

    refreshItems(preserveActive: boolean = true): void {
        const oldActiveIndex = this.activeIndex
        this.items = this.getItemsFn()

        if (preserveActive && oldActiveIndex >= 0 && oldActiveIndex < this.items.length) {
            this.applyFocus(oldActiveIndex, false)
        } else if (!preserveActive) {
            if (this.activeIndex >= this.items.length) {
                this.applyFocus(-1, false)
            } else {
                const item = this.activeIndex >= 0 ? (this.items[this.activeIndex] ?? null) : null
                this.onFocusChange(this.activeIndex, item, { scroll: false })
            }
        }
    }

    moveHorizontal(delta: number): void {
        if (!this.items.length) return
        if (this.activeIndex === -1) {
            this.applyFocus(delta < 0 ? this.items.length - 1 : 0, true)
            return
        }
        let next = this.activeIndex + delta
        if (next < 0) next = 0
        if (next >= this.items.length) next = this.items.length - 1
        this.applyFocus(next, true)
    }

    moveVertical(direction: NavigationDirection): void {
        if (!this.items.length) return
        if (this.activeIndex === -1) {
            this.applyFocus(0, true)
            return
        }
        const current = this.items[this.activeIndex]
        const targetRow = direction === 'up' ? current.row - 1 : current.row + 1

        let bestIndex = -1
        let bestDistance = Number.POSITIVE_INFINITY

        this.items.forEach((item, index) => {
            if (item.row === targetRow) {
                const distance = Math.abs(item.col - current.col)
                if (distance < bestDistance) {
                    bestDistance = distance
                    bestIndex = index
                }
            }
        })

        if (bestIndex !== -1) {
            this.applyFocus(bestIndex, true)
        }
    }

    moveToEdge(edge: NavigationEdge): void {
        if (!this.items.length) return
        this.applyFocus(edge === 'start' ? 0 : this.items.length - 1, true)
    }

    activateCurrent(): void {
        if (!this.items.length) return
        if (this.activeIndex === -1) {
            if (this.settingsID === 'episode') {
                const epData = this.history.getLastUpdated(new MagyarAnime(document, location.href).ANIME.getId())
                if (epData){
                    History.openEpisode(epData.episode.epID)
                    // close the page if opened from history
                    window.setTimeout(() => {window.close()}, 500)
                    // if the above doesn't work, fallback to selecting the first episode
                    this.applyFocus(0, true)
                }
                else {
                     const btn = (document.querySelector('.gen-button.gen-button-dark.adatlap_gomb3') as HTMLButtonElement | null)
                         ?? (document.querySelector('.gen-button.gen-button-dark.adatlap_gomb1') as HTMLButtonElement | null);
                     if (btn) {
                        btn.click();
                     }
                }
                return
            }
            this.applyFocus(0, true)
        }
        const item = this.activeIndex >= 0 && this.activeIndex < this.items.length ? this.items[this.activeIndex] : null
        if (!item) return
        if (this.onActivate) {
            this.onActivate(this.activeIndex, item)
        }
    }

    handleKeyDown = (event: KeyboardEvent): void => {
        const activeTag = (document.activeElement as HTMLElement | null)?.tagName
        if (activeTag && (activeTag === 'INPUT' || activeTag === 'TEXTAREA')) return

        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault()
                this.moveHorizontal(-1)
                break
            case 'ArrowRight':
                event.preventDefault()
                this.moveHorizontal(1)
                break
            case 'ArrowUp':
                event.preventDefault()
                this.moveVertical('up')
                break
            case 'ArrowDown':
                event.preventDefault()
                this.moveVertical('down')
                break
            case 'Home':
                event.preventDefault()
                this.moveToEdge('start')
                break
            case 'End':
                event.preventDefault()
                this.moveToEdge('end')
                break
            default:
                if (checkShortcut(event, this.settings.nav[this.settingsID].open)) {
                    event.preventDefault()
                    this.activateCurrent()
                }
                break
        }
    }

    getActiveIndex(): number {
        return this.activeIndex
    }

    destroy(): void {
        if (this.isInitialized) {
            document.removeEventListener('keydown', this.handleKeyDown)
            this.isInitialized = false
        }
        this.items = []
        this.activeIndex = -1
    }
}

export interface DomNavItem extends NavItem {
    el: HTMLElement
}

export interface BuildGridOptions<TExtra = {}> {
    rowTolerance?: number
    filterHidden?: boolean
    mapExtra?: (el: HTMLElement, row: number, col: number) => TExtra
}

export type GridItem<TExtra = {}> = DomNavItem & TExtra
export type MatNavItem<TExtra = {}> = GridItem<TExtra>

export function buildDomGrid<TExtra = {}>(
    raw: HTMLElement[],
    options: BuildGridOptions<TExtra> = {},
): Array<GridItem<TExtra>> {
    const { rowTolerance = 8, filterHidden = true, mapExtra } = options

    const source = filterHidden ? raw.filter((el) => el.offsetParent !== null) : raw.slice()

    if (!source.length) return []

    const sorted = source.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)

    const rows: HTMLElement[][] = []
    for (const el of sorted) {
        const top = el.getBoundingClientRect().top
        let row = rows.find((r) => Math.abs(r[0].getBoundingClientRect().top - top) <= rowTolerance)
        if (!row) {
            row = []
            rows.push(row)
        }
        row.push(el)
    }

    const out: Array<GridItem<TExtra>> = []
    rows.forEach((r, ri) => {
        r.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)
        r.forEach((el, ci) => {
            const base: DomNavItem = {
                el,
                row: ri,
                col: ci,
            }
            const extra = mapExtra ? mapExtra(el, ri, ci) : ({} as TExtra)
            out.push({
                ...base,
                ...extra,
            })
        })
    })

    return out
}

export interface InjectStyleOptions {
    id?: string
    append?: boolean
}

export function ensureNavStyleElement(cssText: string, options: InjectStyleOptions = {}): HTMLStyleElement {
    const id = options.id ?? 'MAT_NAV_STYLE'

    let styleEl = document.getElementById(id) as HTMLStyleElement | null

    if (!styleEl) return addCSS(cssText, id)

    if (options.append && styleEl.textContent) styleEl.textContent += '\n' + cssText
    else styleEl.textContent = cssText

    return styleEl
}

export interface FocusChangeOptions {
    focusClass?: string
    enableScroll?: boolean
    scrollIntoViewOptions?: ScrollIntoViewOptions
}

export function createMatFocusChangeHandler<I extends DomNavItem>(
    getItems: () => I[],
    options: FocusChangeOptions = {},
): (index: number, item: I | null, opts: { scroll: boolean }) => void {
    const focusClass = options.focusClass ?? 'mat-focus'
    const enableScroll = options.enableScroll !== false
    const scrollOptions: ScrollIntoViewOptions = options.scrollIntoViewOptions ?? {
        block: 'center',
        inline: 'center',
        behavior: 'smooth',
    }

    return (_index, item, opts) => {
        const items = getItems()
        items.forEach((i) => i.el.classList.remove(focusClass))
        if (!item) return
        item.el.classList.add(focusClass)
        if (enableScroll && opts.scroll) {
            item.el.scrollIntoView(scrollOptions)
        }
    }
}

export interface NavMutationObserverOptions extends MutationObserverInit {
    target?: Node
    preserveActive?: boolean
}

export function attachNavMutationObserver<I extends NavItem>(
    engine: NavigationEngine<I>,
    options: NavMutationObserverOptions = {},
): MutationObserver {
    const { target = document.body, preserveActive = true, ...observerInit } = options

    const init: MutationObserverInit = {
        childList: true,
        subtree: true,
        ...observerInit,
    }

    const observer = new MutationObserver(() => {
        engine.refreshItems(preserveActive)
    })

    observer.observe(target, init)
    return observer
}
