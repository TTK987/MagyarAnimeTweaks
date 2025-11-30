import Logger from './Logger'
import { SettingsV019 } from './global'

class MAT {
    __ACTIONS__: {
        SEEK: string
        SOURCE_URL: string
        GET_SOURCE_URL: string
        FRAME_LOADED: string
        LOAD_BOOKMARK: string
        INDA_NO_VIDEO: string
        IFRAME: {
            FRAME_LOADED: string
            AUTO_NEXT_EPISODE: string
            NEXT_EPISODE: string
            PREVIOUS_EPISODE: string
            CURRENT_TIME: string
            REPLACE_PLAYER: string
            TOGGLE_PLAY: string
            VOL_UP: string
            VOL_DOWN: string
            TOGGLE_MUTE: string
            TOGGLE_FULLSCREEN: string
            SEEK: string
            BACKWARD_SKIP: string
            FORWARD_SKIP: string
            GET_CURRENT_TIME: string
            PLAYER_READY: string
            SEEK_PERCENTAGE: string
            GET_BOOKMARKS: string
            TOAST: string
            PLAYER_REPLACED: string
            PLAYER_REPLACE_FAILED: string
        }
        DOWNLOAD: string
    }
    settings: SettingsV019
    constructor() {
        this.settings = this.getDefaultSettings()
        this.__ACTIONS__ = {
            SEEK: 'seek',
            SOURCE_URL: 'sourceUrl',
            GET_SOURCE_URL: 'getSourceUrl',
            FRAME_LOADED: 'frameLoaded',
            LOAD_BOOKMARK: 'loadBookmark',
            INDA_NO_VIDEO: 'indaNoVideo',
            IFRAME: {
                FRAME_LOADED: 'FrameLoaded',
                AUTO_NEXT_EPISODE: 'AutoNextEpisode',
                NEXT_EPISODE: 'NextEpisode',
                PREVIOUS_EPISODE: 'PreviousEpisode',
                CURRENT_TIME: 'CurrentTime',
                REPLACE_PLAYER: 'ReplacePlayer',
                TOGGLE_PLAY: 'TogglePlay',
                VOL_UP: 'VolUp',
                VOL_DOWN: 'VolDown',
                TOGGLE_MUTE: 'ToggleMute',
                TOGGLE_FULLSCREEN: 'ToggleFullscreen',
                SEEK: 'Seek',
                BACKWARD_SKIP: 'BackwardSkip',
                FORWARD_SKIP: 'ForwardSkip',
                GET_CURRENT_TIME: 'getCurrentTime',
                PLAYER_READY: 'PlayerReady',
                SEEK_PERCENTAGE: 'seekPercentage',
                GET_BOOKMARKS: 'getBookmarks',
                TOAST: 'Toast',

                PLAYER_REPLACED: 'PlayerReplaced',
                PLAYER_REPLACE_FAILED: 'PlayerReplaceFailed',
            },
            DOWNLOAD: 'download',
        }
    }

    /**
     * Load the settings from the storage
     *
     * Behaviour:
     * - Tries to load the settings from the preferred storage (local or sync)
     * - If the preferred storage is not available, it tries to load the other storage
     * - If the other storage is not available, it loads the default settings
     * @returns {Promise<SettingsV019>} The settings from the storage
     * @since v0.1.8
     * @example
     * MAT.loadSettings().then((settings) => {
     *    console.log(settings);
     * });
     *
     */
    loadSettings(): Promise<SettingsV019> {
        return new Promise((resolve) => {
            chrome.storage.sync.get('settings', (result) => {
                if (result && result.settings) {
                    this.settings = result.settings as SettingsV019
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
                        this.settings.advanced.player === 'plyr'
                            ? ([
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
                                  }
                              ] as chrome.declarativeNetRequest.Rule[])
                            : ([] as chrome.declarativeNetRequest.Rule[])
                    chrome.declarativeNetRequest
                        .updateDynamicRules({
                            addRules: newRule,
                            removeRuleIds: [],
                        })
                        .then(() => {
                            Logger.log(
                                `Default player is now "${this.settings.advanced.player}"`,
                            )
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
    saveSettings() {
        chrome.storage.sync.set({ settings: this.settings }, () => {
            if (chrome.runtime.lastError) {
                Logger.error('Error: Settings not saved', true)
                Logger.error(chrome.runtime.lastError.message || 'Unknown error', true)
            }
            this.updateDynamicRules()
            Logger.success('Settings saved', true)
        })
    }

    /**
     * Get the version of the extension
     * @returns {String} The version of the extension
     */
    getVersion(): string {
        return chrome.runtime.getManifest().version || '0.0.0'
    }

    /**
     * Get the default settings of the extension
     * @returns {SettingsV019} The default settings of the extension
     */
    getDefaultSettings(): SettingsV019 {
        return {
            forwardSkip: {
                /* Forward skip settings (default: ctrl + →) */ enabled: true,
                time: 85,
                keyBind: {
                    ctrlKey: true,
                    altKey: false,
                    shiftKey: false,
                    key: 'ArrowRight',
                },
            },
            backwardSkip: {
                /* Backward skip settings (default: ctrl + ←) */ enabled: true,
                time: 85,
                keyBind: {
                    ctrlKey: true,
                    altKey: false,
                    shiftKey: false,
                    key: 'ArrowLeft',
                },
            },
            nextEpisode: {
                /* Next episode settings (default: alt + →)  */ enabled: true,
                keyBind: {
                    ctrlKey: false,
                    altKey: true,
                    shiftKey: false,
                    key: 'ArrowRight',
                },
            },
            previousEpisode: {
                /* Previous episode settings (default: alt + ←) */ enabled: true,
                keyBind: {
                    ctrlKey: false,
                    altKey: true,
                    shiftKey: false,
                    key: 'ArrowLeft',
                },
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
            resume: {
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
                player: 'plyr',
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
            plyr: {
                /* Plyr settings */
                design: {
                    /* Plyr design settings */
                    enabled: /* Plyr design settings (default: false) */ false,
                },
            },
            eap: false /* Enable Early Access Program (default: false) (Basically useless, adds "EAP" text and that's it xd) */,
            version: this.getVersion() /* Version of the extension */,
        }
    }

    /**
     * Load Plyr CSS from local storage
     * @returns {Promise<string>} The CSS string
     */
    loadPlyrCSS(): Promise<string> {
        return new Promise((resolve) => {
            chrome.storage.local.get("plyrCSS", (result) => {
                resolve(result.plyrCSS as string || this.getDefaultPlyrCSS())
            })
        })
    }

    /**
     * Save Plyr CSS to local storage
     * @param {string} css - The CSS string to save
     */
    savePlyrCSS(css: string) {
        // Attempt to clean the CSS string by removing HTML tags and invalid characters
        css = css.replace(/<([a-z][a-z0-9]*)\b[^>]*>[\s\S]*?<\/\1>/gi,'')
                 .replace(/<[^>]+>/g, '')
                 .replace(/[^{}:;,.#\w\-\s()\/%"]/g, '');

        // Limit the CSS string length to 10000 characters
        if (css.length > 10000) {
            Logger.error("Error: Plyr CSS is too long (max 10000 characters)", true)
            return
        }

        chrome.storage.local.set({ plyrCSS: css }, () => {
            if (chrome.runtime.lastError) {
                Logger.error("Error: Plyr CSS not saved", true)
            } else {
                Logger.success("Plyr CSS saved", true)
            }
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

    /**
     * Returns whether the extension is an Early Access Program build
     * @returns {boolean}
     */
    isEAP(): boolean {
        return this.settings.eap
    }
}

export default new MAT()
