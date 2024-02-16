const MATweaksVersion = chrome.runtime.getManifest().version;
class Settings {
    constructor() {
        // Default settings for the extension
        this.settings = {
            forwardSkip: { /* Forward skip settings (default: ctrl + →) */ enabled: true,duration: 85,ctrlKey: true,altKey: false,shiftKey: false,key: "ArrowRight",},
            backwardSkip:{ /* Backward skip settings (default: ctrl + ←)*/ enabled: true,duration: 85,ctrlKey: true,altKey: false,shiftKey: false,key: "ArrowLeft",},
            nextEpisode: { /* Next episode settings (default: alt + →)  */ enabled: true,ctrlKey: false,altKey: true,shiftKey: false,key: "ArrowRight",},
            previousEpisode: { /* Previous episode settings (default: alt + ←) */ enabled: true,ctrlKey: false,altKey: true,shiftKey: false,key: "ArrowLeft",},
            fixes: { /* Fixes the buttons (default: true) */ enabled: true,},
            devSettings: { /* Developer settings (default: false) */ enabled: false,settings: { /* Developer settings */ ConsoleLog: { /* Console log (default: false) */ enabled: false,},DefaultPlayer: { /* Default player (default: "plyr") */player: "plyr",},}},
            autoNextEpisode: { /* Auto next episode (default: false) (on last episode of the season it won't skip) */ enabled: false, time: 50, /* Time to skip to the next episode before the end of the episode (in seconds) */ },
            version: MATweaksVersion, /* Version of the extension */
        };
    }
    loadSettings() {
        chrome.storage.local.get('settings', (data) => {
            // Check for version changes
            if (data.settings === undefined || data.settings.version === undefined || data.settings.version !== MATweaksVersion) {
                // Only update the settings that are common in the new version
                const newSettings = Object.assign({}, this.settings, data.settings);
                // Update the version
                newSettings.version = MATweaksVersion;
                // Update the settings
                this.settings = newSettings;
                // Save the new settings
                this.saveSettings()
            } else {
                // Update the settings
                this.settings = data.settings;
            }
        });
    }
    saveSettings() {
        chrome.storage.local.set({settings: this.settings}, () => {
            console.log('Settings saved');
        });
    }
    getSettings() {
        console.log(this.settings);
        return this.settings;
    }
    setSettings(settings) {
        this.settings = settings;
        console.log(this.settings);
    }
}
const settings = new Settings();
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request);
    if (request.plugin === 'MATweaks') {
        switch (request.type) {
            case 'loadSettings':
                settings.loadSettings();
                sendResponse(settings.getSettings());
                return true;
            case 'saveSettings':
                console.log(request.settings);
                settings.setSettings(request.settings);
                settings.saveSettings();
                sendResponse(true);
                return true;
            default:
                sendResponse(null);
                return false;
        }
    }
});
