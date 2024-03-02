chrome.runtime.onInstalled.addListener((details) => { // run at install
    //tartalmazza e ezeket a permissionoket
    chrome.permissions.contains({'origins':
        // az oszes manifestben levo premission ami vebhejre mutat
        chrome.runtime.getManifest()['host_permissions']},(answer) => {
            if (! answer){ // ha nem tartalmazza => open a new tab ahol premissionoket kerunk a usertol
                chrome.tabs.create({"url":chrome.runtime.getURL("premissions.html")});
            }
    });
});

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
