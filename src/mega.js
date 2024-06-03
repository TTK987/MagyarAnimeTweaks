let MAT = window.MAT;
let logger = {
    enabled: false,
    log(message) {
        if (this.enabled) {
            log(message);
        }
    },
    warn(message) {
        if (this.enabled) {
            warn(message);
        }
    },
    error(message) {
        if (this.enabled) {
            error(message)
        }
    },
    enable() {
        this.enabled = true;
    },
    disable() {
        this.enabled = false;
    },
    isEnabled() {
        return this.enabled;
    }
};

/**
 * Settings object to store the settings (Later loaded from the storage)
 *
 * Default settings for the extension (used if the settings are not loaded from the storage)
 *
 * @type {Object}
 */
let settings = MAT.getSettings();


/**
 * Plyr player
 * @type {Plyr}
 */
let plyr = undefined;

/**
 * Function to load the settings from the storage and set the settings variable
 */
function loadSettings() {
    MAT.loadSettings().then((data) => {
        settings = data;
        console.log("[Mega.nz] Settings loaded");
    }).catch(() => {
        console.error("[Mega.nz] Settings not loaded");
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
    if (checkAdvancedSettings() && settings.advanced.settings.ConsoleLog.enabled) {
        logger.enable();
    } else {
        console.log(settings);
    }
    // Send a message to the parent window that the iframe has been loaded and ready
    window.parent.postMessage({plugin: "MATweaks", type: "megaIframeLoaded"}, "*");
}

/**
 * Function to replace the mega.nz player with the custom player
 *
 * (Plyr)
 */
function replaceMega() {
    // wait for the video to load
    const load = setInterval(() => {
        // get the video source
        let playbtn = document.querySelector("div.play-video-button")
        if (playbtn) {
            playbtn.click();
            const video = document.querySelector("video");
            if (video) {
                if (video.src) {
                    // Add plyr to the video
                    addPlyr();
                    // Remove or hide the elements that we don't need
                    let style = document.createElement("style");
                    style.innerHTML = `.sharefile-block, .dropdown, .viewer-top-bl, .play-video-button, .viewer-pending, .logo-container, .viewer-vad-control, .video-progress-bar, .viewer-bottom-bl{display: none !important;}.transfer-limitation-block, .file-removed-block  {z-index: 1001 !important;}`;
                    document.head.appendChild(style);
                    // Remove the elements that we don't need
                    let sharefile = document.querySelector(".sharefile-block"); if (sharefile) {sharefile.remove();}
                    let dropdown = document.querySelector(".dropdown"); if (dropdown) {dropdown.remove();}
                    let viewerTopBl = document.querySelector(".viewer-top-bl");if (viewerTopBl) {viewerTopBl.remove();}
                    let viewerPending = document.querySelector(".viewer-pending");if (viewerPending) {viewerPending.remove();}
                    let logoContainer = document.querySelector(".logo-container");if (logoContainer) {logoContainer.remove();}
                    let viewerVadControl = document.querySelector(".viewer-vad-control");if (viewerVadControl) {viewerVadControl.remove();}
                    let videoProgressBar = document.querySelector(".video-progress-bar");if (videoProgressBar) {videoProgressBar.remove();}
                    let viewerBottomBl = document.querySelector(".viewer-bottom-bl");if (viewerBottomBl) {viewerBottomBl.remove();}
                    // Clear the interval
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
    // Get the icon URL and the blank video URL
    if (plyr !== undefined) { plyr.destroy(); }
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
        }
    });
    // Fix the plyr
    fixPlyr();
    // Add the settings to the plyr
    loadCustomCss();
    addShortcutsToPlyr();
}

/**
 * Function to skip forwards in the video
 * @param {number} seconds The number of seconds to skip
 */
function goForwards(seconds) {
    plyr.currentTime = plyr.currentTime + Number(seconds);
    logger.log("[Mega.nz] Skipping " + seconds + " seconds forwards");
}

/**
 * Function to skip backwards in the video
 * @param {number} seconds The number of seconds to skip
 */
function goBackwards(seconds) {
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
            plyr.style.margin = "0"; // Remove the margin from the player, so when it is in embed mode, there won't be anything around it
            plyr.style.zIndex = "1000"; // Set the z-index to 1000, so it will be on top of everything
            let style = document.createElement("style");
            style.innerHTML = ".plyr__control--overlaid {background: #00b2ff;background: var(--plyr-video-control-background-hover, var(--plyr-color-main, var(--plyr-color-main, #00b2ff))) !important;}";
            document.head.appendChild(style);
            if (settings.autoplay.enabled) document.querySelector("video").play(); // Play the video if the autoplay is enabled in the settings
            if (settings.autoNextEpisode.enabled) setAutoNextEpisode(); // Set the auto next episode if it is enabled in the settings
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
            window.parent.postMessage({plugin: "MATweaks", type: "nextEpisode"}, "*");
        }
    });
}

/**
 * Event listener to listen for messages from the parent window
 */
window.addEventListener("message", (event) => {
    if (event.data.plugin === "MATweaks") {
        // Handle the messages from the parent window
        switch (event.data.type) {
            case "replacePlayer":
                logger.log("[Mega.nz] Replace mega");
                handleMegaReplace();
                break;
            case "backwardSkip":
                goBackwards(event.data.seconds);
                break;
            case "forwardSkip":
                goForwards(event.data.seconds);
                break;
            case "togglePlay":
                plyr.togglePlay();
                break;
            case "volumeUp":
                plyr.increaseVolume(0.1);
                break
            case "volumeDown":
                plyr.decreaseVolume(0.1);
                break;
            case "toggleMute":
                let muted = plyr.muted;
                plyr.muted = !muted;
                break;
            case "toggleFullscreen":
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
            case "seekTo":
                let percentage = event.data.percent;
                if (percentage < 0) percentage = 0;
                if (percentage > 100) percentage = 100;
                plyr.currentTime = (percentage / 100) * plyr.duration;
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
            window.parent.postMessage({ plugin: "MATweaks", type: "nextEpisodeForce" }, "*");
        });
        handleShortcutEvent(event, settings.previousEpisode, () => {
            window.parent.postMessage({ plugin: "MATweaks", type: "previousEpisode" }, "*");
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

// Initialize the mega.nz part of the extension
initMega();

