export type NavigationDirection = 'up' | 'down';
export type NavigationEdge = 'start' | 'end';

export interface NavItem {
    row: number;
    col: number;
}

export interface GridNavEngineConfig<I extends NavItem> {
    getItems: () => I[];
    onFocusChange: (index: number, item: I | null, options: { scroll: boolean }) => void;
    onActivate?: (index: number, item: I | null) => void;
}

export class NavigationEngine<I extends NavItem> {
    private items: I[] = [];
    private activeIndex = -1;
    private readonly getItemsFn: () => I[];
    private readonly onFocusChange: (index: number, item: I | null, options: { scroll: boolean }) => void;
    private readonly onActivate?: (index: number, item: I | null) => void;

    constructor(config: GridNavEngineConfig<I>) {
        this.getItemsFn = config.getItems;
        this.onFocusChange = config.onFocusChange;
        this.onActivate = config.onActivate;
    }

    private applyFocus(index: number, scroll: boolean): void {
        const item = index >= 0 && index < this.items.length ? this.items[index] : null;
        this.activeIndex = item ? index : -1;
        this.onFocusChange(this.activeIndex, item, { scroll });
    }

    init(): void {
        document.addEventListener('keydown', this.handleKeyDown);
        this.refreshItems(true);
    }

    refreshItems(preserveActive: boolean = true): void {
        const oldActiveIndex = this.activeIndex;
        this.items = this.getItemsFn();

        if (preserveActive && oldActiveIndex >= 0 && oldActiveIndex < this.items.length) {
            this.applyFocus(oldActiveIndex, false);
        } else if (!preserveActive) {
            if (this.activeIndex >= this.items.length) {
                this.applyFocus(-1, false);
            } else {
                const item = this.activeIndex >= 0 ? this.items[this.activeIndex] ?? null : null;
                this.onFocusChange(this.activeIndex, item, { scroll: false });
            }
        }
    }

    moveHorizontal(delta: number): void {
        if (!this.items.length) return;
        if (this.activeIndex === -1) {
            this.applyFocus(delta < 0 ? this.items.length - 1 : 0, true);
            return;
        }
        let next = this.activeIndex + delta;
        if (next < 0) next = 0;
        if (next >= this.items.length) next = this.items.length - 1;
        this.applyFocus(next, true);
    }

    moveVertical(direction: NavigationDirection): void {
        if (!this.items.length) return;
        if (this.activeIndex === -1) {
            this.applyFocus(0, true);
            return;
        }
        const current = this.items[this.activeIndex];
        const targetRow = direction === 'up' ? current.row - 1 : current.row + 1;

        let bestIndex = -1;
        let bestDistance = Number.POSITIVE_INFINITY;

        this.items.forEach((item, index) => {
            if (item.row === targetRow) {
                const distance = Math.abs(item.col - current.col);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestIndex = index;
                }
            }
        });

        if (bestIndex !== -1) {
            this.applyFocus(bestIndex, true);
        }
    }

    moveToEdge(edge: NavigationEdge): void {
        if (!this.items.length) return;
        this.applyFocus(edge === 'start' ? 0 : this.items.length - 1, true);
    }

    activateCurrent(): void {
        if (!this.items.length) return;
        if (this.activeIndex === -1) {
            this.applyFocus(0, true);
        }
        const item = this.activeIndex >= 0 && this.activeIndex < this.items.length ? this.items[this.activeIndex] : null;
        if (!item) return;
        if (this.onActivate) {
            this.onActivate(this.activeIndex, item);
        }
    }

    handleKeyDown = (event: KeyboardEvent): void => {
        const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
        if (activeTag && (activeTag === 'INPUT' || activeTag === 'TEXTAREA')) return;
        if (event.altKey || event.metaKey || event.ctrlKey) return;

        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                this.moveHorizontal(-1);
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.moveHorizontal(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.moveVertical('up');
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.moveVertical('down');
                break;
            case 'Home':
                event.preventDefault();
                this.moveToEdge('start');
                break;
            case 'End':
                event.preventDefault();
                this.moveToEdge('end');
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                this.activateCurrent();
                break;
            default:
                return;
        }
    };

    getActiveIndex(): number {
        return this.activeIndex;
    }

    setActiveIndex(index: number, options?: { scroll?: boolean }): void {
        const scroll = options?.scroll ?? true;
        if (index < 0 || index >= this.items.length) {
            this.applyFocus(-1, scroll);
            return;
        }
        this.applyFocus(index, scroll);
    }

    destroy(): void {
        document.removeEventListener('keydown', this.handleKeyDown);
        this.items = [];
        this.activeIndex = -1;
    }
}


export interface DomNavItem extends NavItem {
    el: HTMLElement;
}

export interface BuildGridOptions<TExtra = {}> {
    rowTolerance?: number;
    filterHidden?: boolean;
    mapExtra?: (el: HTMLElement, row: number, col: number) => TExtra;
}

export type GridItem<TExtra = {}> = DomNavItem & TExtra;
export type MatNavItem<TExtra = {}> = GridItem<TExtra>;

export function buildDomGrid<TExtra = {}>(
    raw: HTMLElement[],
    options: BuildGridOptions<TExtra> = {},
): Array<GridItem<TExtra>> {
    const {
        rowTolerance = 8,
        filterHidden = true,
        mapExtra,
    } = options;

    const source = filterHidden
        ? raw.filter((el) => el.offsetParent !== null)
        : raw.slice();

    if (!source.length) return [];

    const sorted = source.sort(
        (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
    );

    const rows: HTMLElement[][] = [];
    for (const el of sorted) {
        const top = el.getBoundingClientRect().top;
        let row = rows.find((r) => Math.abs(r[0].getBoundingClientRect().top - top) <= rowTolerance);
        if (!row) {
            row = [];
            rows.push(row);
        }
        row.push(el);
    }

    const out: Array<GridItem<TExtra>> = [];
    rows.forEach((r, ri) => {
        r.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
        r.forEach((el, ci) => {
            const base: DomNavItem = {
                el,
                row: ri,
                col: ci,
            };
            const extra = mapExtra ? mapExtra(el, ri, ci) : ({} as TExtra);
            out.push({
                ...base,
                ...extra,
            });
        });
    });

    return out;
}

export interface InjectStyleOptions {
    id?: string;
    append?: boolean;
}

export function ensureNavStyleElement(
    cssText: string,
    options: InjectStyleOptions = {},
): HTMLStyleElement {
    const id = options.id ?? 'MAT_NAV_STYLE';
    let styleEl = document.getElementById(id) as HTMLStyleElement | null;

    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = id;
        document.head.appendChild(styleEl);
    }

    if (options.append && styleEl.textContent) {
        styleEl.textContent += '\n' + cssText;
    } else {
        styleEl.textContent = cssText;
    }

    return styleEl;
}

export interface FocusChangeOptions {
    focusClass?: string;
    enableScroll?: boolean;
    scrollIntoViewOptions?: ScrollIntoViewOptions;
}

export function createMatFocusChangeHandler<I extends DomNavItem>(
    getItems: () => I[],
    options: FocusChangeOptions = {},
): (index: number, item: I | null, opts: { scroll: boolean }) => void {
    const focusClass = options.focusClass ?? 'mat-focus';
    const enableScroll = options.enableScroll !== false;
    const scrollOptions: ScrollIntoViewOptions = options.scrollIntoViewOptions ?? {
        block: 'center',
        inline: 'center',
        behavior: 'smooth',
    };

    return (_index, item, opts) => {
        const items = getItems();
        items.forEach((i) => i.el.classList.remove(focusClass));
        if (!item) return;
        item.el.classList.add(focusClass);
        if (enableScroll && opts.scroll) {
            item.el.scrollIntoView(scrollOptions);
        }
    };
}

export interface NavMutationObserverOptions extends MutationObserverInit {
    target?: Node;
    preserveActive?: boolean;
}

export function attachNavMutationObserver<I extends NavItem>(
    engine: NavigationEngine<I>,
    options: NavMutationObserverOptions = {},
): MutationObserver {
    const {
        target = document.body,
        preserveActive = true,
        ...observerInit
    } = options;

    const init: MutationObserverInit = {
        childList: true,
        subtree: true,
        ...observerInit,
    };

    const observer = new MutationObserver(() => {
        engine.refreshItems(preserveActive);
    });

    observer.observe(target, init);
    return observer;
}
