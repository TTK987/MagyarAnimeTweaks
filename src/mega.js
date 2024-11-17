import {MAT, logger, bookmarks} from "./API.js";
/**
 * Settings object to store the settings (Later loaded from the storage)
 *
 * Default settings for the extension (used if the settings are not loaded from the storage)
 *
 * @type {Object}
 */
let settings = MAT.getDefaultSettings();
/**
 * Plyr player object
 */
let plyr = undefined;

/**
 * Class to handle the player
 */
class Player {
    constructor() {
        this.plyr = undefined;
    }

    /**
     * Get the Plyr player i18n
     * @returns {{play: string,seekLabel: string,seek: string,speed: string,enabled: string,duration: string,download: string,loop: string,unmute:string,end: string,disabled: string,menuBack: string,all: string,settings: string,normal: string,restart: string,start: string,mute: string,played: string,pause: string,quality: string,currentTime: string,volume: string,exitFullscreen: string,enterFullscreen: string,reset: string,qualityBadge: {1080: string, 144: string, 576: string, 720: string, 1440: string, 480: string, 360: string, 2160: string, 240: string}}} The Plyr player i18n
     * @since v0.1.8
     */
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


                        let style = document.createElement("style");
                        style.innerHTML = `.sharefile-block, .dropdown, .viewer-top-bl, .play-video-button, .viewer-pending, .logo-container, .viewer-vad-control, .video-progress-bar, .viewer-bottom-bl{display: none !important;}.transfer-limitation-block, .file-removed-block  {z-index: 1001 !important;}`;
                        document.head.appendChild(style);

                        ["sharefile-block", "dropdown", "viewer-top-bl", "viewer-pending", "logo-container", "viewer-vad-control", "video-progress-bar", "viewer-bottom-bl"].forEach(cls => document.querySelector(`.${cls}`)?.remove());


                        clearInterval(load);
                    } else {
                        logger.error("[Mega.nz] Video source not found");
                    }
                } else {
                    logger.error("[Mega.nz] Video not found");
                }
            }
        }, 10);

    }


}

/**
 * Function to load the settings from the storage and set the settings variable
 */
function loadSettings() {
    MAT.loadSettings().then((data) => {
        settings = data;
        logger.log("[Mega.nz] Settings loaded", true);
    }).catch(() => {
        logger.error("[Mega.nz] Settings not loaded", true);
    });
}
/**
 * Function that checks if the advanced settings are enabled
 * @returns {boolean} Returns true if the advanced settings are enabled, otherwise false
 */
function checkAdvancedSettings() {
    return settings.advanced.enabled;
}
/**
 * Function to initialize the mega.nz part of the extension
 */
function initMega() {
    loadSettings();
    bookmarks.loadBookmarks();
    window.parent.postMessage({plugin: MAT.__NAME__, type: MAT.__ACTIONS__.MEGA.FRAME_LOADED}, "*");
}
/**
 * Function to replace the mega.nz player with the custom player
 *
 * (Plyr)
 */
function replaceMega() {
    const load = setInterval(() => {
        let playbtn = document.querySelector("div.play-video-button")
        if (playbtn) {
            playbtn.click();
            const video = document.querySelector("video");
            if (video) {
                if (video.src) {
                    addPlyr();
                    let style = document.createElement("style");
                    style.innerHTML = `.sharefile-block, .dropdown, .viewer-top-bl, .play-video-button, .viewer-pending, .logo-container, .viewer-vad-control, .video-progress-bar, .viewer-bottom-bl{display: none !important;}.transfer-limitation-block, .file-removed-block  {z-index: 1001 !important;}`;
                    document.head.appendChild(style);
                    ["sharefile-block", "dropdown", "viewer-top-bl", "viewer-pending", "logo-container", "viewer-vad-control", "video-progress-bar", "viewer-bottom-bl"].forEach(cls => document.querySelector(`.${cls}`)?.remove());
                    clearInterval(load);
                }
            }
        }
    }, 10);
}
/**
 * Function to add the plyr player to the video
 */
function addPlyr() {
    if (plyr !== undefined) { plyr.destroy(); }
    getActiveBookmarks().then((bookmarks) => {
        plyr = new Plyr("#video", {
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
            i18n: {
                restart: "Újraindítás",
                rewind: "10 másodperccel visszább",
                play: "Lejátszás",
                pause: "Megállítás",
                fastForward: "10 másodperccel előre",
                seek: "Keresés",
                seekLabel: "{currentTime} másodpercnél",
                played: "Lejátszott",
                buffered: "Pufferelt",
                currentTime: "Jelenlegi idő",
                duration: "Teljes idő",
                volume: "Hangerő",
                mute: "Némítás",
                unmute: "Némítás kikapcsolása",
                enableCaptions: "Felirat engedélyezése",
                disableCaptions: "Felirat letiltása",
                enterFullscreen: "Teljes képernyő",
                exitFullscreen: "Kilépés a teljes képernyőből",
                frameTitle: "A(z) {title} videó lejátszó",
                captions: "Feliratok",
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
            },
            speed: {
                selected: 1,
                options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
            },
            markers: {
                enabled: true,
                points: bookmarks,
            }
        });
        fixPlyr();
        loadCustomCss();
        addShortcutsToPlyr();
        window.parent.postMessage({plugin: MAT.__NAME__, type: MAT.__ACTIONS__.MEGA.PLAYER_READY}, "*");
    });
}
/**
 * Function to skip forwards in the video
 * @param {number} seconds The number of seconds to skip
 */
function goForwards(seconds = 10) {
    plyr.currentTime = plyr.currentTime + Number(seconds);
    logger.log("[Mega.nz] Skipping " + seconds + " seconds forwards");
}
/**
 * Function to skip backwards in the video
 * @param {number} seconds The number of seconds to skip
 */
function goBackwards(seconds= 10) {
    plyr.currentTime = plyr.currentTime - Number(seconds);
    logger.log("[Mega.nz] Skipping " + seconds + " seconds backwards");
}
/**
 * Function to fix the plyr player
 */
function fixPlyr() {
    const interval = setInterval(() => {
        const plyr = document.querySelector(".plyr");
        if (plyr) {
            plyr.style.margin = "0";
            plyr.style.zIndex = "1000";
            let style = document.createElement("style");
            style.innerHTML = ".plyr__control--overlaid {background: #00b2ff;background: var(--plyr-video-control-background-hover, var(--plyr-color-main, var(--plyr-color-main, #00b2ff))) !important;}";
            document.head.appendChild(style);
            if (settings.autoplay.enabled) document.querySelector("video").play();
            if (settings.autoNextEpisode.enabled) setAutoNextEpisode();
            clearInterval(interval);
            logger.log("[Mega.nz] Plyr found, fixing it");
        } else {
            logger.log("[Mega.nz] Plyr not found");
        }
    }, 10);
}
/**
 * Function to set the auto next episode
 */
function setAutoNextEpisode() {
    const video = document.querySelector("video");
    if (settings.autoNextEpisode.time < 0) settings.autoNextEpisode.time = 0;
    logger.log("[Mega.nz] Auto next episode set to " + settings.autoNextEpisode.time + " seconds");
    let isAutoNextEpisodeTriggered = false;
    video.addEventListener("timeupdate", () => {
        if (video.currentTime >= video.duration - settings.autoNextEpisode.time && !isAutoNextEpisodeTriggered) {
            isAutoNextEpisodeTriggered = true;
            window.parent.postMessage({plugin: MAT.__NAME__, type: MAT.__ACTIONS__.MEGA.AUTO_NEXT_EPISODE}, "*");
        }
    });
}
/**
 * Event listener to listen for messages from the parent window
 */
window.addEventListener("message", (event) => {
    if (event.data.plugin === MAT.__NAME__) {
        switch (event.data.type) {
            case MAT.__ACTIONS__.MEGA.REPLACE_PLAYER:
                logger.log("[Mega.nz] Replace mega");
                handleMegaReplace();
                break;
            case MAT.__ACTIONS__.MEGA.BACKWARD_SKIP:
                goBackwards(event.data.seconds);
                break;
            case MAT.__ACTIONS__.MEGA.FORWARD_SKIP:
                goForwards(event.data.seconds);
                break;
            case MAT.__ACTIONS__.MEGA.TOGGLE_PLAY:
                plyr.togglePlay();
                break;
            case MAT.__ACTIONS__.MEGA.VOL_UP:
                plyr.increaseVolume(0.1);
                break
            case MAT.__ACTIONS__.MEGA.VOL_DOWN:
                plyr.decreaseVolume(0.1);
                break;
            case MAT.__ACTIONS__.MEGA.TOGGLE_MUTE:
                let muted = plyr.muted;
                plyr.muted = !muted;
                break;
            case MAT.__ACTIONS__.MEGA.TOGGLE_FULLSCREEN:
                // We have to use this, because the browser API only accepts user gestures to enter fullscreen
                // and still not 100% working, but it works most of the time (test results: it works on the second try)
                // Error: Failed to execute 'requestFullscreen' on 'Element': API can only be initiated by a user gesture.
                // Line: player.js:3929
                // I don't want to waste more time on this, because it is not a big issue (works on the second try)
                let fullscrnbtn = document.querySelector(".plyr__controls > button[data-plyr=fullscreen]");
                fullscrnbtn.focus();
                fullscrnbtn.click();
                fullscrnbtn.blur();
                break;
            case MAT.__ACTIONS__.MEGA.SEEK_PERCENTAGE:
                let percentage = event.data.percent;
                if (percentage < 0) percentage = 0;
                if (percentage > 100) percentage = 100;
                plyr.currentTime = (percentage / 100) * plyr.duration;
                break;
            case MAT.__ACTIONS__.MEGA.GET_CURRENT_TIME:
                window.parent.postMessage({plugin: MAT.__NAME__, type: MAT.__ACTIONS__.MEGA.CURRENT_TIME, currentTime: plyr.currentTime}, "*");
                break;
            case MAT.__ACTIONS__.MEGA.SEEK:
                plyr.currentTime = event.data.time;
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
    if (checkAdvancedSettings()) {
        if (settings.advanced.settings.DefaultPlayer.player === "plyr") {
            logger.log("[Mega.nz] Replacing mega player");
            replaceMega();
        } else {
            logger.log("[Mega.nz] Default player is not plyr");
        }
    } else {
        logger.log("[Mega.nz] Replacing mega player");
        replaceMega();
    }
}
/**
 * Function to add the shortcuts to the plyr player
 */
function addShortcutsToPlyr() {
    document.addEventListener("keydown", (event) => {
        handleShortcutEvent(event, settings.forwardSkip, goForwards);
        handleShortcutEvent(event, settings.backwardSkip, goBackwards);
    });

    document.addEventListener("keyup", (event) => {
        handleShortcutEvent(event, settings.nextEpisode, () => {
            window.parent.postMessage({ plugin: MAT.__NAME__, type: MAT.__ACTIONS__.MEGA.NEXT_EPISODE }, "*");
        });
        handleShortcutEvent(event, settings.previousEpisode, () => {
            window.parent.postMessage({ plugin: MAT.__NAME__, type: MAT.__ACTIONS__.MEGA.PREVIOUS_EPISODE }, "*");
        });
    });
}
/**
 * Function to handle the shortcut event
 * @param {KeyboardEvent} event The keyboard event
 * @param {Object} shortcut The shortcut object
 * @param {Function} action The action to do when the shortcut is triggered
 */
function handleShortcutEvent(event, shortcut, action) {
    if (shortcut.enabled && checkShortcut(event, shortcut)) {
        event.preventDefault();
        event.stopPropagation();
        action(shortcut.time);
    }
}
/**
 * Function to check if the shortcut is valid
 * @param {KeyboardEvent} event The keyboard event
 * @param {Object} shortcut The shortcut object
 * @returns {boolean} Returns true if the shortcut is valid, otherwise false
 */
function checkShortcut(event, shortcut) {
    return event.ctrlKey === shortcut.ctrlKey && event.altKey === shortcut.altKey && event.shiftKey === shortcut.shiftKey && event.key === shortcut.key;
}
/**
 * Function to load the custom css for the plyr
 */
function loadCustomCss() {
    if (settings.advanced.plyr.design.enabled) {
        let css = `
        :root {
            --plyr-video-control-color: ${settings.advanced.plyr.design.settings.svgColor};
            --plyr-video-control-background-hover: ${settings.advanced.plyr.design.settings.hoverBGColor};
            --plyr-color-main: ${settings.advanced.plyr.design.settings.mainColor};
            --plyr-video-control-color-hover: ${settings.advanced.plyr.design.settings.hoverColor};
        }
        `;
        document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`);
        logger.log("Custom CSS loaded.");
    }
}

function getActiveBookmarks() {
    window.parent.postMessage({plugin: MAT.__NAME__, type: MAT.__ACTIONS__.MEGA.GET_BOOKMARKS}, "*");
    return new Promise((resolve) => {
        window.addEventListener("message", function bookmarksListener(event) {
            if (event.data.plugin === MAT.__NAME__ && event.data.type === MAT.__ACTIONS__.MEGA.BOOKMARKS) {
                window.removeEventListener("message", bookmarksListener);
                resolve(event.data.bookmarks);
            } else {
                logger.error("Error getting bookmarks");
                resolve([]);
            }
        });
    });

}

initMega();


