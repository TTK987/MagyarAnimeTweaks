/**
 * plyr.io player object
 * @type {Plyr} - The Plyr player object
 * @class Plyr
 */
let plyr = undefined;

/**
 * MATweaks API class
 * @class MATweaksAPI - The API class for the MATweaks extension
 * @since v0.1.7
 * @type {MATweaksAPI}
 */
let MAT = window.MAT;

/**
 * Logger class for logging messages
 * @class MALogger - The Logger class for logging messages
 * @type {Logger}
 */
let logger = window.MATLogger;

/**
 * Settings object to store the settings (Later loaded from the storage)
 * Default settings for the extension (used if the settings are not loaded from the storage)
 * @type {Object}
 */
let settings = MAT.getDefaultSettings();

/**
 * Player class for handling the player
 * @class
 */
class Player {
    /**
     * Player can be reloaded without a page reload
     * Since: v0.1.5
     */
    /**
     * Create a Player instance
     * @constructor
     */
    constructor() {
        this.selector = "#indavideoframe";
        this.isMega = false;  // Controls whether the player is replaced like we did at Mega.nz
        this.IframeUrl = ""
        this.qualityData = []; // [{"quality": <int>, "url": <string>}, ...]
        this.quality = 0;
    }

    /**
     * Replace the player with the given player type
     * @param {string} playerType - The source URL of the player
     */
    replacePlayer(playerType) {
        switch (playerType) {
            case "default":
                this.replaceWithDefaultPlayer();
                break;
            case "plyr":
                this.replaceWithPlyrPlayer();
                break;
            case "html5":
                this.replaceWithHTML5Player();
                break;
            default:
                logger.error("Invalid player type specified.");
        }
    }

    /**
     * Replace the player with the default player (Indavideo / Mega Iframe)
     */
    replaceWithDefaultPlayer() {
        let playerElement = document.querySelector(this.selector);
        // Check if player element exists
        if (playerElement) {
            // Check if the player is already the default player
            if (playerElement.src === this.IframeUrl && !this.isMega) {
                logger.warn("Player is already the default player.");
                return;
            }
            // Replace player with default player
            let iframe = document.createElement("iframe");
            iframe.setAttribute("id", "indavideoframe");
            iframe.setAttribute("style", "float: none;");
            iframe.setAttribute("src", this.IframeUrl);
            iframe.setAttribute("frameborder", "0");
            iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
            iframe.setAttribute("allowfullscreen", "");
            replaceWith(playerElement, iframe);
            this.selector = "#indavideoframe";
            logger.log("Replaced with default player.");
        } else {
            logger.error("Player element not found.");
        }
    }

    /**
     * Replace the player with the Plyr player (plyr.io)
     */
    replaceWithPlyrPlayer() {
        // Check if it is a Mega player
        if (this.isMega) {
            this.replaceWithDefaultPlayer();
            return;
        }
        // Check if Plyr player is already loaded
        if (typeof Plyr == "undefined") {
            logger.error("Plyr player not loaded.");
        }
        // Check if source URL is valid
        if (this.qualityData.length === 0) {
            logger.error("Invalid source URL.");
            this.showErrorMessage("Nem sikerült betölteni a videót. (Hibás videó URL)<br>Töltsd újra az oldalt.")
            return;
        }
        // Replace player with Plyr player
        let playerElement = document.querySelector(this.selector);
        let videoElement = document.createElement("video");
        videoElement.setAttribute("id", "video");
        /**
         * Since: v0.1.5 - Option to autoplay the video
         */
        if (settings.autoplay.enabled) {videoElement.setAttribute("autoplay", "autoplay");}
        videoElement.setAttribute("src", this.qualityData.find((data) => data.quality === this.qualityData.map((data) => data.quality).sort((a, b) => b - a)[0]).url);
        videoElement.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
        videoElement.setAttribute("playsinline", "");
        videoElement.setAttribute("controls", "");
        videoElement.setAttribute("preload", "metadata");
        replaceWith(playerElement, videoElement);
        // Add src to the video element
        for (let i = 0; i < this.qualityData.length; i++) {
            let source = document.createElement("source");
            source.setAttribute("src", this.qualityData[i].url);
            source.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
            videoElement.appendChild(source);
        }
        if (settings.autoNextEpisode.enabled) {
            if (settings.autoNextEpisode.time < 0) settings.autoNextEpisode.time = 0;
            let autoNextEpisodeTriggered = false;
            videoElement.addEventListener("timeupdate", function () {
                if (plyr.duration === 0 || plyr.currentTime === 0) return;
                if (plyr.currentTime >= plyr.duration - settings.autoNextEpisode.time) {
                    if (autoNextEpisodeTriggered === false) {
                        logger.log("Auto next episode triggered.");
                        autoNextEpisode();
                        autoNextEpisodeTriggered = true;
                    }
                }
            });
            videoElement.addEventListener("ended", function () {
                if (autoNextEpisodeTriggered === false) {
                    logger.log("Auto next episode triggered.");
                    autoNextEpisode();
                    autoNextEpisodeTriggered = true;
                }
            });
        }
        if (plyr !== undefined) {
            plyr.destroy();
        }
        plyr = new Plyr(videoElement, {
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
                    480: "SD",
                    360: "",
                    240: "",
                    144: "",
                },
            },
            quality: {
                // Set the default quality to the highest quality (Doesn't work)
                default: this.qualityData.find((data) => data.quality === this.qualityData.map((data) => data.quality).sort((a, b) => b - a)[0]).quality,
                options: this.qualityData.map((data) => data.quality).sort((a, b) => b - a), // Sort the qualities in descending order
                forced: true,
                onChange: (quality) => { // When the quality is changed, change the source url
                    let currentTime = Number(videoElement.currentTime);
                    document.querySelector("video").setAttribute("src", this.qualityData.find((data) => data.quality === quality).url);
                    // set the current time of the video
                    videoElement.currentTime = currentTime;
                    this.quality = quality;
                    logger.log("Quality changed to " + quality);
                },
            },
            speed: {
                selected: 1,
                options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
            },
        });
        this.addShortcutsToPlayer(videoElement);
        // Get the download button
        let downloadButton = document.querySelector("#tryideput > div > div.plyr__controls > a")
        // Add the event listener to the download button
        downloadButton.addEventListener("click", function (event) {
            event.preventDefault(); // Prevent the default action
            logger.log("Download requested."); // Log the download request
            // Get the source url according to the quality
            let filename = renderFileName(settings.advanced.downloadName) + ".mp4"; // Get the filename
            downloadFile(filename); // Download the file with the source url and the title of the page as the filename
        });
        // Create the download progress bar
        let downloadProgressBarContainer = document.querySelector(".download-progress-bar-container");
        if (downloadProgressBarContainer === null) {downloadProgressBarContainer = document.createElement("div");}
        downloadProgressBarContainer.setAttribute("class", "download-progress-bar-container");
        downloadProgressBarContainer.innerHTML = `<progress id="download-progress-bar" value="0" max="100"></progress><p id="download-progress-bar-text">0% (0 MB / 0 MB)</p>`;
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
    transition: width 1.5s;
}
#download-progress-bar::-webkit-progress-bar {
    background: var(--dark);
    border-radius: 10px;
    transition: width 1.5s;
}
#download-progress-bar::-webkit-progress-value {
    background: var(--primary-color);
    border-radius: 10px;
    transition: width 1.5s;
}
#download-progress-bar::-moz-progress-bar {
    background: var(--primary-color);
    border-radius: 10px;
    transition: width 1.5s;
}
#download-progress-bar::-ms-fill {
    background: var(--primary-color);
    border-radius: 10px;
    transition: width 1.5s;
}
#download-progress-bar-text {
    width: 100%;
    position: absolute;
    top: 47%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
    color: #fff;
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
        document.querySelector("head").appendChild(style);
        const videoPlayer = document.querySelector(".plyr");
        // Add the download progress bar below the video player
        videoPlayer.parentNode.insertBefore(downloadProgressBarContainer, videoPlayer.nextSibling);
        // Set a normal height for the video player, so it won't be too big or too small
        videoPlayer.style.display = "inline-block";
        videoPlayer.style.height = "70vh";
        videoPlayer.style.border = "none";
        // Set video player and all of its children to not focusable
        videoPlayer.addEventListener("focus", function () {
            videoPlayer.blur();
        });
        videoPlayer.querySelectorAll("*").forEach((element) => {
            element.addEventListener("focus", function () {
                element.blur();
            });
        });
        // Fix the buffer bar position
        const plyrbuffer = document.querySelector(".plyr__progress__buffer");
        if (plyrbuffer) plyrbuffer.style.top = "9.5px";
        this.selector = ".plyr";
        loadCustomCss();
        logger.log("Replaced with Plyr player.");
    }

    /**
     * Replace the player with the HTML5 player
     */
    replaceWithHTML5Player() {
        // Check if it is a Mega player
        if (this.isMega) {
            this.replacePlayerDefault();
            return;
        }
        // Check if source URL is valid
        if (this.qualityData.length === 0) {
            this.showErrorMessage("Nem sikerült betölteni a videót. <br>Töltsd újra az oldalt.");
            return false;
        }
        let videoElement = document.createElement("video");
        videoElement.setAttribute("autoplay", "autoplay");
        videoElement.setAttribute("src", this.qualityData[0].url);
        videoElement.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
        videoElement.setAttribute("playsinline", "");
        videoElement.setAttribute("controls", "");
        videoElement.setAttribute("preload", "metadata");
        videoElement.setAttribute("id", "video");
        for (let i = 0; i < this.qualityData.length; i++) {
            let source = document.createElement("source");
            source.setAttribute("src", this.qualityData[i].url);
            source.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
            videoElement.appendChild(source);
        }
        const video = document.querySelector(this.selector);
        video.parentNode.replaceChild(videoElement, video);
        this.selector = "video";
        logger.log("Replaced with HTML5 player.");
    }

    /**
     * Add shortcuts to the player
     * @param {HTMLVideoElement} player - The player element
     */
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

    /**
     * Show an error message
     * @param {string} message - The error message to show
     */
    showErrorMessage(message) {
        /* Show an error message */
        logger.error("Error while playing video. Message: " + message);
        // Create the error message
        let error = document.createElement("p");
        error.setAttribute("class", "MATweaks-error");
        error.innerHTML = "[MATweaks] Hiba történt a videó lejátszása közben.<br>" + message + "<br>Ha a hiba továbbra is fennáll, kérlek jelentsd a hibát <a href='https://discord.gg/dJX4tVGZhY' target='_blank'>Discordon</a> vagy a <a href='https://github.com/TTK987/MagyarAnimeTweaks/issues' target='_blank'>GitHubon</a>" +
            "<br>Ne a MagyarAnime-nek jelezd a hibát, mert ők nem tudnak segíteni!<br>Ne a \"Hibabejelentés\" gombot használd, mert azzal csak a MagyarAnime-nek küldesz hibajelzést, nem nekem.";
        error.style.color = "red";
        error.style.fontSize = "x-large";
        // Replace the player with the error message
        let iframe = document.querySelector(this.selector);
        // Replace the player with the error message
        replaceWith(iframe, error);
    }

    /**
     * Skip forward in the player
     * @param {HTMLVideoElement} player - The player element
     */
    skipForward(player) {
        if (player === null) player = document.querySelector('video');
        player.currentTime = Number(player.currentTime) + Number(settings.forwardSkip.time);
        logger.log("Skipped forward " + settings.forwardSkip.time + " seconds.");
    }

    /**
     * Skip backward in the player
     * @param {HTMLVideoElement} player - The player element
     */
    skipBackward(player) {
        if (player === null) player = document.querySelector('video');
        player.currentTime = Number(player.currentTime) - Number(settings.backwardSkip.time);
        logger.log("Skipped backward " + settings.backwardSkip.time + " seconds.");
    }
}

/**
 * Boolean to check if the settings window is open
 * @type {boolean}
 */
let IsSettingsWindowOpen = false;

/**
 * Boolean to check if the auto next episode is triggered (prevents multiple triggers)
 * @type {boolean}
 */
let isAutoNextEpisodeTriggered = false;

/**
 * Boolean to check if the download is in progress
 * @type {boolean}
 */
let downloadInProgress = false;

/**
 * Player object to handle the player
 * @type {Player}
 */
let player = new Player();

/**
 * Helper function to replace an element with a new element
 * @param {HTMLElement} element - The element to replace
 * @param {HTMLElement} newElement - The new element to replace the old element with
 */
function replaceWith(element, newElement) {
    element.parentNode.replaceChild(newElement, element);
}

/**
 * Function that checks if the advanced settings are enabled
 * @returns {boolean} Returns true if the advanced settings are enabled, otherwise false
 * @since v0.1.7
 */
function checkAdvancedSettings() {
    return settings.advanced.enabled;
}

/**
 * Function to load the settings from the storage and set the settings variable
 */
function loadSettings() {
    MAT.loadSettings().then((data) => {
        settings = data;
        if (data.advanced.enabled && data.advanced.settings.ConsoleLog.enabled) {
            logger.enable();
        }
        logger.log("Settings loaded.");
    }).catch((error) => {
        settings = MAT.getDefaultSettings();
        console.log(error);
        showErrorPopup("Hiba történt a beállítások betöltése közben. Alapértelmezett beállítások lesznek használva."); // Should never happen (hopefully)
        logger.error("Error while loading settings: " + error);
    });
}

/**
 * Function to show an error popup
 * @param {string} message - The error message to show
 */
function showErrorPopup(message) {
    let errorPopup = document.createElement("div");
    errorPopup.setAttribute("class", "MATweaks-error-popup");
    errorPopup.innerHTML = message;
    let tries = 0;
    let error = setInterval(() => {
        if (document.body) {
            document.body.appendChild(errorPopup);
            setTimeout(() => {
                errorPopup.style.opacity = "0";
                setTimeout(() => {
                    errorPopup.remove();
                }, 1000);
            }, 5000);
            clearInterval(error);
        } else {
            tries++;
            if (tries >= 10) {
                clearInterval(error);
            }
        }
    }, 10);

}

/**
 * Function to set up the event listeners
 */
function setupEventListeners() {
    window.addEventListener("message", receiveMessage, false);
    window.addEventListener("load", function () {addSettingsButton(); addShortcutsToPage();});
}

/**
 *  Function to receive messages from iframes
 * @param {MessageEvent} event - The message event
 */
function receiveMessage(event) {
    if (event.data.plugin === "MATweaks") {
        switch (event.data.type) {
            case "iframeLoaded":
                handleIframeLoaded(event.data);
                break;
            case "sourceUrl":
                handleSourceUrlReceived(event.data);
                break;
            case "megaIframeLoaded":
                handleMegaIframeLoaded(event.data);
                break;
            case "nextEpisode":
                nextEpisodeMega();
                break;
            case "previousEpisode":
                previousEpisode();
                break;
            case "nextEpisodeForce":
                nextEpisode();
                break;
            default:
                break;
        }
    }
}

/**
 * Function to initialize the extension
 *
 * This function is called when the extension is loaded
 */
function initializeExtension() {
    loadSettings();
    setupEventListeners();
}


/**
 * Function to handle the indavideo iframe loaded message
 * @param {MessageEvent} data - The message event (Unused)
 */
function handleIframeLoaded(data) {
    // Get the iframe and send a message to it to get the source URL
    let iframe = document.querySelector("iframe");
    if (iframe) {
        iframe.contentWindow.postMessage({ plugin: "MATweaks", type: "getSourceUrl" }, "*");
        logger.log("Iframe loaded.");
    } else {
        logger.error("Iframe not found.");
    }
}

/**
 * Function to handle the source URL received message
 * @param {MessageEvent} data - The message event
 */
function handleSourceUrlReceived(data) {
    player.qualityData = data.data;
    player.IframeUrl = document.querySelector("iframe").src;
    if (checkAdvancedSettings()) {
        setPlayer(settings.advanced.settings.DefaultPlayer.player);
    } else {
        setPlayer("plyr");
    }
}

/**
 * Function to get the source from the URL
 * @param {string} url - The URL to get the source from
 * @returns {string} The source of the URL
 * @since v0.1.7
 */
function getSourceFromUrl(url) {
    if (url.includes("indavideo")) {
        return "indavideo";
    } else if (url.includes("videa")) {
        return "videa";
    } else if (url.includes("mega.nz")) {
        return "mega";
    } else if (url.includes("dailymotion")) {
        return "dailyMotion";
    } else if (url.includes("rumble")) {
        return "rumble";
    } else {
        return "default";
    }
}

/**
 * Function to set the player
 * @param {string} playerType - The player type to set
 * @since v0.1.7
 */
function setPlayer(playerType) {
    switch (playerType) {
        case "plyr":
            player.replacePlayer("plyr");
            break;
        case "html5":
            player.replacePlayer("html5");
            break;
        case "default":
            player.replacePlayer("default");
            break;
        default:
            player.replacePlayer("plyr");
    }
}


/**
 * Function to handle the mega iframe loaded message
 * @param {MessageEvent} data - The message event (Unused)
 */
function handleMegaIframeLoaded(data) {
    // If the message is that the mega iframe is loaded, send a message to the iframe to replace the player
    let iframe = document.querySelector('iframe[src*="mega.nz"]');
    addShortcutsToPage();  // Add the shortcuts for next and previous episode
    player.isMega = true;
    player.IframeUrl = iframe.src;
    logger.log("Mega iframe loaded.");
    addShortcutsToPageMega(); // Add the shortcuts for forward and backward skip
    // Check if the advanced settings are enabled and the default player is set to "default"
    // If the default player is set to "default", don't replace the player
    if (checkAdvancedSettings() && settings.advanced.settings.DefaultPlayer.player === "default") {return;}
    // Send a message to the iframe to replace the player
    iframe.contentWindow.postMessage({"plugin": "MATweaks", "type": "replacePlayer"}, "*");
    logger.log("Mega player replaced.");
}

/**
 * Function to add the settings button to the page
 *
 * This function adds the settings button to the account menu
 */
function addSettingsButton() {
    let accountMenu = document.querySelector("#gen-header > div > div > div > div > nav > div.gen-header-info-box > div.gen-account-holder > div > ul");
    if (accountMenu) {
        // Create the settings button
        let settingsButton = document.createElement("li");
        settingsButton.setAttribute("class", "gen-account-menu-item");
        settingsButton.innerHTML = `<a class="gen-account-menu-link" id="MATweaks-settings-button"><i class="fas fa-cog"></i>MATweaks beállítások</a>`;
        // Add the settings button to the account menu
        accountMenu.insertBefore(settingsButton, accountMenu.children[4]);
        // Add the event listener to the settings button
        document.querySelector("#MATweaks-settings-button").addEventListener("click", openSettings);
        // Log the action
        logger.log("Settings button added.");
    }
}

/**
 * Function to open the settings window
 */
function openSettings() {
    let settingsWindow = document.querySelector("#MATweaks-settings-window");
    // Check if the settings window is already created
    if (settingsWindow) {
        // If the settings window is already created, toggle its visibility
        settingsWindow.style.display = settingsWindow.style.display === "none" ? "block" : "none";
        IsSettingsWindowOpen = settingsWindow.style.display !== "none";
        logger.log("Settings window toggled.");
    } else {
        createSettingsWindow();
        IsSettingsWindowOpen = true;
        logger.log("Settings window created.");
    }
}

/**
 * Function to move the next episode automatically
 *
 * Since: v0.1.4
 */
function autoNextEpisode() {
    // Get the next episode button and click it
    let nextEpisodeButton = document.getElementById("epkovetkezo")
    if (nextEpisodeButton) nextEpisodeButton.click();
    logger.log("Moved to the next episode automatically.");
}

/**
 * Function to move to the next episode
 */
function nextEpisode() {
    // Get the next episode button
    let nextEpisodeButton = document.getElementById("epkovetkezo")
    /**
     * On last episode it will go to the data sheet of the series
     * Since: v0.1.4
     */
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

/**
 * Function to move to the previous episode
 */
function previousEpisode() {
    // Get the previous episode button
    let previousEpisodeButton = document.getElementById("epelozo");
    /**
     * On first episode it will go to the data sheet of the series
     * Since: v0.1.6.1
     */
    if (previousEpisodeButton) {
        previousEpisodeButton.click();
    } else {
        // Get the data sheet button (first element)
        let dataSheetButton = document.querySelectorAll(".gomb.bg-red");
        dataSheetButton = dataSheetButton[dataSheetButton.length - 1];
        // If the data sheet button is found, click it
        if (dataSheetButton) {dataSheetButton.click();} else {logger.log("No previous episode or data sheet button found.");}
    }
    logger.log("Moved to the previous episode.");
}

/**
 * Function to move to the next episode if the source is Mega
 */
function nextEpisodeMega() {
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

/**
 * Function to render the filename
 * @param {string} template - The template of the filename
 * @returns {string} The rendered filename
 * @since v0.1.7
 */
function renderFileName(template) {
    if (template === "") {
        template = MAT.getDefaultSettings().advanced.downloadName;
    }
    let title = document.querySelector("h2.gen-title > a").innerText;
    let episode = document.querySelector(".gen-title").innerText.match(/(\d+)\.?\s?[rR]ész/)[1];
    let source = getSourceFromUrl(player.IframeUrl) === "default" ? "ismeretlen" : getSourceFromUrl(player.IframeUrl);
    let quality = player.quality + "p";
    let fansub = document.querySelector(".gen-single-meta-holder > p > a").innerText;
    let filename = template.replace(/%title%/g, title).replace(/%episode%/g, episode).replace(/%0episode%/g, episode.padStart(2, "0")).replace(/%MAT%/g, "MATweaks").replace(/%source%/g, source).replace(/%quality%/g, quality).replace(/%fansub%/g, fansub);
    return filename.replace(/[/\\?%*:|"<>]/g, '-');
}


/**
 * Function to download a file and log the progress
 * @param {string} filename - The filename of the file to download
 * @returns {Promise<boolean>} - Returns true if the download was successful, false if not
 */
async function downloadFile(filename) {
    if (downloadInProgress) {
        logger.error("Download already in progress.");
        return false;
    }
    let url = document.querySelector("video").src;
    if (!filename) {
        logger.error("Download failed: filename is empty or undefined.");
        return false;
    }
    // Check if the URL is a dailymotion video
    if (url.match(/dmcdn.net/)) {
        // Start a download with the dailymotion video URL
        logger.log("Starting download...");
        // Send a message to the background script to start the download
        chrome.runtime.sendMessage({
            plugin: "MATweaks",
            type: "downloadFile",
            url: url,
            filename: filename,
        }, function (response) {
            if (response) {
                logger.log(`Download finished: "${filename}"`);
            } else {
                logger.error("Download failed.");
            }
        });
        return true;
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
        if (!response.ok) logger.error(`Download failed: ${response.status} - ${response.statusText}`);
        const reader = response.body.getReader();
        let receivedLength = 0; // bytes received
        let chunks = []; // array of received binary chunks (comprises the body)
        let max = response.headers.get('content-length');
        let lastUpdate = Date.now();
        let downloadProgressBar = document.querySelector("#download-progress-bar");
        downloadProgressBar.setAttribute("max", max);
        let downloadProgressBarText = document.querySelector("#download-progress-bar-text");
        while(true) {
            const {done, value} = await reader.read();
            if (done) {
                break;
            }
            chunks.push(value);
            receivedLength += value.length;
            if (Date.now() - lastUpdate > 1000) {
                downloadProgressBar.value = receivedLength;
                downloadProgressBarText.innerHTML = `${Math.round(receivedLength / max * 100)}% (${(receivedLength / 1024 / 1024).toFixed(2)} MB / ${(max / 1024 / 1024).toFixed(2)} MB)`;
                lastUpdate = Date.now();
            }

        }
        logger.log("Download complete, preparing for saving...");
        const blob = new Blob(chunks);
        chunks = null;
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

/**
 * Function to add shortcuts to the page
 *
 * Since: v0.1.5
 */
function addShortcutsToPageMega() {
    let iframe = document.querySelector("iframe[src*='mega.nz']")
    document.addEventListener("keydown", (event) => {
        if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") return;
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
                "seconds": settings.forwardSkip.time
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
                "seconds": settings.backwardSkip.time
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

/**
 * Function to add shortcuts to the page
 */
function addShortcutsToPage() {
    // Add the event listener to the page
    document.addEventListener("keydown", (event) => {
        // Check if the event is a shortcut
        if (settings.nextEpisode.enabled &&
            IsSettingsWindowOpen === false &&
            checkShortcut(event, settings.nextEpisode)) {
            // If the event is next episode, move to the next episode
            nextEpisode();
        } else if (
            settings.previousEpisode.enabled &&
            IsSettingsWindowOpen === false &&
            checkShortcut(event, settings.previousEpisode)) {
            // If the event is previous episode, move to the previous episode
            previousEpisode();
        }
    });
    logger.log("Shortcuts added to the page.");
}

/**
 * Function to create the settings window
 */
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
                                <input class="MATweaks-settings-window-body-content-item-feature-input" type="number" id="MATweaks-forwardSkip-duration" name="MATweaks-forwardSkip-duration" value="${settings.forwardSkip.time}">
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
                                <input class="MATweaks-settings-window-body-content-item-feature-input" type="number" id="MATweaks-backwardSkip-duration" name="MATweaks-backwardSkip-duration" value="${settings.backwardSkip.time}">
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
                            <p>További beállítások</p>
                            <p style="font-size: 0.8em;">Például: letöltési név sablon, dev beállítások, plyr kinézet, stb.</p>
                            <button class="MATweaks-settings-window-body-content-item-feature-button">További beállítások</button>    
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
                        <p>Verzió: ${MAT.getVersion()} <span class="eap">EAP</span></p>
                        <p class="eap">Ez egy Early Access Program (Korai hozzáférésű program) verzió, amely még fejlesztés alatt áll.</p>
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
    if (settings.eap === true) {
        logger.log("EAP enabled.");
        document.querySelectorAll(".eap").forEach(e => {
            e.style.display = "inline";
        });
    }
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
        logger.log("forwardSkip.enabled: " + newSettings.forwardSkip.enabled);
    });
    document.querySelector("#MATweaks-backwardSkip").addEventListener("click", () => {
        newSettings.backwardSkip.enabled = !newSettings.backwardSkip.enabled;
        document.querySelector("#MATweaks-backwardSkip-enabled").checked = newSettings.backwardSkip.enabled;
        logger.log("backwardSkip.enabled: " + newSettings.backwardSkip.enabled);
    });
    document.querySelector("#MATweaks-nextEpisode").addEventListener("click", () => {
        newSettings.nextEpisode.enabled = !newSettings.nextEpisode.enabled;
        document.querySelector("#MATweaks-nextEpisode-enabled").checked = newSettings.nextEpisode.enabled;
        logger.log("nextEpisode.enabled: " + newSettings.nextEpisode.enabled);
    });
    document.querySelector("#MATweaks-previousEpisode").addEventListener("click", () => {
        newSettings.previousEpisode.enabled = !newSettings.previousEpisode.enabled;
        document.querySelector("#MATweaks-previousEpisode-enabled").checked = newSettings.previousEpisode.enabled;
        logger.log("previousEpisode.enabled: " + newSettings.previousEpisode.enabled);
    });
    document.querySelector("#MATweaks-autoNextEpisode").addEventListener("click", () => {
        newSettings.autoNextEpisode.enabled = !newSettings.autoNextEpisode.enabled;
        document.querySelector("#MATweaks-autoNextEpisode-enabled").checked = newSettings.autoNextEpisode.enabled;
        logger.log("autoNextEpisode.enabled: " + newSettings.autoNextEpisode.enabled);
    });
    document.querySelector("#MATweaks-autoPlay").addEventListener("click", () => {
        newSettings.autoplay.enabled = !newSettings.autoplay.enabled;
        document.querySelector("#MATweaks-autoPlay-enabled").checked = newSettings.autoplay.enabled;
        logger.log("autoplay.enabled: " + newSettings.autoplay.enabled);
    });
    document.querySelector("#MATweaks-forwardSkip-duration").addEventListener("change", (event) => {
        newSettings.forwardSkip.time = event.target.value;
        logger.log("forwardSkip.duration: " + newSettings.forwardSkip.time);
    });
    document.querySelector("#MATweaks-backwardSkip-duration").addEventListener("change", (event) => {
        newSettings.backwardSkip.time = event.target.value;
        logger.log("backwardSkip.duration: " + newSettings.backwardSkip.time);
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
        setText(newSettings.forwardSkip, event.target)
    });
    document.querySelector("#MATweaks-backwardSkip-key").addEventListener("keydown", (event) => {
        event.preventDefault();
        newSettings.backwardSkip.key = event.key;
        newSettings.backwardSkip.ctrlKey = event.ctrlKey;
        newSettings.backwardSkip.altKey = event.altKey;
        newSettings.backwardSkip.shiftKey = event.shiftKey;
        setText(newSettings.backwardSkip, event.target);
    });
    document.querySelector("#MATweaks-nextEpisode-key").addEventListener("keydown", (event) => {
        event.preventDefault();
        newSettings.nextEpisode.key = event.key;
        newSettings.nextEpisode.ctrlKey = event.ctrlKey;
        newSettings.nextEpisode.altKey = event.altKey;
        newSettings.nextEpisode.shiftKey = event.shiftKey;
        setText(newSettings.nextEpisode, event.target);
    });
    document.querySelector("#MATweaks-previousEpisode-key").addEventListener("keydown", (event) => {
        event.preventDefault();
        newSettings.previousEpisode.key = event.key;
        newSettings.previousEpisode.ctrlKey = event.ctrlKey;
        newSettings.previousEpisode.altKey = event.altKey;
        newSettings.previousEpisode.shiftKey = event.shiftKey;
        setText(newSettings.previousEpisode, event.target);
    });
    document.querySelector(".MATweaks-settings-window-body-content-item-feature-button").addEventListener("click", () => {
        // Close the settings window
        document.querySelector("#MATweaks-settings-window").remove();
        IsSettingsWindowOpen = false;
        // Open the advanced settings window
        chrome.runtime.sendMessage({ plugin: "MATweaks", type: "openSettings" });
    });
    logger.log("Settings window created.");
}

/**
 * Function to set the text of the input
 * @param {Object} data - The data to set the text
 * @param {HTMLInputElement} input - The input to set the text
 */
function setText(data, input) {
    let text = "";
    if (data.ctrlKey && data.key !== "Control") {
        text += "Ctrl + ";
    }
    if (data.altKey && data.key !== "Alt") {
        text += "Alt + ";
    }
    if (data.shiftKey && data.key !== "Shift") {
        text += "Shift + ";
    }
    text += data.key;
    input.value = text;
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
 * Function to close the settings window without saving the settings
 */
function closeSettingsWithoutSaving() {
    // Close the settings window without saving
    document.querySelector("#MATweaks-settings-window").remove();
    IsSettingsWindowOpen = false;
    logger.log("Settings window closed without saving.");
}

/**
 * Function to close the settings window and save the settings
 * @param {Object} newSettings - The new settings to save
 */
function closeSettings(newSettings) {
    // Save the new settings
    saveSettings(newSettings);
    // Close the settings window
    document.querySelector("#MATweaks-settings-window").remove();
    IsSettingsWindowOpen = false;
    logger.log("Settings saved and window closed.");
}

/**
 * Function to save the settings to the storage
 * @param {Object} newSettings - The new settings to save
 */
function saveSettings(newSettings) {
    MAT.setSettings(newSettings);
    MAT.saveSettings();
    settings = MAT.getSettings();
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


/**
 * Initialize the extension
 */
initializeExtension();
