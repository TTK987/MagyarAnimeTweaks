import {MAT, logger} from "./API.js";
chrome.runtime.onInstalled.addListener((details) => {
    checkAndRequestPermissions();
    if (details.reason === "install" || details.reason === "update") {
        const version = chrome.runtime.getManifest().version;
        logger.log(`[background.js]: Installed/Updated to version ${version}`, true);
        MAT.saveSettings();
        if (details.reason === "update") {
            const previousVersion = details.previousVersion;
            logger.log(`[background.js]: Updated from version ${previousVersion}`, true);
            migrateSettings(previousVersion, version);
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
            chrome.tabs.create({url: `https://magyaranime.eu/web/kereso-mal/${(info.linkUrl || info.pageUrl)?.match(/myanimelist\.net\/anime\/(\d+)/)[1] || ''}/`});
        }
    });
}


/**
 *  Temporary storage for bookmarks that are currently being opened and loaded
 *  @type {[{id: number, url: string}]}
 */
let openBookmarks = [];

/**
 * Temporary storage for resumes that are currently being opened and loaded
 * @type {[{id: number, url: string, time: number}]}
 */
let openResume = [];

/**
 * Handle messages from the extension
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.plugin === MAT.__NAME__) {
        switch (request.type) {
            case MAT.__ACTIONS__.DOWNLOAD:
                console.log(request);
                chrome.downloads.download({ url: request.url, filename: request.filename}, (downloadId) => {
                    if (downloadId) {
                        sendResponse("success");
                        logger.log(`[background.js]: Downloading file: ${request.filename}`, true);
                    } else {
                        sendResponse("error");
                        logger.error(`[background.js]: Failed to download file: ${request.filename}`, true);
                    }
                });
                return true;
            case "openSettings":
                chrome.tabs.create({
                    url: chrome.runtime.getURL('pages/settings/index.html'),
                    active: true,
                }).then(r => {
                    sendResponse(true);
                }).catch(e => {
                    sendResponse(false);
                });
                return true;
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
            case "openResume":
                logger.log(`[background.js]: Opening resume: ${request.id}`, true);
                if (openResume.find(id => id === request.id)) {
                    logger.log(`[background.js]: Resume ${request.id} is already being opened`, true);
                    sendResponse(false);
                    return;
                } else {
                    logger.log(`[background.js]: Resume ${request.id} is being opened`, true);
                    openResume.push({id: request.id, url: request.url, time: request.time});
                }
                logger.log(`[background.js]: Opening resume: ${request.url}`, true);
                chrome.tabs.create({
                    url: request.url,
                    active: true,
                });
                sendResponse(true);
                break;
            case "removeOpenResume":
                logger.log(`[background.js]: Resume ${request.id} opened`, true);
                openResume = openResume.filter(b => Number(b.id) !== Number(request.id));
                console.log(openResume);
                sendResponse(true);
                break;
            case "getOpenResume":
                sendResponse(openResume);
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

/**
 * Helper function to migrate settings
 * @param {String} previousVersion The previous version of the extension
 * @param {String} currentVersion The current version of the extension
 */
function migrateSettings(previousVersion, currentVersion) {
    if (previousVersion !== currentVersion) {
        const migrateFn = getMigrationFunction(previousVersion);
        if (migrateFn) {
            MAT.getSettings().then(data => {
                MAT.setSettings(migrateFn(data));
                MAT.saveSettings();
            });
        } else {
            logger.error(`[background.js]: Failed to migrate settings from version ${previousVersion} to version ${currentVersion}`, true);
            MAT.setSettings(MAT.getDefaultSettings());
            MAT.saveSettings();
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
    return null;
}

/**
 * Migrate the settings from version 0.1.8 to the current version
 * @param {Object} pr The previous settings
 * @returns {Object} The migrated settings from version 0.1.8 to the current version
 * @since v0.1.8
 */
function migrateSettings_0_1_8(pr) {
    logger.log(`[background.js]: Migrating settings from version 0.1.8 to version ${MAT.getVersion()}`, true);
    try {
        if (!/0.1.8.[0-9]/.test(pr.version)) return pr;
        // Boilerplate code for future migrations from 0.1.8.x
        return pr;
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
 * @param {Object} pr The previous settings
 * @returns {Object} The migrated settings from version 0.1.7.x to 0.1.8.x
 * @since v0.1.8
 */
function migrateSettings_0_1_7(pr) {
    logger.log(`[background.js]: Migrating settings from version 0.1.7.x to version ${MAT.getVersion()}`, true);
    try {
        if (!/0.1.7.[0-9]/.test(pr.version)) {
            logger.log(`[background.js]: Settings are already up to date`, true);
            return pr
        }
        return {
            
        };
    } catch (error) {
        logger.error(`[background.js]: Failed to migrate settings from version 0.1.7.x to version ${MAT.getVersion()}`, true);
        console.error(error);
        return MAT.getDefaultSettings();
    } finally {
        logger.log(`[background.js]: Migrated settings from version 0.1.7.x to version ${MAT.getVersion()}`, true);
    }
}
