let LastUpdate = "2024.02.16";
// ---------------------------------------------------------------------------------------------------------------------
let settings = {}
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
    /* This is the player class, that I will use to create the players according to the user's settings. (Potentially "hot swappable" players, to minimize the page reloads.)*/
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
            let iframe = document.createElement("iframe");
            iframe.setAttribute("id", "indavideoframe");
            iframe.setAttribute("style", "float: none;");
            iframe.setAttribute("src", this.IframeUrl);
            iframe.setAttribute("frameborder", "0");
            iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
            iframe.setAttribute("allowfullscreen", "");
            // Replace the player
            let video = document.querySelector(this.querrySelector);
            if (video.src === this.IframeUrl) {
                logger.log("The iframe is already the default player.");
                return false;
            }
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
                videoElement.setAttribute("autoplay", "autoplay");
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
                let plyr = new Plyr("#video", {
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
                        advertisement: "Hirdetés",
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
                    downloadFile(sourceUrl, document.title + ".mp4"); // Download the file with the source url and the title of the page as the filename
                });
                // Create the download progress bar
                let downloadProgressBarContainer = document.querySelector(".download-progress-bar-container");
                if (downloadProgressBarContainer === null) {downloadProgressBarContainer = document.createElement("div");}
                downloadProgressBarContainer.setAttribute("class", "download-progress-bar-container");
                downloadProgressBarContainer.innerHTML = `
        <progress id="download-progress-bar" value="0" max="100"></progress>
        <p id="download-progress-bar-text">0% (0 MB / 0 MB)</p>
    `;
                // Add css to the download progress bar
                const css = `
.download-progress-bar-container {
    position: relative;
    display: none;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    flex-direction: column;
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
    top: 35%; /* I don't know why, but it's not centered without this. */
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
    color: #ffffff;
    font-size: 20px;
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
                // fixes the plyr buffer position
                const plyrbuffer = document.querySelector(".plyr__progress__buffer");
                if (plyrbuffer) plyrbuffer.style.top = "9.5px"; // (Could be solved with css)
                this.querrySelector = ".plyr";
                return true;
        } else {
            // If the user watches a Mega.nz video, then we will absolutely do nothing with it, because we aren't at V.0.1.5 yet. :D
            logger.log("Mega.nz video detected. (Not supported yet.)");
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
        }
    }
    setQuerrySelector(querrySelector) {
        this.querrySelector = querrySelector;
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
    getQuerrySelector() {
        return this.querrySelector;
    }
    getSourceUrl720p() {
        return this.sourceUrl720p;
    }
    getSourceUrl360p() {
        return this.sourceUrl360p;
    }
    getIframeUrl() {
        return this.IframeUrl;
    }
    getIsMegaLink() {
        return this.isMegaLink;
    }
    getCurrentQuality() {
        return this.currentQuality;
    }
}
// ---------------------------------------------------------------------------------------------------------------------
const logger = new ConsoleLogger(); // Create a new console logger
const player = new Player(); // Create a new player
// ---------------------------------------------------------------------------------------------------------------------
// All the functions for the extension
async function downloadFile(url, filename) {
    /* Download a file */
    if (downloadInProgress) {
        // If a download is already in progress, log it as an error and return false
        logger.error("Download already in progress.");
        return false;
    }
    if (url === "" || filename === "" || url === undefined || filename === undefined) {
        // If the url or the filename is empty or undefined, log it as an error and return false
        logger.error("Download failed: URL or filename is empty or undefined.");
        return false;
    }
    // Try to download the file
    try {
        // Get the file
        const response = await fetch(url);
        const contentLength = response.headers.get('content-length'); // Get the content length
        const total = parseInt(contentLength, 10); // Parse the content length to an integer
        let loaded = 0; // Set the loaded to 0
        let downloadProgressBar = document.querySelector("#download-progress-bar"); // Get the download progress bar
        let downloadProgressBarcontainer = document.querySelector(".download-progress-bar-container"); // Get the download progress bar container
        downloadProgressBar.setAttribute("max", total); // Set the max value of the download progress bar to the content length
        downloadProgressBarcontainer.style.display = "block"; // Show the download progress bar
        downloadInProgress = true; // Set the download in progress to true
        const reader = response.body.getReader(); // Get the reader
        const stream = new ReadableStream({ // Create a readable stream
            // Start the stream
            start(controller) {
                function pump() { // Pump the stream
                    // Read the stream
                    return reader.read().then(({done, value}) => {
                        if (done) {
                            // If the stream is done, close the controller and return
                            controller.close();
                            return;
                        }
                        loaded += value.byteLength; // Add the value's byte length to the loaded
                        // Log the download progress
                        LogDownloadProgress(total, loaded);
                        controller.enqueue(value); // Enqueue the value
                        return pump();
                    });
                }
                return pump();
            }
        });
        // Create a new response from the stream
        const blob = await new Response(stream).blob();
        // Create a new object url from the blob
        const objectUrl = URL.createObjectURL(blob);
        // Create a new link
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = filename;
        // Append the link to the body
        document.body.appendChild(link);
        link.click(); // Click the link
        // Remove the link and revoke the object url
        downloadProgressBarcontainer.style.display = "none";
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
        // Log the download finished
        logger.log(`Download finished: "${filename}"`);
        downloadInProgress = false; // Set the download in progress to false
    } catch (error) {
        // If the download fails, log it as an error
        logger.error(`Download failed: ${error}`);
        downloadInProgress = false;
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
    downloadProgressBarText.innerHTML = `${((loaded / max) * 100).toPrecision(5)}% (${(loaded / 1000000).toPrecision(5)} MB / ${(max / 1000000).toPrecision(5)} MB)`;
    logger.log(`Downloaded ${(loaded / 1000000).toPrecision(5)} MB of ${(max / 1000000).toPrecision(5)} MB`);

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

function openSettings() {
    /* Open the settings window */
    // Get the settings window
    let settingsWindow = document.querySelector("#MATweaks-settings-window");
    if (settingsWindow) {
        // If the settings window is already open, display it
        settingsWindow.style.display = "block";
        IsSettingsWindowOpen = true;
        logger.log("Settings window opened.");
    } else {
        // If the settings window is not open, create it
        createSettingsWindow();
        IsSettingsWindowOpen = true;
        logger.log("Settings window opened.");
    }
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
    // And here is the html+css code... (It supports custom themes) ( 284 lines of html+css code... in a js file... in one block... )
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
                            <p>Javítások</p>
                            <div class="MATweaks-settings-window-body-content-item-feature" id="MATweaks-fixes">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-fixes-enabled">Engedélyezve</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-checkbox" type="checkbox" id="MATweaks-fixes-enabled" name="MATweaks-fixes-enabled" ${settings.fixes.enabled ? "checked" : ""}>
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
                        <p>Discord: < Fejlesztés alatt... ></p>
                    </div>
                </div>
            </div>
        </div>
        <style>
        .MATweaks-settings-window-body-content-item-feature {
                display: flex;
                cursor: pointer;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                align-content: center;
                align-items: center;
                justify-content: space-between;
        }
        
        .MATweaks-settings-window-body-content-item-feature input[type=checkbox] {
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
          background: none;
          min-width: 0;
          max-width: 0;
        }
        .MATweaks-settings-window-body-content-item-feature input {
            cursor: pointer;
            height: 30px;
            min-width: 133px;
        }
        .MATweaks-settings-window-body-content-item-feature-checkbox-custom {
            height: 30px;
            width: 30px;
            background-color: var(--black);
            border-radius: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            align-content: center;
            flex-direction: row;
            flex-wrap: nowrap;
        }
        .MATweaks-settings-window-body-content-item-feature input ~ .MATweaks-settings-window-body-content-item-feature-checkbox-custom {
            background-color: #222222;
            min-width: 20px;
        }
        
        .MATweaks-settings-window-body-content-item-feature input:checked ~ .MATweaks-settings-window-body-content-item-feature-checkbox-custom {
          background-color: #2b2d30;
          min-width: 20px;
        }
        
        .MATweaks-settings-window-body-content-item-feature-checkbox-custom:after {
          content: "";
        }
        
        .MATweaks-settings-window-body-content-item-feature input:checked ~ .MATweaks-settings-window-body-content-item-feature-checkbox-custom:after {
          display: block;
        }
        
        .MATweaks-settings-window-body-content-item-feature .MATweaks-settings-window-body-content-item-feature-checkbox-custom:after {
          content: "✔";
          display: none;
        }
        .MA-Tweaks-settings-popup {
            position: absolute;
            top: 80%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: var(--black-color);
            border: 4px solid #000000;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border-radius: 5px;
            padding: 10px;
            z-index: 1000000;
            font-family: Arial, sans-serif;
            color: #fff;
            max-width: fit-content;
            max-height: fit-content;
            min-width: 90%;
            min-height: 90%;
            overflow: auto;
        }
        .MA-Tweaks-settings-popup-body-content-features {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            align-content: center;
            flex-direction: row;
        }
        .MATweaks-settings-window-body-content-item {
                width: 48%;
                margin-bottom: 10px;
                background: var(--primary-color);
                padding: 10px;
                border-radius: 5px;
                box-shadow: 3px 3px 6px 0 rgba(0, 0, 0, 0.2);
        }
        .MATweaks-settings-window-body-content-item p {
                margin: 0;
                font-size: larger;
                font-weight: 600;
        }
        .MATweaks-settings-window-body-content-item-feature-input {
            width: 47%;
            border-radius: 5px;
            padding: 10px;
            height: 10px;
        }
        .MATweaks-settings-window-body {
            padding: 10px;
        }
        .MATweaks-settings-window-body-content {
            padding: 10px;
        }
        .MATweaks-settings-window-header {
            background-color: var(--primary-color);
            color: white;
            display: flex;
            flex-direction: row-reverse;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-radius: 5px;
        }
        .MATweaks-settings-window-header h2 {
            margin: 0;
            display: inline-block;
        }
        .MATweaks-settings-window-header .MATweaks-settings-window-close {
            float: right;
            cursor: pointer;
            background: var(--black);
            padding: 10px;
            width: 50px;
            height: 50px;
            align-self: center;
            display: flex;
            align-content: center;
            justify-content: center;
            align-items: center;
            font-size: xxx-large;
            border-radius: 5px;
            color: var(--white);
            transition: 0.3s;
        }
        .MATweaks-settings-window-body-content-credits p {
            margin: 0;
        }
        .MATweaks-settings-window-body-content-credits {
            margin-top: 10px;
            font-size: small;
            display: flex;
            justify-content: space-around;
            align-items: center;
        }
        .MATweaks-settings-window-header .MATweaks-settings-window-close:hover {
            color: var(--red);
        }
        .MATweaks-settings-window-body-content-buttons-button {
            background: var(--primary-color);
            border-radius: 5px;
            color: white;
            border: 0;
            box-shadow: 3px 3px 3px 2px rgb(0 0 0 / 20%);
            height: 50px;
            width: 100px;
        }
        .MATweaks-settings-window-body-content-buttons {
            display: flex;
            justify-content: space-evenly;
            align-items: center;
        }
        </style>
    `;
    // --------------------------
    // Create a new settings object with the new settings
    let newSettings = {
        forwardSkip: {
            enabled: settings.forwardSkip.enabled,
            duration: settings.forwardSkip.duration,
            ctrlKey: settings.forwardSkip.ctrlKey,
            altKey: settings.forwardSkip.altKey,
            shiftKey: settings.forwardSkip.shiftKey,
            key: settings.forwardSkip.key,
        },
        backwardSkip: {
            enabled: settings.backwardSkip.enabled,
            duration: settings.backwardSkip.duration,
            ctrlKey: settings.backwardSkip.ctrlKey,
            altKey: settings.backwardSkip.altKey,
            shiftKey: settings.backwardSkip.shiftKey,
            key: settings.backwardSkip.key,
        },
        nextEpisode: {
            enabled: settings.nextEpisode.enabled,
            ctrlKey: settings.nextEpisode.ctrlKey,
            altKey: settings.nextEpisode.altKey,
            shiftKey: settings.nextEpisode.shiftKey,
            key: settings.nextEpisode.key,
        },
        previousEpisode: {
            enabled: settings.previousEpisode.enabled,
            ctrlKey: settings.previousEpisode.ctrlKey,
            altKey: settings.previousEpisode.altKey,
            shiftKey: settings.previousEpisode.shiftKey,
            key: settings.previousEpisode.key,
        },
        fixes: {
            enabled: settings.fixes.enabled,
        },
        devSettings: {
            enabled: settings.devSettings.enabled,
            settings: {
                ConsoleLog: {
                    enabled: settings.devSettings.settings.ConsoleLog.enabled,
                },
                DefaultPlayer: {
                    player: settings.devSettings.settings.DefaultPlayer.player,
                },
            }
        },
        autoNextEpisode: {
            enabled: settings.autoNextEpisode.enabled,
            time: settings.autoNextEpisode.time,
        },
        version: settings.version,
    };
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
    document.querySelector("#MATweaks-forwardSkip").addEventListener("click", (event) => {
        newSettings.forwardSkip.enabled = !newSettings.forwardSkip.enabled;
        document.querySelector("#MATweaks-forwardSkip-enabled").checked = newSettings.forwardSkip.enabled;
        if (settings.devSettings.enabled) logger.log("forwardSkip.enabled: " + newSettings.forwardSkip.enabled);
    });
    document.querySelector("#MATweaks-backwardSkip").addEventListener("click", (event) => {
        newSettings.backwardSkip.enabled = !newSettings.backwardSkip.enabled;
        document.querySelector("#MATweaks-backwardSkip-enabled").checked = newSettings.backwardSkip.enabled;
        if (settings.devSettings.enabled) logger.log("backwardSkip.enabled: " + newSettings.backwardSkip.enabled);
    });
    document.querySelector("#MATweaks-nextEpisode").addEventListener("click", (event) => {
        newSettings.nextEpisode.enabled = !newSettings.nextEpisode.enabled;
        document.querySelector("#MATweaks-nextEpisode-enabled").checked = newSettings.nextEpisode.enabled;
        if (settings.devSettings.enabled) logger.log("nextEpisode.enabled: " + newSettings.nextEpisode.enabled);
    });
    document.querySelector("#MATweaks-previousEpisode").addEventListener("click", (event) => {
        newSettings.previousEpisode.enabled = !newSettings.previousEpisode.enabled;
        document.querySelector("#MATweaks-previousEpisode-enabled").checked = newSettings.previousEpisode.enabled;
        if (settings.devSettings.enabled) logger.log("previousEpisode.enabled: " + newSettings.previousEpisode.enabled);
    });
    document.querySelector("#MATweaks-fixes").addEventListener("click", (event) => {
        newSettings.fixes.enabled = !newSettings.fixes.enabled;
        document.querySelector("#MATweaks-fixes-enabled").checked = newSettings.fixes.enabled;
        if (settings.devSettings.enabled) logger.log("fixes.enabled: " + newSettings.fixes.enabled);
    });
    document.querySelector("#MATweaks-devSettings").addEventListener("click", (event) => {
        newSettings.devSettings.enabled = !newSettings.devSettings.enabled;
        document.querySelector("#MATweaks-devSettings-enabled").checked = newSettings.devSettings.enabled;
        if (settings.devSettings.enabled) logger.log("devSettings.enabled: " + newSettings.devSettings.enabled);
    });
    document.querySelector("#MATweaks-devSettings-ConsoleLog").addEventListener("click", (event) => {
        newSettings.devSettings.settings.ConsoleLog.enabled = !newSettings.devSettings.settings.ConsoleLog.enabled;
        document.querySelector("#MATweaks-devSettings-ConsoleLog-enabled").checked = newSettings.devSettings.settings.ConsoleLog.enabled;
        if (settings.devSettings.enabled) logger.log("devSettings.settings.ConsoleLog.enabled: " + newSettings.devSettings.settings.ConsoleLog.enabled);
    });
    document.querySelector("#MATweaks-autoNextEpisode").addEventListener("click", (event) => {
        newSettings.autoNextEpisode.enabled = !newSettings.autoNextEpisode.enabled;
        document.querySelector("#MATweaks-autoNextEpisode-enabled").checked = newSettings.autoNextEpisode.enabled;
        if (settings.devSettings.enabled) logger.log("autoNextEpisode.enabled: " + newSettings.autoNextEpisode.enabled);
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
        if (settings.fixes.enabled) {fixURLs();} else {UnFixURLs();}
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
            } else if (settings.devSettings.enabled && settings.devSettings.settings.DefaultPlayer.player === "plyr" || !settings.devSettings.enabled) {
                // If the default player is plyr, or the dev settings are not enabled, replace the player with the plyr player
                player.replacePlayer("plyr");
            } else if (settings.devSettings.enabled && settings.devSettings.settings.DefaultPlayer.player === "html5") {
                // If the default player is html5, replace the player with the html5 player
                // Note: If the user wants to use the html5 player, for idk what reason (Maybe to user their own player, or to use the browser's player...??), then the user has the option.
                player.replacePlayer("html5");
            } else {
                // In case of a miracle, show an error message.
                // Should never happen, but just in case...
                player.showErrorMessage("Hát, valami hiba történt...<br>Próbáld újra.");
            }
        }
    }
}

function nextEpisode() {
    /* Move to the next episode */
    // Get the next episode button
    let nextEpisodeButton = document.querySelector(".gomb.bg-green");
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
    let previousEpisodeButton = document.querySelector(".gomb.bg-orange");
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

function fixURLs() {
    /* Fix the URLs */
    // Check if the current location is a 1080p episode
    let currentLocation = window.location.href;
    if (currentLocation.includes("/resz-1080p/")) {
        // If the current location is a 1080p episode, fix the next and previous episode buttons, and the episode links
        let nextEpisodeButton = document.querySelector(".gomb.bg-green");
        let previousEpisodeButton = document.querySelector(".gomb.bg-orange");
        // Fix the next and previous episode buttons
        if (nextEpisodeButton) {
            // If the next episode button is found, fix it's URL
            let nextEpisodeUrl = nextEpisodeButton.href;
            nextEpisodeUrl = nextEpisodeUrl.replace("/resz/", "/resz-1080p/");
            nextEpisodeButton.href = nextEpisodeUrl;
            logger.log("Next episode button fixed.");
        } else {
            logger.log("Next episode button not found.");
        }
        if (previousEpisodeButton) {
            // If the previous episode button is found, fix it's URL
            let previousEpisodeUrl = previousEpisodeButton.href;
            previousEpisodeUrl = previousEpisodeUrl.replace("/resz/", "/resz-1080p/");
            previousEpisodeButton.href = previousEpisodeUrl;
            logger.log("Previous episode button fixed.");
        } else {
            logger.log("Previous episode button not found.");
        }
        // Fix the episode links
        let episodeLinks = document.querySelectorAll(".epizod_link_normal");
        episodeLinks.forEach((episodeLink) => {
            // For each episode link, fix it's URL
            let episodeUrl = episodeLink.href;
            episodeUrl = episodeUrl.replace("/resz/", "/resz-1080p/");
            episodeLink.href = episodeUrl;
        });
    } else {
        // If the current location is not a 1080p episode, no need to fix the URLs
        logger.log("Next and previous episode buttons are already redirecting to the correct URL.");
    }
}
function loadSettings() {
    /* Load the settings */
    // We use here console instead of logger, because the logger is not always loaded when the settings are loaded
    // Send a message to the background script to get the settings
    chrome.runtime.sendMessage({plugin: "MATweaks", type: "loadSettings"}, function (response) {
        if (response) {
            try {
                settings = response; // If the settings are loaded, save them
                console.log("Settings loaded.");
            } catch (error) {
                // If the settings are not loaded, log it as an error
                console.error("Error while loading settings.");
            }
        } else {
            console.error("Error while loading settings.");
        }
    });
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

// V.0.1.4 - Removed page reload on settings change
function UnFixURLs() {
    /* Unfix the URLs (yes, really) */
    // Inverse of fixURLs function
    // Check if the current location is a 1080p episode
    let currentLocation = window.location.href;
    if (currentLocation.includes("/resz-1080p/")) {
        let nextEpisodeButton = document.querySelector(".gomb.bg-green");
        let previousEpisodeButton = document.querySelector(".gomb.bg-orange");
        if (nextEpisodeButton) {
            let nextEpisodeUrl = nextEpisodeButton.href;
            nextEpisodeUrl = nextEpisodeUrl.replace("/resz-1080p/", "/resz/");
            nextEpisodeButton.href = nextEpisodeUrl;
        }
        if (previousEpisodeButton) {
            let previousEpisodeUrl = previousEpisodeButton.href;
            previousEpisodeUrl = previousEpisodeUrl.replace("/resz-1080p/", "/resz/");
            previousEpisodeButton.href = previousEpisodeUrl;
        }
        let episodeLinks = document.querySelectorAll(".epizod_link_normal");
        episodeLinks.forEach((episodeLink) => {
            let episodeUrl = episodeLink.href;
            episodeUrl = episodeUrl.replace("/resz-1080p/", "/resz/");
            episodeLink.href = episodeUrl;
        });
        logger.log("Unfixed the URLs according to the settings.");
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// Here we go!
// first, load the settings
loadSettings();
// then, add the event listeners to listen for messages from the extension
window.addEventListener("message", receiveMessage, false);
// then, add the event listener to listen for the page load
window.addEventListener("load", (event) => {
    addSettingsButton(); // add the settings button
    addShortcutsToPage(); // add the shortcuts to the page
    if (settings.fixes.enabled) fixURLs(); // fix the URLs

});
