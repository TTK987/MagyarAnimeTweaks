// Firefox grant permission (Original Fix by: emburcke)
chrome.runtime.onInstalled.addListener( () => {
    // Check if the extension has been installed
    chrome.permissions.contains({'origins': chrome.runtime.getManifest()['host_permissions']},(answer) => {
        if (!answer){ // If the extension does not have the permissions yet
            // Open a popup to ask for the permissions
            chrome.windows.create({
                url: chrome.runtime.getURL('permissions.html'),
                type: 'popup',
                width: 410, // To match the size of the firefox popup window
                height: 450,
                focused: true
            });
        }
    });
});
chrome.contextMenus.removeAll(() => {
    createContextMenu();
});
function createContextMenu() {
    chrome.contextMenus.create({
        id: "searchOnMagyarAnime",
        title: "Keresés a MagyarAnime-én",
        contexts: ["link", "page"],
        documentUrlPatterns: ["*://*.myanimelist.net/*"]
    });
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === "searchOnMagyarAnime") {
            let url;
            if (info.linkUrl || info.pageUrl) {
                const targetUrl = info.linkUrl || info.pageUrl;
                const match = targetUrl.match(/myanimelist\.net\/anime\/(\d+)/);
                if (match) {
                    url = `https://magyaranime.eu/web/kereso-mal/${match[1]}/`;
                }
            }
            if (url) {
                chrome.tabs.create({url: url});
            }
        }
    });
}
const MATweaksVersion = chrome.runtime.getManifest().version;
class Settings {
    constructor() {
        // Default settings for the extension
        this.settings = {
            forwardSkip: { /* Forward skip settings (default: ctrl + →) */ enabled: true,duration: 85,ctrlKey: true,altKey: false,shiftKey: false,key: "ArrowRight",},
            backwardSkip:{ /* Backward skip settings (default: ctrl + ←)*/ enabled: true,duration: 85,ctrlKey: true,altKey: false,shiftKey: false,key: "ArrowLeft",},
            nextEpisode: { /* Next episode settings (default: alt + →)  */ enabled: true,ctrlKey: false,altKey: true,shiftKey: false,key: "ArrowRight",},
            previousEpisode: { /* Previous episode settings (default: alt + ←) */ enabled: true,ctrlKey: false,altKey: true,shiftKey: false,key: "ArrowLeft",},
            devSettings: { /* Developer settings (default: false) */ enabled: false,settings: { /* Developer settings */ ConsoleLog: { /* Console log (default: false) */ enabled: false,},DefaultPlayer: { /* Default player (default: "plyr") */player: "plyr",},}},
            autoNextEpisode: { /* Auto next episode (default: false) (on last episode of the season it won't skip) */ enabled: false, time: 50, /* Time to skip to the next episode before the end of the episode (in seconds) */ },
            autoplay: { /* Autoplay (default: true) */ enabled: true, },
            autobetterQuality: { /* Auto better quality (default: false) */ enabled: false, },
            version: MATweaksVersion, /* Version of the extension */
        };
    }
    loadSettings() {
        chrome.storage.local.get('settings', (data) => {
            // Check for version changes
            const newSettings = Object.assign({}, this.settings, data.settings);
            // Update the version
            newSettings.version = MATweaksVersion;
            // Update the settings
            this.settings = newSettings;
            // Save the new settings
            this.saveSettings()
        });
    }
    saveSettings() {
        chrome.storage.local.set({settings: this.settings}, () => {
            console.log('Settings saved' + JSON.stringify(this.settings));
        });
    }
    getSettings() {
        return this.settings;
    }
    setSettings(settings) {
        this.settings = Object.assign({}, this.settings, settings);
    }
}
const settings = new Settings();
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.plugin === 'MATweaks') {
        let data;
        switch (request.type) {
            case 'loadSettings':
                settings.loadSettings();
                data = settings.getSettings();
                console.log("load:" + JSON.stringify(data));
                sendResponse(data);
                return true;
            case 'saveSettings':
                data = request.settings;
                settings.setSettings(data);
                settings.saveSettings();
                console.log("save:" + JSON.stringify(data));
                sendResponse(true);
                return true;
            case "getIconUrl":
                sendResponse(chrome.runtime.getURL('plyr.svg'));
                return true;
            case "getBlankVideo":
                sendResponse(chrome.runtime.getURL('blank.mp4'));
                return true;
            default:
                sendResponse(null);
                return false;
        }
    }
});
