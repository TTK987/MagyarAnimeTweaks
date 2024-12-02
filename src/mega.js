import {MAT, Logger, Bookmarks, Resume, MA, Popup} from "./API.js";
/**
 * Settings object to store the settings (Later loaded from the storage)
 *
 * Default settings for the extension (used if the settings are not loaded from the storage)
 *
 * @type {Object}
 */
let settings = MAT.getDefaultSettings();
/**
 * Class to handle the player
 */
class player {
    /**
     * Constructor for the player class
     * @constructor
     * @var {Plyr} plyr The plyr player object
     * @var {{ id: number, datasheetId: number, title: string, url: string, episodeNumber: number }} videoData The video data object
     */
    constructor() {
        this.plyr = undefined;
        this.videoData = {};
    }
    getPlyrI18n() {
        return {
            restart: "Újraindítás",
            play: "Lejátszás",
            pause: "Megállítás",
            seek: "Keresés",
            seekLabel: "{currentTime} másodpercnél",
            played: "Lejátszott",
            currentTime: "Jelenlegi idő",
            duration: "Teljes idő",
            volume: "Hangerő",
            mute: "Némítás",
            unmute: "Némítás kikapcsolása",
            download: "Letöltés",
            enterFullscreen: "Teljes képernyő",
            exitFullscreen: "Kilépés a teljes képernyőből",
            settings: "Beállítások",
            menuBack: "Vissza",
            speed: "Sebesség",
            normal: "Normál",
            quality: "Minőség",
            loop: "Ismétlés",
            start: "Kezdés",
            end: "Befejezés",
            all: "Összes",
            reset: "Visszaállítás",
            disabled: "Letiltva",
            enabled: "Engedélyezve",
            qualityBadge: {
                2160: "4K",
                1440: "2K",
                1080: "FHD",
                720: "HD",
                576: "SD",
                480: "SD",
                360: "",
                240: "",
                144: "",
            },
        };
    }
    replaceMegaAuto() {
        const load = setInterval(() => {
            let playbtn = document.querySelector("div.play-video-button")
            if (playbtn) {
                playbtn.click();
                const video = document.querySelector("video");
                if (video) {
                    if (video.src) {
                        this.addPlyr();
                        this.removeElements();
                        MA.addCSS(".sharefile-block, .dropdown, .viewer-top-bl, .play-video-button, .viewer-pending, .logo-container, .viewer-vad-control, .video-progress-bar, .viewer-bottom-bl{display: none !important;}.transfer-limitation-block, .file-removed-block  {z-index: 1001 !important;}");
                        clearInterval(load);
                    } else {
                        Logger.error("[Mega.nz] Video source not found");
                    }
                } else {
                    Logger.error("[Mega.nz] Video not found");
                }
            }
        }, 10);
    }
    addPlyr() {
        if (this.plyr !== undefined) { this.plyr.destroy(); }
        this.getActiveBookmarks().then((bookmarks) => {
            this.plyr = new Plyr("#video", {
                controls: ["play-large", "play", "progress", "current-time", "mute", "volume", "settings", "pip", "airplay", "fullscreen"],
                keyboard: {
                    focused: true,
                    global: true,
                },
                settings: ["quality", "speed"],
                tooltips: {
                    controls: true,
                    seek: true,
                },
                iconUrl: chrome.runtime.getURL("plyr.svg"),
                blankVideo: chrome.runtime.getURL("blank.mp4"),
                i18n: this.getPlyrI18n(),
                speed: {
                    selected: 1,
                    options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
                },
                markers: {
                    enabled: true,
                    points: bookmarks,
                }
            });
            this.fixPlyr();
            this.loadCustomCss();
            this.addShortcutsToPlyr();
            if (settings.resume.enabled) initializeResumeFeature();
            if (settings.bookmarks.enabled) initializeBookmarksFeature();
            window.parent.postMessage({plugin: MAT.__NAME__, type: MAT.__ACTIONS__.MEGA.PLAYER_READY}, "*");
        });
    }
    goForwards(seconds = 10) {
        this.plyr.currentTime = this.plyr.currentTime + Number(seconds);
        Logger.log("[Mega.nz] Skipped forward " + seconds + " seconds");
        if (seconds > 60) showPopup("+" + settings.forwardSkip.time + " sec.", 200, "success");
    }
    goBackwards(seconds = 10) {
        this.plyr.currentTime = this.plyr.currentTime - Number(seconds);
        Logger.log("[Mega.nz] Skipping backwards " + seconds + " seconds");
        if (seconds > 60) showPopup("-" + settings.backwardSkip.time + " sec.", 200, "success");
    }
    fixPlyr() {
        const interval = setInterval(() => {
            const plyr = document.querySelector(".plyr");
            if (plyr) {
                plyr.style.margin = "0";
                plyr.style.zIndex = "1000";
                let style = document.createElement("style");
                style.innerHTML = ".plyr__control--overlaid {background: #00b2ff;background: var(--plyr-video-control-background-hover, var(--plyr-color-main, var(--plyr-color-main, #00b2ff))) !important;}";
                document.head.appendChild(style);
                if (settings.autoplay.enabled) document.querySelector("video").play();
                if (settings.autoNextEpisode.enabled) this.setAutoNextEpisode();
                clearInterval(interval);
                Logger.log("[Mega.nz] Plyr found, fixing it");
            } else {
                Logger.log("[Mega.nz] Plyr not found");
            }
        }, 10);
    }
    setAutoNextEpisode() {
        const video = document.querySelector("video");
        if (settings.autoNextEpisode.time < 0) settings.autoNextEpisode.time = 0;
        Logger.log("[Mega.nz] Auto next episode set to " + settings.autoNextEpisode.time + " seconds");
        let isAutoNextEpisodeTriggered = false;
        video.addEventListener("timeupdate", () => {
            if (video.currentTime >= video.duration - settings.autoNextEpisode.time && !isAutoNextEpisodeTriggered) {
                isAutoNextEpisodeTriggered = true;
                window.parent.postMessage({plugin: MAT.__NAME__, type: MAT.__ACTIONS__.MEGA.AUTO_NEXT_EPISODE}, "*");
            }
        });
    }
    addShortcutsToPlyr() {
        document.addEventListener("keydown", (event) => {
            this.handleShortcutEvent(event, settings.forwardSkip, this.goForwards.bind(this));
            this.handleShortcutEvent(event, settings.backwardSkip, this.goBackwards.bind(this));
        });

        document.addEventListener("keyup", (event) => {
            this.handleShortcutEvent(event, settings.nextEpisode, () => {
                window.parent.postMessage({ plugin: MAT.__NAME__, type: MAT.__ACTIONS__.MEGA.NEXT_EPISODE }, "*");
            });
            this.handleShortcutEvent(event, settings.previousEpisode, () => {
                window.parent.postMessage({ plugin: MAT.__NAME__, type: MAT.__ACTIONS__.MEGA.PREVIOUS_EPISODE }, "*");
            });
        });
    }
    handleShortcutEvent(event, shortcut, action) {
        if (shortcut.enabled && this.checkShortcut(event, shortcut.keyBind)) {
            event.preventDefault();
            event.stopPropagation();
            action(shortcut.time);
        }
    }
    checkShortcut(event, shortcut) {
        return event.ctrlKey === shortcut.ctrlKey && event.altKey === shortcut.altKey && event.shiftKey === shortcut.shiftKey && event.key === shortcut.key;
    }
    loadCustomCss() {
        if (settings.advanced.plyr.design.enabled) {
            MA.addCSS(`:root {--plyr-video-control-color: ${settings.advanced.plyr.design.settings.svgColor};--plyr-video-control-background-hover: ${settings.advanced.plyr.design.settings.hoverBGColor};--plyr-color-main: ${settings.advanced.plyr.design.settings.mainColor};--plyr-video-control-color-hover: ${settings.advanced.plyr.design.settings.hoverColor};}`);
            Logger.log("Custom CSS loaded.");
        }
    }
    getActiveBookmarks() {
        window.parent.postMessage({plugin: MAT.__NAME__, type: MAT.__ACTIONS__.MEGA.GET_BOOKMARKS}, "*");
        return new Promise((resolve) => {
            window.addEventListener("message", function bookmarksListener(event) {
                if (event.data.plugin === MAT.__NAME__ && event.data.type === MAT.__ACTIONS__.MEGA.BOOKMARKS) {
                    window.removeEventListener("message", bookmarksListener);
                    resolve(event.data.bookmarks);
                } else {
                    Logger.error("Error getting bookmarks");
                    resolve([]);
                }
            });
        });
    }
    removeElements() {
        ["sharefile-block", "dropdown", "viewer-top-bl", "viewer-pending", "logo-container", "viewer-vad-control", "video-progress-bar", "viewer-bottom-bl"]
            .forEach(cls => document.querySelector(`.${cls}`)?.remove());
    }
}
let Player = new player();
/**
 * Function to show a popup message to the user
 * @param {string} message The message to show
 * @param {number} time The time to show the message
 * @param {string} type The type of the popup (error, success, warning, info)
 */
function showPopup(message, time = 2000, type) {
    if (window.parent && window.parent !== window && document.fullscreenElement === null) {
        window.parent.postMessage({plugin: MAT.__NAME__, type: MAT.__ACTIONS__.MEGA.POPUP, message: message, time: time, popupType: type}, "*");
    } else {
        switch (type) {
            case "error":
                Popup.showErrorPopup(message, time);
                break;
            case "success":
                Popup.showSuccessPopup(message, time);
                break;
            case "warning":
                Popup.showWarningPopup(message, time);
                break;
            default:
                Popup.showInfoPopup(message, time);
                break;
        }
    }
}
/**
 * Function to load the settings from the storage and set the settings variable
 */
function loadSettings() {
    MAT.loadSettings().then((data) => {
        settings = data;
        if (data.advanced.enabled && data.advanced.settings.ConsoleLog.enabled) {
            Logger.enable();
        }
        Logger.log("Settings loaded.");
    }).catch((error) => {
        settings = MAT.getDefaultSettings();
        console.log(error);
        Popup.showErrorPopup("Hiba történt a beállítások betöltése közben. Alapértelmezett beállítások lesznek használva.", 5000);
        Logger.error("Error while loading settings: " + error);
    });
}
/**
 * Function to initialize the mega.nz part of the extension
 */
function initMega() {
    loadSettings();
    window.parent.postMessage({plugin: MAT.__NAME__, type: MAT.__ACTIONS__.MEGA.FRAME_LOADED}, "*");
}

// ---------------------------- Resume feature -----------------------------------
async function getCurrentTime() {
    if (Player.plyr) {
        return Player.plyr.currentTime;
    } else if (!Player.plyr) {
        return document.querySelector("video").currentTime
    } else {
        Logger.error("Error while getting the current time.");
        showPopup("Hiba történt a jelenlegi idő lekérdezése közben.","error");
        return 0;
    }
}
function updateResumeData() {
    getCurrentTime().then((currentTime) => {
        Resume.updateData(
            Player.videoData.id,
            currentTime,
            Player.videoData.datasheetId,
            Player.videoData.title,
            Player.videoData.url,
            Player.videoData.episodeNumber,
            Date.now()
        );
        Logger.log("Resume data updated.");
    }).catch((error) => {
        Logger.error("Error while updating resume data: " + error);
        showPopup("Hiba történt a folytatás adatok frissítése közben.","error");
    });
}
function addResumeEventListeners() {
    const video = document.querySelector("video");
    const curResumeData = Resume.getDataByEpisodeId(Player.videoData.id);
    let isAutoNextEpTriggered = false;
    const handle = () => {
        if (Player.plyr.duration <= 10 || Player.plyr.currentTime <= 5 || Player.plyr.currentTime >= Player.plyr.duration - 5 || isAutoNextEpTriggered) return;
        if (curResumeData && (Player.plyr.currentTime > curResumeData.time + 5 || Player.plyr.currentTime < curResumeData.time - 5)) {
            updateResumeData();
        } else if (!curResumeData) {
            updateResumeData();
        }
    };
    document.addEventListener("visibilitychange", handle);
    window.addEventListener("beforeunload", handle);
    window.addEventListener("unload", handle);
    video.addEventListener("pause", handle);
    video.addEventListener("ended", () => {
        Resume.removeData(Player.videoData.id).then(() => {
            Logger.log("Removed resume data.");
        }).catch((error) => {
            Logger.error("Error while removing resume data: " + error);
            showPopup("Hiba történt a folytatás adatok törlése közben.","error");
        });
    });
    window.addEventListener("MATweaksAutoNextEpisode", () => {
        isAutoNextEpTriggered = true;
        Resume.removeData(Player.videoData.id).then(() =>
            Logger.log("Removed resume data.")
        ).catch(e => {
            Logger.error("Error while removing resume data: " + e);
            showPopup("Hiba történt a folytatás adatok törlése közben.","error");
        });
    });
}
function initializeResumeFeature() {
    Resume.loadData().then(() => {
        checkForResume();
        addResumeEventListeners();
    }).catch((error) => {
        Logger.error("Error while loading resume data: " + error);
        showPopup("Hiba történt a folytatás adatok betöltése közben.","error");
    });
}
function checkForResumeData() {
    let curResumeData = Resume.getDataByEpisodeId(Player.videoData.id);
    if (!curResumeData) return;
    if (settings.resume.mode === "auto") {
        seekTo(curResumeData.time);
        Logger.log("Resumed playback.");
        Popup.showInfoPopup("Folytatás sikeres.");
    } else askUserToResume(curResumeData).then((response) => {
        if (response) {
            seekTo(curResumeData.time);
            Logger.log("Resumed playback.");
            showPopup("Folytatás sikeres.","info");
        } else {
            Logger.log("User declined to resume playback.");
        }
    });
}
function askUserToResume(data) {
    let formatTime = (time) => {
        return `${Math.floor(time / 60).toString().padStart(2, "0")}:${Math.floor(time % 60).toString().padStart(2, "0")}`;
    }
    let div = document.createElement("div");
    div.setAttribute("id", "MATweaks-resume-popup");
    let button = document.createElement("button");
    button.setAttribute("id", "MATweaks-resume-button");
    button.innerHTML = `Folytatás: ${formatTime(data.time)} <i class="fas fa-play"></i>`;
    div.appendChild(button);
    let plyrContainer = document.querySelector(".plyr");
    plyrContainer.appendChild(div);
    let resumeButton = document.getElementById("MATweaks-resume-button");
    return new Promise((resolve) => {
        resumeButton.addEventListener("click", () => {
            div.remove();
            resolve(true);
        });
        setTimeout(() => {
            div.remove();
            resolve(false);
        }, 1000000);
    });
}
function seekTo(time) {
    const video = document.querySelector("video");
    const seekHandler = () => {
        if (Player.plyr && Player.plyr.duration > 0) {
            Player.plyr.currentTime = time;
            video.removeEventListener("loadeddata", seekHandler);
            video.removeEventListener("playing", seekHandler);
        } else if (!Player.plyr && video.duration > 0) {
            video.currentTime = time;
            video.removeEventListener("loadeddata", seekHandler);
            video.removeEventListener("playing", seekHandler);
        }
    };
    video.addEventListener("loadeddata", seekHandler);
    video.addEventListener("playing", seekHandler);
}
function checkForResume() {
    chrome.runtime.sendMessage({plugin: MAT.__NAME__, type: "getOpenResume"}, (response) => {
        if (response) {
            for (let i = 0; i < response.length; i++) {
                if (response[i].url.split("/")[4] === Player.videoData.id.toString()) {
                    seekTo(response[i].time);
                    chrome.runtime.sendMessage({plugin: MAT.__NAME__, type: "removeOpenResume", id: response[i].id}, (r) => {
                        if (r) {
                            Logger.log("Resumed playback.");
                            showPopup("Folytatás sikeres.","info");
                        } else {
                            Logger.error("Error while resuming playback.");
                            showPopup("Hiba történt a folytatás közben.","error");
                        }
                    });
                    return;
                }
            }
            checkForResumeData();
        } else {
            Logger.error("Error while getting the resume data.");
            showPopup("Hiba történt az epizód adatai lekérdezése közben.","error");
        }
    });
}
// ---------------------------- End of Resume feature ----------------------------


// ---------------------------- Bookmark feature ---------------------------------
function checkForBookmarks() {
    chrome.runtime.sendMessage({plugin: MAT.__NAME__, type: "getOpenBookmarks"}, (response) => {
        if (response) {
            response.forEach((bookmark) => {
                if (bookmark.url.split("/")[4] === Player.videoData.id.toString()) {
                    let i = Bookmarks.getBookmark(bookmark.id) || 0;
                    if (Number(i.id) !== Number(bookmark.id)) {Logger.error("Error while getting the bookmark."); return;}
                    seekTo(i.time);
                    chrome.runtime.sendMessage({plugin: MAT.__NAME__, type: "removeOpenBookmark", id: bookmark.id}, (response) => {
                        if (response) {
                            Logger.log("Bookmark opened.");
                            showPopup("Könyvjelző sikeresen megnyitva.","info");
                        } else {
                            Logger.error("Error while opening the bookmark.");
                            showPopup("Hiba történt a könyvjelző megnyitása közben.","error");
                        }
                    });
                } else {
                    Logger.log("No bookmark found for the current URL.");
                }
            });
        } else {
            Logger.error("Error while getting the bookmarks.");
            showPopup("Hiba történt a könyvjelzők lekérdezése közben.","error");
        }
    });
}
function initializeBookmarksFeature() {
    Bookmarks.loadBookmarks().then(() => {
        Logger.log("Bookmarks loaded.");
        checkForBookmarks();
    }).catch((error) => {
        Logger.error("Error while loading bookmarks: " + error);
        showPopup("Hiba történt a könyvjelzők betöltése közben.","error");
    });
}
// ---------------------------- End of Bookmark feature --------------------------


/**
 * Event listener to listen for messages from the parent window
 */
window.addEventListener("message", (event) => {
    if (event.data.plugin === MAT.__NAME__) {
        switch (event.data.type) {
            case MAT.__ACTIONS__.MEGA.REPLACE_PLAYER:
                handleMegaReplace();
                Player.videoData = event.data.videoData;
                break;
            case MAT.__ACTIONS__.MEGA.BACKWARD_SKIP:
                Player.goBackwards(event.data.seconds);
                break;
            case MAT.__ACTIONS__.MEGA.FORWARD_SKIP:
                Player.goForwards(event.data.seconds);
                break;
            case MAT.__ACTIONS__.MEGA.TOGGLE_PLAY:
                Player.plyr.togglePlay();
                break;
            case MAT.__ACTIONS__.MEGA.VOL_UP:
                Player.plyr.increaseVolume(0.1);
                break
            case MAT.__ACTIONS__.MEGA.VOL_DOWN:
                Player.plyr.decreaseVolume(0.1);
                break;
            case MAT.__ACTIONS__.MEGA.TOGGLE_MUTE:
                let muted = Player.plyr.muted;
                Player.plyr.muted = !muted;
                break;
            case MAT.__ACTIONS__.MEGA.TOGGLE_FULLSCREEN:
                let fullscrnbtn = document.querySelector(".plyr__controls > button[data-plyr=fullscreen]");
                fullscrnbtn.focus();
                fullscrnbtn.click();
                fullscrnbtn.blur();
                break;
            case MAT.__ACTIONS__.MEGA.SEEK_PERCENTAGE:
                let percentage = event.data.percent;
                if (percentage < 0) percentage = 0;
                if (percentage > 100) percentage = 100;
                Player.plyr.currentTime = (percentage / 100) * Player.plyr.duration;
                break;
            case MAT.__ACTIONS__.MEGA.GET_CURRENT_TIME:
                window.parent.postMessage({plugin: MAT.__NAME__, type: MAT.__ACTIONS__.MEGA.CURRENT_TIME, currentTime: Player.plyr.currentTime}, "*");
                break;
            case MAT.__ACTIONS__.MEGA.SEEK:
                Player.plyr.currentTime = event.data.time;
                break;
            default:
                break;
        }
    }
});
/**
 * Function to handle the mega player replace
 */
function handleMegaReplace() {
    if (settings.advanced.enabled && settings.advanced.settings.DefaultPlayer.player === "plyr") {
        Logger.log("[Mega.nz] Replacing mega player");
        Player.replaceMegaAuto();
    } else {
        Logger.log("[Mega.nz] Default player is not plyr");
    }
}
initMega();


