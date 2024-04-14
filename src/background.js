/**
 * Check if the extension has the permissions and request if not granted
 *
 * Original Fix by: emburcke
 */
chrome.runtime.onInstalled.addListener((details) => {
    checkAndRequestPermissions();
});

/**
 * Remove all context menus and create a new one
 */
chrome.contextMenus.removeAll(() => {
    createContextMenu();
});

/**
 * Create a context menu to search on MagyarAnime from MyAnimeList.net
 */
function createContextMenu() {
    // Create the context menu
    chrome.contextMenus.create({
        id: "searchOnMagyarAnime",
        title: "Keresés a MagyarAnime-én",
        contexts: ["link", "page"],
        documentUrlPatterns: ["*://*.myanimelist.net/*"]
    });

    // Handle click on context menu item
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === "searchOnMagyarAnime") {
            let url;
            // Check if the context menu was clicked on a link or page
            if (info.linkUrl || info.pageUrl) {
                // Get the target URL
                const targetUrl = info.linkUrl || info.pageUrl;
                // Check if the target URL is an anime page on MyAnimeList
                const match = targetUrl.match(/myanimelist\.net\/anime\/(\d+)/);
                if (match) {
                    // Create the URL to search on MagyarAnime
                    url = `https://magyaranime.eu/web/kereso-mal/${match[1]}/`;
                }
            }
            if (url) {
                // Open the URL in a new tab
                chrome.tabs.create({ url: url });
            }
        }
    });
}

/**
 * Class to handle settings of the extension
 * @class
 * @property {Object} settings - The settings of the extension
 */
class Settings {
    /**
     * Create a new settings object
     */
    constructor() {
        this.settings = {
            forwardSkip: { /* Forward skip settings (default: ctrl + →) */ enabled: true,duration: 85,ctrlKey: true,altKey: false,shiftKey: false,key: "ArrowRight",},
            backwardSkip:{ /* Backward skip settings (default: ctrl + ←)*/ enabled: true,duration: 85,ctrlKey: true,altKey: false,shiftKey: false,key: "ArrowLeft",},
            nextEpisode: { /* Next episode settings (default: alt + →)  */ enabled: true,ctrlKey: false,altKey: true,shiftKey: false,key: "ArrowRight",},
            previousEpisode: { /* Previous episode settings (default: alt + ←) */ enabled: true,ctrlKey: false,altKey: true,shiftKey: false,key: "ArrowLeft",},
            devSettings: { /* Developer settings (default: false) */ enabled: false,settings: { /* Developer settings */ ConsoleLog: { /* Console log (default: false) */ enabled: false,},DefaultPlayer: { /* Default player (default: "plyr") */player: "plyr",},}},
            autoNextEpisode: { /* Auto next episode (default: false) (on last episode of the season it won't skip) */ enabled: false, time: 50, /* Time to skip to the next episode before the end of the episode (in seconds) */ },
            autoplay: { /* Autoplay (default: true) */ enabled: true, },
            autobetterQuality: { /* Auto better quality (default: false) */ enabled: false, },
            version: chrome.runtime.getManifest().version, /* Version of the extension */
        };
    }

    /**
     * Load settings from the storage
     * @returns {Promise} A promise that resolves with the settings
     */
    loadSettings() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get('settings', (data) => {
                if (data.settings) {
                    console.log('Settings loaded ' + JSON.stringify(data.settings));
                    this.settings = Object.assign(this.settings, data.settings);
                    resolve(this.settings);
                } else {
                    console.log('No settings found');
                    reject(new Error('Settings not found'));
                }
            });
        });
    }


    /**
     * Save settings to the storage
     */
    saveSettings() {
        chrome.storage.local.set({ settings: this.settings }, () => {
            console.log('Settings saved ' + JSON.stringify(this.settings));
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
}

/**
 * The settings of the extension
 * @type {Settings} settings
 */
const settings = new Settings();

/**
 * Handle messages from the extension
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.plugin === 'MATweaks') {
        let data;
        // Handle the message type
        switch (request.type) {
            case 'loadSettings':
                settings.loadSettings().then((settings) => {
                    sendResponse(settings);
                });
                return true;
            case 'saveSettings':
                // Save the settings to the storage and send the result as a response
                data = request.settings;
                settings.setSettings(data);
                settings.saveSettings();
                console.log("saved: " + JSON.stringify(data));
                // Check if the settings are saved correctly
                if (JSON.stringify(data) === JSON.stringify(settings.getSettings())) {
                    sendResponse(true);
                } else {
                    console.log(JSON.stringify(data));
                    console.log(JSON.stringify(settings.getSettings()));
                    sendResponse(false);
                }
                return true;
            case "getIconUrl":
                // Send the URL of the icon as a response
                sendResponse(chrome.runtime.getURL('plyr.svg'));
                return true;
            case "getBlankVideo":
                // Send the URL of the blank video as a response
                sendResponse(chrome.runtime.getURL('blank.mp4'));
                return true;
            default:
                // Send null as a response
                sendResponse(null);
                return false;
        }
    }
});

/**
 * Check if the extension has the permissions and request if not granted
 */
function checkAndRequestPermissions() {
    chrome.permissions.contains({ 'origins': chrome.runtime.getManifest()['host_permissions'] }, (answer) => {
        if (!answer) {
            openPermissionPopup();
        }
    });
}

/**
 * Open the permission popup
 */
function openPermissionPopup() {
    chrome.windows.create({
        url: chrome.runtime.getURL('permissions.html'),
        type: 'popup',
        width: 410,
        height: 450,
        focused: true,
    });
}
