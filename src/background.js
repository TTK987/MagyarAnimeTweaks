import {MAT, Logger, Bookmarks, Resume} from "./API.js";

chrome.runtime.onInstalled.addListener((details) => {
    checkAndRequestPermissions();
    if (details.reason === "install" || details.reason === "update") {
        const version = chrome.runtime.getManifest().version;
        if (details.reason === "update") {
            const previousVersion = details.previousVersion;
            Logger.log(`[background.js]: Updated from version ${previousVersion}`, true);
            migrateSettings(previousVersion, version);
        }
        if (details.reason === "install") {
            chrome.tabs.create({ url: `https://matweaks.hu/changelog#${MAT.getVersion().replace(/\./g, '')}` });
            MAT.saveSettings();
            Bookmarks.saveBookmarks();
            Resume.saveData();
        }
        MAT.loadSettings().then(data => {
            MAT.setSettings(data);
            MAT.saveSettings();
            Logger.log(`[background.js]: Loaded settings: ${JSON.stringify(data)}`, true);
        });
    }
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

    chrome.contextMenus.onClicked.addListener((info) => {
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
                        Logger.log(`[background.js]: Downloading file: ${request.filename}`, true);
                    } else {
                        sendResponse("error");
                        Logger.error(`[background.js]: Failed to download file: ${request.filename}`, true);
                    }
                });
                return true;
            case "openSettings":
                chrome.tabs.create({
                    url: chrome.runtime.getURL('pages/settings/index.html'),
                    active: true,
                }).then(() => {
                    sendResponse(true);
                }).catch(() => {
                    sendResponse(false);
                });
                return true;
            case "openBookmark":
                Logger.log(`[background.js]: Opening bookmark: ${request.id}`, true);
                if (openBookmarks.find(id => id === request.id)) {
                    Logger.log(`[background.js]: Bookmark ${request.id} is already being opened`, true);
                    sendResponse(false);
                    return;
                } else {
                    Logger.log(`[background.js]: Bookmark ${request.id} is being opened`, true);
                    openBookmarks.push({id: request.id, url: request.url});
                }
                Logger.log(`[background.js]: Opening bookmark: ${request.url}`, true);
                chrome.tabs.create({
                    url: request.url,
                    active: true,
                });
                sendResponse(true);
                break;
            case "removeOpenBookmark":
                Logger.log(`[background.js]: Bookmark ${request.id} opened`, true);
                openBookmarks = openBookmarks.filter(b => Number(b.id) !== Number(request.id));
                sendResponse(true);
                break;
            case "getOpenBookmarks":
                sendResponse(openBookmarks);
                break;
            case "openResume":
                Logger.log(`[background.js]: Opening resume: ${request.id}`, true);
                if (openResume.find(id => id === request.id)) {
                    Logger.log(`[background.js]: Resume ${request.id} is already being opened`, true);
                    sendResponse(false);
                    return;
                } else {
                    Logger.log(`[background.js]: Resume ${request.id} is being opened`, true);
                    openResume.push({id: request.id, url: request.url, time: request.time});
                }
                Logger.log(`[background.js]: Opening resume: ${request.url}`, true);
                chrome.tabs.create({
                    url: request.url,
                    active: true,
                });
                sendResponse(true);
                break;
            case "removeOpenResume":
                Logger.log(`[background.js]: Resume ${request.id} opened`, true);
                openResume = openResume.filter(b => Number(b.id) !== Number(request.id));
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
        if (!answer) openPermissionPopup(); else Logger.log(`[background.js]: Permissions already granted`, true);
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
        let migrateFn = getMigrationFunction(previousVersion);
        if (migrateFn) {
            chrome.storage.local.get('settings', (result) => {
                if (chrome.runtime.lastError || !result.settings) {
                    MAT.loadSettings().then(data => {
                        let settings = migrateFn(data);
                        MAT.setSettings(settings);
                        MAT.saveSettings();
                    });
                } else {
                    let settings = migrateFn(result.settings);
                    MAT.setSettings(settings);
                    MAT.saveSettings();
                }
            });
        } else {
            Logger.error(`[background.js]: Failed to migrate settings from version ${previousVersion} to version ${currentVersion}`, true);
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
    Logger.log(`[background.js]: Migrating settings from version 0.1.8 to version ${MAT.getVersion()}`, true);
    try {
        // Boilerplate code for future migrations from 0.1.8.x
        return pr;
    } catch (error) {
        Logger.error(`[background.js]: Failed to migrate settings from version 0.1.8 to version ${MAT.getVersion()}`, true);
        console.error(error);
        return MAT.getDefaultSettings();
    }
}
/**
 * Migrate the settings from version 0.1.7.x to 0.1.8.x
 * @param {Object} pr The previous settings
 * @returns {Object} The migrated settings from version 0.1.7.x to 0.1.8.x
 * @since v0.1.8
 */
function migrateSettings_0_1_7(pr) {
    Logger.log(`[background.js]: Migrating settings from version 0.1.7.x to version ${MAT.getVersion()}`, true);
    try {
        let New = {
            forwardSkip: {
                enabled: pr.forwardSkip.enabled || false,
                time: pr.forwardSkip.time || 85,
                keyBind: {
                    ctrlKey: pr.forwardSkip.ctrlKey || true,
                    altKey: pr.forwardSkip.altKey || false,
                    shiftKey: pr.forwardSkip.shiftKey || false,
                    key: pr.forwardSkip.key || 'ArrowRight',
                }
            },
            backwardSkip: {
                enabled: pr.backwardSkip.enabled || false,
                time: pr.backwardSkip.time || 85,
                keyBind: {
                    ctrlKey: pr.backwardSkip.ctrlKey || true,
                    altKey: pr.backwardSkip.altKey || false,
                    shiftKey: pr.backwardSkip.shiftKey || false,
                    key: 'ArrowLeft',
                }
            },
            nextEpisode: {
                enabled: pr.nextEpisode.enabled || false,
                keyBind: {
                    ctrlKey: pr.nextEpisode.ctrlKey || false,
                    altKey: pr.nextEpisode.altKey || true,
                    shiftKey: pr.nextEpisode.shiftKey || false,
                    key: pr.nextEpisode.key || 'ArrowRight',
                }
            },
            previousEpisode: {
                enabled: pr.previousEpisode.enabled || false,
                keyBind: {
                    ctrlKey: pr.previousEpisode.ctrlKey || false,
                    altKey:  pr.previousEpisode.altKey || true,
                    shiftKey: pr.previousEpisode.shiftKey || false,
                    key: pr.previousEpisode.key || 'ArrowLeft',
                }
            },
            autoNextEpisode: {
                enabled: pr.autoNextEpisode.enabled || false,
                time: pr.autoNextEpisode.time || 60,
            },
            autoplay: {
                enabled: pr.autoplay.enabled || false,
            },
            bookmarks: {
                enabled: true,
            },
            resume: {
                enabled: true,
                mode: 'ask',
            },
            advanced: {
                enabled: pr.advanced.enabled || false,
                settings: {
                    ConsoleLog: {
                        enabled: pr.advanced.settings.ConsoleLog.enabled || false,
                    },
                    DefaultPlayer: {
                        player: pr.advanced.settings.DefaultPlayer.player || 'plyr',
                    }
                },
                plyr: {
                    design: {
                        enabled: pr.advanced.plyr.design.enabled || false,
                        settings: {
                            svgColor: pr.advanced.plyr.design.settings.svgColor || '#ffffffff',
                            hoverBGColor: pr.advanced.plyr.design.settings.hoverBGColor || '#00b3ffff',
                            mainColor: pr.advanced.plyr.design.settings.mainColor || '#00b3ffff',
                            hoverColor: pr.advanced.plyr.design.settings.hoverColor || '#ffffffff',
                        },
                    },
                },
                downloadName: pr.advanced.downloadName || '%title% - %episode%.rész (%MAT%)',
            },
            private: {
                eap: pr.eap || false,
            },
            version: MAT.getVersion(),
        };
        chrome.storage.local.set({});
        return New;
    } catch (error) {
        Logger.error(`[background.js]: Failed to migrate settings from version 0.1.7.x to version ${MAT.getVersion()}`, true);
        console.error(error);
        return MAT.getDefaultSettings();
    }
}
