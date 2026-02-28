import Logger from './Logger'
import { Settings } from './global'
import { createKeyBind } from './lib/shortcuts'

class MAT {
    settings: Settings
    version: string
    eap: boolean
    constructor() {
        this.settings = this.getDefaultSettings()
        this.version = chrome.runtime.getManifest().version || '0.0.0'
        this.eap = false
    }

    /**
     * Load the settings from the storage
     *
     * Behaviour:
     * - Tries to load the settings from the preferred storage (local or sync)
     * - If the preferred storage is not available, it tries to load the other storage
     * - If the other storage is not available, it loads the default settings
     * @returns {Promise<Settings>} The settings from the storage
     * @since v0.1.8
     * @example
     * MAT.loadSettings().then((settings) => {
     *    console.log(settings);
     * });
     *
     */
    loadSettings(): Promise<Settings> {
        return new Promise((resolve) => {
            chrome.storage.sync.get('settings', (result) => {
                if (result && result.settings) {
                    this.settings = result.settings as Settings
                    this.eap = this.settings.eap
                    Logger.success('Settings loaded from storage', true)
                    resolve(this.settings)
                } else {
                    this.settings = this.getDefaultSettings()
                    Logger.warn('Settings not found in sync storage', true)
                    resolve(this.settings)
                }
            })
        })
    }

    /**
     * Update the dynamic rules based on the settings
     */
    updateDynamicRules() {
        chrome.declarativeNetRequest.getDynamicRules((rules) => {
            chrome.declarativeNetRequest
                .updateDynamicRules({
                    removeRuleIds: rules.map((rule) => rule.id),
                    addRules: [],
                })
                .then(async () => {
                    const randomId = Math.floor(Math.random() * 1000)
                    const newRule =
                            ([
                                  {
                                      id: randomId,
                                      action: { type: 'block' },
                                      condition: {
                                          urlFilter: '*://magyaranime.eu/js/magyaranime_player.js*',
                                          resourceTypes: ['script'],
                                      },
                                  },
                                  {
                                      id: randomId + 1,
                                      action: { type: 'block' },
                                      condition: {
                                          urlFilter: '*://magyaranime.eu/js/player/*',
                                          resourceTypes: ['script'],
                                      },
                                  },
                                  {
                                      id: randomId + 2,
                                      action: { type: 'block' },
                                      condition: {
                                          urlFilter: '*://cdn.jsdelivr.net/npm/disable-devtool*',
                                          resourceTypes: ['script'],
                                      },
                                  },
                                  {
                                      id: randomId + 3,
                                      action: { type: 'block' },
                                      condition: {
                                          urlFilter: '*://magyaranime.eu/data/search/search.js*',
                                          resourceTypes: ['script'],
                                      },
                                  },
                                  {
                                      id: randomId + 4,
                                      action: { type: 'block' },
                                      condition: {
                                          urlFilter: '*://magyaranime.eu/css/player/player_noframe.css?*',
                                          resourceTypes: ['stylesheet'],
                                      },
                                  },
                              ] as chrome.declarativeNetRequest.Rule[])
                    chrome.declarativeNetRequest
                        .updateDynamicRules({
                            addRules: newRule,
                            removeRuleIds: [],
                        })
                        .catch((error) => {
                            Logger.error(`Failed to add new dynamic rules: ${error}`, true)
                        })
                })
                .catch((error) => {
                    Logger.error(`Failed to remove existing dynamic rules: ${error}`, true)
                })
        })
    }

    /**
     * Save the settings to the storage
     * and update the dynamic rules based on the settings
     */
    saveSettings(): Promise<boolean> {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ settings: this.settings }, () => {
                if (chrome.runtime.lastError) {
                    Logger.error('Error: Settings not saved', true)
                    Logger.error(chrome.runtime.lastError.message || 'Unknown error', true)
                    resolve(false)
                }
                this.updateDynamicRules()
                this.eap = this.settings.eap
                Logger.success('Settings saved', true)
                resolve(true)
            })
        })
    }

    /**
     * Get the default settings of the extension
     * @returns {Settings} The default settings of the extension
     */
    getDefaultSettings(): Settings {
        return {
            forwardSkip: { /* Forward skip settings (default: ctrl + →) */
                enabled: true,
                time: 85,
                keyBind: createKeyBind(true, false, false, false, 'ArrowRight'),
            },
            backwardSkip: { /* Backward skip settings (default: ctrl + ←) */
                enabled: true,
                time: 85,
                keyBind: createKeyBind(true, false, false, false, 'ArrowLeft'),
            },
            nextEpisode: { /* Next episode settings (default: alt + →)  */
                enabled: true,
                keyBind: createKeyBind(false, true, false, false, 'ArrowRight'),
            },
            previousEpisode: { /* Previous episode settings (default: alt + ←) */
                enabled: true,
                keyBind: createKeyBind(false, true, false, false, 'ArrowLeft'),
            },
            autoNextEpisode: {
                /* Auto next episode (default: false) (on last episode of the season it won't skip) */
                enabled: false,
                time: 60 /* Time to skip to the next episode before the end of the episode (in seconds) */,
            },
            autoplay: { /* Autoplay (default: true) */ enabled: true },
            bookmarks: {
                /* Bookmarks settings */ enabled: true /* Bookmarks (default: true) */,
            },
            history: {
                enabled: true /* Resume watching (default: true) */,
                mode: 'ask' /* Resume mode (default: "ask") (ask, auto) */,
                clearAfter: '1m' /* Clear time (default: "1m") (1w, 1m, 3m, 1y, never) (deletes an entry after the specified time, if no changes were made) */,
            },
            skip: {
                /* Skip settings */
                time: 5 /* Value to skip in seconds using arrow keys only (default: 5) */,
            },

            advanced: {/* Advanced settings */
                consoleLog: false /* Console log (default: false) (enables console logging for debugging purposes) */,
                downloadName: '%title% - %episode%.rész (%MAT%)',
                /* Download name (default: "%title% - %episode%.rész (%MAT%)") */
                /*
                 * Download name variables:
                 * %title% - Title of the anime (e.g. "One Piece")
                 * %episode% - Episode number (e.g. 1)
                 * %0episode% - Episode number with leading zero (e.g. 01 instead of 1)
                 * %MAT% - "MATweaks" text
                 * %source% - Source name (e.g. "indavideo")
                 * %quality% - Quality of the video (e.g. "720p")
                 * %group% - Fansub group name (e.g. "Akio Fansub")
                 */
            },
            nav: { /* Navigation settings */
                searchBox: {
                    enabled: true /* Search box in the navigation bar (default: true) */,
                    openSearch: createKeyBind(true, false, false, false, 'Enter'),
                    open: createKeyBind(false, false, true, false, '/'),
                    close: createKeyBind(false, false, false, false, 'Escape'),
                },
                episode: { /* Episode page navigation */
                    enabled: true /* Enable episode page navigation (default: true) */,
                    open: createKeyBind(false, false, false, false, 'Enter')
                },
                mainPage: { /* Main page navigation */
                    enabled: true /* Enable main page navigation (default: true) */,
                    open: createKeyBind(false, false, false, false, 'Enter')
                }
            },
            plyr: {
                /* Plyr settings */
                design: false /* Plyr design settings (default: false) */,
                shortcuts: {
                    playPause:[
                        createKeyBind(false, false, false, false, ' '),
                        createKeyBind(false, false, false, false, 'k'),
                    ],
                    muteUnmute: [
                        createKeyBind(false, false, false, false, 'm'),
                    ],
                    fullscreen: [
                        createKeyBind(false, false, false, false, 'f'),
                    ],
                    volumeUp: [
                        createKeyBind(false, false, false, false, 'ArrowUp'),
                    ],
                    volumeDown: [
                        createKeyBind(false, false, false, false, 'ArrowDown'),
                    ]
                },
                plugins: {
                    aniSkip: {
                        enabled: true /* Enable AniSkip plugin (default: true) */,
                        skips: ['op', 'ed'] /* Skip types (default: ['op', 'ed']) */,
                        keyBind: createKeyBind(false, false, false, false, 's') /* Key bind to toggle skipping (default: S) */ ,
                        autoSkip: []
                    }
                }
            },
            eap: false /* Enable Early Access Program (default: false) */,
            version: this.version /* Version of the extension */,
        }
    }

    /**
     * Load Plyr CSS from local storage
     * @returns {Promise<string>} The CSS string
     */
    loadPlyrCSS(): Promise<string> {
        return new Promise((resolve) => {
            chrome.storage.local.get('plyrCSS', (result) => {
                resolve((result.plyrCSS as string) || this.getDefaultPlyrCSS())
            })
        })
    }

    /**
     * Save Plyr CSS to local storage
     * @param {string} css - The CSS string to save
     */
    savePlyrCSS(css: string): Promise<boolean> {
        // Limit the CSS string length to 100000 characters
        if (css.length > 100000) {
            Logger.error('Error: Plyr CSS is too long (max 100000 characters)', true)
            return Promise.resolve(false)
        }

        return new Promise((resolve) => {
            chrome.storage.local.set({ plyrCSS: css }, () => {
                if (chrome.runtime.lastError) {
                    Logger.error('Error: Plyr CSS not saved', true)
                    resolve(false)
                } else {
                    Logger.success('Plyr CSS saved', true)
                    resolve(true)
                }
            })
        })
    }
    /**
     * Get the default Plyr CSS
     * @returns {string} The default CSS
     */
    getDefaultPlyrCSS(): string {
        return `:root {
    --plyr-color-main: #00b3ff;
    --plyr-video-background: #000000ff;
    --plyr-badge-background: #4a5464;
    --plyr-badge-text-color: #ffffff;
    --plyr-video-control-color: #ffffff;
    --plyr-video-control-color-hover: #ffffff;
    --plyr-menu-background: #ffffffe6;
    --plyr-menu-color: #4a5464;
    --plyr-menu-arrow-color: #728197;
    --plyr-menu-border-color: #dcdfe5;
    --plyr-menu-border-shadow-color: #ffffff;
    --plyr-menu-back-border-color: #dcdfe5;
    --plyr-range-fill-background: #00b3ff;
    --plyr-progress-loading-background: #23282f99;
    --plyr-video-progress-buffered-background: #ffffff40;
    --plyr-range-thumb-background: #ffffff;
    --plyr-video-range-thumb-active-shadow-color: #ffffff80;
    --plyr-tooltip-background: #ffffffe6;
    --plyr-tooltip-color: #4a5464;
}`
    }
}

export default new MAT()
