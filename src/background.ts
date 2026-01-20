import Bookmarks from "./Bookmark";
import Logger from "./Logger";
import MAT from "./MAT";
import Resume from './Resume'
import { ACTIONS } from './lib/actions'
import { migrateSettings } from "./lib/settingsMigration";

chrome.runtime.onInstalled.addListener((details) => {
    checkAndRequestPermissions();
    if (details.reason === "install" || details.reason === "update") {
        const version = chrome.runtime.getManifest().version;
        if (details.reason === "update") {
            // Temporarily disabled the changelog link. It will be re-enabled for the next major release.
            //chrome.tabs.create({url: `https://matweaks.hu/changelog#${MAT.version.replace(/\./g, '')}`})
            Logger.log(`[background.js]: Updated from version ${details.previousVersion ?? "unknown"}`, true);
            if (details.previousVersion && version) {
                migrateSettings(details.previousVersion, version);
            } else {
                Logger.error(`[background.js]: Cannot migrate settings, previousVersion or version is undefined`, true);
            }
        }
        if (details.reason === "install") {
            chrome.tabs.create({url: `https://matweaks.hu/changelog#${MAT.version.replace(/\./g, '')}`})
            MAT.saveSettings();
            Bookmarks.saveBookmarks();
            Resume.saveData();
        }
        MAT.loadSettings().then(data => {
            MAT.settings = data;
            MAT.saveSettings();
            Logger.log(`[background.js]: Loaded settings: ${JSON.stringify(data)}`, true);
        });
        setResumeExpirationCheck();
        checkResumeExpiration();
    }
});
/**
 * Remove all context menus and create a new one
 */
chrome.contextMenus.removeAll(() => {
    createContextMenu();
});

MAT.loadSettings().then(data => {
    MAT.settings = data;
    Logger.log(`[background.js]: Loaded settings: ${JSON.stringify(data)}`, true);
    MAT.updateDynamicRules();
}).catch(() => {
    MAT.settings = MAT.getDefaultSettings();
    MAT.saveSettings();
    Logger.error(`[background.js]: Failed to load settings`, true);
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
            chrome.tabs.create({url: `https://magyaranime.eu/web/kereso-mal/${(info.linkUrl || info.pageUrl)?.match(/myanimelist\.net\/anime\/(\d+)/)?.[1] || ''}/`});
        }
    });
}

/**
 * Set a timer to check for expired resume data every day
 *
 * Using chrome.alarms API to set a daily check
 */
async function setResumeExpirationCheck() {
    try {
        const alarms = await chrome.alarms.getAll();
        const alarmExists = alarms.some(alarm => alarm.name === "checkResumeExpiration");

        if (!alarmExists) {
            await chrome.alarms.create("checkResumeExpiration", {
                periodInMinutes: 60 * 24,
            });
            Logger.log(`[background.js]: Set daily resume expiration check`, true);
        } else {
            Logger.log(`[background.js]: Alarm "checkResumeExpiration" already exists`, true);
        }
    } catch (error) {
        Logger.error(`[background.js]: Failed to set daily resume expiration check: ${error}`, true);
    }
}
/**
 * Handle the resume expiration check
 */
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkResumeExpiration") {
        Logger.log(`[background.js]: Checking for expired resume data`, true);
        checkResumeExpiration();
    }
})

function checkResumeExpiration() {
    Resume.loadData().then((data) => {
        if (data && data.length > 0) {
            MAT.loadSettings().then(s => {
                const currentTime = Date.now();
                const expirationTime = strToTime(s.resume.clearAfter);
                if (expirationTime === -1) {
                    Logger.log(`[background.js]: Resume data will not expire`, true);
                    return;
                }
                Logger.log(`[background.js]: Running resume expiration check with expiration time: ${expirationTime}ms (${s.resume.clearAfter})`, true,)
                const animesToRemove: number[] = []
                for (const anime of data) {
                    const expiredEpisodes = anime.episodes.filter(
                        (ep) => ep.updateTime && currentTime - ep.updateTime > expirationTime,
                    )
                    expiredEpisodes.forEach((ep) => anime.removeEpisode(ep.epID))
                    if (anime.episodes.length === 0) {
                        animesToRemove.push(anime.animeID)
                    }
                }
                data = data.filter(a => !animesToRemove.includes(a.animeID));
                Resume.animes = data;
                Logger.log(`[background.js]: Removed ${animesToRemove.length} animes with all episodes expired from resume data`, true);
                Resume.saveData()
                Resume.loadData()
            })
        }
    }).catch((error) => {
        Logger.error(`[background.js]: Failed to load resume data: ${error}`, true);
    })
}

function strToTime(str: "1w" | "1m" | "3m" | "1y" | "never"): number {
    switch (str) {
        case "1w":
            return 7 * 24 * 60 * 60 * 1000; // 1 week
        case "1m":
            return 30 * 24 * 60 * 60 * 1000; // 1 month
        case "3m":
            return 90 * 24 * 60 * 60 * 1000; // 3 months
        case "1y":
            return 365 * 24 * 60 * 60 * 1000; // 1 year
        case "never":
            return -1; // never expires
        default:
            return -1; // never expires
    }
}


/**
 *  Temporary storage for bookmarks that are currently being opened and loaded
 *  @type {[{id: number, url: string}]}
 */
let openBookmarks: Array<{epID: number, epURL: string}> = [];

/**
 * Temporary storage for resumes that are currently being opened and loaded
 * @type {[{id: number, url: string, time: number}]}
 */
let openResume: Array<{epID: number, epURL: string, epTime: number}> = [];

/**
 * Handle messages from the extension
 */
chrome.runtime.onMessage.addListener((request, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    switch (request.type) {
        case ACTIONS.DOWNLOAD:
            chrome.downloads.download({url: request.url, filename: request.filename}, (downloadId) => {
                if (downloadId !== undefined) {
                    sendResponse(true);
                    Logger.log(`[background.js]: Downloading file: ${request.filename}`, true);
                } else {
                    sendResponse(false);
                    Logger.error(`[background.js]: Failed to download file: ${request.filename}`, true);
                }
            });
            break;
        case "openSettings":
            chrome.tabs.create({
                url: chrome.runtime.getURL('src/pages/settings/index.html'),
                active: true,
            }).then(() => {
                sendResponse(true);
            }).catch(() => {
                sendResponse(false);
            });
            break;
        case "openBookmark":
            Logger.log(`[background.js]: Opening bookmark: ${request.epID}`, true);
            if (openBookmarks.find(id => id === request.epID)) {
                Logger.log(`[background.js]: Bookmark ${request.epID} is already being opened`, true);
                sendResponse(false);
                break;
            } else {
                Logger.log(`[background.js]: Bookmark ${request.epID} is being opened`, true);
                openBookmarks.push({epID: request.epID, epURL: request.epURL});
            }
            Logger.log(`[background.js]: Opening bookmark: ${request.epURL}`, true);
            chrome.tabs.create({
                url: request.epURL,
                active: true,
            });
            sendResponse(true);
            break;
        case "removeOpenBookmark":
            Logger.log(`[background.js]: Bookmark ${request.epID} opened`, true);
            openBookmarks = openBookmarks.filter(b => Number(b.epID) !== Number(request.epID));
            sendResponse(true);
            break;
        case "getOpenBookmarks":
            sendResponse(openBookmarks);
            break;
        case "openResume":
            Logger.log(`[background.js]: Opening resume: ${request.epID}`, true);
            if (openResume.find(id => id === request.epID)) {
                Logger.log(`[background.js]: Resume ${request.epID} is already being opened`, true);
                sendResponse(false);
                break;
            } else {
                Logger.log(`[background.js]: Resume ${request.epID} is being opened`, true);
                openResume.push({epID: request.epID, epURL: request.epURL, epTime: request.epTime});
            }
            Logger.log(`[background.js]: Opening resume: ${request.epURL}`, true);
            chrome.tabs.create({
                url: request.epURL,
                active: true,
            });
            sendResponse(true);
            break;
        case "removeOpenResume":
            Logger.log(`[background.js]: Resume ${request.epID} opened`, true);
            openResume = openResume.filter(b => Number(b.epID) !== Number(request.epID));
            sendResponse(true);
            break;
        case "getOpenResume":
            sendResponse(openResume);
            break;
        default:
            break;
    }
    return true;
});

/**
 * Check if the extension has the permissions and request if not granted
 *
 * Original fix by: emburcke
 * @since v0.1.6.1
 */
function checkAndRequestPermissions() {
    chrome.permissions.contains({origins: chrome.runtime.getManifest()['host_permissions']}, (answer) => {
        if (!answer) openPermissionPage(); else Logger.log(`[background.js]: Permissions already granted`, true);
    });
}

/**
 * Open the permission page in a new window
 */
function openPermissionPage() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('src/pages/permissions/index.html'),
        active: true,
    });
}
