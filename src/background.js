import {MAT, logger, bookmarks} from "./API.js";
chrome.runtime.onInstalled.addListener((details) => {
    checkAndRequestPermissions();
    if (details.reason === "install" || details.reason === "update") {
        const version = chrome.runtime.getManifest().version;
        logger.log(`[background.js]: Installed/Updated to version ${version}`, true);
        MAT.saveSettings();
        if (details.reason === "update") {
            const previousVersion = details.previousVersion;
            logger.log(`[background.js]: Updated from version ${previousVersion}`, true);
            migrateLocalSettings(previousVersion, version);
            migrateSyncSettings(previousVersion, version);
            MAT.saveSettings();
        }
    }
    MAT.loadSettings().then(() => {
        MAT.saveSettings();
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
                chrome.tabs.create({ url: url });
            }
        }
    });
}


/**
 *  Temporary storage for bookmarks that are currently being opened and loaded
 *  @type {[{id: number, url: string}]}
 */
let openBookmarks = [];





















/**
 * Handle messages from the extension
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request);
    if (request.plugin === MAT.__NAME) {
        switch (request.type) {
            case "downloadFile":
                // Download the file
                chrome.downloads.download({url: request.url, filename: request.filename}).then(r => {
                    logger.log(`[background.js]: Downloading file: ${request.filename}`, true);
                    sendResponse(true);
                }).catch(e => {
                    logger.log(`[background.js]: Failed to download file: ${e}`, true);
                    sendResponse(false);
                })
                break;
            case "openSettings":
                chrome.tabs.create({
                    url: chrome.runtime.getURL('options.html'),
                    active: true,
                }).then(r => {
                    sendResponse(true);
                }).catch(e => {
                    sendResponse(false);
                });
                break;
            case "openBookmark":
                logger.log(`[background.js]: Opening bookmark: ${request.id}`, true);
                if (openBookmarks.find(id => id === request.id)) {
                    logger.log(`[background.js]: Bookmark ${request.id} is already being opened`, true);
                    sendResponse(false);
                    return;
                } else {
                    logger.log(`[background.js]: Bookmark ${request.id} is being opened`, true);
                    openBookmarks.push({id: request.id, url: request.url});
                }
                logger.log(`[background.js]: Opening bookmark: ${request.url}`, true);
                chrome.tabs.create({
                    url: request.url,
                    active: true,
                });
                sendResponse(true);
                break;
            case "removeOpenBookmark":
                logger.log(`[background.js]: Bookmark ${request.id} opened`, true);
                openBookmarks = openBookmarks.filter(b => Number(b.id) !== Number(request.id));
                console.log(openBookmarks);
                sendResponse(true);
                break;
            case "getOpenBookmarks":
                sendResponse(openBookmarks);
                break;
            default:
                break;
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
    chrome.permissions.contains({origins: chrome.runtime.getManifest()['host_permissions'] }, (answer) => {
        if (!answer) openPermissionPopup(); else logger.log(`[background.js]: Permissions already granted`, true);
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


// |=================================================================================================
// | CURRENTLY ALL THE CODE BELOW IS BROKEN AND NEEDS TO BE FIXED
// |=================================================================================================

// TODO: Fix settings migration
/**
 * Helper function to migrate settings
 * @param {String} previousVersion The previous version of the extension
 * @param {String} currentVersion The current version of the extension
 * @param {Function} getSettings Function to get settings (local or sync)
 * @param {Function} saveSettings Function to save settings (local or sync)
 */
function migrateSettings(previousVersion, currentVersion, getSettings, saveSettings) {
    if (previousVersion !== currentVersion) {
        const migrateFn = getMigrationFunction(previousVersion);
        if (migrateFn) {
            getSettings().then(data => {
                MAT.setSettings(migrateFn(data));
                saveSettings();
            });
        } else {
            logger.error(`[background.js]: Failed to migrate settings from version ${previousVersion} to version ${currentVersion}`, true);
            MAT.setSettings(MAT.getDefaultSettings());
            saveSettings();
        }
    }
}

/**
 * Get the appropriate migration function based on the version
 * @param {String} version The version of the extension
 * @returns {Function} The migration function
 */
function getMigrationFunction(version) {
    if (/0.1.8.[0-9]/.test(version)) return migrateSettings_0_1_8;
    if (/0.1.7.[0-9]/.test(version)) return migrateSettings_0_1_7;
    if (/0.1.6.[0-9]/.test(version)) return migrateSettings_0_1_6;
    if (/0.1.5.[0-9]/.test(version)) return migrateSettings_0_1_5;
    return null;
}

/**
 * Migrate local settings
 * @param {String} previousVersion The previous version of the extension
 * @param {String} currentVersion The current version of the extension
 */
function migrateLocalSettings(previousVersion, currentVersion) {
    migrateSettings(previousVersion, currentVersion, MAT.getLocalSettings, MAT.saveLocalSettings);
}

/**
 * Migrate sync settings
 * @param {String} previousVersion The previous version of the extension
 * @param {String} currentVersion The current version of the extension
 */
function migrateSyncSettings(previousVersion, currentVersion) {
    migrateSettings(previousVersion, currentVersion, MAT.getSyncSettings, MAT.saveSyncSettings);
}
/**
 * Migrate the settings from version 0.1.8 to the current version
 * @param {Object} previousSettings The previous settings
 * @returns {Object} The migrated settings from version 0.1.8 to the current version
 * @since v0.1.8
 */
function migrateSettings_0_1_8(previousSettings) {
    logger.log(`[background.js]: Migrating settings from version 0.1.8 to version ${MAT.getVersion()}`, true);
    try {
        if (!/0.1.8.[0-9]/.test(previousSettings.version)) return previousSettings
        previousSettings.version = MAT.getVersion();
        return previousSettings;
    } catch (error) {
        logger.error(`[background.js]: Failed to migrate settings from version 0.1.8 to version ${MAT.getVersion()}`, true);
        console.error(error);
        return MAT.getDefaultSettings();
    } finally {
        logger.log(`[background.js]: Migrated settings from version 0.1.8 to version ${MAT.getVersion()}`, true);
    }
}
/**
 * Migrate the settings from version 0.1.7.x to 0.1.8.x
 * @param {Object} previousSettings The previous settings
 * @returns {Object} The migrated settings from version 0.1.7.x to 0.1.8.x
 * @since v0.1.8
 */
function migrateSettings_0_1_7(previousSettings) {
    logger.log(`[background.js]: Migrating settings from version 0.1.7.x to version ${MAT.getVersion()}`, true);
    try {
        if (!/0.1.7.[0-9]/.test(previousSettings.version)) {
            logger.log(`[background.js]: Settings are already up to date`, true);
            return previousSettings
        }
        let data = MAT.getDefaultSettings();
        data.version = MAT.getVersion();
        data.private.eap = previousSettings.eap || false;
        data = Object.assign(data, previousSettings);
        if (data.advanced.settings.DefaultPlayer.player === 'html5') data.advanced.settings.DefaultPlayer.player = 'plyr';
        return data;
    } catch (error) {
        logger.error(`[background.js]: Failed to migrate settings from version 0.1.7.x to version ${MAT.getVersion()}`, true);
        console.error(error);
        return MAT.getDefaultSettings();
    } finally {
        logger.log(`[background.js]: Migrated settings from version 0.1.7.x to version ${MAT.getVersion()}`, true);
    }
}
/**
 * Migrate the settings from version 0.1.6.x to 0.1.7.x
 * @param {Object} previousSettings The previous settings
 * @returns {Object} The migrated settings from version 0.1.6.x to 0.1.7.x
 * @since v0.1.8
 */
function migrateSettings_0_1_6(previousSettings) {
    logger.log(`[background.js]: Migrating settings from version 0.1.6.x to version ${MAT.getVersion()}`, true);

    try {
        if (!/0.1.6.[0-9]/.test(previousSettings.version)) return previousSettings
        let data = MAT.getDefaultSettings();
        data.version = MAT.getVersion();
        data.advanced.enabled = previousSettings.devSettings.enabled || false;
        data.advanced.settings.ConsoleLog.enabled = previousSettings.devSettings.settings.ConsoleLog.enabled || false;
        data.advanced.settings.DefaultPlayer.player = previousSettings.devSettings.settings.DefaultPlayer.player || 'plyr';
        data.forwardSkip.time = previousSettings.forwardSkip.duration || 85;
        data.backwardSkip.time = previousSettings.backwardSkip.duration || 85;
        data = Object.assign(data, previousSettings);
        if (data.advanced.settings.DefaultPlayer.player === 'html5') data.advanced.settings.DefaultPlayer.player = 'plyr';
        return data;
    } catch (error) {
        logger.error(`[background.js]: Failed to migrate settings from version 0.1.6.x to version ${MAT.getVersion()}`, true);
        console.error(error);
        return MAT.getDefaultSettings();
    } finally {
        logger.log(`[background.js]: Migrated settings from version 0.1.6.x to version ${MAT.getVersion()}`, true);
    }
}
/**
 * Migrate the settings from version 0.1.5.x to 0.1.6.x
 * @param {Object} previousSettings The previous settings
 * @returns {Object} The migrated settings from version 0.1.5.x to 0.1.6.x
 * @since v0.1.8
 */
function migrateSettings_0_1_5(previousSettings) {
    logger.log(`[background.js]: Migrating settings from version 0.1.5.x to version ${MAT.getVersion()}`, true);

    try {
        if (!/0.1.5.[0-9]/.test(previousSettings.version)) return previousSettings
        let data = MAT.getDefaultSettings();
        data.version = MAT.getVersion();
        data.advanced.enabled = previousSettings.devSettings.enabled || false;
        data.advanced.settings.ConsoleLog.enabled = previousSettings.devSettings.settings.ConsoleLog.enabled || false;
        data.advanced.settings.DefaultPlayer.player = previousSettings.devSettings.settings.DefaultPlayer.player || 'plyr';
        data.forwardSkip.time = previousSettings.forwardSkip.duration || 85;
        data.backwardSkip.time = previousSettings.backwardSkip.duration || 85;
        data = Object.assign(data, previousSettings);
        if (data.advanced.settings.DefaultPlayer.player === 'html5') data.advanced.settings.DefaultPlayer.player = 'plyr';
        return data;
    } catch (error) {
        logger.error(`[background.js]: Failed to migrate settings from version 0.1.5.x to version ${MAT.getVersion()}`, true);
        console.error(error);
        return MAT.getDefaultSettings();
    } finally {
        logger.log(`[background.js]: Migrated settings from version 0.1.5.x to version ${MAT.getVersion()}`, true);
    }
}

