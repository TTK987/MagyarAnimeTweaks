// ==UserScript==
// @name         MagyarAnimeTweaks (Tampermonkey version)
// @namespace    TTK987/MagyarAnimeTweaks
// @version      0.1.6.2
// @description  Egyéni beállításokkal bővíti a MagyarAnime oldalait. (Ez a Tampermonkey verzió)
// @author       TTK987
// @license      MIT
// @match        https://*.magyaranime.eu/*
// @match        https://*.magyaranime.hu/*
// @match        https://embed.indavideo.hu/*
// @match        https://*.mega.nz/embed/*
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_info
// @grant        GM_getResourceText
// @grant        GM_XMLHttpRequest
// @require      https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.min.js
// @resource     settingsCSS https://raw.githubusercontent.com/TTK987/MagyarAnimeTweaks/main/src/MATSettings.css
// @run-at       document-start
// ==/UserScript==
// --------------------------------------------------------------------
// This is licensed under the MIT Licence. See on GitHub: https://github.com/TTK987/MagyarAnimeTweaks
// This licence applies to the whole project, including the Tampermonkey version.
// With this licence you can do anything with the code. You can modify it, redistribute it, use it in your own project, etc.
// You can do all of this without giving credit to the original author. (But it would be nice if you did. :D)
// --------------------------------------------------------------------


/*
 * Figyelem! Ez a script csak egy teszt!
 * Lehetnek benne bugok és nem feltétlen optimalizált a kód!
 * Minden lényeges funkció működik.
 * Ha hibát találsz benne, akkor jelezd felém discordon.
*/


(function() {
    'use strict';

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
        version: GM_info.script.version, // The version of the extension
    };

    /**
     * Function to load the settings from the storage and set the settings variable
     * @returns {Object} - The settings object
     */
    function loadSettings() {
        // Load the settings from the storage
        settings = GM_getValue("settings", settings);
        // Log the settings
        console.log("Settings loaded.");
        return settings;
    }
    function saveSettings() {
        // Save the settings to the storage
        GM_setValue("settings", settings);
        // Log the settings
        console.log("Settings saved.");
    }
    if (window.location.hostname.includes("magyaranime")) {
        /**
         * Helper function to replace an element with a new element
         * @param {HTMLElement} element - The element to replace
         * @param {HTMLElement} newElement - The new element to replace the old element with
         */
        function replaceWith(element, newElement) {
            element.parentNode.replaceChild(newElement, element);
        }
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

        let plyr = undefined;

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
                this.IframeUrl = "";
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
                if (settings.autoplay.enabled) {
                    videoElement.setAttribute("autoplay", "autoplay");
                }
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
                if (downloadProgressBarContainer === null) {
                    downloadProgressBarContainer = document.createElement("div");
                }
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
         * Function to set up the event listeners
         */
        function setupEventListeners() {
            window.addEventListener("message", receiveMessage, false);
            window.addEventListener("load", function () {
                addSettingsButton();
                addShortcutsToPage();
                redirectBetterQuality();
            });
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
                if (dataSheetButton) {
                    dataSheetButton.click();
                } else {
                    logger.log("No next episode or data sheet button found.");
                }
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
                if (dataSheetButton) {
                    dataSheetButton.click();
                } else {
                    logger.log("No previous episode or data sheet button found.");
                }
            }
            logger.log("Moved to the previous episode.");
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
            settings = loadSettings();
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
                iframe.contentWindow.postMessage({plugin: "MATweaks", type: "getSourceUrl"}, "*");
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
            if (settings.devSettings.enabled && settings.devSettings.settings.DefaultPlayer.player === "default") {
                return;
            }
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
                document.head.insertAdjacentHTML("beforeend", `<style>${GM_getResourceText("settingsCSS")}</style>`);
                document.head.insertAdjacentHTML("beforeend", `<style>${GM_getResourceText("plyrCSS")}</style>`);
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
            document.querySelector("#download-progress-bar-cancel").addEventListener("click", function (event) {
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
                const response = await fetch(url, {signal});
                if (!response.ok) logger.error(`Download failed: ${response.status} - ${response.statusText}`);
                const reader = response.body.getReader();
                let receivedLength = 0; // bytes received
                let chunks = []; // array of received binary chunks (comprises the body)
                let max = response.headers.get('content-length');
                let lastUpdate = Date.now();
                let downloadProgressBar = document.querySelector("#download-progress-bar");
                downloadProgressBar.setAttribute("max", max);
                let downloadProgressBarText = document.querySelector("#download-progress-bar-text");
                while (true) {
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
                } else if (IsSettingsWindowOpen === false && event.key === "ArrowRight") {
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
                    iframe.contentWindow.postMessage({
                        "plugin": "MATweaks",
                        "type": "seekTo",
                        "percent": event.key * 10
                    }, "*");
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
                        <p>Verzió: ${GM_info.script.version}</p>
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
         * Initialize the extension
         */
        initializeExtension();
    } else if /* Check for indavideo */ (location.href.includes("indavideo")) {
        window.addEventListener('message', function (event) {
            // A message has been received from the parent window
            if (event.data && event.data.plugin === 'MATweaks') {
                // The message is from the "MA Tweaks" extension
                if (event.data.type === 'getSourceUrl') {
                    // The parent window requested the source URL of the video
                    let retry = 10;  // The number of retries
                    let interval = setInterval(function () {  // The interval function
                        if (f720() === false && f360() === false) {
                            // Retrying to get the source URL
                            console.log('retrying... ' + retry);
                        }
                        if (f720() || f360() || retry <= 0) {
                            // Sending the source URL to the parent window
                            clearInterval(interval); // Clear the interval
                            window.parent.postMessage({'plugin': 'MATweaks', 'type': 'sourceUrl', 'data': {'720p': f720(), '360p': f360()}}, '*'); // Send the source URL to the parent window
                            return;
                        }
                        retry--; // Decrement the retry counter
                    }, 100);
                }
            }
        });
        function f720() {
            // The function to get the 720p source URL
            let hdbutton = document.querySelector('.hd_button span'); // The 720p button
            if (hdbutton === null) { // If the 720p button is not found
                return false; // Return false
            }
            hdbutton.click(); // Click the 720p button
            let sourceUrl720p = document.getElementById('html5video').src; // Get the source URL
            if (sourceUrl720p.includes('.720.')) { // If the source URL contains ".720."
                return sourceUrl720p; // Return the source URL
            } else { // If the source URL does not contain ".720."
                return false; // Return false
            }
        }
        function f360() {
            let sdbutton = document.querySelector('.sd_button span');  // The 360p button
            if (sdbutton === null) { // If the 360p button is not found
                let sourceUrl360p = document.getElementById('html5video').src; // Get the source URL
                if (sourceUrl360p.includes('.360.')) { // If the source URL contains ".360."
                    return sourceUrl360p; // Return the source URL
                } else { // If the source URL does not contain ".360."
                    return false; // Return false
                }
            }
            sdbutton.click(); // Click the 360p button
            let sourceUrl360p = document.getElementById('html5video').src; // Get the source URL
            if (sourceUrl360p.includes('.360.')) { // If the source URL contains ".360."
                return sourceUrl360p; // Return the source URL
            } else { // If the source URL does not contain ".360."
                return false; // Return false
            }
        }
        // Send a message to the parent window that the iframe has been loaded and ready
        document.addEventListener('DOMContentLoaded', function () {
            window.parent.postMessage({'plugin': 'MATweaks', 'type': 'iframeLoaded'}, '*');
        });
    } else if /* Check for mega.nz */ (location.href.includes("mega.nz")) {


        /**
         * Plyr player
         * @type {Plyr}
         */
        let plyr = Plyr;

        /**
         * Function to initialize the mega.nz part of the extension
         *
         */
        function initMega() {
            settings = loadSettings(); // Load the settings
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
                    const video = document.querySelector("video");
                    if (video) {
                        if (video.src) {
                            document.head.insertAdjacentHTML("beforeend", `<style>@charset "UTF-8";@keyframes plyr-progress{to{background-position:25px 0;background-position:var(--plyr-progress-loading-size,25px) 0}}@keyframes plyr-popup{0%{opacity:.5;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes plyr-fade-in{0%{opacity:0}to{opacity:1}}.plyr{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;align-items:center;direction:ltr;display:flex;flex-direction:column;font-family:inherit;font-family:var(--plyr-font-family,inherit);font-variant-numeric:tabular-nums;font-weight:400;font-weight:var(--plyr-font-weight-regular,400);line-height:1.7;line-height:var(--plyr-line-height,1.7);max-width:100%;min-width:200px;position:relative;text-shadow:none;transition:box-shadow .3s ease;z-index:0}.plyr audio,.plyr iframe,.plyr video{display:block;height:100%;width:100%}.plyr button{font:inherit;line-height:inherit;width:auto}.plyr:focus{outline:0}.plyr--full-ui{box-sizing:border-box}.plyr--full-ui *,.plyr--full-ui :after,.plyr--full-ui :before{box-sizing:inherit}.plyr--full-ui a,.plyr--full-ui button,.plyr--full-ui input,.plyr--full-ui label{touch-action:manipulation}.plyr__badge{background:#4a5464;background:var(--plyr-badge-background,#4a5464);border-radius:2px;border-radius:var(--plyr-badge-border-radius,2px);color:#fff;color:var(--plyr-badge-text-color,#fff);font-size:9px;font-size:var(--plyr-font-size-badge,9px);line-height:1;padding:3px 4px}.plyr--full-ui ::-webkit-media-text-track-container{display:none}.plyr__captions{animation:plyr-fade-in .3s ease;bottom:0;display:none;font-size:13px;font-size:var(--plyr-font-size-small,13px);left:0;padding:10px;padding:var(--plyr-control-spacing,10px);position:absolute;text-align:center;transition:transform .4s ease-in-out;width:100%}.plyr__captions span:empty{display:none}@media (min-width:480px){.plyr__captions{font-size:15px;font-size:var(--plyr-font-size-base,15px);padding:20px;padding:calc(var(--plyr-control-spacing, 10px)*2)}}@media (min-width:768px){.plyr__captions{font-size:18px;font-size:var(--plyr-font-size-large,18px)}}.plyr--captions-active .plyr__captions{display:block}.plyr:not(.plyr--hide-controls) .plyr__controls:not(:empty)~.plyr__captions{transform:translateY(-40px);transform:translateY(calc(var(--plyr-control-spacing, 10px)*-4))}.plyr__caption{background:#000c;background:var(--plyr-captions-background,#000c);border-radius:2px;-webkit-box-decoration-break:clone;box-decoration-break:clone;color:#fff;color:var(--plyr-captions-text-color,#fff);line-height:185%;padding:.2em .5em;white-space:pre-wrap}.plyr__caption div{display:inline}.plyr__control{background:#0000;border:0;border-radius:4px;border-radius:var(--plyr-control-radius,4px);color:inherit;cursor:pointer;flex-shrink:0;overflow:visible;padding:7px;padding:calc(var(--plyr-control-spacing, 10px)*.7);position:relative;transition:all .3s ease}.plyr__control svg{fill:currentColor;display:block;height:18px;height:var(--plyr-control-icon-size,18px);pointer-events:none;width:18px;width:var(--plyr-control-icon-size,18px)}.plyr__control:focus{outline:0}.plyr__control:focus-visible{outline:2px dashed #00b2ff;outline:2px dashed var(--plyr-focus-visible-color,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)));outline-offset:2px}a.plyr__control{text-decoration:none}.plyr__control.plyr__control--pressed .icon--not-pressed,.plyr__control.plyr__control--pressed .label--not-pressed,.plyr__control:not(.plyr__control--pressed) .icon--pressed,.plyr__control:not(.plyr__control--pressed) .label--pressed,a.plyr__control:after,a.plyr__control:before{display:none}.plyr--full-ui ::-webkit-media-controls{display:none}.plyr__controls{align-items:center;display:flex;justify-content:flex-end;text-align:center}.plyr__controls .plyr__progress__container{flex:1;min-width:0}.plyr__controls .plyr__controls__item{margin-left:2.5px;margin-left:calc(var(--plyr-control-spacing, 10px)/4)}.plyr__controls .plyr__controls__item:first-child{margin-left:0;margin-right:auto}.plyr__controls .plyr__controls__item.plyr__progress__container{padding-left:2.5px;padding-left:calc(var(--plyr-control-spacing, 10px)/4)}.plyr__controls .plyr__controls__item.plyr__time{padding:0 5px;padding:0 calc(var(--plyr-control-spacing, 10px)/2)}.plyr__controls .plyr__controls__item.plyr__progress__container:first-child,.plyr__controls .plyr__controls__item.plyr__time+.plyr__time,.plyr__controls .plyr__controls__item.plyr__time:first-child{padding-left:0}.plyr [data-plyr=airplay],.plyr [data-plyr=captions],.plyr [data-plyr=fullscreen],.plyr [data-plyr=pip],.plyr__controls:empty{display:none}.plyr--airplay-supported [data-plyr=airplay],.plyr--captions-enabled [data-plyr=captions],.plyr--fullscreen-enabled [data-plyr=fullscreen],.plyr--pip-supported [data-plyr=pip]{display:inline-block}.plyr__menu{display:flex;position:relative}.plyr__menu .plyr__control svg{transition:transform .3s ease}.plyr__menu .plyr__control[aria-expanded=true] svg{transform:rotate(90deg)}.plyr__menu .plyr__control[aria-expanded=true] .plyr__tooltip{display:none}.plyr__menu__container{animation:plyr-popup .2s ease;background:#ffffffe6;background:var(--plyr-menu-background,#ffffffe6);border-radius:8px;border-radius:var(--plyr-menu-radius,8px);bottom:100%;box-shadow:0 1px 2px #00000026;box-shadow:var(--plyr-menu-shadow,0 1px 2px #00000026);color:#4a5464;color:var(--plyr-menu-color,#4a5464);font-size:15px;font-size:var(--plyr-font-size-base,15px);margin-bottom:10px;position:absolute;right:-3px;text-align:left;white-space:nowrap;z-index:3}.plyr__menu__container>div{overflow:hidden;transition:height .35s cubic-bezier(.4,0,.2,1),width .35s cubic-bezier(.4,0,.2,1)}.plyr__menu__container:after{border:4px solid #0000;border-top-color:#ffffffe6;border:var(--plyr-menu-arrow-size,4px) solid #0000;border-top-color:var(--plyr-menu-background,#ffffffe6);content:"";height:0;position:absolute;right:14px;right:calc(var(--plyr-control-icon-size, 18px)/2 + var(--plyr-control-spacing, 10px)*.7 - var(--plyr-menu-arrow-size, 4px)/2);top:100%;width:0}.plyr__menu__container [role=menu]{padding:7px;padding:calc(var(--plyr-control-spacing, 10px)*.7)}.plyr__menu__container [role=menuitem],.plyr__menu__container [role=menuitemradio]{margin-top:2px}.plyr__menu__container [role=menuitem]:first-child,.plyr__menu__container [role=menuitemradio]:first-child{margin-top:0}.plyr__menu__container .plyr__control{align-items:center;color:#4a5464;color:var(--plyr-menu-color,#4a5464);display:flex;font-size:13px;font-size:var(--plyr-font-size-menu,var(--plyr-font-size-small,13px));padding:4.66667px 10.5px;padding:calc(var(--plyr-control-spacing, 10px)*.7/1.5) calc(var(--plyr-control-spacing, 10px)*.7*1.5);-webkit-user-select:none;user-select:none;width:100%}.plyr__menu__container .plyr__control>span{align-items:inherit;display:flex;width:100%}.plyr__menu__container .plyr__control:after{border:4px solid #0000;border:var(--plyr-menu-item-arrow-size,4px) solid #0000;content:"";position:absolute;top:50%;transform:translateY(-50%)}.plyr__menu__container .plyr__control--forward{padding-right:28px;padding-right:calc(var(--plyr-control-spacing, 10px)*.7*4)}.plyr__menu__container .plyr__control--forward:after{border-left-color:#728197;border-left-color:var(--plyr-menu-arrow-color,#728197);right:6.5px;right:calc(var(--plyr-control-spacing, 10px)*.7*1.5 - var(--plyr-menu-item-arrow-size, 4px))}.plyr__menu__container .plyr__control--forward:focus-visible:after,.plyr__menu__container .plyr__control--forward:hover:after{border-left-color:initial}.plyr__menu__container .plyr__control--back{font-weight:400;font-weight:var(--plyr-font-weight-regular,400);margin:7px;margin:calc(var(--plyr-control-spacing, 10px)*.7);margin-bottom:3.5px;margin-bottom:calc(var(--plyr-control-spacing, 10px)*.7/2);padding-left:28px;padding-left:calc(var(--plyr-control-spacing, 10px)*.7*4);position:relative;width:calc(100% - 14px);width:calc(100% - var(--plyr-control-spacing, 10px)*.7*2)}.plyr__menu__container .plyr__control--back:after{border-right-color:#728197;border-right-color:var(--plyr-menu-arrow-color,#728197);left:6.5px;left:calc(var(--plyr-control-spacing, 10px)*.7*1.5 - var(--plyr-menu-item-arrow-size, 4px))}.plyr__menu__container .plyr__control--back:before{background:#dcdfe5;background:var(--plyr-menu-back-border-color,#dcdfe5);box-shadow:0 1px 0 #fff;box-shadow:0 1px 0 var(--plyr-menu-back-border-shadow-color,#fff);content:"";height:1px;left:0;margin-top:3.5px;margin-top:calc(var(--plyr-control-spacing, 10px)*.7/2);overflow:hidden;position:absolute;right:0;top:100%}.plyr__menu__container .plyr__control--back:focus-visible:after,.plyr__menu__container .plyr__control--back:hover:after{border-right-color:initial}.plyr__menu__container .plyr__control[role=menuitemradio]{padding-left:7px;padding-left:calc(var(--plyr-control-spacing, 10px)*.7)}.plyr__menu__container .plyr__control[role=menuitemradio]:after,.plyr__menu__container .plyr__control[role=menuitemradio]:before{border-radius:100%}.plyr__menu__container .plyr__control[role=menuitemradio]:before{background:#0000001a;content:"";display:block;flex-shrink:0;height:16px;margin-right:10px;margin-right:var(--plyr-control-spacing,10px);transition:all .3s ease;width:16px}.plyr__menu__container .plyr__control[role=menuitemradio]:after{background:#fff;border:0;height:6px;left:12px;opacity:0;top:50%;transform:translateY(-50%) scale(0);transition:transform .3s ease,opacity .3s ease;width:6px}.plyr__menu__container .plyr__control[role=menuitemradio][aria-checked=true]:before{background:#00b2ff;background:var(--plyr-control-toggle-checked-background,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)))}.plyr__menu__container .plyr__control[role=menuitemradio][aria-checked=true]:after{opacity:1;transform:translateY(-50%) scale(1)}.plyr__menu__container .plyr__control[role=menuitemradio]:focus-visible:before,.plyr__menu__container .plyr__control[role=menuitemradio]:hover:before{background:#23282f1a}.plyr__menu__container .plyr__menu__value{align-items:center;display:flex;margin-left:auto;margin-right:-5px;margin-right:calc(var(--plyr-control-spacing, 10px)*.7*-1 - -2px);overflow:hidden;padding-left:24.5px;padding-left:calc(var(--plyr-control-spacing, 10px)*.7*3.5);pointer-events:none}.plyr--full-ui input[type=range]{-webkit-appearance:none;appearance:none;background:#0000;border:0;border-radius:26px;border-radius:calc(var(--plyr-range-thumb-height, 13px)*2);color:#00b2ff;color:var(--plyr-range-fill-background,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)));display:block;height:19px;height:calc(var(--plyr-range-thumb-active-shadow-width, 3px)*2 + var(--plyr-range-thumb-height, 13px));margin:0;min-width:0;padding:0;transition:box-shadow .3s ease;width:100%}.plyr--full-ui input[type=range]::-webkit-slider-runnable-track{background:#0000;background-image:linear-gradient(90deg,currentColor 0,#0000 0);background-image:linear-gradient(to right,currentColor var(--value,0),#0000 var(--value,0));border:0;border-radius:2.5px;border-radius:calc(var(--plyr-range-track-height, 5px)/2);height:5px;height:var(--plyr-range-track-height,5px);-webkit-transition:box-shadow .3s ease;transition:box-shadow .3s ease;-webkit-user-select:none;user-select:none}.plyr--full-ui input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;background:#fff;background:var(--plyr-range-thumb-background,#fff);border:0;border-radius:100%;box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33);height:13px;height:var(--plyr-range-thumb-height,13px);margin-top:-4px;margin-top:calc((var(--plyr-range-thumb-height, 13px) - var(--plyr-range-track-height, 5px))/2*-1);position:relative;-webkit-transition:all .2s ease;transition:all .2s ease;width:13px;width:var(--plyr-range-thumb-height,13px)}.plyr--full-ui input[type=range]::-moz-range-track{background:#0000;border:0;border-radius:2.5px;border-radius:calc(var(--plyr-range-track-height, 5px)/2);height:5px;height:var(--plyr-range-track-height,5px);-moz-transition:box-shadow .3s ease;transition:box-shadow .3s ease;user-select:none}.plyr--full-ui input[type=range]::-moz-range-thumb{background:#fff;background:var(--plyr-range-thumb-background,#fff);border:0;border-radius:100%;box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33);height:13px;height:var(--plyr-range-thumb-height,13px);position:relative;-moz-transition:all .2s ease;transition:all .2s ease;width:13px;width:var(--plyr-range-thumb-height,13px)}.plyr--full-ui input[type=range]::-moz-range-progress{background:currentColor;border-radius:2.5px;border-radius:calc(var(--plyr-range-track-height, 5px)/2);height:5px;height:var(--plyr-range-track-height,5px)}.plyr--full-ui input[type=range]::-ms-track{color:#0000}.plyr--full-ui input[type=range]::-ms-fill-upper,.plyr--full-ui input[type=range]::-ms-track{background:#0000;border:0;border-radius:2.5px;border-radius:calc(var(--plyr-range-track-height, 5px)/2);height:5px;height:var(--plyr-range-track-height,5px);-ms-transition:box-shadow .3s ease;transition:box-shadow .3s ease;user-select:none}.plyr--full-ui input[type=range]::-ms-fill-lower{background:#0000;background:currentColor;border:0;border-radius:2.5px;border-radius:calc(var(--plyr-range-track-height, 5px)/2);height:5px;height:var(--plyr-range-track-height,5px);-ms-transition:box-shadow .3s ease;transition:box-shadow .3s ease;user-select:none}.plyr--full-ui input[type=range]::-ms-thumb{background:#fff;background:var(--plyr-range-thumb-background,#fff);border:0;border-radius:100%;box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33);height:13px;height:var(--plyr-range-thumb-height,13px);margin-top:0;position:relative;-ms-transition:all .2s ease;transition:all .2s ease;width:13px;width:var(--plyr-range-thumb-height,13px)}.plyr--full-ui input[type=range]::-ms-tooltip{display:none}.plyr--full-ui input[type=range]::-moz-focus-outer{border:0}.plyr--full-ui input[type=range]:focus{outline:0}.plyr--full-ui input[type=range]:focus-visible::-webkit-slider-runnable-track{outline:2px dashed #00b2ff;outline:2px dashed var(--plyr-focus-visible-color,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)));outline-offset:2px}.plyr--full-ui input[type=range]:focus-visible::-moz-range-track{outline:2px dashed #00b2ff;outline:2px dashed var(--plyr-focus-visible-color,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)));outline-offset:2px}.plyr--full-ui input[type=range]:focus-visible::-ms-track{outline:2px dashed #00b2ff;outline:2px dashed var(--plyr-focus-visible-color,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)));outline-offset:2px}.plyr__poster{background-color:#000;background-color:var(--plyr-video-background,var(--plyr-video-background,#000));background-position:50% 50%;background-repeat:no-repeat;background-size:contain;height:100%;left:0;opacity:0;position:absolute;top:0;transition:opacity .2s ease;width:100%;z-index:1}.plyr--stopped.plyr__poster-enabled .plyr__poster{opacity:1}.plyr--youtube.plyr--paused.plyr__poster-enabled:not(.plyr--stopped) .plyr__poster{display:none}.plyr__time{font-size:13px;font-size:var(--plyr-font-size-time,var(--plyr-font-size-small,13px))}.plyr__time+.plyr__time:before{content:"⁄";margin-right:10px;margin-right:var(--plyr-control-spacing,10px)}@media (max-width:767px){.plyr__time+.plyr__time{display:none}}.plyr__tooltip{background:#fff;background:var(--plyr-tooltip-background,#fff);border-radius:5px;border-radius:var(--plyr-tooltip-radius,5px);bottom:100%;box-shadow:0 1px 2px #00000026;box-shadow:var(--plyr-tooltip-shadow,0 1px 2px #00000026);color:#4a5464;color:var(--plyr-tooltip-color,#4a5464);font-size:13px;font-size:var(--plyr-font-size-small,13px);font-weight:400;font-weight:var(--plyr-font-weight-regular,400);left:50%;line-height:1.3;margin-bottom:10px;margin-bottom:calc(var(--plyr-control-spacing, 10px)/2*2);opacity:0;padding:5px 7.5px;padding:calc(var(--plyr-control-spacing, 10px)/2) calc(var(--plyr-control-spacing, 10px)/2*1.5);pointer-events:none;position:absolute;transform:translate(-50%,10px) scale(.8);transform-origin:50% 100%;transition:transform .2s ease .1s,opacity .2s ease .1s;white-space:nowrap;z-index:2}.plyr__tooltip:before{border-left:4px solid #0000;border-left:var(--plyr-tooltip-arrow-size,4px) solid #0000;border-right:4px solid #0000;border-right:var(--plyr-tooltip-arrow-size,4px) solid #0000;border-top:4px solid #fff;border-top:var(--plyr-tooltip-arrow-size,4px) solid var(--plyr-tooltip-background,#fff);bottom:-4px;bottom:calc(var(--plyr-tooltip-arrow-size, 4px)*-1);content:"";height:0;left:50%;position:absolute;transform:translateX(-50%);width:0;z-index:2}.plyr .plyr__control:focus-visible .plyr__tooltip,.plyr .plyr__control:hover .plyr__tooltip,.plyr__tooltip--visible{opacity:1;transform:translate(-50%) scale(1)}.plyr .plyr__control:hover .plyr__tooltip{z-index:3}.plyr__controls>.plyr__control:first-child .plyr__tooltip,.plyr__controls>.plyr__control:first-child+.plyr__control .plyr__tooltip{left:0;transform:translateY(10px) scale(.8);transform-origin:0 100%}.plyr__controls>.plyr__control:first-child .plyr__tooltip:before,.plyr__controls>.plyr__control:first-child+.plyr__control .plyr__tooltip:before{left:16px;left:calc(var(--plyr-control-icon-size, 18px)/2 + var(--plyr-control-spacing, 10px)*.7)}.plyr__controls>.plyr__control:last-child .plyr__tooltip{left:auto;right:0;transform:translateY(10px) scale(.8);transform-origin:100% 100%}.plyr__controls>.plyr__control:last-child .plyr__tooltip:before{left:auto;right:16px;right:calc(var(--plyr-control-icon-size, 18px)/2 + var(--plyr-control-spacing, 10px)*.7);transform:translateX(50%)}.plyr__controls>.plyr__control:first-child .plyr__tooltip--visible,.plyr__controls>.plyr__control:first-child+.plyr__control .plyr__tooltip--visible,.plyr__controls>.plyr__control:first-child+.plyr__control:focus-visible .plyr__tooltip,.plyr__controls>.plyr__control:first-child+.plyr__control:hover .plyr__tooltip,.plyr__controls>.plyr__control:first-child:focus-visible .plyr__tooltip,.plyr__controls>.plyr__control:first-child:hover .plyr__tooltip,.plyr__controls>.plyr__control:last-child .plyr__tooltip--visible,.plyr__controls>.plyr__control:last-child:focus-visible .plyr__tooltip,.plyr__controls>.plyr__control:last-child:hover .plyr__tooltip{transform:translate(0) scale(1)}.plyr__progress{left:6.5px;left:calc(var(--plyr-range-thumb-height, 13px)*.5);margin-right:13px;margin-right:var(--plyr-range-thumb-height,13px);position:relative}.plyr__progress input[type=range],.plyr__progress__buffer{margin-left:-6.5px;margin-left:calc(var(--plyr-range-thumb-height, 13px)*-.5);margin-right:-6.5px;margin-right:calc(var(--plyr-range-thumb-height, 13px)*-.5);width:calc(100% + 13px);width:calc(100% + var(--plyr-range-thumb-height, 13px))}.plyr__progress input[type=range]{position:relative;z-index:2}.plyr__progress .plyr__tooltip{left:0;max-width:120px;overflow-wrap:break-word}.plyr__progress__buffer{-webkit-appearance:none;background:#0000;border:0;border-radius:100px;height:5px;height:var(--plyr-range-track-height,5px);left:0;margin-top:-2.5px;margin-top:calc((var(--plyr-range-track-height, 5px)/2)*-1);padding:0;position:absolute;top:50%}.plyr__progress__buffer::-webkit-progress-bar{background:#0000}.plyr__progress__buffer::-webkit-progress-value{background:currentColor;border-radius:100px;min-width:5px;min-width:var(--plyr-range-track-height,5px);-webkit-transition:width .2s ease;transition:width .2s ease}.plyr__progress__buffer::-moz-progress-bar{background:currentColor;border-radius:100px;min-width:5px;min-width:var(--plyr-range-track-height,5px);-moz-transition:width .2s ease;transition:width .2s ease}.plyr__progress__buffer::-ms-fill{border-radius:100px;-ms-transition:width .2s ease;transition:width .2s ease}.plyr--loading .plyr__progress__buffer{animation:plyr-progress 1s linear infinite;background-image:linear-gradient(-45deg,#23282f99 25%,#0000 0,#0000 50%,#23282f99 0,#23282f99 75%,#0000 0,#0000);background-image:linear-gradient(-45deg,var(--plyr-progress-loading-background,#23282f99) 25%,#0000 25%,#0000 50%,var(--plyr-progress-loading-background,#23282f99) 50%,var(--plyr-progress-loading-background,#23282f99) 75%,#0000 75%,#0000);background-repeat:repeat-x;background-size:25px 25px;background-size:var(--plyr-progress-loading-size,25px) var(--plyr-progress-loading-size,25px);color:#0000}.plyr--video.plyr--loading .plyr__progress__buffer{background-color:#ffffff40;background-color:var(--plyr-video-progress-buffered-background,#ffffff40)}.plyr--audio.plyr--loading .plyr__progress__buffer{background-color:#c1c8d199;background-color:var(--plyr-audio-progress-buffered-background,#c1c8d199)}.plyr__progress__marker{background-color:#fff;background-color:var(--plyr-progress-marker-background,#fff);border-radius:1px;height:5px;height:var(--plyr-range-track-height,5px);position:absolute;top:50%;transform:translate(-50%,-50%);width:3px;width:var(--plyr-progress-marker-width,3px);z-index:3}.plyr__volume{align-items:center;display:flex;position:relative}.plyr__volume input[type=range]{margin-left:5px;margin-left:calc(var(--plyr-control-spacing, 10px)/2);margin-right:5px;margin-right:calc(var(--plyr-control-spacing, 10px)/2);max-width:90px;min-width:60px;position:relative;z-index:2}.plyr--audio{display:block}.plyr--audio .plyr__controls{background:#fff;background:var(--plyr-audio-controls-background,#fff);border-radius:inherit;color:#4a5464;color:var(--plyr-audio-control-color,#4a5464);padding:10px;padding:var(--plyr-control-spacing,10px)}.plyr--audio .plyr__control:focus-visible,.plyr--audio .plyr__control:hover,.plyr--audio .plyr__control[aria-expanded=true]{background:#00b2ff;background:var(--plyr-audio-control-background-hover,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)));color:#fff;color:var(--plyr-audio-control-color-hover,#fff)}.plyr--full-ui.plyr--audio input[type=range]::-webkit-slider-runnable-track{background-color:#c1c8d199;background-color:var(--plyr-audio-range-track-background,var(--plyr-audio-progress-buffered-background,#c1c8d199))}.plyr--full-ui.plyr--audio input[type=range]::-moz-range-track{background-color:#c1c8d199;background-color:var(--plyr-audio-range-track-background,var(--plyr-audio-progress-buffered-background,#c1c8d199))}.plyr--full-ui.plyr--audio input[type=range]::-ms-track{background-color:#c1c8d199;background-color:var(--plyr-audio-range-track-background,var(--plyr-audio-progress-buffered-background,#c1c8d199))}.plyr--full-ui.plyr--audio input[type=range]:active::-webkit-slider-thumb{box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33,0 0 0 3px #23282f1a;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#23282f1a)}.plyr--full-ui.plyr--audio input[type=range]:active::-moz-range-thumb{box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33,0 0 0 3px #23282f1a;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#23282f1a)}.plyr--full-ui.plyr--audio input[type=range]:active::-ms-thumb{box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33,0 0 0 3px #23282f1a;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#23282f1a)}.plyr--audio .plyr__progress__buffer{color:#c1c8d199;color:var(--plyr-audio-progress-buffered-background,#c1c8d199)}.plyr--video{overflow:hidden}.plyr--video.plyr--menu-open{overflow:visible}.plyr__video-wrapper{background:#000;background:var(--plyr-video-background,var(--plyr-video-background,#000));border-radius:inherit;height:100%;margin:auto;overflow:hidden;position:relative;width:100%}.plyr__video-embed,.plyr__video-wrapper--fixed-ratio{aspect-ratio:16/9}@supports not (aspect-ratio:16/9){.plyr__video-embed,.plyr__video-wrapper--fixed-ratio{height:0;padding-bottom:56.25%;position:relative}}.plyr__video-embed iframe,.plyr__video-wrapper--fixed-ratio video{border:0;height:100%;left:0;position:absolute;top:0;width:100%}.plyr--full-ui .plyr__video-embed>.plyr__video-embed__container{padding-bottom:240%;position:relative;transform:translateY(-38.28125%)}.plyr--video .plyr__controls{background:linear-gradient(#0000,#000000bf);background:var(--plyr-video-controls-background,linear-gradient(#0000,#000000bf));border-bottom-left-radius:inherit;border-bottom-right-radius:inherit;bottom:0;color:#fff;color:var(--plyr-video-control-color,#fff);left:0;padding:5px;padding:calc(var(--plyr-control-spacing, 10px)/2);padding-top:20px;padding-top:calc(var(--plyr-control-spacing, 10px)*2);position:absolute;right:0;transition:opacity .4s ease-in-out,transform .4s ease-in-out;z-index:3}@media (min-width:480px){.plyr--video .plyr__controls{padding:10px;padding:var(--plyr-control-spacing,10px);padding-top:35px;padding-top:calc(var(--plyr-control-spacing, 10px)*3.5)}}.plyr--video.plyr--hide-controls .plyr__controls{opacity:0;pointer-events:none;transform:translateY(100%)}.plyr--video .plyr__control:focus-visible,.plyr--video .plyr__control:hover,.plyr--video .plyr__control[aria-expanded=true]{background:#00b2ff;background:var(--plyr-video-control-background-hover,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)));color:#fff;color:var(--plyr-video-control-color-hover,#fff)}.plyr__control--overlaid{background:#00b2ff;background:var(--plyr-video-control-background-hover,var(--plyr-color-main,var(--plyr-color-main,#00b2ff)));border:0;border-radius:100%;color:#fff;color:var(--plyr-video-control-color,#fff);display:none;left:50%;opacity:.9;padding:15px;padding:calc(var(--plyr-control-spacing, 10px)*1.5);position:absolute;top:50%;transform:translate(-50%,-50%);transition:.3s;z-index:2}.plyr__control--overlaid svg{left:2px;position:relative}.plyr__control--overlaid:focus,.plyr__control--overlaid:hover{opacity:1}.plyr--playing .plyr__control--overlaid{opacity:0;visibility:hidden}.plyr--full-ui.plyr--video .plyr__control--overlaid{display:block}.plyr--full-ui.plyr--video input[type=range]::-webkit-slider-runnable-track{background-color:#ffffff40;background-color:var(--plyr-video-range-track-background,var(--plyr-video-progress-buffered-background,#ffffff40))}.plyr--full-ui.plyr--video input[type=range]::-moz-range-track{background-color:#ffffff40;background-color:var(--plyr-video-range-track-background,var(--plyr-video-progress-buffered-background,#ffffff40))}.plyr--full-ui.plyr--video input[type=range]::-ms-track{background-color:#ffffff40;background-color:var(--plyr-video-range-track-background,var(--plyr-video-progress-buffered-background,#ffffff40))}.plyr--full-ui.plyr--video input[type=range]:active::-webkit-slider-thumb{box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33,0 0 0 3px #ffffff80;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#ffffff80)}.plyr--full-ui.plyr--video input[type=range]:active::-moz-range-thumb{box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33,0 0 0 3px #ffffff80;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#ffffff80)}.plyr--full-ui.plyr--video input[type=range]:active::-ms-thumb{box-shadow:0 1px 1px #23282f26,0 0 0 1px #23282f33,0 0 0 3px #ffffff80;box-shadow:var(--plyr-range-thumb-shadow,0 1px 1px #23282f26,0 0 0 1px #23282f33),0 0 0 var(--plyr-range-thumb-active-shadow-width,3px) var(--plyr-audio-range-thumb-active-shadow-color,#ffffff80)}.plyr--video .plyr__progress__buffer{color:#ffffff40;color:var(--plyr-video-progress-buffered-background,#ffffff40)}.plyr:fullscreen{background:#000;border-radius:0!important;height:100%;margin:0;width:100%}.plyr:fullscreen video{height:100%}.plyr:fullscreen .plyr__control .icon--exit-fullscreen{display:block}.plyr:fullscreen .plyr__control .icon--exit-fullscreen+svg{display:none}.plyr:fullscreen.plyr--hide-controls{cursor:none}@media (min-width:1024px){.plyr:fullscreen .plyr__captions{font-size:21px;font-size:var(--plyr-font-size-xlarge,21px)}}.plyr--fullscreen-fallback{background:#000;border-radius:0!important;bottom:0;height:100%;left:0;margin:0;position:fixed;right:0;top:0;width:100%;z-index:10000000}.plyr--fullscreen-fallback video{height:100%}.plyr--fullscreen-fallback .plyr__control .icon--exit-fullscreen{display:block}.plyr--fullscreen-fallback .plyr__control .icon--exit-fullscreen+svg{display:none}.plyr--fullscreen-fallback.plyr--hide-controls{cursor:none}@media (min-width:1024px){.plyr--fullscreen-fallback .plyr__captions{font-size:21px;font-size:var(--plyr-font-size-xlarge,21px)}}.plyr__ads{border-radius:inherit;bottom:0;cursor:pointer;left:0;overflow:hidden;position:absolute;right:0;top:0;z-index:-1}.plyr__ads>div,.plyr__ads>div iframe{height:100%;position:absolute;width:100%}.plyr__ads:after{background:#23282f;border-radius:2px;bottom:10px;bottom:var(--plyr-control-spacing,10px);color:#fff;content:attr(data-badge-text);font-size:11px;padding:2px 6px;pointer-events:none;position:absolute;right:10px;right:var(--plyr-control-spacing,10px);z-index:3}.plyr__ads:empty:after{display:none}.plyr__cues{background:currentColor;display:block;height:5px;height:var(--plyr-range-track-height,5px);left:0;opacity:.8;position:absolute;top:50%;transform:translateY(-50%);width:3px;z-index:3}.plyr__preview-thumb{background-color:#fff;background-color:var(--plyr-tooltip-background,#fff);border-radius:8px;border-radius:var(--plyr-menu-radius,8px);bottom:100%;box-shadow:0 1px 2px #00000026;box-shadow:var(--plyr-tooltip-shadow,0 1px 2px #00000026);margin-bottom:10px;margin-bottom:calc(var(--plyr-control-spacing, 10px)/2*2);opacity:0;padding:3px;pointer-events:none;position:absolute;transform:translateY(10px) scale(.8);transform-origin:50% 100%;transition:transform .2s ease .1s,opacity .2s ease .1s;z-index:2}.plyr__preview-thumb--is-shown{opacity:1;transform:translate(0) scale(1)}.plyr__preview-thumb:before{border-left:4px solid #0000;border-left:var(--plyr-tooltip-arrow-size,4px) solid #0000;border-right:4px solid #0000;border-right:var(--plyr-tooltip-arrow-size,4px) solid #0000;border-top:4px solid #fff;border-top:var(--plyr-tooltip-arrow-size,4px) solid var(--plyr-tooltip-background,#fff);bottom:-4px;bottom:calc(var(--plyr-tooltip-arrow-size, 4px)*-1);content:"";height:0;left:calc(50% + var(--preview-arrow-offset));position:absolute;transform:translateX(-50%);width:0;z-index:2}.plyr__preview-thumb__image-container{background:#c1c8d1;border-radius:7px;border-radius:calc(var(--plyr-menu-radius, 8px) - 1px);overflow:hidden;position:relative;z-index:0}.plyr__preview-thumb__image-container img,.plyr__preview-thumb__image-container:after{height:100%;left:0;position:absolute;top:0;width:100%}.plyr__preview-thumb__image-container:after{border-radius:inherit;box-shadow:inset 0 0 0 1px #00000026;content:"";pointer-events:none}.plyr__preview-thumb__image-container img{max-height:none;max-width:none}.plyr__preview-thumb__time-container{background:linear-gradient(#0000,#000000bf);background:var(--plyr-video-controls-background,linear-gradient(#0000,#000000bf));border-bottom-left-radius:7px;border-bottom-left-radius:calc(var(--plyr-menu-radius, 8px) - 1px);border-bottom-right-radius:7px;border-bottom-right-radius:calc(var(--plyr-menu-radius, 8px) - 1px);bottom:0;left:0;line-height:1.1;padding:20px 6px 6px;position:absolute;right:0;z-index:3}.plyr__preview-thumb__time-container span{color:#fff;font-size:13px;font-size:var(--plyr-font-size-time,var(--plyr-font-size-small,13px))}.plyr__preview-scrubbing{bottom:0;filter:blur(1px);height:100%;left:0;margin:auto;opacity:0;overflow:hidden;pointer-events:none;position:absolute;right:0;top:0;transition:opacity .3s ease;width:100%;z-index:1}.plyr__preview-scrubbing--is-shown{opacity:1}.plyr__preview-scrubbing img{height:100%;left:0;max-height:none;max-width:none;object-fit:contain;position:absolute;top:0;width:100%}.plyr--no-transition{transition:none!important}.plyr__sr-only{clip:rect(1px,1px,1px,1px);border:0!important;height:1px!important;overflow:hidden;padding:0!important;position:absolute!important;width:1px!important}.plyr [hidden]{display:none!important}</style>`);
                            document.body.insertAdjacentHTML("beforeend", `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><symbol id="plyr-airplay" viewBox="0 0 18 18"><path d="M16 1H2a1 1 0 00-1 1v10a1 1 0 001 1h3v-2H3V3h12v8h-2v2h3a1 1 0 001-1V2a1 1 0 00-1-1z"/><path d="M4 17h10l-5-6z"/></symbol><symbol id="plyr-captions-off" viewBox="0 0 18 18"><path d="M1 1c-.6 0-1 .4-1 1v11c0 .6.4 1 1 1h4.6l2.7 2.7c.2.2.4.3.7.3.3 0 .5-.1.7-.3l2.7-2.7H17c.6 0 1-.4 1-1V2c0-.6-.4-1-1-1H1zm4.52 10.15c1.99 0 3.01-1.32 3.28-2.41l-1.29-.39c-.19.66-.78 1.45-1.99 1.45-1.14 0-2.2-.83-2.2-2.34 0-1.61 1.12-2.37 2.18-2.37 1.23 0 1.78.75 1.95 1.43l1.3-.41C8.47 4.96 7.46 3.76 5.5 3.76c-1.9 0-3.61 1.44-3.61 3.7 0 2.26 1.65 3.69 3.63 3.69zm7.57 0c1.99 0 3.01-1.32 3.28-2.41l-1.29-.39c-.19.66-.78 1.45-1.99 1.45-1.14 0-2.2-.83-2.2-2.34 0-1.61 1.12-2.37 2.18-2.37 1.23 0 1.78.75 1.95 1.43l1.3-.41c-.28-1.15-1.29-2.35-3.25-2.35-1.9 0-3.61 1.44-3.61 3.7 0 2.26 1.65 3.69 3.63 3.69z" fill-rule="evenodd" fill-opacity=".5"/></symbol><symbol id="plyr-captions-on" viewBox="0 0 18 18"><path d="M1 1c-.6 0-1 .4-1 1v11c0 .6.4 1 1 1h4.6l2.7 2.7c.2.2.4.3.7.3.3 0 .5-.1.7-.3l2.7-2.7H17c.6 0 1-.4 1-1V2c0-.6-.4-1-1-1H1zm4.52 10.15c1.99 0 3.01-1.32 3.28-2.41l-1.29-.39c-.19.66-.78 1.45-1.99 1.45-1.14 0-2.2-.83-2.2-2.34 0-1.61 1.12-2.37 2.18-2.37 1.23 0 1.78.75 1.95 1.43l1.3-.41C8.47 4.96 7.46 3.76 5.5 3.76c-1.9 0-3.61 1.44-3.61 3.7 0 2.26 1.65 3.69 3.63 3.69zm7.57 0c1.99 0 3.01-1.32 3.28-2.41l-1.29-.39c-.19.66-.78 1.45-1.99 1.45-1.14 0-2.2-.83-2.2-2.34 0-1.61 1.12-2.37 2.18-2.37 1.23 0 1.78.75 1.95 1.43l1.3-.41c-.28-1.15-1.29-2.35-3.25-2.35-1.9 0-3.61 1.44-3.61 3.7 0 2.26 1.65 3.69 3.63 3.69z" fill-rule="evenodd"/></symbol><symbol id="plyr-download" viewBox="0 0 18 18"><path d="M9 13c.3 0 .5-.1.7-.3L15.4 7 14 5.6l-4 4V1H8v8.6l-4-4L2.6 7l5.7 5.7c.2.2.4.3.7.3zm-7 2h14v2H2z"/></symbol><symbol id="plyr-enter-fullscreen" viewBox="0 0 18 18"><path d="M10 3h3.6l-4 4L11 8.4l4-4V8h2V1h-7zM7 9.6l-4 4V10H1v7h7v-2H4.4l4-4z"/></symbol><symbol id="plyr-exit-fullscreen" viewBox="0 0 18 18"><path d="M1 12h3.6l-4 4L2 17.4l4-4V17h2v-7H1zM16 .6l-4 4V1h-2v7h7V6h-3.6l4-4z"/></symbol><symbol id="plyr-fast-forward" viewBox="0 0 18 18"><path d="M7.875 7.171L0 1v16l7.875-6.171V17L18 9 7.875 1z"/></symbol><symbol id="plyr-logo-vimeo" viewBox="0 0 18 18"><path d="M17 5.3c-.1 1.6-1.2 3.7-3.3 6.4-2.2 2.8-4 4.2-5.5 4.2-.9 0-1.7-.9-2.4-2.6C5 10.9 4.4 6 3 6c-.1 0-.5.3-1.2.8l-.8-1c.8-.7 3.5-3.4 4.7-3.5 1.2-.1 2 .7 2.3 2.5.3 2 .8 6.1 1.8 6.1.9 0 2.5-3.4 2.6-4 .1-.9-.3-1.9-2.3-1.1.8-2.6 2.3-3.8 4.5-3.8 1.7.1 2.5 1.2 2.4 3.3z"/></symbol><symbol id="plyr-logo-youtube" viewBox="0 0 18 18"><path d="M16.8 5.8c-.2-1.3-.8-2.2-2.2-2.4C12.4 3 9 3 9 3s-3.4 0-5.6.4C2 3.6 1.3 4.5 1.2 5.8 1 7.1 1 9 1 9s0 1.9.2 3.2c.2 1.3.8 2.2 2.2 2.4C5.6 15 9 15 9 15s3.4 0 5.6-.4c1.4-.3 2-1.1 2.2-2.4.2-1.3.2-3.2.2-3.2s0-1.9-.2-3.2zM7 12V6l5 3-5 3z"/></symbol><symbol id="plyr-muted" viewBox="0 0 18 18"><path d="M12.4 12.5l2.1-2.1 2.1 2.1 1.4-1.4L15.9 9 18 6.9l-1.4-1.4-2.1 2.1-2.1-2.1L11 6.9 13.1 9 11 11.1zM3.786 6.008H.714C.286 6.008 0 6.31 0 6.76v4.512c0 .452.286.752.714.752h3.072l4.071 3.858c.5.3 1.143 0 1.143-.602V2.752c0-.601-.643-.977-1.143-.601L3.786 6.008z"/></symbol><symbol id="plyr-pause" viewBox="0 0 18 18"><path d="M6 1H3c-.6 0-1 .4-1 1v14c0 .6.4 1 1 1h3c.6 0 1-.4 1-1V2c0-.6-.4-1-1-1zm6 0c-.6 0-1 .4-1 1v14c0 .6.4 1 1 1h3c.6 0 1-.4 1-1V2c0-.6-.4-1-1-1h-3z"/></symbol><symbol id="plyr-pip" viewBox="0 0 18 18"><path d="M13.293 3.293L7.022 9.564l1.414 1.414 6.271-6.271L17 7V1h-6z"/><path d="M13 15H3V5h5V3H2a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1v-6h-2v5z"/></symbol><symbol id="plyr-play" viewBox="0 0 18 18"><path d="M15.562 8.1L3.87.225c-.818-.562-1.87 0-1.87.9v15.75c0 .9 1.052 1.462 1.87.9L15.563 9.9c.584-.45.584-1.35 0-1.8z"/></symbol><symbol id="plyr-restart" viewBox="0 0 18 18"><path d="M9.7 1.2l.7 6.4 2.1-2.1c1.9 1.9 1.9 5.1 0 7-.9 1-2.2 1.5-3.5 1.5-1.3 0-2.6-.5-3.5-1.5-1.9-1.9-1.9-5.1 0-7 .6-.6 1.4-1.1 2.3-1.3l-.6-1.9C6 2.6 4.9 3.2 4 4.1 1.3 6.8 1.3 11.2 4 14c1.3 1.3 3.1 2 4.9 2 1.9 0 3.6-.7 4.9-2 2.7-2.7 2.7-7.1 0-9.9L16 1.9l-6.3-.7z"/></symbol><symbol id="plyr-rewind" viewBox="0 0 18 18"><path d="M10.125 1L0 9l10.125 8v-6.171L18 17V1l-7.875 6.171z"/></symbol><symbol id="plyr-settings" viewBox="0 0 18 18"><path d="M16.135 7.784a2 2 0 01-1.23-2.969c.322-.536.225-.998-.094-1.316l-.31-.31c-.318-.318-.78-.415-1.316-.094a2 2 0 01-2.969-1.23C10.065 1.258 9.669 1 9.219 1h-.438c-.45 0-.845.258-.997.865a2 2 0 01-2.969 1.23c-.536-.322-.999-.225-1.317.093l-.31.31c-.318.318-.415.781-.093 1.317a2 2 0 01-1.23 2.969C1.26 7.935 1 8.33 1 8.781v.438c0 .45.258.845.865.997a2 2 0 011.23 2.969c-.322.536-.225.998.094 1.316l.31.31c.319.319.782.415 1.316.094a2 2 0 012.969 1.23c.151.607.547.865.997.865h.438c.45 0 .845-.258.997-.865a2 2 0 012.969-1.23c.535.321.997.225 1.316-.094l.31-.31c.318-.318.415-.781.094-1.316a2 2 0 011.23-2.969c.607-.151.865-.547.865-.997v-.438c0-.451-.26-.846-.865-.997zM9 12a3 3 0 110-6 3 3 0 010 6z"/></symbol><symbol id="plyr-volume" viewBox="0 0 18 18"><path d="M15.6 3.3c-.4-.4-1-.4-1.4 0-.4.4-.4 1 0 1.4C15.4 5.9 16 7.4 16 9c0 1.6-.6 3.1-1.8 4.3-.4.4-.4 1 0 1.4.2.2.5.3.7.3.3 0 .5-.1.7-.3C17.1 13.2 18 11.2 18 9s-.9-4.2-2.4-5.7z"/><path d="M11.282 5.282a.909.909 0 000 1.316c.735.735.995 1.458.995 2.402 0 .936-.425 1.917-.995 2.487a.909.909 0 000 1.316c.145.145.636.262 1.018.156a.725.725 0 00.298-.156C13.773 11.733 14.13 10.16 14.13 9c0-.17-.002-.34-.011-.51-.053-.992-.319-2.005-1.522-3.208a.909.909 0 00-1.316 0zm-7.496.726H.714C.286 6.008 0 6.31 0 6.76v4.512c0 .452.286.752.714.752h3.072l4.071 3.858c.5.3 1.143 0 1.143-.602V2.752c0-.601-.643-.977-1.143-.601L3.786 6.008z"/></symbol></svg>`);
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
                iconUrl: "https://cdn.plyr.io/3.6.8/plyr.svg",
                blankVideo: "https://cdn.plyr.io/static/blank.mp4",
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
            // Add the shortcuts to the plyr
            addShortcutsToPlyr();
        }

        /**
         * Function to skip forwards in the video
         * @param {number} seconds The number of seconds to skip
         */
        function goForwards(seconds) {
            const video = document.querySelector("video");
            video.currentTime = video.currentTime + seconds;
        }

        /**
         * Function to skip backwards in the video
         * @param {number} seconds The number of seconds to skip
         */
        function goBackwards(seconds) {
            const video = document.querySelector("video");
            video.currentTime = video.currentTime - seconds;
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
                    if (settings.autoplay.enabled) document.querySelector("video").play(); // Play the video if the autoplay is enabled in the settings
                    if (settings.autoNextEpisode.enabled) setAutoNextEpisode(); // Set the auto next episode if it is enabled in the settings
                    clearInterval(interval);
                    console.log("[MATweaks] [Mega.nz] Plyr found, fixing it");
                } else {
                    console.log("[MATweaks] [Mega.nz] Plyr not found");
                }
            }, 10);
        }

        /**
         * Function to set the auto next episode
         */
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

        /**
         * Event listener to listen for messages from the parent window
         */
        window.addEventListener("message", (event) => {
            if (event.data.plugin === "MATweaks") {
                // Handle the messages from the parent window
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

        /**
         * Function to add the shortcuts to the plyr player
         */
        function addShortcutsToPlyr() {
            document.addEventListener("keydown", (event) => {
                event.preventDefault();
                console.log(event);
                if (settings.forwardSkip.enabled && event.ctrlKey === settings.forwardSkip.ctrlKey && event.altKey === settings.forwardSkip.altKey && event.shiftKey === settings.forwardSkip.shiftKey && event.key === settings.forwardSkip.key) {
                    goForwards(settings.forwardSkip.duration);
                } else if (settings.backwardSkip.enabled && event.ctrlKey === settings.backwardSkip.ctrlKey && event.altKey === settings.backwardSkip.altKey && event.shiftKey === settings.backwardSkip.shiftKey && event.key === settings.backwardSkip.key) {
                    goBackwards(settings.backwardSkip.duration);
                }
            });
            document.addEventListener("keyup", (event) => {
                if (settings.nextEpisode.enabled && event.ctrlKey === settings.nextEpisode.ctrlKey && event.altKey === settings.nextEpisode.altKey && event.shiftKey === settings.nextEpisode.shiftKey && event.key === settings.nextEpisode.key) {
                    window.parent.postMessage({plugin: "MATweaks", type: "nextEpisodeForce"}, "*");
                } else if (settings.previousEpisode.enabled && event.ctrlKey === settings.previousEpisode.ctrlKey && event.altKey === settings.previousEpisode.altKey && event.shiftKey === settings.previousEpisode.shiftKey && event.key === settings.previousEpisode.key) {
                    window.parent.postMessage({plugin: "MATweaks", type: "previousEpisode"}, "*");
                }
            });
        }

        // Initialize the mega.nz part of the extension
        initMega();
    }
})();
