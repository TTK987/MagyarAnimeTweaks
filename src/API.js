/**
 * Helper function to load stuff from the storage
 * @param {String} key - The key to load
 * @param {Boolean} sync - Whether to load from the sync storage (default: false)
 * @returns {Promise<Object>} The value of the key
 * @since v0.1.8
 */
function loadFromStorage(key,sync = false) {
    return new Promise((resolve, reject) => {
        chrome.storage[sync ? 'sync' : 'local'].get(key, (data) => {
            if (data[key]) {
                resolve(data[key]);
            } else {
                reject(new Error('Data not found'));
            }
        });
    });
}



class MATweaks {
    constructor() {
        this.settings = this.getDefaultSettings();
    }

    /**
     * Load the settings from the storage
     *
     * Behaviour:
     * - Tries to load the settings from the preferred storage (local or sync)
     * - If the preferred storage is not available, it tries to load the other storage
     * - If the other storage is not available, it loads the default settings
     * @returns {Promise<Object>} The settings from the storage
     * @since v0.1.8
     * @example
     * MAT.loadSettings().then((settings) => {
     *    console.log(settings);
     * });
     *
     */
    loadSettings() {
        return new Promise((resolve, reject) => {
            if (this.settings.syncSettings.enabled) {
                this.getSyncSettings().then((settings) => {
                    this.setSettings(settings.settings);
                    resolve(settings.settings);
                }).catch(() => {
                    this.getLocalSettings().then((settings) => {
                        this.setSettings(settings.settings);
                        resolve(settings.settings);
                    }).catch(() => {
                        this.setSettings(this.getDefaultSettings());
                        resolve(this.getDefaultSettings());
                    });
                });
            } else {
                this.getLocalSettings().then((settings) => {
                    this.setSettings(settings.settings);
                    resolve(settings.settings);
                }).catch(() => {
                    this.getSyncSettings().then((settings) => {
                        this.setSettings(settings.settings);
                        resolve(settings.settings);
                    }).catch(() => {
                        this.setSettings(this.getDefaultSettings());
                        resolve(this.getDefaultSettings());
                    });
                });
            }
        });
    }

    /**
     * Get the settings from the local storage
     * @returns {Promise<Object>} The settings from the local storage
     */
    getLocalSettings() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get('settings', (data) => {
                if (data) {
                    resolve(data);
                } else {
                    logger.error('Error: Settings not found in the local storage', true)
                    reject(new Error('Settings not found'));
                }
            });
        });
    }

    /**
     * Get the settings from the sync storage
     * @returns {Promise<Object>} The settings from the sync storage
     * @since v0.1.8
     */
    getSyncSettings() {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get('settings', (data) => {
                if (data) {
                    resolve(data);
                } else {
                    logger.error('Error: Settings not found in the sync storage', true)
                    reject(new Error('Settings not found'));
                }
            });
        });
    }

    /**
     * Sync the settings to the storage
     */
    syncSettings() {
        if (this.settings.syncSettings.enabled) {
            chrome.storage.sync.set({settings: this.settings});
        } else {
            chrome.storage.local.set({settings: this.settings});
        }
    }

    /**
     * Save the settings to the local storage
     * @since v0.1.8
     */
    saveLocalSettings() {
        chrome.storage.local.set({settings: this.settings});
    }

    /**
     * Save the settings to the sync storage
     * @since v0.1.8
     */
    saveSyncSettings() {
        chrome.storage.sync.set({settings: this.settings});
    }

    /**
     * Save the settings to the storage (local and sync)
     *
     * Behaviour:
     * - Saves the settings to BOTH local and sync storage
     */
    saveSettings() {
        chrome.storage.sync.set({settings: this.settings});
        chrome.storage.local.set({settings: this.settings});
    }

    /**
     * Get the settings of the extension
     * @returns {Object} The settings of the extension
     */
    getSettings() {
        return this.settings;
    }

    /**
     * Set the settings of the extension
     * @param {Object} settings - The settings to set
     */
    setSettings(settings) {
        this.settings = settings;
    }

    /**
     * Get the version of the extension
     * @returns {String} The version of the extension
     */
    getVersion() {
        return chrome.runtime.getManifest().version;
    }

    /**
     * Get the default settings of the extension
     * @returns {Object} The default settings of the extension
     */
    getDefaultSettings() {
        return {
            forwardSkip: { /* Forward skip settings (default: ctrl + →) */
                enabled: true,
                time: 85,
                keyBind: {
                    ctrlKey: true,
                    altKey: false,
                    shiftKey: false,
                    key: 'ArrowRight',
                }
            },
            backwardSkip: { /* Backward skip settings (default: ctrl + ←) */
                enabled: true,
                time: 85,
                keyBind: {
                    ctrlKey: true,
                    altKey: false,
                    shiftKey: false,
                    key: 'ArrowLeft',
                }
            },
            nextEpisode: { /* Next episode settings (default: alt + →)  */
                enabled: true,
                keyBind: {
                    ctrlKey: false,
                    altKey: true,
                    shiftKey: false,
                    key: 'ArrowRight',
                }
            },
            previousEpisode: { /* Previous episode settings (default: alt + ←) */
                enabled: true,
                keyBind: {
                    ctrlKey: false,
                    altKey: true,
                    shiftKey: false,
                    key: 'ArrowLeft',
                }
            },
            autoNextEpisode: { /* Auto next episode (default: false) (on last episode of the season it won't skip) */
                enabled: false,
                time: 60 /* Time to skip to the next episode before the end of the episode (in seconds) */
            },
            autoplay: { /* Autoplay (default: true) */ enabled: true},
            syncSettings: {
                enabled: true, /* Sync settings using Google Account (default: true) */
            },
            bookmarks: { /* Bookmarks settings */
                enabled: true, /* Bookmarks (default: true) */
                syncBookmarks: {
                    enabled: true, /* Sync bookmarks using Google Account (default: true) */
                },
            },
            resume: {
                enabled: true, /* Resume watching (default: true) */
                syncResume: {
                    enabled: true, /* Sync resume using Google Account (default: true) */
                },
                mode: 'ask', /* Resume mode (default: "ask") (ask, auto) */ /* TODO: Requires modification of the plyr player */
            },
            advanced: { /* Advanced settings */
                enabled: /* Developer settings (default: false) */ true, // TODO: Set to false
                settings: { /* Developer settings */
                    ConsoleLog: { /* Console log (default: false) */ enabled: true}, // TODO: Set to false
                    DefaultPlayer: { /* Default player (default: "plyr") */ player: 'plyr'}
                },
                plyr: { /* Plyr settings */
                    design: { /* Plyr design settings */
                        enabled: /* Plyr design settings (default: false) */ false,
                        settings: { /* Plyr design settings */
                            svgColor: '#ffffffff', // --plyr-video-control-color
                            hoverBGColor: '#00b3ffff', // --plyr-video-control-background-hover
                            mainColor: '#00b3ffff', // --plyr-color-main
                            hoverColor: '#ffffffff', //  --plyr-video-control-color-hover
                        },
                    },
                },
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
                forcePlyr: true, /* Force Plyr player for users with the MA player (default: null )
                (null = the user hasn't decided yet, true = replace the player even if the user has the MA player, false = don't force Plyr) */
            },
            private: { /* Don't touch this! Seriously, don't touch this! */
                hasMAPlayer: false, /* Has the user the MA player on MagyarAnime? */
                eap: true, /* Enable Early Access Program (default: false) (Basically useless, adds "EAP" text and that's it xd) */ // TODO: Set to false
            },
            version: this.getVersion(), /* Version of the extension */
        };
    }

    __ACTIONS = {
        SEEK: 'seek',
        SOURCE_URL: 'sourceUrl',
        GET_SOURCE_URL: 'getSourceUrl',
        FRAME_LOADED: 'frameLoaded',
        LOAD_BOOKMARK: 'loadBookmark',
        MEGA: {
            FRAME_LOADED: 'megaFrameLoaded',
            AUTO_NEXT_EPISODE: 'megaAutoNextEpisode',
            NEXT_EPISODE: 'megaNextEpisode',
            PREVIOUS_EPISODE: 'megaPreviousEpisode',
            CURRENT_TIME: 'megaCurrentTime',
            REPLACE_PLAYER: 'megaReplacePlayer',
            TOGGLE_PLAY: 'megaTogglePlay',
            VOL_UP: 'megaVolUp',
            VOL_DOWN: 'megaVolDown',
            TOGGLE_MUTE: 'megaToggleMute',
            TOGGLE_FULLSCREEN: 'megaToggleFullscreen',
            SEEK: 'megaSeek',
            BACKWARD_SKIP: 'megaBackwardSkip',
            FORWARD_SKIP: 'megaForwardSkip',
            GET_CURRENT_TIME: 'getCurrentTime',
            PLAYER_READY: 'megaPlayerReady',
            SEEK_PERCENTAGE: 'seekPercentage',
            GET_BOOKMARKS: 'getBookmarks',
            BOOKMARKS: 'bookmarks',

        },

    }
    __NAME = "MATweaks";

    /**
     * Returns whether the extension is an Early Access Program build
     * @returns {boolean}
     */
    isEAP() {
        return this.settings.private.eap;
    }
}
const MAT = new MATweaks();
class Logger {
    constructor() {
        this.enabled = MAT.getSettings().advanced.settings.ConsoleLog.enabled;
        this.styles = {
            logo: `color: #2196F3; font-weight: bold; background-color: #000000; padding: 2px 5px; border-radius: 5px;`,
            log: `color: #000000; background-color: #2196F3; padding: 2px 5px; border-radius: 5px;`,
            warn: `color: #000000; background-color: #FFC107; padding: 2px 5px; border-radius: 5px;`,
            error: `color: #000000; background-color: #F44336; padding: 2px 5px; border-radius: 5px;`,
        };
    }

    /**
     * Logs a message to the console in style
     * @param {String} message - The message to log
     * @param {Boolean} bypass - Bypass the enabled setting (force log)
     * @since v0.1.7
     * @example
     * logger.log('This is a log message')
     */
    log(message, bypass = false) {
        if (this.enabled || bypass) {
            console.log(`%c[MATweaks]: %c${message}`, this.styles.logo, this.styles.log);
        }
    }

    /**
     * Logs a warning message to the console in style
     * @param {String} message - The message to log
     * @param {Boolean} bypass - Bypass the enabled setting (force log)
     * @since v0.1.7
     * @example
     * logger.warn('This is a warning message')
     */
    warn(message, bypass = false) {
        if (this.enabled || bypass) {
            console.warn(`%c[MATweaks]: %c${message}`, this.styles.logo, this.styles.warn);
        }
    }

    /**
     * Logs an error message to the console in style
     * @param {String} message - The message to log
     * @param {Boolean} bypass - Bypass the enabled setting (force log)
     * @since v0.1.7
     * @example
     * logger.error('This is an error message')
     */
    error(message, bypass = false) {
        if (this.enabled || bypass) {
            console.error(`%c[MATweaks]: %c${message}`, this.styles.logo, this.styles.error);
        }
    }

    /**
     * Enable the logger
     * @since v0.1.7
     */
    enable() {
        this.enabled = true;
    }


    /**
     * Disable the logger
     * @since v0.1.7
     */
    disable() {
        this.enabled = false;
    }
}
const logger = new Logger();
class Bookmarks {
    constructor() {
        this.bookmarks = [];
    }

    loadBookmarks() {
        return new Promise((resolve, reject) => {
            if (MAT.getSettings().bookmarks.syncBookmarks.enabled) {
                loadFromStorage('bookmarks', true).then((bookmarks) => {
                    this.bookmarks = bookmarks;
                    resolve(this.bookmarks);
                }).catch(() => {reject(new Error('Bookmarks not found'))});
            } else {
                loadFromStorage('bookmarks').then((bookmarks) => {
                    this.bookmarks = bookmarks;
                    resolve(this.bookmarks);
                }).catch(() => {reject(new Error('Bookmarks not found'))});
            }
        });
    }

    saveBookmarks() {
        if (MAT.getSettings().bookmarks.syncBookmarks.enabled) {
            chrome.storage.sync.set({bookmarks: this.bookmarks});
        } else {
            chrome.storage.local.set({bookmarks: this.bookmarks});
        }
    }

    /**
     * Get the bookmarks
     * @returns {Array<Bookmark>} The bookmarks
     */
    getBookmarks() {
        return this.bookmarks;
    }

    /**
     * Add a new bookmark
     * @param {String} title - Title of the anime
     * @param {Number} episode - Episode number
     * @param {String} url - URL of the bookmark
     * @param {String} description - Description of the bookmark
     * @param {Number} time - Time in the episode (in seconds)
     * @param {Number} episodeId - Episode number
     * @constructor Bookmark - Create a new bookmark
     * @returns {Bookmark} The created bookmark
     * @method addBookmark - Add a new bookmark
     * @example
     * const bookmark = bookmarks.addBookmark('One Piece', 1, 'https://magyaranime.eu/resz/5555/', 'Ez egy példa leírás', 60, 5555, 'https://magyaranime.eu/image.jpg');
     * console.log(bookmark);
     * @since v0.1.8
     */
    addBookmark(title, episode, url, description, time, episodeId) {
        const bookmark = new Bookmark(Date.now(), title, episode, url, description, time, episodeId, Number(MA.EPISODE.getAnimeLink().match(/\/leiras\/(\d+)\//)[1]));
        this.bookmarks.push(bookmark);
        this.saveBookmarks();
        return bookmark;
    }

    clearBookmarks() {
        this.bookmarks = [];
        this.saveBookmarks();
    }

    hasBookmark(bookmark) {
        return this.bookmarks.some((b) => b.url === bookmark.url);
    }

    getBookmarkByUrl(url) {
        return this.bookmarks.find((b) => b.url === url);
    }

    getBookmarkByTitle(title) {
        return this.bookmarks.find((b) => b.title === title);
    }

    getBookmarkByEpisodeId(episodeId) {
        return this.bookmarks.find((b) => Number(b.episodeId) === Number(episodeId));
    }

    deleteBookmark(id) {
        return new Promise((resolve, reject) => {
            this.bookmarks = this.bookmarks.filter((b) => Number(b.id) !== Number(id));
            this.saveBookmarks();
            resolve();
        });
    }

    updateBookmark(id, title, episode, url, description, time, episodeId) {
        return new Promise((resolve, reject) => {
            const bookmark = this.bookmarks.find((b) => Number(b.id) === Number(id));
            bookmark.title = title;
            bookmark.episode = episode;
            bookmark.url = url;
            bookmark.description = description;
            bookmark.time = time;
            bookmark.episodeId = episodeId;
            this.saveBookmarks();
            resolve();
        });
    }

    openBookmark(id) {
        logger.log('Opening bookmark with id: ' + id, true);
        const bookmark = this.getBookmark(Number(id));
        if (bookmark) {
            chrome.runtime.sendMessage({
                plugin: MAT.__NAME,
                type: 'openBookmark',
                id: bookmark.id,
                time: bookmark.time,
                url: bookmark.url,
            }, (response) => {
                if (response) {
                    logger.log('Bookmark opened', true);
                } else {
                    logger.error('Error: Bookmark not opened', true);
                }
            });
        } else { logger.error('Bookmark not found', true); }
    }

    getBookmark(id) {
        return this.bookmarks.find((b) => b.id === Number(id));
    }
}
const bookmarks = new Bookmarks();
class Bookmark {
    /**
     * @param {String} title - Title of the anime
     * @param {Number} episode - Episode number
     * @param {String} url - URL of the bookmark
     * @param {String} description - Description of the bookmark
     * @param {Number} time - Time in the episode (in seconds)
     * @param {Number} episodeId - Episode number
     * @param {Number} id - ID of the bookmark
     * @param {Number} datasheetId - ID of the datasheet
     * @constructor Bookmark - Create a new bookmark
     */
    constructor(id, title, episode, url, description, time, episodeId, datasheetId) {
        this.id = id;
        this.title = title;
        this.episode = episode;
        this.url = url;
        this.description = description || '';
        this.time = time;
        this.episodeId = episodeId;
        this.datasheetId = datasheetId;
    }
}
class MagyarAnime {
    constructor() {
    }
    /**
     * Returns whether we are on an episode page
     * @returns {boolean} Whether we are on an episode page
     * @since v0.1.8
     */
    isEpisodePage() {
        return window.location.pathname.includes('resz');
    }
    /**
     * Returns whether we are on the anime page (leírás)
     * @returns {boolean} Whether we are on the anime page (leírás)
     * @since v0.1.8
     */
    isAnimePage() {
        return window.location.pathname.includes('leiras');
    }
    /**
     * Adds custom CSS to the page
     * @param {String} css - The CSS to add (Automatically minifies the CSS)
     * @since v0.1.8
     */
    addCSS(css) {
        const style = document.createElement('style');
        style.textContent = css.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
        style.classList.add('MATweaks');
        document.head.appendChild(style);
    }
    /**
     * A collection of functions to fetch data from datasheets
     * @since v0.1.8
     */
    ANIME = {
        /**
         * Get the title of the anime
         * @returns {String} The title of the anime
         * @since v0.1.8
         */
        getImage() {
            if (!MA.isAnimePage()) return null;
            return document.querySelector('.gentech-tv-show-img-holder img')?.src || null;
        },
        /**
         * Get the title of the anime
         * @returns {String} The title of the anime
         * @since v0.1.8
         */
        getTitle() {
            if (!MA.isAnimePage()) return null;
            return document.querySelector('.gen-single-tv-show-info h2')?.innerText || null;
        },
        /**
         * Get the description of the anime
         * @returns {String} The description of the anime
         * @since v0.1.8
         */
        getDescription() {
            if (!MA.isAnimePage()) return null;
            return document.querySelector('.leiras_text')?.innerText.match(/(.*)(?!=\[[Ff]orrás:|\([Ff]orrás:|\([Ss]ource:|\[[Ss]ource:)/)[0] || null;
        },
        /**
         * Get the genres of the anime
         * @returns {Array<String>} The genres of the anime
         * @since v0.1.8
         */
        getGenres() {
            if (!MA.isAnimePage()) return null;
            return document.querySelector('.gen-single-tv-show-info p')?.innerText.match(/Műfajok: (.*)/)[1].split(',').map((g) => g.trim()) || null;
        },
        /**
         * Get the rating of the anime
         * @returns {Number} The rating of the anime
         * @since v0.1.8
         */
        getRating() {
            if (!MA.isAnimePage()) return null;
            return parseFloat(document.querySelector('.gen-single-tv-show-info p')?.innerText.match(/(\d+\.\d+) \/ 5/)[1]) || null;
        },
        /**
         * Get the age rating of the anime
         * @returns {String} The age rating of the anime
         * @since v0.1.8
         */
        getAgeRating() {
            if (!MA.isAnimePage()) return null;
            return document.querySelector('.gen-rating')?.innerText || null;
        },
        /**
         * Get the season of the anime (e.g. "Winter 2023")
         * @returns {String} The season of the anime
         * @since v0.1.8
         */
        getSeason() {
            if (!MA.isAnimePage()) return null;
            return document.querySelector('ul:nth-child(4) li:nth-child(5)')?.innerText || null;
        },
        /**
         * Get the episode count of the anime
         * @returns {Number} The episode count of the anime
         * @since v0.1.8
         */
        getEpisodeCount() {
            if (!MA.isAnimePage()) return null;
            return parseInt(document.querySelector('ul:nth-child(4) li:nth-child(3)')?.innerText.match(/Epizódok: (\d+) /)[1]) || null;
        },
        /**
         * Get the max episode count of the anime
         * @returns {Number} The max episode count of the anime (Infinity if it's unknown)
         * @since v0.1.8
         */
        getMaxEpisodeCount() {
            if (!MA.isAnimePage()) return null;
            const maxEpisodes = document.querySelector('ul:nth-child(4) li:nth-child(3)')?.innerText.match(/Epizódok: \d+ \/ (\d+|∞)/)[1];
            return maxEpisodes === '∞' ? Infinity : parseInt(maxEpisodes) || null;
        },
        /**
         * Get the release date of the anime
         * @returns {String} The release date of the anime
         * @since v0.1.8
         */
        getReleaseDate() {
            if (!MA.isAnimePage()) return null;
            return document.querySelector('ul:nth-child(4) li:nth-child(4)')?.innerText || null;
        },
        /**
         * Get the views of the anime
         * @returns {Number} The views of the anime
         * @since v0.1.8
         */
        getViews() {
            if (!MA.isAnimePage()) return null;
            return parseInt(document.querySelector('ul:nth-child(4) li:nth-child(6) span')?.innerText.replace(',', '')) || null;
        },
        /**
         * Get the episodes of the anime
         * @returns {Array<{title: String, link: String, date: String, epNumber: Number}>} The episodes of the anime
         * @since v0.1.8
         */
        getEpisodes() {
            if (!MA.isAnimePage()) return null;
            return [...document.querySelectorAll('.owl-item')]?.map(episodeItem => ({
                title: episodeItem.querySelector('.gen-episode-info a')?.textContent || "",
                link: episodeItem.querySelector('.gen-episode-info a')?.href || "",
                date: episodeItem.querySelector('.release-date')?.textContent || "",
                epNumber: parseInt(episodeItem.querySelector('.gen-episode-info a')?.textContent.match(/(\d+)/)[1]) || -1
            })) || [];
        },
        /**
         * Get the torrent links of each episode
         *
         * If the torrent has all episodes in one, the episode number will be Infinity (e.g. "01 ~ 12")
         * @returns {Array<{title: String, link: String, epNumber: Number}>} The torrent links of each episode
         * @since v0.1.8
         */
        getTorrents() {
            if (!MA.isAnimePage()) return null;
            return [...document.querySelectorAll('.epizod_torrent')].map(torrentItem => ({
                title: torrentItem.textContent || "",
                link: torrentItem.href || "",
                epNumber: torrentItem.textContent.includes("~") ? Infinity : parseInt(torrentItem.textContent.match(/(\d+)/)?.[1]) || -1
            })) || [];
        },
        /**
         * Get the related anime of the anime
         * @returns {Array<{title: String, link: String, season: String, genres: Array<String>}>} The related anime of the anime
         * @since v0.1.8
         */
        getRelatedAnime() {
            if (!MA.isAnimePage()) return null;
            return [...document.querySelectorAll('.gen-movie-contain')].map(animeItem => ({
                title: animeItem.querySelector('.gen-movie-info h3 a')?.textContent || "",
                link: animeItem.querySelector('.gen-movie-info h3 a')?.href || "",
                season: animeItem.querySelector('.gen-movie-meta-holder ul li')?.textContent || "",
                genres: animeItem.querySelector('.gen-movie-meta-holder ul li:nth-child(2) a span')?.textContent.split(',').map((g) => g.trim()) || []
            })) || [];
        },
        /**
         * Get the source of the anime
         * @returns {Array<{site: String, link: String}>} The source of the anime
         * @since v0.1.8
         */
        getSource() {
            if (!MA.isAnimePage()) return null;
            return [...document.querySelectorAll('.sourceslink')].map(sourceItem => ({
                site: sourceItem.textContent.toLowerCase() || "",
                link: sourceItem.href || ""
            })) || [];
        },

        // ---------------------------- TEST ----------------------------
        /**
         * Test function to get the all data of the anime
         */
        TEST() {
            return {
                image: MA.ANIME.getImage(),
                title: MA.ANIME.getTitle(),
                description: MA.ANIME.getDescription(),
                genres: MA.ANIME.getGenres(),
                rating: MA.ANIME.getRating(),
                ageRating: MA.ANIME.getAgeRating(),
                season: MA.ANIME.getSeason(),
                episodeCount: MA.ANIME.getEpisodeCount(),
                maxEpisodeCount: MA.ANIME.getMaxEpisodeCount(),
                releaseDate: MA.ANIME.getReleaseDate(),
                views: MA.ANIME.getViews(),
                episodes: MA.ANIME.getEpisodes(),
                torrents: MA.ANIME.getTorrents(),
                relatedAnime: MA.ANIME.getRelatedAnime(),
                source: MA.ANIME.getSource()
            }
        }
    }
    /**
     * A collection of functions to fetch data from datasheets
     * @since v0.1.8
     */
    EPISODE = {
        /**
         * Get the title of the episode
         * @returns {String} The title of the episode
         * @since v0.1.8
         */
        getTitle() {
            if (!MA.isEpisodePage()) return "";
            return document.querySelector('.gen-title a')?.innerText || "";
        },
        /**
         * Get the episode number of the episode
         * @returns {Number} The episode number of the episode
         * @since v0.1.8
         */
        getEpisodeNumber() {
            if (!MA.isEpisodePage()) return -1;
            return parseInt(document.querySelector(".gen-title").innerText.match(/(\d+)\.?\s?[rR]ész/)[1]) || -1;
        },
        /**
         * Get the release date of the episode
         * @returns {String} The release date of the episode
         * @since v0.1.8
         */
        getReleaseDate() {
            if (!MA.isEpisodePage()) return "";
            return document.querySelector('.gen-single-meta-holder ul li:nth-child(1)')?.innerText || "";
        },
        /**
         * Get the views of the episode
         * @returns {Number} The views of the episode
         * @since v0.1.8
         */
        getViews() {
            if (!MA.isEpisodePage()) return -1;
            return parseInt(document.querySelector('.gen-single-meta-holder ul li:nth-child(3) span')?.innerText.match(/(\d+)/)[1]) || -1;
        },
        /**
         * Get the fansub data
         * @returns {{name: String, link: String}} The fansub data
         * @since v0.1.8
         */
        getFansub() {
            if (!MA.isEpisodePage()) return {name: "", link: ""};
            return {
                name: document.querySelector('.gen-single-meta-holder p a')?.innerText || "",
                link: document.querySelector('.gen-single-meta-holder p a')?.href || ""
            }
        },
        /**
         * Get the urls for different qualities of the episode
         * @returns {Array<{site: String, link: String}>} The urls for different qualities of the episode
         * @since v0.1.8
         */
        getUrls() {
            if (!MA.isEpisodePage()) return [];
            return [...document.querySelectorAll('.gomb2')].map(btn => ({
                site: btn.innerText.trim() || "",
                link: btn.href || ""
            })) || [];
        },
        /**
         * Get the previous episode link
         * @returns {String} The previous episode link
         * @since v0.1.8
         */
        getPreviousEpisodeLink() {
            if (!MA.isEpisodePage()) return "";
            return document.getElementById('epelozo')?.href || "";
        },
        /**
         * Get the next episode link
         * @returns {String} The next episode link
         * @since v0.1.8
         */
        getNextEpisodeLink() {
            if (!MA.isEpisodePage()) return "";
            return document.getElementById('epkovetkezo')?.href || "";
        },
        /**
         * Get the download link
         * @returns {String} The download link
         * @since v0.1.8
         */
        getDownloadLink() {
            if (!MA.isEpisodePage()) return "";
            return document.getElementById('letoltes')?.href || "";
        },
        /**
         * Get the link for the datasheet of the anime
         * @returns {String} The link for the datasheet of the anime
         * @since v0.1.8
         */
        getAnimeLink() {
            if (!MA.isEpisodePage()) return "";
            return document.getElementById('adatlap')?.href || "";
        },
        /**
         * Get all episode links
         * @returns {Array<{eposodeNumber: Number, title: String, link: String}>} All episode links
         * @since v0.1.8
         */
        getAllEpisodes() {
            if (!MA.isEpisodePage()) return [];
            return [...document.querySelectorAll('.epizod_link_normal')].map(episodeItem => ({
                episodeNumber: parseInt(episodeItem.textContent.match(/(\d+)/)[1]) || -1,
                title: episodeItem.textContent || "",
                link: episodeItem.href || ""
            })) || [];
        },
        /**
         * Returns the id of the episode
         * @returns {number}
         */
        getId() {
            if (!MA.isEpisodePage()) return -1;
            return parseInt(window.location.pathname.match(/(-s\d+)?\/(\d+)\//)[2]) || -1;
        },

        /**
         * Get the datasheet of the episode
         * @returns {Number} The datasheet of the episode
         */
        getDatasheet() {
            if (!MA.isEpisodePage()) return -1;
            return Number(document.querySelector('#adatlap')?.href.match(/\/leiras\/(\d+)\//)[1]) || -1;
        },
        // ---------------------------- TEST ----------------------------
        /**
         * Test function to get the all data of the episode
         */
        TEST() {
            return {
                title: MA.EPISODE.getTitle(),
                episodeNumber: MA.EPISODE.getEpisodeNumber(),
                releaseDate: MA.EPISODE.getReleaseDate(),
                views: MA.EPISODE.getViews(),
                fansub: MA.EPISODE.getFansub(),
                urls: MA.EPISODE.getUrls(),
                previousEpisodeLink: MA.EPISODE.getPreviousEpisodeLink(),
                nextEpisodeLink: MA.EPISODE.getNextEpisodeLink(),
                downloadLink: MA.EPISODE.getDownloadLink(),
                animeLink: MA.EPISODE.getAnimeLink(),
                allEpisodes: MA.EPISODE.getAllEpisodes(),
                id: MA.EPISODE.getId(),
                datasheetId:  MA.EPISODE.getDatasheet(),
            };
        },

    }
}
const MA = new MagyarAnime();
class Popup {
    constructor() {
        this.popups = [];
    }

    /**
     * Function to show an error popup
     * @param {string} message - The message to show
     * @param {number} time - The time to show the popup in milliseconds (default: 2000)
     * @since v0.1.8
     */
    showErrorPopup(message, time) {
        const popup = document.createElement('div');
        popup.textContent = message;
        popup.classList.add('error-popup');
        this._showPopup(popup, time || 2000);
    }

    /**
     * Function to show an info popup
     * @param {string} message - The message to show
     * @param {number | undefined} time - The time to show the popup in milliseconds (default: 2000)
     * @since v0.1.8
     */
    showInfoPopup(message, time) {
        const popup = document.createElement('div');
        popup.textContent = message;
        popup.classList.add('info-popup');
        this._showPopup(popup, time || 2000);
    }

    /**
     * Function to show a success popup
     * @param {string} message - The message to show
     * @param {number | undefined} time - The time to show the popup in milliseconds
     * @since v0.1.8
     */
    showSuccessPopup(message, time) {
        const popup = document.createElement('div');
        popup.textContent = message;
        popup.classList.add('success-popup');
        this._showPopup(popup, time || 2000);
    }

    /**
     * Function to show a warning popup
     * @param {string} message - The message to show
     * @param {number | undefined} time - The time to show the popup in milliseconds
     * @since v0.1.8
     */
    showWarningPopup(message, time) {
        const popup = document.createElement('div');
        popup.textContent = message;
        popup.classList.add('warning-popup');
        this._showPopup(popup, time || 2000);
    }

    /**
     * Function to show a generic popup
     * @param {HTMLElement} popup - The popup element to show
     * @param {number} time - The time to show the popup in milliseconds
     * @since v0.1.8
     */
    _showPopup(popup, time) {
        popup.setAttribute('style', `position: fixed; bottom: ${10 + this.popups.length * 60}px; left: 10px; color: white; padding: 10px; border-radius: 10px; box-shadow: 0 0 10px var(--primary-color); z-index: 100; transition: opacity 2s;`);

        const appendPopup = () => {
            document.body.appendChild(popup);
            this.popups.push(popup);
            setTimeout(() => {
                popup.style.opacity = "0";
                setTimeout(() => {
                    this.popups.shift();
                    document.body.removeChild(popup);
                    this.popups.forEach((p, index) => {
                        p.style.bottom = `${10 + index * 60}px`;
                    });
                }, 2000);
            }, time);
        };

        if (!document.body) {
            document.addEventListener('DOMContentLoaded', appendPopup);
        } else {
            appendPopup();
        }
    }
}
const popup = new Popup();
/**
 * Class to manage the resume data
 * @since v0.1.8
 */
class ResumePlayBack {
    constructor() {
        this.eps = [];
    }

    /**
     * Get the resume data
     * @returns {Array<{episodeId: Number, time: Number}>} The resume data
     * @since v0.1.8
     */
    getResumeData() {
        return this.eps;
    }

    /**
     * Add a new resume data
     * @param {Number} episodeId - Episode number
     * @param {Number} time - Time in the episode (in seconds)
     * @since v0.1.8
     */
    addResumeData(episodeId, time) {
        this.eps.push(new ResumePlayback(episodeId, time, Date.now()));
        this.saveResumeData();
    }

    /**
     * Remove a resume data
     * @param {Number} episodeId - Episode number
     * @since v0.1.8
     */
    removeResumeData(episodeId) {
        this.eps = this.eps.filter((ep) => ep.EpisodeID !== episodeId);
        this.saveResumeData();
    }

    /**
     * Clear all resume data
     * @since v0.1.8
     */
    clearResumeData() {
        this.eps = [];
        this.saveResumeData();
    }

    /**
     * Save the resume data
     * @since v0.1.8
     */
    saveResumeData() {
        if (MAT.getSettings().resume.syncResume.enabled) {
            chrome.storage.sync.set({resume: this.eps});
        } else {
            chrome.storage.local.set({resume: this.eps});
        }
    }

    /**
     * Load the resume data
     * @since v0.1.8
     */
    loadResumeData() {
        return new Promise((resolve, reject) => {
            if (MAT.getSettings().resume.syncResume.enabled) {
                loadFromStorage('resume', true).then((resume) => {
                    this.eps = resume;
                    resolve(this.eps);
                }).catch(() => {reject(new Error('Resume data not found'))});
            } else {
                loadFromStorage('resume').then((resume) => {
                    this.eps = resume;
                    resolve(this.eps);
                }).catch(() => {reject(new Error('Resume data not found'))});
            }
        });
    }

    /**
     * Get the resume data by episode ID
     * @param {Number} episodeId - Episode number
     * @returns {ResumePlayback} The resume data
     * @since v0.1.8
     */
    getResumeDataByEpisodeId(episodeId) {
        return this.eps.find((ep) => ep.EpisodeID === episodeId);
    }

}

/**
 * Class to define a resume data object for an episode (used in the resume data array)
 * @param {Number} EpisodeID - Episode number
 * @param {Number} Time - Time in the episode (in seconds)
 * @param {Number} CTimestamp - Current timestamp
 */
class ResumePlayback {
    constructor(EpisodeID, Time, CTimestamp) {
        this.EpisodeID = EpisodeID;
        this.Time = Time;
        this.CTimestamp = CTimestamp;
    }
}


if (typeof window !== 'undefined') {
    window.MAT = MAT;
    window.logger = logger;
    window.bookmarks = bookmarks;
    window.popup = popup;
}
export {
    MAT, logger, bookmarks, Bookmark, MA, popup,
};
