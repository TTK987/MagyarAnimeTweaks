/**
 * API module for interacting with the extension
 */
class MATweaksAPI {
    /**
     * Create a new API object
     */
    constructor() {
        this.settings = this.getDefaultSettings();
    };

     /**
     * Load settings from the storage
     * @returns {Promise} A promise that resolves with the settings
     */
    loadSettings() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get('settings', (data) => {
                if (data.settings) {
                    mat_logger.log('Settings loaded.');
                    this.settings = Object.assign(this.settings, data.settings);
                    resolve(this.settings);
                } else {
                    mat_logger.log('No settings found');
                    reject(new Error('Settings not found'));
                }
            });
        });
    }

    /**
     * Save settings to the storage
     */
    saveSettings() {
        chrome.storage.local.set({settings: this.settings}, () => {
            mat_logger.log('Settings saved!');
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
        this.settings = Object.assign({}, this.settings, settings);
    }

    /**
     * Get the default settings of the extension
     * @returns {Object} The default settings of the extension
     */
    getDefaultSettings() {
        return {
            forwardSkip: { /* Forward skip settings (default: ctrl + →) */ enabled: true, time: 85, ctrlKey: true, altKey: false, shiftKey: false, key: "ArrowRight",},
            backwardSkip: { /* Backward skip settings (default: ctrl + ←)*/ enabled: true, time: 85, ctrlKey: true, altKey: false, shiftKey: false, key: "ArrowLeft",},
            nextEpisode: { /* Next episode settings (default: alt + →)  */ enabled: true, ctrlKey: false, altKey: true, shiftKey: false, key: "ArrowRight",},
            previousEpisode: { /* Previous episode settings (default: alt + ←) */ enabled: true, ctrlKey: false, altKey: true, shiftKey: false, key: "ArrowLeft",},
            autoNextEpisode: { /* Auto next episode (default: false) (on last episode of the season it won't skip) */ enabled: false, time: 60, /* Time to skip to the next episode before the end of the episode (in seconds) */},
            autoplay: { /* Autoplay (default: true) */ enabled: true,},
            version: this.getVersion(), /* Version of the extension */
            eap: false, /* Enable Early Access Program (default: false) (Basically useless, adds "EAP" text and that's it xd) */
            advanced: { /* Advanced settings */
                enabled: /* Developer settings (default: false) */ false,
                settings: { /* Developer settings */ ConsoleLog: { /* Console log (default: false) */ enabled: false,}, DefaultPlayer: { /* Default player (default: "plyr") */ player: "plyr",},},
                plyr: { /* Plyr settings */
                    design: { /* Plyr design settings */
                        enabled: /* Plyr design settings (default: false) */ false,
                        settings: { /* Plyr design settings */
                            svgColor: '#ffffffff',  // --plyr-video-control-color
                            hoverBGColor: '#00b3ffff', // --plyr-video-control-background-hover
                            mainColor: '#00b3ffff', // --plyr-color-main
                            hoverColor: '#ffffffff', //  --plyr-video-control-color-hover
                        },
                    },
                },
                downloadName: "%title% - %episode%.rész (%MAT%)",
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
        };
    }

    /**
     * Get the version of the extension
     * @returns {String} The version of the extension
     */
    getVersion() {
        return chrome.runtime.getManifest().version;
    }
}
/**
 * Logger class for logging messages
 */
class Logger {
    constructor() {
        this.enabled = api.getSettings().advanced.settings.ConsoleLog.enabled;
    }

    log(message) {
        if (this.enabled) {
            log(message);
        }
    }

    warn(message) {
        if (this.enabled) {
            warn(message);
        }
    }

    error(message) {
        if (this.enabled) {
            error(message)
        }
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }
}

/**
 * Function to send logs to the console
 */
function log(message) {
    console.log(`[MATweaks]: ${message}`);
}

/**
 * Function to send warnings to the console
 */
function warn(message) {
    console.warn(`[MATweaks]: ${message}`);
}

/**
 * Function to send errors to the console
 */
function error(message) {
    console.error(`[MATweaks]: ${message}`);
}

let api = new MATweaksAPI();
let mat_logger = new Logger();
// Check if there is a window object
if (typeof window !== 'undefined') {
    window.MAT = api;
    window.MATLogger = mat_logger;
}
