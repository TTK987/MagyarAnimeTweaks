/**
 * Helper function to load stuff from the storage
 * @param {String} key - The key to load
 * @returns {Promise<Object>} The value of the key
 * @since v0.1.8
 */
function loadFromStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(key, (data) => {
            if (data[key]) {
                resolve(data[key]);
            } else {
                reject(new Error('Data not found'));
            }
        });
    });
}
/**
 * Helper function to save stuff to the storage
 * @param {String} key - The key to save
 * @param {Object} value - The value to save
 * @returns {Promise<Object>} The saved value
 * @since v0.1.8
 */
function saveToStorage(key, value) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.set({[key]: value}, () => {
            if (chrome.runtime.lastError) {
                reject(new Error('Error: Data not saved'));
            } else {
                resolve(value);
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
        return new Promise((resolve) => {
            loadFromStorage('settings').then((settings) => {
                this.setSettings(settings);
                resolve(settings);
            }).catch(() => {
                this.setSettings(this.getDefaultSettings());
                resolve(this.getDefaultSettings());
            });
        });
    }
    /**
     * Save the settings to the storage (local and sync)
     *
     * Behaviour:
     * - Saves the settings to BOTH local and sync storage
     */
    saveSettings() {
        saveToStorage('settings', this.settings).then(() => {
            chrome.declarativeNetRequest.getDynamicRules(rules => {
                const ruleIdsToRemove = rules.map(rule => rule.id);
                chrome.declarativeNetRequest.updateDynamicRules({
                    removeRuleIds: ruleIdsToRemove,
                    addRules: []
                }).then(() => {
                    const newRule = this.settings.advanced.settings.DefaultPlayer.player === 'plyr' ? [{
                        id: 1,
                        action: { type: "block" },
                        condition: { urlFilter: "*://magyaranime.eu/js/magyaranime_player.js*", resourceTypes: ["script"] }
                    }] : [];

                    chrome.declarativeNetRequest.updateDynamicRules({
                        addRules: newRule,
                        removeRuleIds: []
                    }).then(() => {
                        Logger.log(`Default player is now "${this.settings.advanced.settings.DefaultPlayer.player}"`);
                    }).catch(error => {
                        Logger.error(`Failed to add new dynamic rules: ${error}`, true);
                    });
                }).catch(error => {
                    Logger.error(`Failed to remove existing dynamic rules: ${error}`, true);
                });
            });

            Logger.success('Settings saved', true);
        }).catch(() => {
            Logger.error('Error: Settings not saved', true);
            console.log(chrome.runtime.lastError);
        });
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
            bookmarks: { /* Bookmarks settings */
                enabled: true, /* Bookmarks (default: true) */
            },
            resume: {
                enabled: true, /* Resume watching (default: true) */
                mode: 'ask', /* Resume mode (default: "ask") (ask, auto) */
            },
            advanced: { /* Advanced settings */
                enabled: /* Developer settings (default: false) */ false,
                settings: { /* Developer settings */
                    ConsoleLog: { /* Console log (default: false) */ enabled: false},
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
            },
            private: { /* Don't touch this! Seriously, don't touch this! */
                eap: false, /* Enable Early Access Program (default: false) (Basically useless, adds "EAP" text and that's it xd) */
            },
            version: this.getVersion(), /* Version of the extension */
        };
    }

    __ACTIONS__ = {
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
            POPUP: 'megaPopup',
        },
        DOWNLOAD: "download",


    }
    __NAME__ = "MATweaks";

    /**
     * Returns whether the extension is an Early Access Program build
     * @returns {boolean}
     */
    isEAP() {
        return this.settings.private.eap;
    }
}
const MAT = new MATweaks();
class logger {
    constructor() {
        this.enabled = MAT.getSettings().advanced.settings.ConsoleLog.enabled;
        this.styles = {
            logo: `color: #2196F3; font-weight: bold; background-color: #000000; padding: 2px 5px; border-radius: 5px;`,
            log: `color: #000000; background-color: #2196F3; padding: 2px 5px; border-radius: 5px;`,
            warn: `color: #000000; background-color: #FFC107; padding: 2px 5px; border-radius: 5px;`,
            error: `color: #000000; background-color: #F44336; padding: 2px 5px; border-radius: 5px;`,
            success: `color: #000000; background-color: #4CAF50; padding: 2px 5px; border-radius: 5px;`,
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
     * Logs a success message to the console in style
     * @example logger.success('This is a success message')
     * @param {String} message - The message to log
     * @param {Boolean} bypass - Bypass the enabled setting (force log)
     * @since v0.1.8
     */
    success(message, bypass = false) {
        if (this.enabled || bypass) {
            console.log(`%c[MATweaks]: %c${message}`, this.styles.logo, this.styles.success);
        }
    }

    /**
     * Enable the logger
     * @since v0.1.7
     */
    enable() {
        this.enabled = true;
    }
}
const Logger = new logger();
class bookmarks {
    /**
     * Create a new bkmrks class
     * @since v0.1.8
     * @constructor Bookmarks - Create a new bkmrks class
     * @property {Array<Bookmark>} bookmarks - The bkmrks
     */
    constructor() {
        this.bkmrks = [];
    }

    /**
     * Load the bkmrks
     * @returns {Promise<Array<Bookmark>>} The bkmrks
     * @since v0.1.8
     */
    loadBookmarks() {
        return new Promise((resolve) => {
            loadFromStorage('bookmarks').then((bookmarks) => {
                this.bkmrks = bookmarks;
                resolve(this.bkmrks);
            }).catch(() => {
                Logger.warn('Bookmarks not found', true);
                resolve(this.bkmrks);
            });
        });
    }

    /**
     * Save the bkmrks
     * @since v0.1.8
     */
    saveBookmarks() {
        saveToStorage('bookmarks', this.bkmrks).then(() => {
            Logger.success('Bookmarks saved', true);
        }).catch(() => {
            Logger.error('Error: Bookmarks not saved', true);
            console.log(chrome.runtime.lastError);
        });
    }

    /**
     * Get the bkmrks
     * @returns {Array<Bookmark>} The bkmrks
     */
    getBookmarks() {
        return this.bkmrks;
    }

    /**
     * Add a new bookmark
     * @param {String} title - Title of the anime
     * @param {Number} episode - Episode number
     * @param {String} description - Description of the bookmark
     * @param {Number} time - Time in the episode (in seconds)
     * @param {Number} episodeId - Episode number
     * @constructor Bookmark - Create a new bookmark
     * @returns {Bookmark} The created bookmark
     * @method addBookmark - Add a new bookmark
     * @since v0.1.8
     */
    addBookmark(title, episode, description, time, episodeId) {
        this.loadBookmarks().then(() => {
            const bookmark = new Bookmark(Date.now(), title, episode, description, time, episodeId, MA.EPISODE.getDatasheet());
            this.bkmrks.push(bookmark);
            this.saveBookmarks();
            return bookmark;
        });
    }

    /**
     * Delete a bookmark
     * @param {Number} id - The ID of the bookmark
     * @returns {Promise<boolean>} Whether the bookmark was deleted
     * @since v0.1.8
     */
    deleteBookmark(id) {
        return new Promise((resolve) => {
            this.loadBookmarks().then(() => {
                this.bkmrks = this.bkmrks.filter((b) => Number(b.id) !== Number(id));
                this.saveBookmarks();
                resolve(this.getBookmark(Number(id)) === undefined);
            });
        });
    }

    /**
     * Open a bookmark
     * @param {Number} id - The ID of the bookmark
     * @since v0.1.8
     */
    openBookmark(id) {
        Logger.log('Opening bookmark with id: ' + id, true);
        const bookmark = this.getBookmark(Number(id));
        if (bookmark) {
            chrome.runtime.sendMessage({
                plugin: MAT.__NAME__,
                type: 'openBookmark',
                id: bookmark.id,
                time: bookmark.time,
                url: `https://magyaranime.eu/resz/${bookmark.episodeId}/`,
            }, (response) => {
                if (response) {
                    Logger.log('Bookmark opened', true);
                } else {
                    Logger.error('Error: Bookmark not opened', true);
                }
            });
        } else { Logger.error('Bookmark not found', true); }
    }

    /**
     * Get a bookmark by ID
     * @param {Number} id - The ID of the bookmark
     * @returns {Bookmark | undefined} The bookmark
     */
    getBookmark(id) {
        return this.bkmrks.find((b) => b.id === Number(id));
    }
}
const Bookmarks = new bookmarks();
class Bookmark {
    /**
     * @param {String} title - Title of the anime
     * @param {Number} episode - Episode number
     * @param {String} description - Description of the bookmark
     * @param {Number} time - Time in the episode (in seconds)
     * @param {Number} episodeId - Episode number
     * @param {Number} id - ID of the bookmark
     * @param {Number} datasheetId - ID of the datasheet
     * @constructor Bookmark - Create a new bookmark
     * @since v0.1.8
     */
    constructor(id, title, episode, description, time, episodeId, datasheetId) {
        this.id = id;
        this.title = title;
        this.episode = episode;
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
        return window.location.pathname.includes('resz') || window.location.pathname.includes('inda-play');
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
        style.id = 'MAT_CSS';
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
            if (!MA.isAnimePage()) return "";
            try{ return document.querySelector('.gentech-tv-show-img-holder img')?.src || ""; } catch(e) { return ""; }
        },
        /**
         * Get the title of the anime
         * @returns {String} The title of the anime
         * @since v0.1.8
         */
        getTitle() {
            if (!MA.isAnimePage()) return "";
            try{ return document.querySelector('.gen-single-tv-show-info h2')?.innerText || ""; } catch(e) { return ""; }
        },
        /**
         * Get the description of the anime
         * @returns {String} The description of the anime
         * @since v0.1.8
         */
        getDescription() {
            if (!MA.isAnimePage()) return "";
            try{ return document.querySelector('.leiras_text')?.innerText.match(/(.*)(?!=\[[Ff]orrás:|\([Ff]orrás:|\([Ss]ource:|\[[Ss]ource:)/)[0] || ""; } catch(e) { return ""; }
        },
        /**
         * Get the rating of the anime
         * @returns {Number} The rating of the anime
         * @since v0.1.8
         */
        getRating() {
            if (!MA.isAnimePage()) return -1;
            try{ return parseFloat(document.querySelector('.gen-single-tv-show-info p')?.innerText.match(/(\d+\.\d+) \/ 10/)[1]) || -1; } catch(e) { return -1; }
        },
        /**
         * Get the age rating of the anime
         * @returns {String} The age rating of the anime
         * @since v0.1.8
         */
        getAgeRating() {
            if (!MA.isAnimePage()) return "";
            try{ return document.querySelector('.gen-rating')?.innerText || ""; } catch(e) { return ""; }
        },
        /**
         * Get the season of the anime (e.g. "Winter 2023")
         * @returns {String} The season of the anime
         * @since v0.1.8
         */
        getSeason() {
            if (!MA.isAnimePage()) return "";
            try{ return document.querySelectorAll('.gen-single-meta-holder')[1]?.querySelector('ul > li:nth-child(4)')?.innerText || ""; } catch(e) { return ""; }
        },
        /**
         * Get the episode count of the anime
         * @returns {Number} The episode count of the anime
         * @since v0.1.8
         */
        getEpisodeCount() {
            if (!MA.isAnimePage()) return -1;
            try{ return parseInt(document.querySelectorAll('.gen-single-meta-holder')[1]?.querySelector('ul > li:nth-child(2)')?.innerText.match(/Epizódok: (\d+) /)[1]) || -1; } catch(e) { return -1; }
        },
        /**
         * Get the max episode count of the anime
         * @returns {Number} The max episode count of the anime (Infinity if it's unknown)
         * @since v0.1.8
         */
        getMaxEpisodeCount() {
            if (!MA.isAnimePage()) return -1;
            const maxEpisodes = document.querySelectorAll('.gen-single-meta-holder')[1]?.querySelector('ul > li:nth-child(2)')?.innerText.match(/Epizódok: \d+ \/ (\d+|∞)/)[1];
            try{ return maxEpisodes === '∞' ? Infinity : parseInt(maxEpisodes) || -1; } catch(e) { return -1; }
        },
        /**
         * Get the release date of the anime
         * @returns {String} The release date of the anime
         * @since v0.1.8
         */
        getReleaseDate() {
            if (!MA.isAnimePage()) return "";
            try{ return document.querySelectorAll('.gen-single-meta-holder')[1]?.querySelector('ul > li:nth-child(3)')?.innerText || ""; } catch(e) { return ""; }
        },
        /**
         * Get the views of the anime
         * @returns {Number} The views of the anime
         * @since v0.1.8
         */
        getViews() {
            if (!MA.isAnimePage()) return -1;
            try{ return parseInt(document.querySelectorAll('.gen-single-meta-holder')[1]?.querySelector('ul > li:nth-child(5) span')?.innerText.replace(',', '')) || -1; } catch(e) { return -1; }
        },
        /**
         * Get the episodes of the anime
         * @returns {Array<{title: String, link: String, date: String, epNumber: Number}>} The episodes of the anime
         * @since v0.1.8
         */
        getEpisodes() {
            if (!MA.isAnimePage()) return [];
            try {
                return [...document.querySelectorAll('.owl-item, .epizod_link_normal')].map(item => ({
                    title: item.querySelector('.gen-episode-info a')?.textContent || item.textContent || "",
                    link: item.querySelector('.gen-episode-info a')?.href || item.href || "",
                    date: item.querySelector('.release-date')?.textContent || "",
                    epNumber: parseInt(item.querySelector('.gen-episode-info a')?.textContent.match(/(\d+)/)?.[1] || item.textContent.match(/(\d+)/)?.[1]) || -1
                })) || [];
            } catch(e) { return []; }
        },
        /**
         * Get the torrent links of each episode
         *
         * If the torrent has all episodes in one, the episode number will be Infinity (e.g. "01 ~ 12")
         * @returns {Array<{title: String, link: String, epNumber: Number}>} The torrent links of each episode
         * @since v0.1.8
         */
        getTorrents() {
            if (!MA.isAnimePage()) return [];
            try{ return [...document.querySelectorAll('.epizod_torrent')].map(torrentItem => ({
                title: torrentItem.textContent || "",
                link: torrentItem.href || "",
                epNumber: torrentItem.textContent.includes("~") ? Infinity : parseInt(torrentItem.textContent.match(/(\d+)/)?.[1]) || -1
            })) || []; } catch(e) { return []; }
        },
        /**
         * Get the related anime of the anime
         * @returns {Array<{title: String, link: String, season: String, genres: Array<String>}>} The related anime of the anime
         * @since v0.1.8
         */
        getRelatedAnime() {
            if (!MA.isAnimePage()) return [];
            try{ return [...document.querySelectorAll('.gen-movie-contain')].map(animeItem => ({
                title: animeItem.querySelector('.gen-movie-info h3 a')?.textContent || "",
                link: animeItem.querySelector('.gen-movie-info h3 a')?.href || "",
                season: animeItem.querySelector('.gen-movie-meta-holder ul li')?.textContent || "",
                genres: animeItem.querySelector('.gen-movie-meta-holder ul li:nth-child(2) a span')?.textContent.split(',').map((g) => g.trim()) || []
            })) || []; } catch(e) { return []; }
        },
        /**
         * Get the source of the anime
         * @returns {Array<{site: String, link: String}>} The source of the anime
         * @since v0.1.8
         */
        getSource() {
            if (!MA.isAnimePage()) return [];
            try{ return [...document.querySelectorAll('.sourceslink')].map(sourceItem => ({
                site: sourceItem.textContent.toLowerCase() || "",
                link: sourceItem.href || ""
            })) || []; } catch(e) { return []; }
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
                source: MA.ANIME.getSource(),
                checks: {
                    isEpisodePage: MA.isEpisodePage(),
                    isAnimePage: MA.isAnimePage(),
                },
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
            try{ return parseInt(document.querySelector(".gen-title").innerText.match(/(\d+)\.?\s?[rR]ész/)[1]) || -1; } catch(e) { return -1; }
        },
        /**
         * Get the release date of the episode
         * @returns {String} The release date of the episode
         * @since v0.1.8
         */
        getReleaseDate() {
            if (!MA.isEpisodePage()) return "";
            try{ return document.querySelector('.gen-single-meta-holder ul li:nth-child(1)')?.innerText || ""; } catch(e) { return ""; }
        },
        /**
         * Get the views of the episode
         * @returns {Number} The views of the episode
         * @since v0.1.8
         */
        getViews() {
            if (!MA.isEpisodePage()) return -1;
            try{ return parseInt(document.querySelector('.gen-single-meta-holder ul li:nth-child(3) span')?.innerText.match(/(\d+)/)[1]) || -1; } catch(e) { return -1; }
        },
        /**
         * Get the fansub data
         * @returns {{name: String, link: String}} The fansub data
         * @since v0.1.8
         */
        getFansub() {
            if (!MA.isEpisodePage()) return {name: "", link: ""};
            try{ return {
                name: document.querySelector('.gen-single-meta-holder p a')?.innerText || "",
                link: document.querySelector('.gen-single-meta-holder p a')?.href || ""
            } || {name: "", link: ""}; } catch(e) { return {name: "", link: ""}; }
        },
        /**
         * Get the urls for different qualities of the episode
         * @returns {Array<{site: String, link: String}>} The urls for different qualities of the episode
         * @since v0.1.8
         */
        getUrls() {
            if (!MA.isEpisodePage()) return [];
            try{ return [...document.querySelectorAll('.gomb2')].map(btn => ({
                site: btn.innerText.trim() || "",
                link: btn.href || ""
            })) || []; } catch(e) { return []; }
        },
        /**
         * Get the previous episode link
         * @returns {String} The previous episode link
         * @since v0.1.8
         */
        getPreviousEpisodeLink() {
            if (!MA.isEpisodePage()) return "";
            try{ return document.getElementById('epelozo')?.href || ""; } catch(e) { return ""; }
        },
        /**
         * Get the next episode link
         * @returns {String} The next episode link
         * @since v0.1.8
         */
        getNextEpisodeLink() {
            if (!MA.isEpisodePage()) return "";
            try{ return document.getElementById('epkovetkezo')?.href || ""; } catch(e) { return ""; }
        },
        /**
         * Get the link for the datasheet of the anime
         * @returns {String} The link for the datasheet of the anime
         * @since v0.1.8
         */
        getAnimeLink() {
            if (!MA.isEpisodePage()) return "";
            try{ return document.getElementById('adatlap')?.href || ""; } catch(e) { return ""; }
        },
        /**
         * Get all episode links
         * @returns {Array<{eposodeNumber: Number, title: String, link: String}>} All episode links
         * @since v0.1.8
         */
        getAllEpisodes() {
            if (!MA.isEpisodePage()) return [];
            try{  return [...document.querySelectorAll('.epizod_link_normal')].map(episodeItem => ({
                episodeNumber: parseInt(episodeItem.textContent.match(/(\d+)/)[1]) || -1,
                title: episodeItem.textContent || "",
                link: episodeItem.href || ""
            })) || []; } catch(e) { return []; }
        },
        /**
         * Returns the id of the episode
         * @returns {number}
         */
        getId() {
            if (!MA.isEpisodePage()) return -1;
            try{ return parseInt(window.location.pathname.match(/(-s\d+)?\/(\d+)\//)[2]) || -1; } catch(e) { return -1; }
        },

        /**
         * Get the datasheet of the episode
         * @returns {Number} The datasheet of the episode
         */
        getDatasheet() {
            if (!MA.isEpisodePage()) return -1;
            try{ return Number(document.querySelector('#adatlap')?.href.match(/\/leiras\/(\d+)\//)[1]) || -1; } catch(e) { return -1; }
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
                animeLink: MA.EPISODE.getAnimeLink(),
                allEpisodes: MA.EPISODE.getAllEpisodes(),
                id: MA.EPISODE.getId(),
                datasheetId:  MA.EPISODE.getDatasheet(),
                checks: {
                    isEpisodePage: MA.isEpisodePage(),
                    isAnimePage: MA.isAnimePage(),
                },
            };
        },

    }

    removeCSS() {
        document.querySelectorAll('#MAT_CSS').forEach((style) => style.remove());
    }
}
const MA = new MagyarAnime();
class popup {
    constructor() {
        this.popups = [];
    }

    /**
     * Function to show an error popup
     * @param {string} message - The message to show
     * @param {number} time - The time to show the popup in milliseconds (default: 2000)
     * @since v0.1.8
     */
    showErrorPopup(message, time= 2000) {
        const popup = document.createElement('div');
        popup.innerHTML = `<p><i class="fas fa-exclamation-circle"></i> ${message}</p>`;
        popup.className = 'MAT-popup error-popup';
        this._showPopup(popup, time || 2000);
    }

    /**
     * Function to show an info popup
     * @param {string} message - The message to show
     * @param {number} time - The time to show the popup in milliseconds (default: 2000)
     * @since v0.1.8
     */
    showInfoPopup(message, time= 2000) {
        const popup = document.createElement('div');
        popup.innerHTML = `<p><i class="fas fa-info-circle"></i> ${message}</p>`;
        popup.className = 'MAT-popup info-popup';
        this._showPopup(popup, time || 2000);
    }

    /**
     * Function to show a success popup
     * @param {string} message - The message to show
     * @param {number} time - The time to show the popup in milliseconds
     * @since v0.1.8
     */
    showSuccessPopup(message, time= 2000) {
        const popup = document.createElement('div');
        popup.innerHTML = `<p><i class="fas fa-check-circle"></i> ${message}</p>`;
        popup.className = 'MAT-popup success-popup';
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
        popup.innerHTML = `<p><i class="fas fa-exclamation-triangle"></i> ${message}</p>`;
        popup.className = 'MAT-popup warning-popup';
        this._showPopup(popup, time || 2000);
    }

    /**
     * Function to show a generic popup
     * @param {HTMLElement} popup - The popup element to show
     * @param {number} time - The time to show the popup in milliseconds
     * @since v0.1.8
     */
    _showPopup(popup, time) {
        if (time < 0) time = 2000;
        popup.setAttribute('style', `${document.fullscreenElement ? 'top' : 'bottom'}: ${10 + this.popups.length * 60}px;`);
        const appendPopup = () => {
            if (document.fullscreenElement) {
                document.fullscreenElement.appendChild(popup);
            } else {
                document.body.appendChild(popup);
            }
            if (time > 1000) popup.animate([ { left: '-100%' }, { left: '10px' } ], {duration: 750, fill: 'forwards', easing: 'ease-in-out'});
            this.popups.push(popup);
            setTimeout(() => {
                popup.style.opacity = "0";
                if (time > 1000) popup.animate([ { left: '10px' }, { left: '-100%' } ], {duration: 750, fill: 'forwards', easing: 'ease-in-out'});
                setTimeout(() => {
                    this.popups.shift();
                    popup.remove();
                    this.popups.forEach((p, index) => {
                        if (document.fullscreenElement) {
                            p.style.top = `${10 + index * 60}px`;
                        } else {
                            p.style.bottom = `${10 + index * 60}px`;
                        }
                    });
                }, time > 1000 ? 750 : time);
            }, time);
        };

        if (!document.body) {
            document.addEventListener('DOMContentLoaded', appendPopup);
        } else {
            appendPopup();
        }
    }
}
const Popup = new popup();
class resume {
    /**
     * Create a new Episode class
     * @since v0.1.8
     * @constructor Episode - Create a new Episode class
     * @property {Array<Anime>} animes - The animes with resume data
     */
    constructor() {
        this.animes = [];
    }

    /**
     * Add resume data
     * @param {Number} episodeId - The ID of the episode
     * @param {Number} time - The time in the episode
     * @param {Number} datasheetId - The ID of the datasheet
     * @param {String} title - The title of the anime
     * @param {String} url - The URL of the episode
     * @param {Number} epnum - The episode number
     * @param {Number} currentTime - The current time in real life (in milliseconds)
     * @since v0.1.8
     */
    addData(episodeId, time, datasheetId, title, url, epnum, currentTime) {
        this.loadData().then(() => {
            let anime = this.animes.find(anime => anime.datasheetId === datasheetId);
            if (!anime) {
                anime = new Anime(datasheetId, title);
                this.animes.push(anime);
            }
            anime.addEpisode(new Episode(episodeId, time, url, epnum, currentTime));
            this.saveData();
        });
    }

    /**
     * Remove resume data
     * @param {Number} id - The ID of the episode
     * @since v0.1.8
     */
    removeData(id) {
        return new Promise((resolve, reject) => {
            for (const anime of this.animes) {
                anime.removeEpisode(id);
            }
            this.animes = this.animes.filter(anime => anime.episodes.length > 0);
            this.saveData();
            if (this.getDataByEpisodeId(id) === null) {
                resolve(true);
            } else {
                reject(new Error('Resume data not removed'));
            }
        });
    }

    /**
     * Save the resume data
     * @since v0.1.8
     */
    saveData() {
        saveToStorage('resume', this.animes).then(() => {
        }).catch(() => {
            Logger.error('Error: Resume data not saved', true);
            console.log(chrome.runtime.lastError);
        });
    }

    /**
     * Load the resume data
     * @returns {Promise<Array<Anime>>} The resume data
     * @since v0.1.8
     */
    loadData() {
        return new Promise((resolve) => {
            loadFromStorage('resume').then((resume) => {
                this.animes = resume.map(animeData => {
                    const anime = new Anime(animeData.datasheetId, animeData.title);
                    anime.episodes = animeData.episodes.map(ep => new Episode(ep.id, ep.time, ep.url, ep.epnum, ep.timestamp));
                    return anime;
                });
                resolve(this.animes);
            }).catch(() => {
                resolve([]);
            });
        });
    }

    /**
     * Get the resume data by episode ID
     * @param {Number} id - The ID of the episode
     * @returns {Episode | null} The resume data
     * @since v0.1.8
     */
    getDataByEpisodeId(id) {
        for (const anime of this.animes) {
            const episode = anime.getEpisodeById(id);
            if (episode) return episode;
        }
        return null;
    }

    /**
     * Update resume data
     * @param {Number} id - The ID of the episode
     * @param {Number} time - The time in the episode
     * @param {Number} datasheetId - The ID of the datasheet
     * @param {String} title - The title of the anime
     * @param {String} url - The URL of the episode
     * @param {Number} epnum - The episode number
     * @param {Number} currentTime - The current time in real life (in milliseconds)
     * @since v0.1.8
     */
    updateData(id, time, datasheetId, title, url, epnum, currentTime) {
        this.loadData().then(() => {
            const anime = this.animes.find(anime => anime.datasheetId === datasheetId);
            if (anime) {
                const episode = anime.getEpisodeById(id);
                if (episode) {
                    episode.time = time;
                    episode.timestamp = Date.now();
                } else {
                    anime.addEpisode(new Episode(id, time, url, epnum, currentTime));
                }
            } else {
                this.addData(id, time, datasheetId, title, url, epnum, currentTime);
            }
            this.saveData();
        });
    }

    /**
     * Get the last updated resume data
     * @returns {{episode: Episode | null, anime: Anime | null}} The last updated resume data
     */
    getLastUpdated() {
        let lastUpdated = null;
        let lastAnime = null;
        for (const anime of this.animes) {
            for (const episode of anime.episodes) {
                if (!lastUpdated || episode.timestamp > lastUpdated.timestamp) {
                    lastUpdated = episode;
                    lastAnime = anime;
                }
            }
        }
        return {episode: lastUpdated, anime: lastAnime};
    }

    /**
     * Filter the resume data
     * @param {string} param - The parameter to filter
     */
    search(param) {
        return this.animes.filter(anime => anime.title.toLowerCase().includes(param.toLowerCase()));
    }

    openEpisode(id) {
        const episode = this.getDataByEpisodeId(id);
        if (episode) {
            chrome.runtime.sendMessage({
                plugin: MAT.__NAME__,
                type: 'openResume',
                id: episode.id,
                time: episode.time,
                url: episode.url,
            }, (response) => {
                if (response) {
                    Logger.log('Episode opened', true);
                } else {
                    Logger.error('Error: Episode not opened', true);
                }
            });
        } else { Logger.error('Episode not found', true); }
    }

}
class Anime {
    constructor(datasheetId, title) {
        this.datasheetId = datasheetId;
        this.title = title;
        this.episodes = [];
    }

    /**
     * Add an episode to the anime
     * @param {Episode} episode - The episode to add
     */
    addEpisode(episode) {
        this.episodes.push(episode);
    }

    /**
     * Remove an episode from the anime
     * @param {Number} id - The ID of the episode
     */
    removeEpisode(id) {
        this.episodes = this.episodes.filter(ep => Number(ep.id) !== Number(id));
    }

    getEpisodeById(id) {
        return this.episodes.find(ep => Number(ep.id) === Number(id)) || null;
    }

    getLastEpisode() {
        return this.episodes.sort((a, b) => b.timestamp - a.timestamp)[0];
    }
}
class Episode {
    constructor(id, time, url, epnum, currentTime) {
        this.id = id;
        this.timestamp = currentTime;
        this.time = time;
        this.url = url;
        this.epnum = epnum;
    }
}
const Resume = new resume();
if (typeof window !== 'undefined') {
    window.MAT = MAT;
    window.Logger = Logger;
    window.Bookmarks = Bookmarks;
    window.Popup = Popup;
    window.Resume = Resume;
    window.loadFromStorage = loadFromStorage;
    window.saveToStorage = saveToStorage;
}
export {MAT, Logger, Bookmarks, MA, Popup, Resume};

