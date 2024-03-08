let LastUpdate = "2024.03.08"; // The last time I updated the code (YYYY.MM.DD)
// ---------------------------------------------------------------------------------------------------------------------
let settings = {} // The settings of the extension (Will be loaded from the storage)
let downloadInProgress = false; // Download in progress (User can't download the video while this is true)
let IsSettingsWindowOpen = false; // Is the settings window open (Used for disabling the key events)
let lastLogTime = 0; // Last log time (Used for the download progress log)
// ---------------------------------------------------------------------------------------------------------------------
class ConsoleLogger { // Console logger (Used for disabling the logs easily)
    log(message) {
        // If the console log is enabled and the dev settings are enabled, log the message.
        if (settings.devSettings.enabled && settings.devSettings.settings.ConsoleLog.enabled) console.log(`[MATweaks]: ` + message);
    }

    warn(message) {
        // If the console log is enabled and the dev settings are enabled, log the message as a warning.
        if (settings.devSettings.enabled && settings.devSettings.settings.ConsoleLog.enabled) console.warn(`[MATweaks]: ` + message);
    }

    error(message) {
        // If the console log is enabled and the dev settings are enabled, log the message as an error.
        if (settings.devSettings.enabled && settings.devSettings.settings.ConsoleLog.enabled) console.error(`[MATweaks]: ` + message);
    }
}
class Player {
    /* This is the player class, that I will create the players depending on the user's settings.*/
    // (Potentially "hot swappable" players, to minimize the page reloads.) (already in V.0.1.5)
    constructor() {
        this.querrySelector = "#indavideoframe";
        this.sourceUrl720p = "";
        this.sourceUrl360p = "";
        this.IframeUrl = "";
        this.isMegaLink = false;
        this.currentQuality = 720;
    }
    replacePlayer(player) {
        // Check if the iframe is a Mega.nz embed
        if (this.querrySelector === "#indavideoframe") {
            this.isMegaLink = !!document.querySelector(this.querrySelector).src.includes("mega.nz");
            this.IframeUrl = document.querySelector(this.querrySelector).src;
        }
        // Replace the player with the given player
        if (player === "default") /* In older version this called "indavideo" */ {
            this.replacePlayerDefault();
        } else if (player === "plyr") {
            this.replacePlayerPlyr();
        } else if (player === "html5") {
            this.replacePlayerHtml5();
        }
    }
    replacePlayerDefault() {
        /* Replace the player with the default player */
        // Create the default iframe
        try {
            let video = document.querySelector(this.querrySelector);
            if (video.src === this.IframeUrl && this.isMegaLink === false) {
                logger.log("The iframe is already the default player.");
                return false;
            }
            let iframe = document.createElement("iframe");
            iframe.setAttribute("id", "indavideoframe");
            iframe.setAttribute("style", "float: none;");
            iframe.setAttribute("src", this.IframeUrl);
            iframe.setAttribute("frameborder", "0");
            iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
            iframe.setAttribute("allowfullscreen", "");
            // Replace the player
            video.parentNode.replaceChild(iframe, video);
            this.querrySelector = "#indavideoframe";
            return true;
        } catch (error) {
            logger.error("Error while replacing the player with the default player.");
            return false;
        }
    }
    replacePlayerPlyr() {
        /* Replace the player with the plyr player */
        if (!this.isMegaLink) {
                if (!this.sourceUrl720p && !this.sourceUrl360p) {
                    this.showErrorMessage("Nem sikerült betölteni a videót. (Hibás videó URL)<br>Töltsd újra az oldalt.");
                    return false;
                }
                // Create the plyr player
                let videoElement = document.createElement("video");
                // V.0.1.5 - Settings for autoplay.
                if (settings.autoplay.enabled) {videoElement.setAttribute("autoplay", "autoplay");}
                videoElement.setAttribute("src", this.sourceUrl720p || this.sourceUrl360p); // Set the source url to the 720p or 360p source url
                videoElement.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
                videoElement.setAttribute("playsinline", "");
                videoElement.setAttribute("controls", "");
                videoElement.setAttribute("preload", "metadata");
                videoElement.setAttribute("id", "video");
                // Add the source urls
                if (this.sourceUrl720p) {
                    let source720p = document.createElement("source");
                    source720p.setAttribute("src", this.sourceUrl720p);
                    source720p.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
                    videoElement.appendChild(source720p);
                }
                if (this.sourceUrl360p) {
                    let source360p = document.createElement("source");
                    source360p.setAttribute("src", this.sourceUrl360p);
                    source360p.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
                    videoElement.appendChild(source360p);
                }
                if (settings.autoNextEpisode.enabled) {
                    if (settings.autoNextEpisode.time < 0) settings.autoNextEpisode.time = 0;
                    let autoNextEpisodetriggered = false;
                    videoElement.addEventListener("timeupdate", function () {
                        if (this.currentTime >= this.duration - settings.autoNextEpisode.time) {
                            if (autoNextEpisodetriggered === false) {
                                autoNextEpisodetriggered = true;
                                logger.log("Auto next episode triggered.");
                                autoNextEpisode();
                            }
                        }
                    });
                }
                // Replace the player
                const video = document.querySelector(this.querrySelector);
                video.parentNode.replaceChild(videoElement, video);
                new Plyr("#video", {
                    controls: ["play-large", "play", "progress", "current-time", "mute", "volume", "settings", "pip", "airplay", "download", "fullscreen"],
                    keyboard: {
                        focused: true,
                        global: true,
                    },
                    settings: ["quality", "speed"],
                    tooltips: {
                        controls: true,
                        seek: true,
                    },
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
                        download: "Letöltés",
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
                        advertisement: "Hirdetés", // That's funny because one of main reasons to use this extension is to block ads
                        qualityBadge: {
                            2160: "4K",
                            1440: "HD",
                            1080: "HD",
                            720: "HD",
                            576: "SD",
                            480: "SD",
                            360: "SD",
                        },
                    },
                    quality: {
                        default: this.sourceUrl720p ? 720 : 360, // Default quality is the highest available quality
                        options: this.sourceUrl720p ? [720, 360] : [360],
                        forced: true,
                        onChange: (quality) => { // When the quality is changed, change the source url
                            if (quality === 720) {
                                // get the current time of the video
                                let currentTime = Number(videoElement.currentTime);
                                // set the source url to the 720p source url
                                document.querySelector("video").setAttribute("src", this.sourceUrl720p);
                                // set the current time of the video
                                videoElement.currentTime = currentTime;
                            } else if (quality === 360) {
                                // get the current time of the video
                                let currentTime = Number(videoElement.currentTime);
                                // set the source url to the 360p source url
                                document.querySelector("video").setAttribute("src", this.sourceUrl360p);
                                // set the current time of the video
                                videoElement.currentTime = currentTime;
                            }
                            this.currentQuality = quality;
                            logger.log("Quality changed to " + quality);
                        },
                    },
                    speed: {
                        selected: 1,
                        options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
                    },
                });
                // Add the shortcuts to the player
                this.addShortcutsToPlayer(videoElement);
                // Fix the download button of the player
                // Get the download button
                let downloadButton = document.querySelector("#tryideput > div > div.plyr__controls > a")
                downloadButton.href = ""; // Remove the default href (basically useless, because plyr will add it back if you start the video)
                // Add the event listener to the download button
                downloadButton.addEventListener("click", function (event) {
                    event.preventDefault(); // Prevent the default action
                    logger.log("Download requested."); // Log the download request
                    let sourceUrl = player.getSourceUrl720p() || player.getSourceUrl360p(); // Get the source url
                    downloadFile(sourceUrl, document.title + " (MATweaks).mp4"); // Download the file with the source url and the title of the page as the filename
                });
                // Create the download progress bar
                let downloadProgressBarContainer = document.querySelector(".download-progress-bar-container");
                if (downloadProgressBarContainer === null) {downloadProgressBarContainer = document.createElement("div");}
                downloadProgressBarContainer.setAttribute("class", "download-progress-bar-container");
                downloadProgressBarContainer.innerHTML = `
        <progress id="download-progress-bar" value="0" max="100"></progress>
        <p id="download-progress-bar-text">0% (0 MB / 0 MB)</p>
    `;
                const cancelDownloadButton = document.createElement("button");
                cancelDownloadButton.setAttribute("id", "download-progress-bar-cancel");
                cancelDownloadButton.innerHTML = "Mégse";
                downloadProgressBarContainer.appendChild(cancelDownloadButton);
                // Add css to the download progress bar
                const css = `
.download-progress-bar-container {
    position: relative;
    display: none;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    align-content: center;
}

#download-progress-bar {
    width: 100%;
    height: 30px;
    border-radius: 10px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--dark);
    outline: none;
    border: none;
}
#download-progress-bar::-webkit-progress-bar {
    background: var(--dark);
    border-radius: 10px;
}
#download-progress-bar::-webkit-progress-value {
    background:  var(--primary-color);
    border-radius: 10px;
}
#download-progress-bar::-moz-progress-bar {
    background: var(--primary-color);
    border-radius: 10px;
}
#download-progress-bar::-ms-fill {
    background: var(--primary-color);
    border-radius: 10px;
}
        
#download-progress-bar-text {
    width: 100%;
    position: absolute;
    top: 47%; /* I don't know why, but it's not centered without this. */
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
    color: #ffffff;
    font-size: 20px;
}
#download-progress-bar-cancel {
    z-index: 100;
    background-color: var(--primary-color);
    color: var(--light);
    border: none;
    border-radius: 5px;
    padding: 10px;
    margin: 10px;
    cursor: pointer;
}
    `;
                let style = document.createElement("style");
                style.innerHTML = css;
                // add the css to the head
                document.querySelector("head").appendChild(style);
                // Get the video player
                const videoPlayer = document.querySelector(".plyr");
                // Add the download progress bar below the video player
                videoPlayer.parentNode.insertBefore(downloadProgressBarContainer, videoPlayer.nextSibling);
                // Set a normal height for the video player, so it won't be too big
                videoPlayer.style.display = "inline-block";
                videoPlayer.style.height = "70vh";
                videoPlayer.style.border = "none";
                // fixes the plyr buffer position
                const plyrbuffer = document.querySelector(".plyr__progress__buffer");
                if (plyrbuffer) plyrbuffer.style.top = "9.5px"; // (Could be solved with css)
                this.querrySelector = ".plyr";
                return true;
        } else {
            // If the user watches a Mega.nz video, remake the player iframe
            this.replacePlayerDefault();
            return false;
        }
    }
    replacePlayerHtml5() {
        if (!this.isMegaLink) {
            try {
                if (!this.sourceUrl720p && !this.sourceUrl360p) {
                    this.showErrorMessage("Nem sikerült betölteni a videót. (Rossz URL)<br>Töltsd újra az oldalt.");
                    return false;
                }
                // Create the html5 player
                let videoElement = document.createElement("video");
                videoElement.setAttribute("autoplay", "autoplay");
                videoElement.setAttribute("src", this.sourceUrl720p || this.sourceUrl360p);
                videoElement.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
                videoElement.setAttribute("playsinline", "");
                videoElement.setAttribute("controls", "");
                videoElement.setAttribute("preload", "metadata");
                videoElement.setAttribute("id", "video");
                // Add the source urls
                if (this.sourceUrl720p) {
                    let source720p = document.createElement("source");
                    source720p.setAttribute("src", this.sourceUrl720p);
                    source720p.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
                    videoElement.appendChild(source720p);
                }
                if (this.sourceUrl360p) {
                    let source360p = document.createElement("source");
                    source360p.setAttribute("src", this.sourceUrl360p);
                    source360p.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
                    videoElement.appendChild(source360p);
                }
                // Replace the player
                const video = document.querySelector(this.querrySelector);
                video.parentNode.replaceChild(videoElement, video);
                this.querrySelector = "video";
                return true;
            } catch (error) {
                logger.error("Error while replacing the player with the html5 player.");
                return false;
            }
        } else {
            // If the user watches a Mega.nz video, remake the player iframe
            this.replacePlayerDefault();
            return false;
        }
    }
    setSourceUrl720p(sourceUrl720p) {
        this.sourceUrl720p = sourceUrl720p;
    }
    setSourceUrl360p(sourceUrl360p) {
        this.sourceUrl360p = sourceUrl360p;
    }
    setIframeUrl(iframeUrl) {
        this.IframeUrl = iframeUrl;
    }
    setIsMegaLink(isMegaLink) {
        this.isMegaLink = isMegaLink;
    }
    skipForward(video) {
        if (video === null) video = document.querySelector('video');
        video.currentTime = Number(video.currentTime) + Number(settings.forwardSkip.duration);
        logger.log("Skipped forward " + settings.forwardSkip.duration + " seconds.");
    }
    skipBackward(video) {
        if (video === null) video = document.querySelector('video');
        video.currentTime = Number(video.currentTime) - Number(settings.backwardSkip.duration);
        logger.log("Skipped backward " + settings.backwardSkip.duration + " seconds.");
    }
    addShortcutsToPlayer(player) {
        window.addEventListener("keydown", (event) => {
            if (settings.forwardSkip.enabled &&
                event.ctrlKey === settings.forwardSkip.ctrlKey &&
                event.altKey === settings.forwardSkip.altKey &&
                event.shiftKey === settings.forwardSkip.shiftKey &&
                event.key === settings.forwardSkip.key &&
                IsSettingsWindowOpen === false) {
                this.skipForward(player)
            } else if (settings.backwardSkip.enabled &&
                event.ctrlKey === settings.backwardSkip.ctrlKey &&
                event.altKey === settings.backwardSkip.altKey &&
                event.shiftKey === settings.backwardSkip.shiftKey &&
                event.key === settings.backwardSkip.key &&
                IsSettingsWindowOpen === false) {
                this.skipBackward(player);
            }
        });
        logger.log("Shortcuts added to the player.");
    }
    showErrorMessage(message) {
        /* Show an error message */
        logger.error("Error while playing video. Message: " + message);
        // Create the error message
        let error = document.createElement("p");
        error.setAttribute("class", "MATweaks-error");
        error.innerHTML = "[MATweaks] Hiba történt a videó lejátszása közben.<br>" + message;
        error.style.color = "red";
        error.style.fontSize = "xx-large";
        // Replace the player with the error message
        let iframe = document.querySelector(this.querrySelector);
        iframe.parentNode.replaceChild(error, iframe);
        return false;
    }
    getSourceUrl720p() {
        return this.sourceUrl720p;
    }
    getSourceUrl360p() {
        return this.sourceUrl360p;
    }
}
// ---------------------------------------------------------------------------------------------------------------------
const logger = new ConsoleLogger(); // Create a new console logger
const player = new Player(); // Create a new player
// ---------------------------------------------------------------------------------------------------------------------
// All the functions for the extension
let isAutoNextEpisodeTriggered = false; // Is the auto next episode triggered
function loadSettings() {
    /* Load the settings */
    // We use here console instead of logger, because the logger is not always loaded when the settings are loaded
    // Send a message to the background script to get the settings
    chrome.runtime.sendMessage({plugin: "MATweaks", type: "loadSettings"}, function (response) {
        if (response) {
            try {
                settings = response; // If the settings are loaded, save them
                logger.log("Settings loaded");
                logger.log(JSON.stringify(settings));
            } catch (error) {
                // If the settings are not loaded, log it as an error
                logger.error("Error loading settings");
            }
        } else {
            logger.error("Error loading settings");
        }
    });
}
async function downloadFile(url, filename) {
    if (downloadInProgress) {
        logger.error("Download already in progress.");
        return false;
    }
    if (!url || !filename) {
        logger.error("Download failed: URL or filename is empty or undefined.");
        return false;
    }
    let abortController = new AbortController();
    let signal = abortController.signal;
    let downloadProgressBarContainer = document.querySelector(".download-progress-bar-container");
    document.querySelector("#download-progress-bar-cancel").addEventListener("click", function(event) {
        event.preventDefault();
        abortController.abort();
        downloadProgressBarContainer.style.display = "none";
        downloadInProgress = false;
        logger.log("Download aborted by the user.");
    });
    try {
        downloadInProgress = true;
        downloadProgressBarContainer.style.display = "flex";
        logger.log("Starting download...");
        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error('Network response was not ok.');
        const reader = response.body.getReader();
        let receivedLength = 0; // bytes received
        let chunks = []; // array of received binary chunks (comprises the body)
        let max = response.headers.get('content-length');
        while(true) {
            const {done, value} = await reader.read();
            if (done) {
                break;
            }
            chunks.push(value);
            receivedLength += value.length;
            LogDownloadProgress(max, receivedLength);
        }
        logger.log("Download complete, preparing for saving...");
        const blob = new Blob(chunks);
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
        logger.log(`Download finished: "${filename}"`);
    } catch (error) {
        if (error.name === 'AbortError') {
            logger.log("Download aborted by the user.");
        } else {
            logger.error(`Download failed: ${error}`);
        }
    } finally {
        downloadInProgress = false;
        downloadProgressBarContainer.style.display = "none";
    }
}
function LogDownloadProgress(max, loaded) {
    /* Log the download progress */
    if (Date.now() - lastLogTime < 1000) /* Update every second */ {
        return;
    } else {
        lastLogTime = Date.now();
    }
    // Log the download progress
    let downloadProgressBar = document.querySelector("#download-progress-bar");
    let downloadProgressBarText = document.querySelector("#download-progress-bar-text");
    downloadProgressBar.setAttribute("value", loaded);
    downloadProgressBar.setAttribute("max", max);
    downloadProgressBarText.innerHTML = `${((loaded / max) * 100).toPrecision(5)}% (${(loaded / 1000000).toPrecision(5)} MB / ${(max / 1000000).toPrecision(5)} MB)`;
    logger.log(`Downloaded ${(loaded / 1000000).toPrecision(5)} MB of ${(max / 1000000).toPrecision(5)} MB`);

}
function createSettingsWindow() {
    /* Create the settings window */
    // Note: This is the longest function in the code. Mainly because of the html+css code. (Maybe I should move it to a separate file...)

    // First, load the settings again
    loadSettings();
    logger.log(JSON.stringify(settings));
    let settingsWindow = document.createElement("div");
    settingsWindow.setAttribute("id", "MATweaks-settings-window");
    settingsWindow.setAttribute("class", "MA-Tweaks-settings-popup");
    // --------------------------
    // Get the key combinations
    const forwardSkip = `${settings.forwardSkip.altKey ? 'Alt + ' : ''}${settings.forwardSkip.ctrlKey ? 'Ctrl + ' : ''}${settings.forwardSkip.shiftKey ? 'Shift + ' : ''}${settings.forwardSkip.key}`;
    const backwardSkip = `${settings.backwardSkip.altKey ? 'Alt + ' : ''}${settings.backwardSkip.ctrlKey ? 'Ctrl + ' : ''}${settings.backwardSkip.shiftKey ? 'Shift + ' : ''}${settings.backwardSkip.key}`;
    const nextEpisode = `${settings.nextEpisode.altKey ? 'Alt + ' : ''}${settings.nextEpisode.ctrlKey ? 'Ctrl + ' : ''}${settings.nextEpisode.shiftKey ? 'Shift + ' : ''}${settings.nextEpisode.key}`;
    const previousEpisode = `${settings.previousEpisode.altKey ? 'Alt + ' : ''}${settings.previousEpisode.ctrlKey ? 'Ctrl + ' : ''}${settings.previousEpisode.shiftKey ? 'Shift + ' : ''}${settings.previousEpisode.key}`;
    // --------------------------
    // And here is the html code... (It supports custom themes) ( 284 lines of html+css code... in a js file... in one block... )
    settingsWindow.innerHTML = `
        <div class="MA-Tweaks-settings-popup-content">
            <div class="MATweaks-settings-window-header">
                <span class="MATweaks-settings-window-close">&times;</span>
                <h2>MATweaks beállítások</h2>
            </div>
            <div class="MATweaks-settings-window-body">
                <div class="MATweaks-settings-window-body-content">
                    <div class="MA-Tweaks-settings-popup-body-content-features">
                        <div class="MATweaks-settings-window-body-content-item">
                            <p>Előre ugrás</p>
                            <div class="MATweaks-settings-window-body-content-item-feature" id="MATweaks-forwardSkip">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-forwardSkip-enabled">Engedélyezve</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-checkbox" type="checkbox" id="MATweaks-forwardSkip-enabled" name="MATweaks-forwardSkip-enabled" ${settings.forwardSkip.enabled ? "checked" : ""}>
                                <span class="MATweaks-settings-window-body-content-item-feature-checkbox-custom"></span>
                            </div>
                            <div class="MATweaks-settings-window-body-content-item-feature">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-forwardSkip-duration">Ugrás időtartama</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-input" type="number" id="MATweaks-forwardSkip-duration" name="MATweaks-forwardSkip-duration" value="${settings.forwardSkip.duration}">
                            </div>
                            <div class="MATweaks-settings-window-body-content-item-feature">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-forwardSkip-key">Gomb</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-input" type="text" id="MATweaks-forwardSkip-key" name="MATweaks-forwardSkip-key" value="${forwardSkip}">
                            </div>
                        </div>
                        <div class="MATweaks-settings-window-body-content-item">
                            <p>Hátra ugrás</p>
                            <div class="MATweaks-settings-window-body-content-item-feature" id="MATweaks-backwardSkip">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-backwardSkip-enabled">Engedélyezve</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-checkbox" type="checkbox" id="MATweaks-backwardSkip-enabled" name="MATweaks-backwardSkip-enabled" ${settings.backwardSkip.enabled ? "checked" : ""}>
                                <span class="MATweaks-settings-window-body-content-item-feature-checkbox-custom"></span>
                            </div>
                            <div class="MATweaks-settings-window-body-content-item-feature">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-backwardSkip-duration">Ugrás időtartama</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-input" type="number" id="MATweaks-backwardSkip-duration" name="MATweaks-backwardSkip-duration" value="${settings.backwardSkip.duration}">
                            </div>
                            <div class="MATweaks-settings-window-body-content-item-feature">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-backwardSkip-key">Gomb</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-input" type="text" id="MATweaks-backwardSkip-key" name="MATweaks-backwardSkip-key" value="${backwardSkip}">
                            </div>
                        </div>
                        <div class="MATweaks-settings-window-body-content-item">
                            <p>Következő epizód</p>
                            <div class="MATweaks-settings-window-body-content-item-feature" id="MATweaks-nextEpisode">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-nextEpisode-enabled">Engedélyezve</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-checkbox" type="checkbox" id="MATweaks-nextEpisode-enabled" name="MATweaks-nextEpisode-enabled" ${settings.nextEpisode.enabled ? "checked" : ""}>
                                <span class="MATweaks-settings-window-body-content-item-feature-checkbox-custom"></span>
                            </div>
                            <div class="MATweaks-settings-window-body-content-item-feature">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-nextEpisode-key">Gomb</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-input" type="text" id="MATweaks-nextEpisode-key" name="MATweaks-nextEpisode-key" value="${nextEpisode}">
                            </div>
                        </div>
                        <div class="MATweaks-settings-window-body-content-item">
                            <p>Előző epizód</p>
                            <div class="MATweaks-settings-window-body-content-item-feature" id="MATweaks-previousEpisode">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-previousEpisode-enabled">Engedélyezve</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-checkbox" type="checkbox" id="MATweaks-previousEpisode-enabled" name="MATweaks-previousEpisode-enabled" ${settings.previousEpisode.enabled ? "checked" : ""}>
                                <span class="MATweaks-settings-window-body-content-item-feature-checkbox-custom"></span>
                            </div>
                            <div class="MATweaks-settings-window-body-content-item-feature">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-previousEpisode-key">Gomb</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-input" type="text" id="MATweaks-previousEpisode-key" name="MATweaks-previousEpisode-key" value="${previousEpisode}">
                            </div>
                        </div>
                        <div class="MATweaks-settings-window-body-content-item">
                            <p>Automatikus lejátszás</p>
                            <div class="MATweaks-settings-window-body-content-item-feature" id="MATweaks-autoPlay">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-autoPlay-enabled">Engedélyezve</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-checkbox" type="checkbox" id="MATweaks-autoPlay-enabled" name="MATweaks-autoPlay-enabled" ${settings.autoplay.enabled ? "checked" : ""}>
                                <span class="MATweaks-settings-window-body-content-item-feature-checkbox-custom"></span>
                            </div>
                        </div>
                        <div class="MATweaks-settings-window-body-content-item">
                            <p>Automatikus jobb minőség</p>
                            <div class="MATweaks-settings-window-body-content-item-feature" id="MATweaks-autoQuality">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-autoQuality-enabled">Engedélyezve</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-checkbox" type="checkbox" id="MATweaks-autoQuality-enabled" name="MATweaks-autoQuality-enabled" ${settings.autobetterQuality.enabled ? "checked" : ""}>
                                <span class="MATweaks-settings-window-body-content-item-feature-checkbox-custom"></span>
                            </div>
                        </div>
                        <div class="MATweaks-settings-window-body-content-item">
                            <p>Automatikus következő epizód</p>
                            <div class="MATweaks-settings-window-body-content-item-feature" id="MATweaks-autoNextEpisode">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-autoNextEpisode-enabled">Engedélyezve</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-checkbox" type="checkbox" id="MATweaks-autoNextEpisode-enabled" name="MATweaks-fixes-enabled" ${settings.autoNextEpisode.enabled ? "checked" : ""}>
                                <span class="MATweaks-settings-window-body-content-item-feature-checkbox-custom"></span>
                            </div>
                            <div class="MATweaks-settings-window-body-content-item-feature">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-autoNextEpisode-duration">Idő</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-input" type="number" id="MATweaks-autoNextEpisode-duration" name="MATweaks-autoNextEpisode-duration" value="${settings.autoNextEpisode.time}">
                            </div>
                        </div>
                        <div class="MATweaks-settings-window-body-content-item">
                            <p>Fejlesztői beállítások</p>
                            <div class="MATweaks-settings-window-body-content-item-feature" id="MATweaks-devSettings">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-devSettings-enabled">Engedélyezve</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-checkbox" type="checkbox" id="MATweaks-devSettings-enabled" name="MATweaks-devSettings-enabled" ${settings.devSettings.enabled ? "checked" : ""}>
                                <span class="MATweaks-settings-window-body-content-item-feature-checkbox-custom"></span>
                            </div>
                            <p style="font-size: 15px; font-weight: unset;">Mega.nz esetén csak az Alap (nincs csere) és a plyr.io elérhető!</p>
                            <div class="MATweaks-settings-window-body-content-item-feature">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-devSettings-DefaultPlayer-player">Alapértelmezett lejátszó</label>
                                <select class="MATweaks-settings-window-body-content-item-feature-input" id="MATweaks-devSettings-DefaultPlayer-player" name="MATweaks-devSettings-DefaultPlayer-player">
                                    <option value="html5" ${settings.devSettings.settings.DefaultPlayer.player === "html5" ? "selected" : ""}>Html5</option>
                                    <option value="default" ${settings.devSettings.settings.DefaultPlayer.player === "default" ? "selected" : ""}>Alap</option>
                                    <option value="plyr" ${settings.devSettings.settings.DefaultPlayer.player === "plyr" ? "selected" : ""}>Plyr</option>
                                </select>
                            </div>
                            <div class="MATweaks-settings-window-body-content-item-feature" id="MATweaks-devSettings-ConsoleLog">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-devSettings-ConsoleLog-enabled">Console log</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-checkbox" type="checkbox" id="MATweaks-devSettings-ConsoleLog-enabled" name="MATweaks-devSettings-ConsoleLog-enabled" ${settings.devSettings.settings.ConsoleLog.enabled ? "checked" : ""}>
                                <span class="MATweaks-settings-window-body-content-item-feature-checkbox-custom"></span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="MATweaks-settings-window-body-content-buttons">
                    <button class="MATweaks-settings-window-body-content-buttons-button" id="MATweaks-settings-window-body-content-buttons-button-save">Mentés</button>
                    <button class="MATweaks-settings-window-body-content-buttons-button" id="MATweaks-settings-window-body-content-buttons-button-cancel">Mégse</button>
                </div>
                <div class="MATweaks-settings-window-body-content-credits">
                    <div class="MATweaks-settings-window-body-content-credits-item">
                        <p>MATweaks készítette: <a href="https://discord.com/users/537718439586955285" target="_blank">TTK987</a></p>
                        <p>GitHub: <a href="https://github.com/TTK987/MagyarAnimeTweaks/" target="_blank">MagyarAnimeTweaks</a></p>
                    </div>
                    <div class="MATweaks-settings-window-body-content-credits-item">
                        <p>Verzió: ${chrome.runtime.getManifest().version}</p>
                        <p>Utolsó frissítés: ${LastUpdate}</p>
                    </div>
                    <div class="MATweaks-settings-window-body-content-credits-item">
                        <p>Weblap: < Fejlesztés alatt... ></p>
                        <p>Discord: <a href="https://discord.gg/dJX4tVGZhY" target="_blank">MagyarAnimeTweaks</a></p>
                    </div>
                </div>
            </div>
        </div>
    `;
    // --------------------------
    // Create a new settings object with the new settings
    let newSettings = settings;
    // add the settings window to the body
    document.querySelector("body").appendChild(settingsWindow);
    // --------------------------
    // Add the event listeners for exiting the settings window (save or cancel)
    document.querySelector(".MATweaks-settings-window-close").addEventListener("click", closeSettingsWithoutSaving);
    document.querySelector("#MATweaks-settings-window-body-content-buttons-button-cancel").addEventListener("click", closeSettingsWithoutSaving);
    document.querySelector("#MATweaks-settings-window-body-content-buttons-button-save").addEventListener("click", () => {
        closeSettings(newSettings);
    });
    // --------------------------
    // Add the event listeners for each setting
    document.querySelector("#MATweaks-forwardSkip").addEventListener("click", () => {
        newSettings.forwardSkip.enabled = !newSettings.forwardSkip.enabled;
        document.querySelector("#MATweaks-forwardSkip-enabled").checked = newSettings.forwardSkip.enabled;
        if (settings.devSettings.enabled) logger.log("forwardSkip.enabled: " + newSettings.forwardSkip.enabled);
    });
    document.querySelector("#MATweaks-backwardSkip").addEventListener("click", () => {
        newSettings.backwardSkip.enabled = !newSettings.backwardSkip.enabled;
        document.querySelector("#MATweaks-backwardSkip-enabled").checked = newSettings.backwardSkip.enabled;
        if (settings.devSettings.enabled) logger.log("backwardSkip.enabled: " + newSettings.backwardSkip.enabled);
    });
    document.querySelector("#MATweaks-nextEpisode").addEventListener("click", () => {
        newSettings.nextEpisode.enabled = !newSettings.nextEpisode.enabled;
        document.querySelector("#MATweaks-nextEpisode-enabled").checked = newSettings.nextEpisode.enabled;
        if (settings.devSettings.enabled) logger.log("nextEpisode.enabled: " + newSettings.nextEpisode.enabled);
    });
    document.querySelector("#MATweaks-previousEpisode").addEventListener("click", () => {
        newSettings.previousEpisode.enabled = !newSettings.previousEpisode.enabled;
        document.querySelector("#MATweaks-previousEpisode-enabled").checked = newSettings.previousEpisode.enabled;
        if (settings.devSettings.enabled) logger.log("previousEpisode.enabled: " + newSettings.previousEpisode.enabled);
    });
    document.querySelector("#MATweaks-devSettings").addEventListener("click", () => {
        newSettings.devSettings.enabled = !newSettings.devSettings.enabled;
        document.querySelector("#MATweaks-devSettings-enabled").checked = newSettings.devSettings.enabled;
        if (settings.devSettings.enabled) logger.log("devSettings.enabled: " + newSettings.devSettings.enabled);
    });
    document.querySelector("#MATweaks-devSettings-ConsoleLog").addEventListener("click", () => {
        newSettings.devSettings.settings.ConsoleLog.enabled = !newSettings.devSettings.settings.ConsoleLog.enabled;
        document.querySelector("#MATweaks-devSettings-ConsoleLog-enabled").checked = newSettings.devSettings.settings.ConsoleLog.enabled;
        if (settings.devSettings.enabled) logger.log("devSettings.settings.ConsoleLog.enabled: " + newSettings.devSettings.settings.ConsoleLog.enabled);
    });
    document.querySelector("#MATweaks-autoNextEpisode").addEventListener("click", () => {
        newSettings.autoNextEpisode.enabled = !newSettings.autoNextEpisode.enabled;
        document.querySelector("#MATweaks-autoNextEpisode-enabled").checked = newSettings.autoNextEpisode.enabled;
        if (settings.devSettings.enabled) logger.log("autoNextEpisode.enabled: " + newSettings.autoNextEpisode.enabled);
    });
    document.querySelector("#MATweaks-autoPlay").addEventListener("click", () => {
        newSettings.autoplay.enabled = !newSettings.autoplay.enabled;
        document.querySelector("#MATweaks-autoPlay-enabled").checked = newSettings.autoplay.enabled;
        if (settings.devSettings.enabled) logger.log("autoplay.enabled: " + newSettings.autoplay.enabled);
    });
    document.querySelector("#MATweaks-autoQuality").addEventListener("click", () => {
        newSettings.autobetterQuality.enabled = !newSettings.autobetterQuality.enabled;
        document.querySelector("#MATweaks-autoQuality-enabled").checked = newSettings.autobetterQuality.enabled;
        if (settings.devSettings.enabled) logger.log("autobetterQuality.enabled: " + newSettings.autobetterQuality.enabled);
    });
    document.querySelector("#MATweaks-forwardSkip-duration").addEventListener("change", (event) => {
        newSettings.forwardSkip.duration = event.target.value;
        logger.log("forwardSkip.duration: " + newSettings.forwardSkip.duration);
    });
    document.querySelector("#MATweaks-backwardSkip-duration").addEventListener("change", (event) => {
        newSettings.backwardSkip.duration = event.target.value;
        logger.log("backwardSkip.duration: " + newSettings.backwardSkip.duration);
    });
    document.querySelector("#MATweaks-autoNextEpisode-duration").addEventListener("change", (event) => {
        newSettings.autoNextEpisode.time = event.target.value;
        logger.log("autoNextEpisode.time: " + newSettings.autoNextEpisode.time);
    });
    document.querySelector("#MATweaks-forwardSkip-key").addEventListener("keydown", (event) => {
        event.preventDefault();
        newSettings.forwardSkip.key = event.key;
        newSettings.forwardSkip.ctrlKey = event.ctrlKey;
        newSettings.forwardSkip.altKey = event.altKey;
        newSettings.forwardSkip.shiftKey = event.shiftKey;
        let keyDisplay = "";
        if (event.ctrlKey) {
            keyDisplay += "Ctrl + ";
        }
        if (event.altKey) {
            keyDisplay += "Alt + ";
        }
        if (event.shiftKey) {
            keyDisplay += "Shift + ";
        }
        keyDisplay += event.key;
        event.target.value = keyDisplay;
    });
    document.querySelector("#MATweaks-backwardSkip-key").addEventListener("keydown", (event) => {
        event.preventDefault();
        newSettings.backwardSkip.key = event.key;
        newSettings.backwardSkip.ctrlKey = event.ctrlKey;
        newSettings.backwardSkip.altKey = event.altKey;
        newSettings.backwardSkip.shiftKey = event.shiftKey;

        let keyDisplay = "";
        if (event.ctrlKey) {
            keyDisplay += "Ctrl + ";
        }
        if (event.altKey) {
            keyDisplay += "Alt + ";
        }
        if (event.shiftKey) {
            keyDisplay += "Shift + ";
        }
        keyDisplay += event.key;

        event.target.value = keyDisplay;
    });
    document.querySelector("#MATweaks-nextEpisode-key").addEventListener("keydown", (event) => {
        event.preventDefault();
        newSettings.nextEpisode.key = event.key;
        newSettings.nextEpisode.ctrlKey = event.ctrlKey;
        newSettings.nextEpisode.altKey = event.altKey;
        newSettings.nextEpisode.shiftKey = event.shiftKey;
        let keyDisplay = "";
        if (event.ctrlKey) {
            keyDisplay += "Ctrl + ";
        }
        if (event.altKey) {
            keyDisplay += "Alt + ";
        }
        if (event.shiftKey) {
            keyDisplay += "Shift + ";
        }
        keyDisplay += event.key;

        event.target.value = keyDisplay;
    });
    document.querySelector("#MATweaks-previousEpisode-key").addEventListener("keydown", (event) => {
        event.preventDefault();
        newSettings.previousEpisode.key = event.key;
        newSettings.previousEpisode.ctrlKey = event.ctrlKey;
        newSettings.previousEpisode.altKey = event.altKey;
        newSettings.previousEpisode.shiftKey = event.shiftKey;
        let keyDisplay = "";
        if (event.ctrlKey) {
            keyDisplay += "Ctrl + ";
        }
        if (event.altKey) {
            keyDisplay += "Alt + ";
        }
        if (event.shiftKey) {
            keyDisplay += "Shift + ";
        }
        keyDisplay += event.key;

        event.target.value = keyDisplay;
    });
    document.querySelector("#MATweaks-devSettings-DefaultPlayer-player").addEventListener("change", (event) => {
        newSettings.devSettings.settings.DefaultPlayer.player = event.target.value;
    });
    // --------------------------
    // And finally, log the action.
    logger.log("Settings window created.");
}
function openSettings() {
    /* Open the settings window */
    // Get the settings window
    let settingsWindow = document.querySelector("#MATweaks-settings-window");
    if (settingsWindow) {
        // If the settings window is already open, display it
        settingsWindow.remove();
        createSettingsWindow();
        IsSettingsWindowOpen = true;
        logger.log("Settings window opened.");
    } else {
        // If the settings window is not open, create it
        createSettingsWindow();
        IsSettingsWindowOpen = true;
        logger.log("Settings window opened.");
    }
}
function addSettingsButton() {
    /* Add the settings button to the account menu */
    let accountMenu = document.querySelector("#gen-header > div > div > div > div > nav > div.gen-header-info-box > div.gen-account-holder > div > ul");
    if (accountMenu) {
        // Create the settings button
        let settingsButton = document.createElement("li");
        settingsButton.setAttribute("class", "gen-account-menu-item");
        settingsButton.innerHTML = `
            <a class="gen-account-menu-link" id="MATweaks-settings-button">
                <i class="fas fa-cog"></i>
                MATweaks beállítások
            </a>
        `;
        // Add the settings button to the account menu
        accountMenu.insertBefore(settingsButton, accountMenu.children[4]);
        // Add the event listener to the settings button
        document.querySelector("#MATweaks-settings-button").addEventListener("click", openSettings);
        // Log the action
        logger.log("Settings button added.");
    }
}
function saveSettings() {
    /* Save the settings. */
    // Send the settings to the background script
    chrome.runtime.sendMessage({plugin: "MATweaks", type: "saveSettings", settings: settings }, function (response) {
        if (response) {
            // If the settings are saved, log it.
            logger.log("Settings saved.");
            return true;
        } else {
            // If the settings are not saved, log it as an error.
            logger.error("Error while saving settings.");
            return false;
        }
    });
}
function closeSettings(newSettings) {
    /* Close the settings window */
    // Get the settings window
    let settingsWindow = document.querySelector("#MATweaks-settings-window");
    if (settingsWindow) {
        // If the settings window is found, close it and save the settings.
        settingsWindow.style.display = "none";
        // Update the settings
        for (let key in newSettings) {
            settings[key] = newSettings[key];
        }
        saveSettings();
        logger.log("Settings window closed.");
        IsSettingsWindowOpen = false;
        // Reload the iframe to apply the changes
        player.replacePlayer(settings.devSettings.settings.DefaultPlayer.player);
        redirectBetterQuality(); // Redirect to the better quality
        settingsWindow.remove(); // Remove the settings window from the DOM
    } else {
        logger.error("Settings window not found, cannot close it.");
    }
}
// fun fact: In older versions of the code, this function was "closeSettingsWithouSaving" (without the "t" in "without")... I just noticed it... :D
function closeSettingsWithoutSaving() {
    /* Close the settings window without saving */
    // Get the settings window
    let settingsWindow = document.querySelector("#MATweaks-settings-window");
    if (settingsWindow) {
        // If the settings window is found, close it without saving the settings.
        IsSettingsWindowOpen = false;
        settingsWindow.remove(); // Remove the settings window from the DOM
        logger.log("Settings window closed without saving.");
    }
}
function receiveMessage(event) {
    /* Receive the messages from the indavideo iframe */
    // Check if the message is from the extension
    if (event.data && event.data.plugin === "MATweaks") {
        // If the message is from the extension, check the type of the message
        if (event.data.type === "iframeLoaded")  {
            // If the message is that the iframe is loaded, send a message to the iframe to get the source url
            let iframe = document.querySelector('iframe[src*="embed.indavideo.hu"]')
            iframe.contentWindow.postMessage({"plugin": "MATweaks", "type": "getSourceUrl"}, "*");
            logger.log("Indavideo iframe loaded.");
        } else if (event.data.type === "sourceUrl") {
            // If the message is the source url, save it and replace the player
            logger.log("Indavideo 720p source URL received. Url: " + event.data.data["720p"]);
            logger.log("Indavideo 360p source URL received. Url: " + event.data.data["360p"]);
            // Save the source urls
            player.setSourceUrl720p(event.data.data["720p"]);
            player.setSourceUrl360p(event.data.data["360p"]);
            let iframe = document.querySelector('iframe[src*="embed.indavideo.hu"]')
            player.setIframeUrl(iframe.src);
            // Replace the player
            if (settings.devSettings.enabled && settings.devSettings.settings.DefaultPlayer.player === "default") {
                // If the default player is the default player, replace the player with the default player <- This is a good sentence :D
                player.replacePlayer("default");
            } else if ((settings.devSettings.enabled && settings.devSettings.settings.DefaultPlayer.player === "plyr") || !settings.devSettings.enabled) {
                // If the default player is plyr, or the dev settings are not enabled, replace the player with the plyr player
                player.replacePlayer("plyr");
            } else if (settings.devSettings.enabled && settings.devSettings.settings.DefaultPlayer.player === "html5") {
                // If the default player is html5, replace the player with the html5 player
                // Note: If the user wants to use the html5 player, for IDK what reason (Maybe to user their own player, or to use the browser's player...??), then the user has the option.
                player.replacePlayer("html5");
            } else {
                // In case of a miracle, show an error message.
                // Should never happen, but just in case...
                player.showErrorMessage("Hát, valami hiba történt...<br>Próbáld újra.");
            }
        } else if (event.data.type === "megaIframeLoaded") {
            // If the message is that the mega iframe is loaded, send a message to the iframe to replace the player
            let iframe = document.querySelector('iframe[src*="mega.nz"]');
            addShortcutsToPage();  // Add the shortcuts for next and previous episode
            player.setIsMegaLink(true);
            player.setIframeUrl(iframe.src);
            logger.log("Mega iframe loaded.");
            addShortcutsToPageMega(); // Add the shortcuts for forward and backward skip
            if (settings.devSettings.enabled && settings.devSettings.settings.DefaultPlayer.player === "default") {
                return;
            }
            // Replace the player
            iframe.contentWindow.postMessage({"plugin": "MATweaks", "type": "replacePlayer"}, "*");
            logger.log("Mega player replaced.");
        } else if (event.data.type === "nextEpisode") {
            // Triggers when the autoNextEpisode is enabled and the time is up
            // If the message is to move to the next episode, move to the next episode
            nextEpisodeMega();
        } else if (event.data.type === "previousEpisode") {
            // Triggers when the user wants to go back to the previous episode, but the shortcut is in the iframe
            // If the message is to move to the previous episode, move to the previous episode
            previousEpisode();
        } else if (event.data.type === "nextEpisodeForce") {
            // Triggers when the user wants to go to the next episode by shortcut, but the shortcut is in the iframe
            // If the message is to move to the next episode, move to the next episode
            nextEpisode();
        }
    }
}
function nextEpisode() {
    /* Move to the next episode */
    // Get the next episode button
    let nextEpisodeButton = document.getElementById("epkovetkezo")
    // If the next episode button is found, click it

    // V.0.1.4 - On last episode it will go to the data sheet of the series
    if (nextEpisodeButton) {
        nextEpisodeButton.click();
    } else {
        // Get the data sheet button (last element)
        let dataSheetButton = document.querySelectorAll(".gomb.bg-red");
        dataSheetButton = dataSheetButton[dataSheetButton.length - 1];
        // If the data sheet button is found, click it
        if (dataSheetButton) {dataSheetButton.click();} else {logger.log("No next episode or data sheet button found.");}
    }
    logger.log("Moved to the next episode.");
}
function previousEpisode() {
    /* Move to the previous episode */
    // Get the previous episode button
    let previousEpisodeButton = document.getElementById("epelozo");
    // If the previous episode button is found, click it
    if (previousEpisodeButton) previousEpisodeButton.click();
    logger.log("Moved to the previous episode.");
}
function addShortcutsToPage() {
    /* Add the shortcuts to the page */
    // Add the event listener to the page
    document.addEventListener("keydown", (event) => {
        // Check if the event is a shortcut
        if (settings.nextEpisode.enabled &&
            IsSettingsWindowOpen === false &&
            event.ctrlKey === settings.nextEpisode.ctrlKey &&
            event.altKey === settings.nextEpisode.altKey &&
            event.shiftKey === settings.nextEpisode.shiftKey &&
            event.key === settings.nextEpisode.key) {
            // If the event is next episode, move to the next episode
            nextEpisode();
        } else if (
            settings.previousEpisode.enabled &&
            IsSettingsWindowOpen === false &&
            event.ctrlKey === settings.previousEpisode.ctrlKey &&
            event.altKey === settings.previousEpisode.altKey &&
            event.shiftKey === settings.previousEpisode.shiftKey &&
            event.key === settings.previousEpisode.key) {
            // If the event is previous episode, move to the previous episode
            previousEpisode();
        }
    });
    logger.log("Shortcuts added to the page.");
}
// V.0.1.4 - Auto next episode
function autoNextEpisode() {
    /* Move to the next episode */
    // Get the next episode button
    let nextEpisodeButton = document.querySelector(".gomb.bg-green");
    // If the next episode button is found, click it
    if (nextEpisodeButton) nextEpisodeButton.click();
    logger.log("Moved to the next episode automatically.");
}
// V.0.1.5 - Mega.nz player handler
function addShortcutsToPageMega() {
    /* Add the shortcuts to the page */
    // Add the event listener to the page
    let iframe = document.querySelector("iframe[src*='mega.nz']")
    document.addEventListener("keydown", (event) => {
        // Check if the event is a shortcut
        // Spaghetti code incoming... Yey!
        if (settings.forwardSkip.enabled &&
            IsSettingsWindowOpen === false &&
            event.ctrlKey === settings.forwardSkip.ctrlKey &&
            event.altKey === settings.forwardSkip.altKey &&
            event.shiftKey === settings.forwardSkip.shiftKey &&
            event.key === settings.forwardSkip.key) {
            // If the event is forward skip, skip forward
            iframe.contentWindow.postMessage({
                "plugin": "MATweaks",
                "type": "forwardSkip",
                "seconds": settings.forwardSkip.duration
            }, "*");
        } else if (settings.backwardSkip.enabled &&
            IsSettingsWindowOpen === false &&
            event.ctrlKey === settings.backwardSkip.ctrlKey &&
            event.altKey === settings.backwardSkip.altKey &&
            event.shiftKey === settings.backwardSkip.shiftKey &&
            event.key === settings.backwardSkip.key) {
            // If the event is backward skip, skip backward
            iframe.contentWindow.postMessage({
                "plugin": "MATweaks",
                "type": "backwardSkip",
                "seconds": settings.backwardSkip.duration
            }, "*");
        }
        else if (IsSettingsWindowOpen === false && event.key === "ArrowRight") {
            event.preventDefault();
            iframe.contentWindow.postMessage({"plugin": "MATweaks", "type": "forwardSkip", "seconds": 5}, "*");
        } else if (IsSettingsWindowOpen === false && event.key === "ArrowLeft") {
            event.preventDefault();
            iframe.contentWindow.postMessage({"plugin": "MATweaks", "type": "backwardSkip", "seconds": 5}, "*");
        } else if (IsSettingsWindowOpen === false && event.key === " ") {
            event.preventDefault();
            iframe.contentWindow.postMessage({"plugin": "MATweaks", "type": "togglePlay"}, "*");
        } else if (IsSettingsWindowOpen === false && event.key === "ArrowUp") {
            event.preventDefault();
            iframe.contentWindow.postMessage({"plugin": "MATweaks", "type": "volumeUp"}, "*");
        } else if (IsSettingsWindowOpen === false && event.key === "ArrowDown") {
            event.preventDefault();
            iframe.contentWindow.postMessage({"plugin": "MATweaks", "type": "volumeDown"}, "*");
        } else if (IsSettingsWindowOpen === false && event.key === "M" || event.key === "m") {
            event.preventDefault();
            iframe.contentWindow.postMessage({"plugin": "MATweaks", "type": "toggleMute"}, "*");
        } else if (IsSettingsWindowOpen === false && event.key === "F" || event.key === "f") {
            event.preventDefault();
            iframe.contentWindow.postMessage({"plugin": "MATweaks", "type": "toggleFullscreen"}, "*");
        } else if (IsSettingsWindowOpen === false && event.key === "C" || event.key === "c") {
            event.preventDefault();
        } /* Check if the key is a number */ else if (IsSettingsWindowOpen === false && event.key >= 0 && event.key <= 9) {
            event.preventDefault();
            iframe.contentWindow.postMessage({"plugin": "MATweaks", "type": "seekTo", "percent": event.key * 10}, "*");
        }
    });
    logger.log("Shortcuts added to the page.");
}
function nextEpisodeMega() {
    /* Move to the next episode */
    if (!isAutoNextEpisodeTriggered) /* <- This prevents the "infinite" loop */ {
        // Get the next episode button
        let nextEpisodeButton = document.getElementById("epkovetkezo")
        // If the next episode button is found, click it
        if (nextEpisodeButton) {
            nextEpisodeButton.click();
            logger.log("Moved to the next episode. (If you can read this message, then you are a wizard.)");
        }
        isAutoNextEpisodeTriggered = true;
    }
}
// v0.1.6 - Redirect automatically to the better quality ( idea by: fwexy_hun_ )
function redirectBetterQuality() {
    /* Redirect to the better quality */
    if (!settings.autobetterQuality.enabled || location.href.includes("1080p")) return;
    // Get the better quality button
    let betterQualityButton = Array.from(document.querySelectorAll(".gomb.bg-red")).find(button => button.href.includes("1080p"));
    // If the better quality button is found, click it
    if (betterQualityButton) {
        betterQualityButton.click();
        console.log("Redirected to the better quality.");
    } else {
        console.log("No better quality found.");
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// Here we go!
// First, load the settings
loadSettings();
// Then, add the event listeners to listen for messages from the extension
window.addEventListener("message", receiveMessage, false);
// then, add the event listener to listen for the page load
window.addEventListener("load", () => {
    loadSettings(); // load the settings ( again, just in case... )
    addSettingsButton(); // add the settings button
    addShortcutsToPage(); // add the shortcuts to the page
    redirectBetterQuality(); // redirect to the better quality
});
