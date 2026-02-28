const STORAGE_KEY = 'matTheatreMode'

interface TheatreModeConfig {
    leftColSelector: string
    rightColSelector: string
    headerSelector: string
    playerSelector: string
    toggleButtonId: string
}

const defaultConfig: TheatreModeConfig = {
    leftColSelector: '#leftCol',
    rightColSelector: '#rightCol',
    headerSelector: '#gen-header',
    playerSelector: '#sectionPlayer, #VideoPlayer',
    toggleButtonId: 'matTheatreToggle',
}

class TheatreMode {
    private config: TheatreModeConfig
    private isExpanded: boolean = false
    private initialized: boolean = false
    private domObserver: MutationObserver | null = null

    constructor(config: Partial<TheatreModeConfig> = {}) {
        this.config = { ...defaultConfig, ...config }
        this.isExpanded = this.loadState()
    }

    /**
     * Initialize the theatre mode feature
     * Uses a small observer delay if wrapper/plyr are not yet present.
     */
    public init(): void {
        if (this.initialized) return
        this.initialized = true
        this.injectStyles()
        this.createToggleButton()

        // If the core player elements are not ready yet, observe DOM until they appear
        const hasWrapper = !!document.getElementById('MATweaks-player-wrapper')
        const hasPlyr = !!document.querySelector('.plyr')

        if (!hasWrapper || !hasPlyr) {
            this.startDomObserver()
        } else {
            this.applyState(this.isExpanded)
        }

        this.setupKeyboardShortcut()
    }

    /**
     * Toggle theatre mode on/off
     */
    public toggle(): void {
        this.isExpanded = !this.isExpanded
        this.applyState(this.isExpanded)
        this.saveState(this.isExpanded)
    }

    /**
     * Check if theatre mode is currently active
     */
    public isActive(): boolean {
        return this.isExpanded
    }

    private startDomObserver(): void {
        if (this.domObserver) return

        this.domObserver = new MutationObserver(() => {
            const wrapper = document.getElementById('MATweaks-player-wrapper')
            const plyr = document.querySelector('.plyr')

            if (wrapper && plyr) {
                this.domObserver?.disconnect()
                this.domObserver = null
                // Now that everything exists, apply current state once
                this.applyState(this.isExpanded)
            }
        })

        this.domObserver.observe(document.body, {
            childList: true,
            subtree: true,
        })
    }

    /**
     * Apply the theatre mode state to the DOM
     */
    private applyState(expanded: boolean): void {
        const leftCol = document.querySelector(this.config.leftColSelector) as HTMLElement | null
        const rightCol = document.querySelector(this.config.rightColSelector) as HTMLElement | null
        const header = document.querySelector(this.config.headerSelector) as HTMLElement | null
        const playerSection = document.querySelector(this.config.playerSelector) as HTMLElement | null
        const playerWrapper = document.getElementById('MATweaks-player-wrapper') as HTMLElement | null
        const videoPlayerContainer = document.querySelector('#VideoPlayer') as HTMLElement | null
        const plyrElement = document.querySelector('.plyr') as HTMLElement | null
        const externalBtn = document.getElementById(this.config.toggleButtonId) as HTMLElement | null

        // If core layout elements are missing (e.g., before video loads), do nothing
        if (!leftCol || !rightCol || !playerSection) {
            return
        }

        console.log('Applying theatre mode state:', { expanded, leftCol, rightCol, header, playerSection, playerWrapper, plyrElement })
        if (leftCol) {
            if (expanded) {
                leftCol.classList.remove('col-lg-9')
                leftCol.classList.add('col-lg-12', 'mat-theatre-expanded')
            } else {
                leftCol.classList.remove('col-lg-12', 'mat-theatre-expanded')
                leftCol.classList.add('col-lg-9')
            }
        }

        if (rightCol) {
            if (expanded) {
                rightCol.classList.remove('col-lg-3')
                rightCol.classList.add('col-lg-12', 'mat-theatre-sidebar')
            } else {
                rightCol.classList.remove('col-lg-12', 'mat-theatre-sidebar')
                rightCol.classList.add('col-lg-3')
            }
        }

        if (header) {
            header.classList.toggle('mat-theatre-header', expanded)
        }

        if (playerSection) {
            playerSection.classList.toggle('mat-theatre-player', expanded)
        }

        // Wrapper: full width, but no container-style max-width limitation
        if (playerWrapper) {
            if (expanded) {
                playerWrapper.style.setProperty('max-width', '100%', 'important')
                playerWrapper.style.setProperty('width', '100%', 'important')
                playerWrapper.style.removeProperty('max-height')
                playerWrapper.style.removeProperty('height')
            } else {
                playerWrapper.style.removeProperty('max-width')
                playerWrapper.style.removeProperty('width')
            }
        }

        // #VideoPlayer container: can still have its own constraints if needed
        if (videoPlayerContainer) {
            if (expanded) {
                videoPlayerContainer.style.setProperty('max-width', '100%', 'important')
                videoPlayerContainer.style.setProperty('width', '100%', 'important')
            } else {
                videoPlayerContainer.style.removeProperty('max-width')
                videoPlayerContainer.style.removeProperty('width')
            }
        }

        // Plyr element: match wrapper width, but don't impose extra height logic
        if (plyrElement) {
            if (expanded) {
                plyrElement.style.setProperty('max-width', '100%', 'important')
                plyrElement.style.setProperty('width', '100%', 'important')
                plyrElement.style.removeProperty('height')
            } else {
                plyrElement.style.removeProperty('max-width')
                plyrElement.style.removeProperty('width')
            }
        }

        if (externalBtn) {
            externalBtn.classList.toggle('mat-theatre-active', expanded)
        }

        // Dispatch custom event for other components to react
        document.dispatchEvent(new CustomEvent('matTheatreModeChange', {
            detail: { expanded }
        }))
    }


    /**
     * Inject theatre mode CSS styles
     */
    private injectStyles(): void {
        if (document.getElementById('mat-theatre-styles')) return

        const style = document.createElement('style')
        style.id = 'mat-theatre-styles'
        style.textContent = `

            /* Sidebar moves below in theatre */
            .mat-theatre-sidebar {
                margin-top: 16px !important;
            }

            /* Header is fully hidden in theatre mode for maximum focus */
            .mat-theatre-header {
                display: none !important;
            }

            /* Player container: adjust top padding in theatre mode (but not too much) */
            .mat-theatre-player {
                padding-top: 6px !important;
            }

            /* Compact icon-only theatre button next to Session ID */
            .mat-theatre-icon-btn {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 20px !important;
                height: 20px !important;
                padding: 0 !important;
                margin-left: 4px !important;
                border-radius: 4px !important;
                border: 1px solid rgba(32, 93, 170, 0.3) !important;
                background-color: #0a0e17 !important;
                color: inherit !important;
                cursor: pointer !important;
            }

            .mat-theatre-icon-btn:hover {
                background-color: #1a1f2e !important;
                border-color: rgba(32, 93, 170, 0.5) !important;
            }

            .mat-theatre-icon-btn svg {
                width: 12px !important;
                height: 12px !important;
            }

            .mat-theatre-icon-btn .mat-theatre-icon-collapse {
                display: none !important;
            }

            .mat-theatre-icon-btn.mat-theatre-active .mat-theatre-icon-expand {
                display: none !important;
            }

            .mat-theatre-icon-btn.mat-theatre-active .mat-theatre-icon-collapse {
                display: block !important;
            }

            #leftCol.col-lg-12 #VideoPlayer {
                max-height: unset !important;
            }

            @media (max-width: 991px) {
                .mat-theatre-icon-btn {
                    display: none !important;
                }
            }
        `
        document.head.appendChild(style)
    }

    private createToggleButton(): void {
        let theatreBtn = document.createElement('button')
        theatreBtn.id = 'matTheatreToggleBtn'
        theatreBtn.className = 'mat-theatre-icon-btn' + (this.isExpanded ? ' mat-theatre-active' : '')
        theatreBtn.innerHTML = `
        <svg class="mat-theatre-icon-expand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        <svg class="mat-theatre-icon-collapse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="10" rx="2" ry="2"></rect>
            <path d="M17 2l-5 5-5-5"></path>
            <path d="M17 22l-5-5-5 5"></path>
        </svg>
    `
        theatreBtn.onclick = () => {
            toggleTheatreMode()
            theatreBtn.classList.toggle('mat-theatre-active')
        }

        const sessionIdElem = document.querySelector('#sessionInfoContainer')
        if (sessionIdElem) {
            sessionIdElem.appendChild(theatreBtn)
        }
    }

    /**
     * Setup keyboard shortcut (T key) to toggle theatre mode
     */
    private setupKeyboardShortcut(): void {
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement as HTMLElement)?.tagName)) {
                return
            }

            // T key to toggle theatre mode
            if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault()
                this.toggle()
            }
        })
    }

    /**
     * Save theatre mode state to localStorage
     */
    private saveState(expanded: boolean): void {
        try {
            localStorage.setItem(STORAGE_KEY, String(expanded))
        } catch (e) {
            console.warn('Failed to save theatre mode state:', e)
        }
    }

    /**
     * Load theatre mode state from localStorage
     */
    private loadState(): boolean {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'true'
        } catch (e) {
            return false
        }
    }

    /**
     * Cleanup theatre mode (remove styles and reset state)
     */
    public destroy(): void {
        this.applyState(false)

        const style = document.getElementById('mat-theatre-styles')
        if (style) style.remove()
    }
}

// Export a singleton instance and the class
let theatreModeInstance: TheatreMode | null = null

export function initTheatreMode(config?: Partial<TheatreModeConfig>): TheatreMode {
    if (!theatreModeInstance) {
        theatreModeInstance = new TheatreMode(config)
        theatreModeInstance.init()
    }
    return theatreModeInstance
}

export function getTheatreMode(): TheatreMode | null {
    return theatreModeInstance
}

export function toggleTheatreMode(): void {
    theatreModeInstance?.toggle()
}

export function isTheatreModeActive(): boolean {
    return theatreModeInstance?.isActive() ?? false
}

export default TheatreMode
