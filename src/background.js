chrome.runtime.onInstalled.addListener((details) => {
    checkAndRequestPermissions();
    // Check if the extension was installed or updated
    if (details.reason === "install" || details.reason === "update") {
        // Get the version of the extension
        const version = chrome.runtime.getManifest().version;
        // Log the version
        console.log(`[MATweaks]: Installed/Updated to version ${version}`);
        // Create the settings
        MAT.saveSettings();
        // Check if the extension was updated
        if (details.reason === "update") {
            // Get the previous version of the extension
            const previousVersion = details.previousVersion;
            // Log the previous version
            console.log(`[MATweaks]: Updated from version ${previousVersion}`);
            // Check if the previous settings version is less than the current settings version
            migrateSettings(previousVersion);
        }
    }
    MAT.loadSettings().then(() => {
        if (MAT.getSettings().version !== MAT.getVersion()) {
            MAT.setSettings(MAT.getDefaultSettings());
        }
    }).catch(() => {
        MAT.setSettings(MAT.getDefaultSettings());
    });

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
 * Handle messages from the extension
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.plugin === 'MATweaks') {
        switch (request.type) {
            case "downloadFile":
                // Download the file
                chrome.downloads.download({ url: request.url, filename: request.filename});
                sendResponse(true);
                return true;
            case "openSettings":
                // Open the settings page
                chrome.tabs.create({
                    url: chrome.runtime.getURL('options.html'),
                    active: true,
                });
                sendResponse(true);
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
 *
 * Original fix by: emburcke
 * @since v0.1.6.1
 */
function checkAndRequestPermissions() {
    chrome.permissions.contains({ 'origins': chrome.runtime.getManifest()['host_permissions'] }, (answer) => {
        if (!answer) {
            openPermissionPopup();
        }
    });
}

/**
 * Migrate the settings from the previous version to the current version
 * @param {String} previousVersion The previous version of the extension
 *
 */
function migrateSettings(previousVersion) {
    const currentVersion = chrome.runtime.getManifest().version;
    MAT.loadSettings().then(data => {
        if (MAT.getSettings().version !== MAT.getVersion()) {
            MAT.setSettings(Object.assign({}, MAT.getDefaultSettings(), data));
            console.log(`[MATweaks]: Migrated settings from version ${previousVersion} to version ${currentVersion}`);
            console.log(`[MATweaks]: Settings:`, JSON.stringify(MAT.getSettings()));
            MAT.saveSettings();
        }
    }).catch(() => {
        MAT.setSettings(MAT.getDefaultSettings());
        MAT.saveSettings();
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
