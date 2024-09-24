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
 * Handle messages from the extension
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.plugin === MAT.__NAME) {
        switch (request.type) {
            case MAT.__ACTIONS.DOWNLOAD:
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
                    url: chrome.runtime.getURL('options.html'),
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
    if (/0.1.6.[0-9]/.test(version)) return migrateSettings_0_1_6;
    if (/0.1.5.[0-9]/.test(version)) return migrateSettings_0_1_5;
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
            forwardSkip: { enabled: pr.forwardSkip.enabled || true, time: pr.forwardSkip.time || 85, keyBind: { ctrlKey: pr.forwardSkip.ctrlKey || true, altKey: pr.forwardSkip.altKey || false, shiftKey: pr.forwardSkip.shiftKey || false, key: pr.forwardSkip.key || 'ArrowRight', }},
            backwardSkip: { enabled: pr.backwardSkip.enabled || true, time: pr.backwardSkip.time || 85, keyBind: { ctrlKey: pr.backwardSkip.ctrlKey || true, altKey: pr.backwardSkip.altKey || false, shiftKey: pr.backwardSkip.shiftKey || false, key: pr.backwardSkip.key || 'ArrowLeft', }},
            nextEpisode: { enabled: pr.nextEpisode.enabled || true, keyBind: { ctrlKey: pr.nextEpisode.ctrlKey || false, altKey: pr.nextEpisode.altKey || true, shiftKey: pr.nextEpisode.shiftKey || false, key: pr.nextEpisode.key || 'ArrowRight', }},
            previousEpisode: { enabled: pr.previousEpisode.enabled || true, keyBind: { ctrlKey: pr.previousEpisode.ctrlKey || false, altKey: pr.previousEpisode.altKey || true, shiftKey: pr.previousEpisode.shiftKey || false, key: pr.previousEpisode.key || 'ArrowLeft', }},
            autoNextEpisode: { enabled: pr.autoNextEpisode.enabled || false, time: pr.autoNextEpisode.time || 60 },
            autoplay: { enabled: pr.autoplay.enabled || true},
            syncSettings: { enabled: true, },
            bookmarks: { enabled: true, syncBookmarks: { enabled: true, }, },
            resume: { enabled: true, syncResume: { enabled: true, }, mode: 'ask', },
            advanced: { enabled: pr.advanced.enabled || false, settings: { ConsoleLog: {  enabled: pr.advanced.settings.ConsoleLog.enabled || false}, DefaultPlayer: { player: pr.advanced.settings.DefaultPlayer.player === 'html5' ? 'plyr' : pr.advanced.settings.DefaultPlayer.player || 'plyr'} }, plyr: { design: { enabled:false, settings: { svgColor: '#ffffffff', hoverBGColor: '#00b3ffff', mainColor: '#00b3ffff', hoverColor: '#ffffffff', }, }, }, downloadName: '%title% - %episode%.rész (%MAT%)', forcePlyr: true, },
            private: { hasMAPlayer: false, eap: true, },
            version: this.getVersion(),
        };
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
 * @param {Object} pr The previous settings
 * @returns {Object} The migrated settings from version 0.1.6.x to 0.1.7.x
 * @since v0.1.8
 */
function migrateSettings_0_1_6(pr) {
    logger.log(`[background.js]: Migrating settings from version 0.1.6.x to version ${MAT.getVersion()}`, true);
    try {
        if (!/0.1.6.[0-9]/.test(pr.version)) return pr
        return {
            forwardSkip: { enabled: pr.forwardSkip.enabled || true, time: pr.forwardSkip.duration || 85, keyBind: { ctrlKey: pr.forwardSkip.ctrlKey || true, altKey: pr.forwardSkip.altKey || false, shiftKey: pr.forwardSkip.shiftKey || false, key: pr.forwardSkip.key || 'ArrowRight', }},
            backwardSkip: { enabled: pr.backwardSkip.enabled || true, time: pr.backwardSkip.duration || 85, keyBind: { ctrlKey: pr.backwardSkip.ctrlKey || true, altKey: pr.backwardSkip.altKey || false, shiftKey: pr.backwardSkip.shiftKey || false, key: pr.backwardSkip.key || 'ArrowLeft', }},
            nextEpisode: { enabled: pr.nextEpisode.enabled || true, keyBind: { ctrlKey: pr.nextEpisode.ctrlKey || false, altKey: pr.nextEpisode.altKey || true, shiftKey: pr.nextEpisode.shiftKey || false, key: pr.nextEpisode.key || 'ArrowRight', }},
            previousEpisode: { enabled: pr.previousEpisode.enabled || true, keyBind: { ctrlKey: pr.previousEpisode.ctrlKey || false, altKey: pr.previousEpisode.altKey || true, shiftKey: pr.previousEpisode.shiftKey || false, key: pr.previousEpisode.key || 'ArrowLeft', }},
            autoNextEpisode: { enabled: pr.autoNextEpisode.enabled || false, time: pr.autoNextEpisode.time || 60 },
            autoplay: { enabled: pr.autoplay.enabled || true},
            syncSettings: { enabled: true, },
            bookmarks: { enabled: true, syncBookmarks: { enabled: true, }, },
            resume: { enabled: true, syncResume: { enabled: true, }, mode: 'ask', },
            advanced: { enabled: pr.devSettings.enabled || false, settings: {ConsoleLog: {  enabled: pr.devSettings.settings.ConsoleLog.enabled || false}, DefaultPlayer: { player: pr.devSettings.settings.DefaultPlayer.player === 'html5' ? 'plyr' : pr.devSettings.settings.DefaultPlayer.player || 'plyr'}}, plyr: {design: { enabled:false, settings: { svgColor: '#ffffffff', hoverBGColor: '#00b3ffff', mainColor: '#00b3ffff', hoverColor: '#ffffffff', }, }, }, downloadName: '%title% - %episode%.rész (%MAT%)', forcePlyr: true, },
            private: { hasMAPlayer: false, eap: true, },
            version: this.getVersion(),
        };
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
 * @param {Object} pr The previous settings
 * @return{Object} The migrated settings from version 0.1.5.x to 0.1.6.x
 * @since v0.1.8
 */
function migrateSettings_0_1_5(pr) {
    logger.log(`[background.js]: Migrating settings from version 0.1.5.x to version ${MAT.getVersion()}`, true);
    try {
        if (!/0.1.5.[0-9]/.test(pr.version)) return pr
        return {
            forwardSkip: {enabled: pr.forwardSkip.enabled || true, time: pr.forwardSkip.duration || 85, keyBind: {ctrlKey: pr.forwardSkip.ctrlKey || true, altKey: pr.forwardSkip.altKey || false, shiftKey: pr.forwardSkip.shiftKey || false, key: pr.forwardSkip.key || 'ArrowRight',}},
            backwardSkip: {enabled: pr.backwardSkip.enabled || true, time: pr.backwardSkip.duration || 85, keyBind: {ctrlKey: pr.backwardSkip.ctrlKey || true, altKey: pr.backwardSkip.altKey || false, shiftKey: pr.backwardSkip.shiftKey || false, key: pr.backwardSkip.key || 'ArrowLeft',}},
            nextEpisode: {enabled: pr.nextEpisode.enabled || true, keyBind: {ctrlKey: pr.nextEpisode.ctrlKey || false, altKey: pr.nextEpisode.altKey || true, shiftKey: pr.nextEpisode.shiftKey || false, key: pr.nextEpisode.key || 'ArrowRight',}},
            previousEpisode: {enabled: pr.previousEpisode.enabled || true, keyBind: {ctrlKey: pr.previousEpisode.ctrlKey || false, altKey: pr.previousEpisode.altKey || true, shiftKey: pr.previousEpisode.shiftKey || false, key: pr.previousEpisode.key || 'ArrowLeft',}},
            autoNextEpisode: {enabled: pr.autoNextEpisode.enabled || false, time: pr.autoNextEpisode.time || 60,},
            autoplay: {enabled: pr.autoplay.enabled || true},
            syncSettings: {enabled: true,},
            bookmarks: {enabled: true, syncBookmarks: {enabled: true,},},
            resume: {enabled: true, syncResume: {enabled: true,}, mode: 'ask',},
            advanced: {enabled: pr.devSettings.enabled || false, settings: {ConsoleLog: {enabled: pr.devSettings.settings.ConsoleLog.enabled || false,}, DefaultPlayer: { player: pr.devSettings.settings.DefaultPlayer.player === 'html5' ? 'plyr' : pr.devSettings.settings.DefaultPlayer.player || 'plyr' },}, plyr: {design: {enabled: false, settings: {svgColor: '#ffffffff', hoverBGColor: '#00b3ffff', mainColor: '#00b3ffff', hoverColor: '#ffffffff',},},}, downloadName: '%title% - %episode%.rész (%MAT%)', forcePlyr: true,},
            private: {hasMAPlayer: false, eap: false,},
            version: MAT.getVersion(),
        };
    } catch (error) {
        logger.error(`[background.js]: Failed to migrate settings from version 0.1.5.x to version ${MAT.getVersion()}`, true);
        console.error(error);
        return MAT.getDefaultSettings();
    } finally {
        logger.log(`[background.js]: Migrated settings from version 0.1.5.x to version ${MAT.getVersion()}`, true);
    }
}

