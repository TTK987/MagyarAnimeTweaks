/**
 * ConsoleLogger class for easy enable/disable of logging
 * @class
 */
class ConsoleLogger {
    /**
     * Log a message to the console
     * @param {string} message - The message to log
     */
    log(message) {
        if (settings.devSettings.enabled && settings.devSettings.settings.ConsoleLog.enabled) console.log(`[MATweaks]: ` + message);
    }

    /**
     * Logs a warning to the console if logging is enabled
     * @param {string} message - The warning message to log
     */
    warn(message) {
        if (settings.devSettings.enabled && settings.devSettings.settings.ConsoleLog.enabled) console.warn(`[MATweaks]: ` + message);

    }

    /**
     * Logs an error to the console if logging is enabled
     * @param {string} message - The error message to log
     */
    error(message) {
        if (settings.devSettings.enabled && settings.devSettings.settings.ConsoleLog.enabled) console.error(`[MATweaks]: ` + message);
    }
}

plyr = undefined;

/**
 * Player class for handling the player
 * @class
 */
class Player {
    /**
     * Player can be reloaded without a page reload
     *
     * Since: v0.1.5
     */
    /**
     * Create a Player instance
     * @constructor
     */
    constructor() {
        this.selector = "#indavideoframe";
        this.sourceUrl = "";
        this.isMega = false;
        this.sourceUrl720p = "";
        this.sourceUrl360p = "";
        this.IframeUrl = ""
        this.quality = 720;
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
            this.replacePlayerDefault();
            return;
        }
        // Check if Plyr player is already loaded
        if (typeof Plyr == "undefined") {
            logger.error("Plyr player not loaded.");
        }
        // Check if source URL is valid
        if (!this.sourceUrl720p && !this.sourceUrl360p) {
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
        videoElement.setAttribute("src", this.sourceUrl720p || this.sourceUrl360p); // Set the source url to the 720p or 360p source url
        videoElement.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
        videoElement.setAttribute("playsinline", "");
        videoElement.setAttribute("controls", "");
        videoElement.setAttribute("preload", "metadata");
        replaceWith(playerElement, videoElement);
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
                        logger.log("Auto next episode triggered.");
                        autoNextEpisode();
                        autoNextEpisodetriggered = true;
                    }
                }
            });
            videoElement.addEventListener("ended", function () {
                if (autoNextEpisodetriggered === false) {
                    logger.log("Auto next episode triggered.");
                    autoNextEpisode();
                    autoNextEpisodetriggered = true;
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
                ualityBadge: {
                    2160: "4K",
                    1440: "HD",
                    1080: "HD",
                    720: "HD",
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
            let sourceUrl = player.quality === 720 ? player.sourceUrl720p : player.sourceUrl360p;
            downloadFile(sourceUrl, document.title + " (MATweaks).mp4"); // Download the file with the source url and the title of the page as the filename
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
    transition: width 0.5s;
}
#download-progress-bar::-webkit-progress-bar {
    background: var(--dark);
    border-radius: 10px;
    transition: width 0.5s;
}
#download-progress-bar::-webkit-progress-value {
    background: var(--primary-color);
    border-radius: 10px;
    transition: width 0.5s;
}
#download-progress-bar::-moz-progress-bar {
    background: var(--primary-color);
    border-radius: 10px;
    transition: width 0.5s;
}
#download-progress-bar::-ms-fill {
    background: var(--primary-color);
    border-radius: 10px;
    transition: width 0.5s;
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
        if (!this.sourceUrl720p && !this.sourceUrl360p) {
            this.showErrorMessage("Nem sikerült betölteni a videót. (Rossz URL)<br>Töltsd újra az oldalt.");
            return false;
        }
        let videoElement = document.createElement("video");
        videoElement.setAttribute("autoplay", "autoplay");
        videoElement.setAttribute("src", this.sourceUrl720p || this.sourceUrl360p);
        videoElement.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
        videoElement.setAttribute("playsinline", "");
        videoElement.setAttribute("controls", "");
        videoElement.setAttribute("preload", "metadata");
        videoElement.setAttribute("id", "video");

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
        error.innerHTML = "[MATweaks] Hiba történt a videó lejátszása közben.<br>" + message;
        error.style.color = "red";
        error.style.fontSize = "xx-large";
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
        player.currentTime = Number(player.currentTime) + Number(settings.forwardSkip.duration);
        logger.log("Skipped forward " + settings.forwardSkip.duration + " seconds.");
    }

    /**
     * Skip backward in the player
     * @param {HTMLVideoElement} player - The player element
     */
    skipBackward(player) {
        if (player === null) player = document.querySelector('video');
        player.currentTime = Number(player.currentTime) - Number(settings.backwardSkip.duration);
        logger.log("Skipped backward " + settings.backwardSkip.duration + " seconds.");
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
 * Settings object to store the settings (Later loaded from the storage)
 *
 * Default settings for the extension (used if the settings are not loaded from the storage)
 *
 * @type {Object}
 */
let settings = {
    forwardSkip: { /* Forward skip settings (default: ctrl + →) */ enabled: true,duration: 85,ctrlKey: true,altKey: false,shiftKey: false,key: "ArrowRight",},
    backwardSkip:{ /* Backward skip settings (default: ctrl + ←)*/ enabled: true,duration: 85,ctrlKey: true,altKey: false,shiftKey: false,key: "ArrowLeft",},
    nextEpisode: { /* Next episode settings (default: alt + →)  */ enabled: true,ctrlKey: false,altKey: true,shiftKey: false,key: "ArrowRight",},
    previousEpisode: { /* Previous episode settings (default: alt + ←) */ enabled: true,ctrlKey: false,altKey: true,shiftKey: false,key: "ArrowLeft",},
    devSettings: { /* Developer settings (default: false) */ enabled: false,settings: { /* Developer settings */ ConsoleLog: { /* Console log (default: false) */ enabled: false,},DefaultPlayer: { /* Default player (default: "plyr") */player: "plyr",},}},
    autoNextEpisode: { /* Auto next episode (default: false) (on last episode of the season it won't skip) */ enabled: false, time: 50, /* Time to skip to the next episode before the end of the episode (in seconds) */ },
    autoplay: { /* Autoplay (default: true) */ enabled: true, },
    autobetterQuality: { /* Auto better quality (default: false) */ enabled: false, },
    version: chrome.runtime.getManifest().version, /* Version of the extension */
};

/**
 * Logger object to log messages to the console
 * @type {ConsoleLogger}
 */
let logger = new ConsoleLogger();

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
 * Function to load the settings from the storage and set the settings variable
 */
function loadSettings() {
    chrome.runtime.sendMessage({ plugin: "MATweaks", type: "loadSettings" }, function (response) {
        if (response && response !== {}) {
            settings = response;
            console.log("[MATweaks] Settings loaded.");
        } else {
            showErrorPopup("[MATweaks] Nem sikerült betölteni a beállításokat, az alapértelmezett beállítások lesznek használva.");
            console.error("[MATweaks] Settings not loaded.");
        }
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
    window.addEventListener("load", function () {addSettingsButton(); addShortcutsToPage(); redirectBetterQuality();});
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
                logger.warn("Invalid message type received.");
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
    let iframe = document.querySelector("iframe[src*='embed.indavideo.hu']");
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
    // Get the source URL from the message and set it in the player
    player.sourceUrl720p = data.data["720p"];
    player.sourceUrl360p = data.data["360p"];
    // Get the iframe src and set it in the player
    player.IframeUrl = document.querySelector("iframe[src*='embed.indavideo.hu']").src;
    // Replace the player with the selected player type
    // Check if the devsettings are enabled
    if (settings.devSettings.enabled) {
        switch (settings.devSettings.settings.DefaultPlayer.player) {
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
    } else {
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
    // Check if the devsettings are enabled and the default player is set to "default"
    // If the default player is set to "default", don't replace the player
    if (settings.devSettings.enabled && settings.devSettings.settings.DefaultPlayer.player === "default") {return;}
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
     * Since: v0.1.7.1
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
 * Function to download a file and log the progress
 * @param {string} url - The URL of the file to download
 * @param {string} filename - The filename of the file to download
 * @returns {Promise<boolean>} - Returns true if the download was successful, false if not
 */
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

/**
 * Function to add shortcuts to the page
 */
function addShortcutsToPage() {
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

/**
 * Function to redirect to the better quality
 *
 * Since: v0.1.6
 */
function redirectBetterQuality() {
    if (!settings.autobetterQuality.enabled || location.href.includes("1080p") || location.href.includes("2160p")) return;
    // Get the better quality button (2160p or 1080p)
    let betterQualityButton = Array.from(document.querySelectorAll(".gomb.bg-red")).find(button => button.href.includes("2160p") || button.href.includes("1080p"));
    // If the better quality button is found, click it
    if (betterQualityButton) {
        betterQualityButton.click();
        logger.log("Redirected to the better quality.");
    } else {
        logger.log("No better quality found.");
    }
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
        if (event.ctrlKey && event.key !== "Control") {
            keyDisplay += "Ctrl + ";
        }
        if (event.altKey && event.key !== "Alt") {
            keyDisplay += "Alt + ";
        }
        if (event.shiftKey && event.key !== "Shift") {
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
        if (event.ctrlKey && event.key !== "Control") {
            keyDisplay += "Ctrl + ";
        }
        if (event.altKey && event.key !== "Alt") {
            keyDisplay += "Alt + ";
        }
        if (event.shiftKey && event.key !== "Shift") {
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
        if (event.ctrlKey && event.key !== "Control") {
            keyDisplay += "Ctrl + ";
        }
        if (event.altKey && event.key !== "Alt") {
            keyDisplay += "Alt + ";
        }
        if (event.shiftKey && event.key !== "Shift") {
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
        if (event.ctrlKey && event.key !== "Control") {
            keyDisplay += "Ctrl + ";
        }
        if (event.altKey && event.key !== "Alt") {
            keyDisplay += "Alt + ";
        }
        if (event.shiftKey && event.key !== "Shift") {
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
    if (settings.devSettings.enabled) {
        player.replacePlayer(settings.devSettings.settings.DefaultPlayer.player);
    }
}

/**
 * Function to save the settings to the storage
 * @param {Object} newSettings - The new settings to save
 */
function saveSettings(newSettings) {
    // Save the new settings to the storage
    settings = Object.assign(settings, newSettings);
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


/**
 * Initialize the extension
 */
initializeExtension();

