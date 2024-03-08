let megaLink = ""
let settings = {};
function loadSettings() {
    /* Load the settings */
    // We use here console instead of logger, because the logger is not always loaded when the settings are loaded
    // Send a message to the background script to get the settings
    chrome.runtime.sendMessage({plugin: "MATweaks", type: "loadSettings"}, function (response) {
        if (response) {
            try {
                settings = response; // If the settings are loaded, save them
                console.log("[MATweaks] [Mega.nz] Settings loaded");
            } catch (error) {
                // If the settings are not loaded, log it as an error
                console.error("[MATweaks] [Mega.nz] Error loading settings");
            }
        } else {
            console.error("[MATweaks] [Mega.nz] Error loading settings");
        }
    });
}
loadSettings();
let plyr = false;
function replaceMega() {
    // wait for the video to load
    const load = setInterval(() => {
        // get the video source
        let playbtn = document.querySelector("div.play-video-button")
        if (playbtn) {
            // wait for the video to load
            const video = document.querySelector("video");
            if (video) {
                if (video.src) {
                    addPlyr();
                    megaLink = "https://mega.nz/file/" + location.href.split("/")[4]
                    // Remove or hide the elements that we don't need
                    let style = document.createElement("style");
                    style.innerHTML = `.sharefile-block, .dropdown, .viewer-top-bl, .play-video-button, .viewer-pending, .logo-container, .viewer-vad-control, .video-progress-bar, .viewer-bottom-bl{display: none !important;}.transfer-limitation-block, .file-removed-block  {z-index: 1001 !important;}`;
                    let sharefile = document.querySelector(".sharefile-block"); if (sharefile) {sharefile.remove();}
                    let dropdown = document.querySelector(".dropdown"); if (dropdown) {dropdown.remove();}
                    let viewerTopBl = document.querySelector(".viewer-top-bl");if (viewerTopBl) {viewerTopBl.remove();}
                    let viewerPending = document.querySelector(".viewer-pending");if (viewerPending) {viewerPending.remove();}
                    let logoContainer = document.querySelector(".logo-container");if (logoContainer) {logoContainer.remove();}
                    let viewerVadControl = document.querySelector(".viewer-vad-control");if (viewerVadControl) {viewerVadControl.remove();}
                    let videoProgressBar = document.querySelector(".video-progress-bar");if (videoProgressBar) {videoProgressBar.remove();}
                    let viewerBottomBl = document.querySelector(".viewer-bottom-bl");if (viewerBottomBl) {viewerBottomBl.remove();}
                    document.head.appendChild(style);
                    clearInterval(load);
                }
            }
        }
    }, 10); // Check every second
}
function addPlyr() {
    chrome.runtime.sendMessage({ plugin: "MATweaks", type: "getIconUrl" }, (iconUrlResponse) => {
        chrome.runtime.sendMessage({ plugin: "MATweaks", type: "getBlankVideo" }, (blankVideoResponse) => {
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
                iconUrl: iconUrlResponse,
                blankVideo: blankVideoResponse,
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
                    advertisement: "Hirdetés", // Still useless
                },
                speed: {
                    selected: 1,
                    options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
                }
            });
        });
    });
    // Fix the plyr
    fixPlyr();
    // Add the shortcuts to the plyr
    addShortcutsToPlyr();
}
function goForwards(seconds) {
    const video = document.querySelector("video");
    video.currentTime = video.currentTime + seconds;
}
function goBackwards(seconds) {
    const video = document.querySelector("video");
    video.currentTime = video.currentTime - seconds;
}
function fixPlyr() {
    const interval = setInterval(() => {
        const plyr = document.querySelector(".plyr");
        if (plyr) {
            plyr.style.margin = "0"; // Remove the margin from the player, so when it is in embed mode, there won't be anything around it
            plyr.style.zIndex = "1000"; // Set the z-index to 1000, so it will be on top of everything
            autoPlay(); // Autoplay the video (if it is enabled in the settings)
            if (settings.autoNextEpisode.enabled) setAutoNextEpisode(); // Set the auto next episode if it is enabled in the settings
            clearInterval(interval);
            console.log("[MATweaks] [Mega.nz] Plyr found, fixing it");
        } else {
            console.log("[MATweaks] [Mega.nz] Plyr not found");
        }
    }, 10);
}
function autoPlay() {if (settings.autoplay.enabled) plyr.play();}
function setAutoNextEpisode() {
    const video = document.querySelector("video");
    if (settings.autoNextEpisode.time < 0) settings.autoNextEpisode.time = 0;
    console.log("[MATweaks] [Mega.nz] Auto next episode set to " + settings.autoNextEpisode.time + " seconds");
    let isAutoNextEpisodeTriggered = false;
    video.addEventListener("timeupdate", () => {
        if (video.currentTime >= video.duration - settings.autoNextEpisode.time && !isAutoNextEpisodeTriggered) {
            isAutoNextEpisodeTriggered = true;
            window.parent.postMessage({plugin: "MATweaks", type: "nextEpisode"}, "*");
        }
    });
}
window.addEventListener("message", (event) => {
    if (event.data.plugin === "MATweaks") {
        switch (event.data.type) {
            case "replacePlayer":
                console.log("[MATweaks] [Mega.nz] Replace mega");
                replaceMega();
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
function addShortcutsToPlyr() {
    window.addEventListener("keydown", (event) => {
        if (settings.forwardSkip.enabled && event.ctrlKey === settings.forwardSkip.ctrlKey && event.altKey === settings.forwardSkip.altKey && event.shiftKey === settings.forwardSkip.shiftKey && event.key === settings.forwardSkip.key) {
            goForwards(settings.forwardSkip.duration);
        } else if (settings.backwardSkip.enabled && event.ctrlKey === settings.backwardSkip.ctrlKey && event.altKey === settings.backwardSkip.altKey && event.shiftKey === settings.backwardSkip.shiftKey && event.key === settings.backwardSkip.key) {
            goBackwards(settings.backwardSkip.duration);
        } else if (settings.nextEpisode.enabled && event.ctrlKey === settings.nextEpisode.ctrlKey && event.altKey === settings.nextEpisode.altKey && event.shiftKey === settings.nextEpisode.shiftKey && event.key === settings.nextEpisode.key) {
            window.parent.postMessage({plugin: "MATweaks", type: "nextEpisodeForce"}, "*");
        } else if (settings.previousEpisode.enabled && event.ctrlKey === settings.previousEpisode.ctrlKey && event.altKey === settings.previousEpisode.altKey && event.shiftKey === settings.previousEpisode.shiftKey && event.key === settings.previousEpisode.key) {
            window.parent.postMessage({plugin: "MATweaks", type: "previousEpisode"}, "*");
        }
    });
}
window.parent.postMessage({plugin: "MATweaks", type: "megaIframeLoaded"}, "*");
