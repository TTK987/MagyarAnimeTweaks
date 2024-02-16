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

// This Function will be removed in the future, since MA removed the devtool blocker from the website
function updateRules() {
    if (settings.settings.devSettings.enabled) {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1],
            addRules: [
                {
                    "id": 1,
                    "priority": 1,
                    "action": {
                        "type": "block"
                    },
                    "condition": {
                        "urlFilter": "https://cdn.jsdelivr.net/npm/disable-devtool@latest",
                        "resourceTypes": ["main_frame", "script"]
                    }
                }
            ]
        });
        console.log('Removed devtool blocker');
    } else {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1],
            addRules: []
        });
        console.log('Added devtool blocker');
    }
}
// ---------------------------------------------------------------------------------------------------------------------
// COPYRIGHT NOTICE:
// - The code above is part of the "MA Tweaks" extension for MagyarAnime.eu.
// - The extension is NOT related to the magyaranime.eu website or the indavideo.hu website other than it's purpose.
// - The program is protected by the MIT licence.
// - The extension is NOT used for any commercial purposes.
// - The extension can only be used on the magyaranime.eu website.
// - The developers are not responsible for any damages caused by the use of the extension.
// - The extension was created in accordance with the "The content on the site is freely available" terms of the Magyar Anime website.
// - The extension was created in accordance with the DMCA rules of the Magyar Anime website. https://magyaranime.eu/web/dmca/
// - The developers (/s) reserve the right to modify the extension at any time.
// - If the developer (/s) of Magyar Anime requests it, I will remove the extension from GitHub and any other platform.
// - The extension is only available in Hungarian.
// - By using the extension you accept the above.
