chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.plugin === 'MATweaks') {
        switch (request.type) {
            case 'loadSettings':
                chrome.storage.local.get('settings', (data) => {
                    sendResponse(data.settings);
                });
                return true;
            case 'saveSettings':
                chrome.storage.local.set({settings: request.settings}, () => {
                    updateRules(request.settings.devSettings.enabled);
                    sendResponse();
                });
                return true;
        }
    }
});
function updateRules(isDevMode) {
    if (isDevMode) {
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
chrome.storage.local.get('settings', (data) => {
    updateRules(data.settings.devSettings.enabled);
});

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
