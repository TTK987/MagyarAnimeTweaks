import {MAT, logger, bookmarks, MA, popup} from "./API";

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
        this.isMega = false;
        this.IframeUrl = ""
        this.qualityData = [];
        this.plyr = undefined;
        this.isReplaced = false;
    }

    /**
     * Replace the player with the given player type
     * @param {string} playerType - The source URL of the player
     * @since v0.1.7
     * @since v0.1.8 - Dropped HTML5 player support and added Event dispatchers
     */
    replacePlayer(playerType) {
        const playerActions = {
            "default": () => this.replaceWithDefaultPlayer(),
            "plyr": () => this.replaceWithPlyrPlayer()
        };
        try {
            playerActions[playerType]();
        } catch (error) {
            logger.error("Invalid player type specified.");
            this.showErrorMessage("Érvénytelen lejátszó típus.");
            window.dispatchEvent(new Event("MATweaksPlayerReplaceFailed"));
        }
    }

    /**
     * Replace the player with the default player (Indavideo / Mega Iframe)
     */
    replaceWithDefaultPlayer() {
        let playerElement = document.querySelector(this.selector) || document.querySelector("video");
        if (playerElement) {
            if (playerElement.src === this.IframeUrl && !this.isMega) {
                logger.warn("Player is already the default player.");
                return;
            }
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
     * Replace the player with the Plyr player
     * @since v0.1.7
     */
    replaceWithPlyrPlayer() {
        try {
            if (this.isMega) {
                this.replaceWithDefaultPlayer();
                return;
            }
            if (typeof Plyr == "undefined") {
                logger.error("Plyr player not loaded.");
                return;
            }
            if (this.qualityData.length === 0) {
                logger.error("Invalid source URL.");
                this.showErrorMessage("Nem sikerült betölteni a videót. (Hibás videó URL)<br>Töltsd újra az oldalt.");
                return;
            }

            let playerElement = document.querySelector(this.selector);
            let videoElement = this.createVideoElement();
            replaceWith(playerElement, videoElement);
            this.setupPlyr(videoElement);
            this.setupDownload();
            this.selector = ".plyr";
            loadCustomCss();
            logger.log("Replaced with Plyr player.");
            window.dispatchEvent(new Event("MATweaksPlayerReplaced"));
        } catch (e) {
            logger.error("Error while replacing with Plyr player. Error: " + e);
            this.showErrorMessage("Hiba történt a videó lejátszása közben. <br>További információk a konzolban.");
            window.dispatchEvent(new Event("MATweaksPlayerReplaceFailed"));
        }
    }

    /**
     * Create a video element with the highest quality source
     * @returns {HTMLVideoElement} The video element
     */
    createVideoElement() {
        let videoElement = document.createElement("video");
        videoElement.id = "video";
        if (settings.autoplay.enabled) videoElement.setAttribute("autoplay", "autoplay");
        videoElement.src = this.getHighestQualitySource().url;
        videoElement.type = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
        videoElement.setAttribute("playsinline", "");
        videoElement.controls = true;
        videoElement.preload = "metadata";
        this.qualityData.forEach(data => {
            let source = document.createElement("source");
            source.src = data.url;
            source.type = videoElement.type;
            videoElement.appendChild(source);
        });
        this.setupAutoNextEpisode(videoElement);
        return videoElement;
    }

    /**
     * Set up the auto next episode feature
     * @param {HTMLVideoElement} videoElement - The video element to set up the auto next episode feature
     */
    setupAutoNextEpisode(videoElement) {
        if (!settings.autoNextEpisode.enabled) return;
        settings.autoNextEpisode.time = Math.max(settings.autoNextEpisode.time, 0);
        let autoNextEpisodeTriggered = false;
        videoElement.addEventListener("timeupdate", () => {
            if ((this.plyr.duration - this.plyr.currentTime) <= settings.autoNextEpisode.time && !autoNextEpisodeTriggered && this.plyr.currentTime !== 0 && this.plyr.duration !== 0) {
                logger.log("Auto next episode triggered.");
                popup.showSuccessPopup("Következő rész betöltése...");
                autoNextEpisode();
                autoNextEpisodeTriggered = true;
            }
        });
        videoElement.addEventListener("ended", () => {
            if (!autoNextEpisodeTriggered && this.plyr.currentTime !== 0 && this.plyr.duration !== 0) {
                logger.log("Auto next episode triggered.");
                popup.showSuccessPopup("Következő rész betöltése...");
                autoNextEpisode();
                autoNextEpisodeTriggered = true;
            }
        });
    }

    /**
     * Returns the highest quality source
     * @returns {{quality: number, url: string}} The highest quality source
     */
    getHighestQualitySource() {
        return this.qualityData.find(data => data.quality === this.qualityData.map(data => data.quality).sort((a, b) => b - a)[0]);
    }

    /**
     * Set up the Plyr player
     * @param {HTMLVideoElement} videoElement - The video element to set up the Plyr player
     */
    setupPlyr(videoElement) {
        if (this.plyr) this.plyr.destroy();
        this.plyr = new Plyr(videoElement, {
            controls: ["play-large", "play", "progress", "current-time", "mute", "volume", "settings", "pip", "airplay", "download", "fullscreen"],
            keyboard: {focused: true, global: true},
            settings: ["quality", "speed"],
            tooltips: {controls: true, seek: true},
            i18n: this.getPlyrI18n(),
            quality: {
                default: this.getHighestQualitySource().quality,
                options: this.qualityData.map(data => data.quality).sort((a, b) => b - a),
                forced: true,
                onChange: quality => this.changeQuality(quality, videoElement)
            },
            speed: {selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]},
            markers: {
                enabled: true,
                points: this.getBookmarks(),
            }
        });
        this.addShortcutsToPlayer(videoElement);
        this.fixPlyr();
    }

    /**
     * Fix the Plyr player
     * Since: v0.1.8
     */
    fixPlyr() {
        const videoPlayer = document.querySelector(".plyr");
        videoPlayer.addEventListener("focus", function () {
            videoPlayer.blur();
        });
        videoPlayer.querySelectorAll("*").forEach((element) => {
            element.addEventListener("focus", function () {
                element.blur();
            });
        });
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

    /**
     * Change the quality of the video
     * @param {number} quality - The quality to change to
     * @param {HTMLVideoElement} videoElement - The video element to change the quality of
     */
    changeQuality(quality, videoElement) {
        let currentTime = videoElement.currentTime;
        videoElement.src = this.qualityData.find(data => data.quality === quality).url;
        videoElement.currentTime = currentTime;
    }

    /**
     * Set up the download button
     * Since: v0.1.8
     */
    setupDownload() {
        let downloadButton = document.querySelector("div.plyr__controls > a");
        let cooldown = false;
        downloadButton.addEventListener("click", event => {
            event.preventDefault();
            if (cooldown) {
                popup.showErrorPopup("Kérlek várj egy kicsit, mielőtt újra letöltenéd a videót.");
                return;
            }
            let filename = renderFileName(settings.advanced.downloadName) + ".mp4";
            downloadFile(filename).then(() => {
                popup.showSuccessPopup("A videó letöltése elkezdődött.");
                logger.log("Download started.");
            });
            cooldown = true;
            setTimeout(() => cooldown = false, 2000);
        });
    }

    /**
     * Add shortcuts to the player
     * @param {HTMLVideoElement} player - The player element
     */
    addShortcutsToPlayer(player) {
        window.addEventListener("keydown", (event) => {
            if (settings.forwardSkip.enabled && checkShortcut(event, settings.forwardSkip.keyBind) && !settingsUI.isOpened) {
                event.preventDefault();
                event.stopPropagation();
                this.skipForward(player)
            } else if (settings.backwardSkip.enabled && checkShortcut(event, settings.backwardSkip.keyBind) && !settingsUI.isOpened) {
                event.preventDefault();
                event.stopPropagation();
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
        logger.error("Error while playing video. Message: " + message);
        let error = document.createElement("p");
        error.setAttribute("class", "MATweaks-error");
        error.innerHTML = "[MATweaks] Hiba történt a videó lejátszása közben.<br>" + message + "<br>Ha a hiba továbbra is fennáll, kérlek jelentsd a hibát <a href='https://discord.gg/dJX4tVGZhY' target='_blank'>Discordon</a> vagy a <a href='https://github.com/TTK987/MagyarAnimeTweaks/issues' target='_blank'>GitHubon</a>" +
            "<br>Ne a MagyarAnime-nek jelezd a hibát, mert ők nem tudnak segíteni!<br>Ne a \"Hibabejelentés\" gombot használd, mert azzal csak a MagyarAnime-nek küldesz hibajelzést, nem nekem.";
        error.style.color = "red";
        error.style.fontSize = "x-large";
        let iframe = document.querySelector(this.selector);
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

    getBookmarks() {
        let bmks = [];
        bookmarks.getBookmarks().forEach(bm => {
            if (bm.episodeId !== MA.EPISODE.getId()) return
            bmks.push({
                time: bm.time,
                label: bm.title,
            });
        });
        return bmks;
    }
}

/**
 * Player object to handle the player
 * @type {Player}
 */
let player = new Player();

/**
 * Class to handle the settings popup
 */
class Settings {

    /**
     * Create a Settings instance
     * @constructor
     * @since v0.1.8
     */
    constructor() {
        this.localSettings = settings;
        this.settingsWindow = document.createElement("div");
        this.settingsWindow.setAttribute("id", "MATweaks-settings-window");
        this.settingsWindow.setAttribute("class", "MA-Tweaks-settings-popup");
        this.settingsItems = []; // [{title, id}, ...]
        this.isOpened = false;
    }

    /**
     * Function to show the settings window
     * @since v0.1.8
     */
    show() {
        if (this.isOpened) return;
        loadSettings();
        this.localSettings = settings;
        this._createSettingsWindow();
        document.body.appendChild(this.settingsWindow);
        this.settingsItems.forEach(item => this._addEventListenerToItem(item.id));
        this._addEventListener();
        this.isOpened = true;
        this._handleEAP();
    }

    hide() {
        if (!this.isOpened) return;
        document.querySelector("#MATweaks-settings-window").remove();
        this.isOpened = false;
        logger.log("Settings UI closed.");
    }

    /**
     * Function to add a settings item
     * @param {String} title The title of the settings item
     * @param {String} id The id of the settings item
     * @since v0.1.8
     */
    addSettingsItem(title, id) {
        this.settingsItems.push({title, id});
    }

    /**
     * Function to create the settings window
     * @since v0.1.8
     * @private
     */
    _createSettingsWindow() {
        this.settingsWindow.innerHTML = `
        <div class="MA-Tweaks-settings-popup-content">
            <div class="MATweaks-settings-window-header">
                <span class="MATweaks-settings-window-close">&times;</span>
                <h2>MATweaks beállítások</h2>
            </div>
            <div class="MATweaks-settings-window-body">
                <div class="MATweaks-settings-window-body-content">
                    <div class="MA-Tweaks-settings-popup-body-content-features">
                        ${this.settingsItems.map(item => this._generateSettingsItem(item.title, item.id)).join("")}
                        <div class="MATweaks-settings-window-body-content-item">
                            <p>További beállítások</p>
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
                        <p>Verzió: ${MAT.getVersion()} <span class="eap">EAP</span> </p>
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
    }

    /**
     * Function to generate a settings item
     * @param {String} title The title of the settings item
     * @param {String} id The id of the settings item
     * @returns {String} The generated settings item
     * @since v0.1.8
     * @private
     */
    _generateSettingsItem(title, id) {
        return `
        <div class="MATweaks-settings-window-body-content-item" id="MATweaks-${id}">
            <p>${title}</p>
            <div class="MATweaks-settings-window-body-content-item-feature" id="MATweaks-${id}-checkbox">
                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-${id}-enabled">Engedélyezve</label>
                <input class="MATweaks-settings-window-body-content-item-feature-checkbox" type="checkbox" id="MATweaks-${id}-enabled" name="MATweaks-${id}-enabled" ${this.localSettings[id].enabled ? "checked" : ""}>
                <span class="MATweaks-settings-window-body-content-item-feature-checkbox-custom" id="MATweaks-${id}-enabled-custom"></span>
            </div>
            ${this.localSettings[id].time  ? ` <div class="MATweaks-settings-window-body-content-item-feature">
                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-${id}-duration">Időtartam</label>
                <input class="MATweaks-settings-window-body-content-item-feature-input" type="number" id="MATweaks-${id}-duration" name="MATweaks-${id}-duration" value="${this.localSettings[id].time}">
            </div>` : ""}
            ${this.localSettings[id].keyBind ? `<div class="MATweaks-settings-window-body-content-item-feature">
                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-${id}-key">Gomb</label>
                <input class="MATweaks-settings-window-body-content-item-feature-input" type="text" id="MATweaks-${id}-key" name="MATweaks-${id}-key" value="${this._genSCText(this.localSettings[id].keyBind)}">
            </div>` : ""}
        </div>
        `;
    }

    /**
     * Function to add an event listener to one of the settings items
     * @param {String} id The id of the settings item
     * @since v0.1.8
     * @private
     */
    _addEventListenerToItem(id) {
        let item = document.querySelector(`#MATweaks-${id}`);
        let checkbox = item.querySelector(`#MATweaks-${id}-checkbox`);
        let duration = item.querySelector(`#MATweaks-${id}-duration`);
        let key = item.querySelector(`#MATweaks-${id}-key`);
        checkbox.addEventListener("click", () => {
            let ch = item.querySelector(`#MATweaks-${id}-enabled`);
            ch.checked = !ch.checked;
            this.localSettings[id].enabled = ch.checked;
            logger.log(`${id} enabled state changed to ${ch.checked}.`);
        });
        if (duration) {
            duration.addEventListener("change", () => {
                this.localSettings[id].time = duration.value;
                logger.log(`${id} duration changed to ${duration.value}.`);
            });
        }
        if (key) {
            key.addEventListener("keydown", (event) => {
                event.preventDefault();
                this._setShortcut(this.localSettings[id].keyBind, event);
                this._setText(this.localSettings[id].keyBind, key);
                logger.log(`${id} key changed to ${this._genSCText(this.localSettings[id].keyBind)}.`);
            });
        }
    }

    /**
     * Function to add event listeners to the settings window
     * @since v0.1.8
     * @private
     */
    _addEventListener() {
        try {
            document.querySelector(".MATweaks-settings-window-close").addEventListener("click", this._closeNoSave.bind(this));
            document.querySelector("#MATweaks-settings-window-body-content-buttons-button-cancel").addEventListener("click", this._closeNoSave.bind(this));
            document.querySelector("#MATweaks-settings-window-body-content-buttons-button-save").addEventListener("click", this._closeSave.bind(this));
            document.querySelector(".MATweaks-settings-window-body-content-item-feature-button").addEventListener("click", () => {
                this._closeNoSave();
                chrome.runtime.sendMessage({plugin: "MATweaks", type: "openSettings"})
                    .then(() => logger.log("Opened the settings window."))
                    .catch(error => logger.error(`Error while opening the settings window: ${error}`));
            });
        } catch (error) {
            logger.error(`Error while adding event listeners to the settings window: ${error}`);
        }
    }

    /**
     * Function to set the shortcut
     * @param {Object} x - The shortcut object
     * @param {KeyboardEvent} e - The keyboard event
     * @since v0.1.8
     * @private
     */
    _setShortcut(x, e) {
        x.ctrlKey = e.ctrlKey;
        x.altKey = e.altKey;
        x.shiftKey = e.shiftKey;
        x.key = e.key;
    }

    /**
     * Function to set the text of the shortcut
     * @param {Object} data - The shortcut object
     * @param {HTMLInputElement} input - The input element
     * @since v0.1.8
     * @private
     */
    _setText(data, input) {
        input.value = this._genSCText(data);
    }

    /**
     * Function to generate the shortcut text
     * @param {Object} data - The shortcut object
     * @returns {string} The generated shortcut text
     * @since v0.1.8
     * @private
     */
    _genSCText(data) {
        return `${data.altKey ? 'Alt + ' : ''}${data.ctrlKey ? 'Ctrl + ' : ''}${data.shiftKey ? 'Shift + ' : ''}${data.key}`;
    }

    /**
     * Function to handle the EAP version
     * @since v0.1.8
     * @private
     */
    _handleEAP() {
        if (MAT.isEAP()) {
            logger.log("EAP version detected.");
            document.querySelectorAll(".eap").forEach(element => element.style.display = "block");
        }
    }

    /**
     * Function to close the settings window without saving
     * @since v0.1.8
     * @private
     */
    _closeNoSave() {
        this.localSettings = settings;
        this.hide();
        popup.showInfoPopup("Beállítások nem lettek mentve.");
    }

    /**
     * Function to close the settings window and save the settings
     * @since v0.1.8
     * @private
     */
    _closeSave() {
        saveSettings(this.localSettings);
        loadSettings();
        this.localSettings = settings;
        this.hide();
        popup.showSuccessPopup("Beállítások mentve.");
    }

}

/**
 * Settings object to handle the settings UI
 * @since v0.1.8
 * @type {Settings}
 */
let settingsUI = new Settings();

/**
 * Helper function to replace an element with a new element
 * @param {HTMLElement} element - The element to replace
 * @param {HTMLElement} newElement - The new element to replace the old element with
 */
// ---------------------------- Helper Functions ----------------------------
function replaceWith(element, newElement) {
    element.parentNode.replaceChild(newElement, element);
}

/**
 * A shortcut to check if the advanced settings are enabled
 * @returns {boolean} Returns true if the advanced settings are enabled, otherwise false
 * @since v0.1.7
 */
function checkAdvancedSettings() {
    return settings.advanced.enabled;
}

/**
 * Function to determine whether the user is an admin
 *
 * UNUSED
 * @returns {boolean} Returns true if the user is an admin, otherwise false

function checkAdmin() {
    let adminbtn = document.querySelector(".gen-account-menu li a")
    return adminbtn && adminbtn.textContent.includes("Admin") &&
        adminbtn.querySelector("i").classList.contains("fa-crown") &&
        !document.querySelector(".gen-account-menu li a[href='felhasznalo/torles']");

}
*/

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
    return template
        .replace(/%title%/g, MA.EPISODE.getTitle())
        .replace(/%episode%/g, MA.EPISODE.getEpisodeNumber().toString())
        .replace(/%0episode%/g, MA.EPISODE.getEpisodeNumber().toString().padStart(2, "0"))
        .replace(/%MAT%/g, "MATweaks")
        .replace(/%source%/g, getSourceFromUrl(player.IframeUrl) || "Ismeretlen")
        .replace(/%quality%/g, player.quality + "p")
        .replace(/%fansub%/g, MA.EPISODE.getFansub().name || "Ismeretlen")
        .replace(/[/\\?%*:|"<>]/g, '-');
}

/**
 * Function to check if the shortcut is pressed
 * @param {KeyboardEvent} event The keyboard event
 * @param {Object} shortcut The relevant part of the settings
 * @returns {boolean} Returns true if the shortcut is pressed, otherwise false
 */
function checkShortcut(event, shortcut) {
    return event.ctrlKey === shortcut.ctrlKey && event.altKey === shortcut.altKey && event.shiftKey === shortcut.shiftKey && event.key === shortcut.key;
}

/**
 * Function to get the source from the URL
 * @param {string} url - The URL to get the source from
 * @returns {string} The source of the URL
 * @since v0.1.7
 * @since v0.1.8 - Performance improvements
 */
function getSourceFromUrl(url) {
    const sources = {
        "indavideo": "Indavideo",
        "videa": "Videa",
        "mega.nz": "Mega",
        "dailymotion": "DailyMotion",
        "rumble": "Rumble"
    };
    return Object.keys(sources).find(key => url.toLowerCase().includes(key)) || "Ismeretlen";
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
        case "default":
            player.replacePlayer("default");
            break;
        default:
            player.replacePlayer("plyr");
    }
}

/**
 * Function to load the custom css for the plyr
 * @since v0.1.7
 * @since v0.1.8 - Switched to the new MA API
 */
function loadCustomCss() {
    if (settings.advanced.plyr.design.enabled) {
        MA.addCSS(`
        :root {
            --plyr-video-control-color: ${settings.advanced.plyr.design.settings.svgColor};
            --plyr-video-control-background-hover: ${settings.advanced.plyr.design.settings.hoverBGColor};
            --plyr-color-main: ${settings.advanced.plyr.design.settings.mainColor};
            --plyr-video-control-color-hover: ${settings.advanced.plyr.design.settings.hoverColor};
        }
        `);
        logger.log("Custom CSS loaded.");
    }
}

// ---------------------------- End of Helper Functions ----------------------------


// ---------------------------- Settings related functions ----------------------------
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
        popup.showErrorPopup("Hiba történt a beállítások betöltése közben. Alapértelmezett beállítások lesznek használva.", 5000);
        logger.error("Error while loading settings: " + error);
    });
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
 * Function to add the settings button to the page
 *
 * This function adds the settings button to the account menu
 */
function addSettingsButton() {
    let accountMenu = document.querySelector("#gen-header > div > div > div > div > nav > div.gen-header-info-box > div.gen-account-holder > div > ul");
    if (accountMenu) {
        let settingsButton = document.createElement("li");
        settingsButton.setAttribute("class", "gen-account-menu-item");
        settingsButton.innerHTML = `<a class="gen-account-menu-link" id="MATweaks-settings-button"><i class="fas fa-cog"></i>MATweaks beállítások</a>`;
        accountMenu.insertBefore(settingsButton, accountMenu.children[4]);
        addSettingsItems();
        document.querySelector("#MATweaks-settings-button").addEventListener("click", openSettings);
        logger.log("Settings button added.");
    }
}

/**
 * Function to add the settings items to the settings UI
 * @since v0.1.8
 */
function addSettingsItems() {
    settingsUI.addSettingsItem("Előre ugrás", "forwardSkip");
    settingsUI.addSettingsItem("Hátra ugrás", "backwardSkip");
    settingsUI.addSettingsItem("Következő epizód", "nextEpisode");
    settingsUI.addSettingsItem("Előző epizód", "previousEpisode");
    settingsUI.addSettingsItem("Automatikus lejátszás", "autoplay");
    settingsUI.addSettingsItem("Automatikus következő epizód", "autoNextEpisode");
}

/**
 * Function to open the settings UI
 * @since v0.1.8
 */
function openSettings() {
    settingsUI.show();
    logger.log("Settings UI created.");
}

// ---------------------------- End of Settings related functions ----------------------------

// ---------------------------- MA Player Replacement ----------------------------
/**
 * Function to determine whether the user has the custom player
 */
function checkCustomPlayer() {
    return document.querySelector("#lejatszo video") !== null;
}

/**
 * Function to handle MA player replacement
 */
function handleA() {
    if (!window.location.href.includes("resz")) return;
    settings.private.hasMAPlayer = checkCustomPlayer();
    if (settings.private.hasMAPlayer) {
        logger.log("User has the custom player.");
        if (settings.advanced.forcePlyr === null) {
            let buttons = a => {
                let btns = [];
                for (let i = 0; i < a.length; i++) {
                    let btn = document.createElement("button");
                    btn.innerHTML = a[i];
                    btn.value = a[i].toLowerCase();
                    btns.push(btn);
                }
                return btns;
            }
            askUser("Úgy tűnik, hogy a MagyarAnime saját videólejátszóját használod.<br>" +
                "Szeretnéd, hogy a MATweaks lecserélje a videólejátszót a sajátjára?" +
                "<br>Előnyök: Letölthető a videó, egységes kinézet, <i>MŰKÖDIK</i>", buttons(["Igen", "Nem", "Később"]), function (value) {
                if (value === "igen") {
                    logger.log("User decided to replace the player with the MATweaks player.");
                    settings.advanced.forcePlyr = true;
                    AReplacePlayer();
                    saveSettings(settings);
                } else if (value === "nem") {
                    settings.advanced.forcePlyr = false;
                    logger.log("User decided to keep the default player.");
                    saveSettings(settings);
                } else {
                    settings.advanced.forcePlyr = null;
                    logger.log("User decided to be asked later.");
                    saveSettings(settings);
                }
            });
        } else if (settings.advanced.forcePlyr) {
            logger.log("User decided to force the Plyr player.");
            AReplacePlayer();
        } else {
            logger.log("User decided to keep the default player.");
        }
    } else {
        logger.log("User does not have the custom player.");
    }
}

/**
 * Function to replace the player with our own player
 */
function AReplacePlayer() {
    player.qualityData = fetchQualityDataA();
    if (player.plyr !== undefined) {
        player.plyr.destroy();
    } else {
        let playerElement = document.querySelector(".plyr")
        if (playerElement) {
            playerElement.remove();
        }
    }
    let message = {
        plugin: "MATweaks",
        type: "removePlayer"
    };
    document.dispatchEvent(new CustomEvent("MATweaks", {detail: message}));
    let videoElement = document.createElement("video");
    videoElement.setAttribute("id", "video");
    videoElement.setAttribute("src", player.qualityData[0].url);
    videoElement.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
    videoElement.setAttribute("playsinline", "");
    videoElement.setAttribute("controls", "");
    videoElement.setAttribute("preload", "metadata");
    for (let i = 0; i < player.qualityData.length; i++) {
        let source = document.createElement("source");
        source.setAttribute("src", player.qualityData[i].url);
        source.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
        videoElement.appendChild(source);
    }
    document.querySelector("#lejatszo").appendChild(videoElement);
    player.selector = "video";
    if (checkAdvancedSettings() && settings.advanced.settings.DefaultPlayer.player === "default") {
        // Do nothing
    } else if (checkAdvancedSettings() && settings.advanced.settings.DefaultPlayer.player === "plyr") {
        player.replacePlayer("plyr");
    } else {
        player.replacePlayer("plyr");
    }
}

/**
 * Function to ask the user a question
 * @param {string} question - The question to ask the user
 * @param {NodeListOf<HTMLButtonElement>} buttons - The buttons to show the user
 * @param {function} callback - The callback function to call when the user clicks a button
 */
function askUser(question, buttons, callback) {
    let q = document.createElement("div");
    q.innerHTML = `<p>${question}</p>`;
    q.classList.add("MATweaks-ask-user");
    let popup = document.createElement("div");
    popup.appendChild(q);
    document.body.appendChild(popup);
    buttons.forEach((button) => {
        let btn = document.createElement("button");
        btn.innerHTML = button.innerHTML;
        btn.addEventListener("click", () => {
            callback(button.value);
            popup.remove();
        });
        btn.classList.add("MATweaks-ask-user-button");
        q.appendChild(btn);
    });
}

/**
 * Function to fetch the quality data from the page
 */
function fetchQualityDataA() { return Array.from(document.querySelectorAll("source")).map(source => ({
        quality: Number(source.getAttribute("size")),
        url: source.src
    }));
}

// ---------------------------- End of MA Player Replacement ----------------------------

// ---------------------------- Initialization ----------------------------
/**
 * Function to initialize the extension
 *
 * This function is called when the extension is loaded
 */
function initializeExtension() {
    loadSettings();
    bookmarks.loadBookmarks().then(() => {
        logger.log("Bookmarks loaded.");
    }).catch((error) => {
        logger.error("Error while loading bookmarks: " + error);
    });
    setupEventListeners();
    logger.log("Extension initialized.");
}



/**
 * Function to set up the event listeners
 */
function setupEventListeners() {
    window.addEventListener("message", receiveMessage, false);
    window.addEventListener("load", function () {
        addSettingsButton();
        handleA();
        if (MA.isEpisodePage()) console.log(MA.EPISODE.TEST()); // TODO: Remove this line
        if (MA.isAnimePage()) console.log(MA.ANIME.TEST()); // TODO: Remove this line
    });
    window.addEventListener("DOMContentLoaded", function () {});  // Useless line
    window.addEventListener("MATweaksPlayerReplaced", function () {
        logger.log("Player replaced.");
        addShortcutsToPage();
        handleReszPage();
        checkForBookmarks();
        player.isReplaced = true;
    });
    window.addEventListener("MATweaksPlayerReplaceFailed", function () {
        popup.showErrorPopup("A videólejátszó cseréje sikertelen volt.");
        logger.error("Player replacement failed.");
    });
}

/**
 *  Function to receive messages from iframes
 * @param {MessageEvent} event - The message event
 */
function receiveMessage(event) {
    if (event.data.plugin === MAT.__NAME) {
        switch (event.data.type) {
            case MAT.__ACTIONS.FRAME_LOADED:
                handleIframeLoaded();
                break;
            case MAT.__ACTIONS.SOURCE_URL:
                handleSourceUrlReceived(event.data);
                break;
            case MAT.__ACTIONS.MEGA.FRAME_LOADED:
                handleMegaIframeLoaded();
                break;
            case MAT.__ACTIONS.MEGA.NEXT_EPISODE:
                nextEpisodeMega();
                break;
            case MAT.__ACTIONS.MEGA.PREVIOUS_EPISODE:
                previousEpisode();
                break;
            case MAT.__ACTIONS.MEGA.AUTO_NEXT_EPISODE:
                nextEpisode();
                break;
            case MAT.__ACTIONS.MEGA.PLAYER_READY:
                logger.log("Mega player ready.");
                window.dispatchEvent(new Event("MATweaksPlayerReplaced"));
                break;
            case MAT.__ACTIONS.SEEK:
                player.plyr.currentTime = event.data.time;
                break;
            case MAT.__ACTIONS.MEGA.GET_BOOKMARKS:
                event.source.postMessage({plugin: MAT.__NAME, type: MAT.__ACTIONS.MEGA.BOOKMARKS, bookmarks: player.getBookmarks()}, "*");
                break;
            default:
                break;
        }
    }
}

/**
 * Function to handle the indavideo iframe loaded message
 */
function handleIframeLoaded() {
    let iframe = document.querySelector("iframe");
    if (iframe) {
        iframe.contentWindow.postMessage({plugin: MAT.__NAME, type: MAT.__ACTIONS.GET_SOURCE_URL}, "*");
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
 * Function to handle the mega iframe loaded message
 */
function handleMegaIframeLoaded() {
    let iframe = document.querySelector('iframe[src*="mega.nz"]');
    addShortcutsToPage();
    player.isMega = true;
    player.IframeUrl = iframe.src;
    logger.log("Mega iframe loaded.");
    addShortcutsToPageMega();
    if (checkAdvancedSettings() && settings.advanced.settings.DefaultPlayer.player === "default") return;
    iframe.contentWindow.postMessage({plugin: MAT.__NAME, type: MAT.__ACTIONS.MEGA.REPLACE_PLAYER}, "*");
    logger.log("Mega player replaced.");
}

/**
 * Function to handle the resz page
 */
function handleReszPage() {
    if (!window.location.href.includes("resz")) return;
    addBookmarkButton();
}

// ---------------------------- End of Initialization ----------------------------

// ---------------------------- Navigation between episodes ----------------------------
/**
 * Function to move the next episode automatically
 *
 * Since: v0.1.4
 */
function autoNextEpisode() {
    let nextEpisodeButton = document.getElementById("epkovetkezo")
    if (nextEpisodeButton) nextEpisodeButton.click();
    logger.log("Moved to the next episode automatically.");
}

/**
 * Function to move to the next episode
 */
function nextEpisode() {
    let nextEpisodeButton = document.getElementById("epkovetkezo")
    /**
     * On last episode it will go to the data sheet of the series
     * Since: v0.1.4
     */
    if (nextEpisodeButton) {
        nextEpisodeButton.click();
    } else {
        let dataSheetButton = document.getElementById("adatlap")
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
    let previousEpisodeButton = document.getElementById("epelozo");
    /**
     * On first episode it will go to the data sheet of the series
     * Since: v0.1.6.1
     */
    if (previousEpisodeButton) {
        previousEpisodeButton.click();
    } else {
        let dataSheetButton = document.getElementById("adatlap")
        if (dataSheetButton) {
            dataSheetButton.click();
        } else {
            logger.log("No previous episode or data sheet button found.");
        }
    }
    logger.log("Moved to the previous episode.");
}

/**
 * Function to move to the next episode if the source is Mega
 */
function nextEpisodeMega() {
    let nextEpisodeButton = document.getElementById("epkovetkezo")
    if (nextEpisodeButton) {
        nextEpisodeButton.click();
        logger.log("Moved to the next episode. (If you can read this message, then you are a wizard.)");
    }
}

// ---------------------------- End of Navigation between episodes ----------------------------

// ---------------------------- Downloading the video ----------------------------
/**
 * Function to download a file and log the progress
 * @param {string} filename - The filename of the file to download
 * @returns {Promise<boolean>} - Returns true if the download was successful
 */
async function downloadFile(filename) { return new Promise((resolve, reject) => {
        let url = document.querySelector("video").src;
        if (!filename) {
            logger.error("Download failed: filename is empty or undefined.");
            reject("Filename is empty or undefined.");
        }
        logger.log("Starting download...");
        chrome.runtime.sendMessage({
            plugin: "MATweaks",
            type: "downloadFile",
            url: url,
            filename: filename,
        }, function (response) {
            if (response === true) {
                logger.log(`Download started: "${filename}"`);
                resolve(true);
            } else {
                logger.error("Download failed.");
                reject("Download failed.");
            }
        });
    });
}

// ---------------------------- End of Downloading the video ----------------------------

// ---------------------------- Shortcuts ----------------------------
/**
 * Function to add shortcuts to the page
 *
 * Since: v0.1.5
 * @since v0.1.8 - Performance improvements
 */
function addShortcutsToPageMega() {
    let iframe = document.querySelector("iframe[src*='mega.nz']")
    document.addEventListener("keydown", (event) => {
        if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName) || settingsUI.isOpened) return;
        const actions = [
            {condition: settings.forwardSkip.enabled && checkShortcut(event, settings.forwardSkip.keyBind), type: MAT.__ACTIONS.MEGA.FORWARD_SKIP, seconds: settings.forwardSkip.time},
            {condition: settings.backwardSkip.enabled && checkShortcut(event, settings.backwardSkip.keyBind), type: MAT.__ACTIONS.MEGA.BACKWARD_SKIP, seconds: settings.backwardSkip.time},
            {condition: event.key === "ArrowRight", type: MAT.__ACTIONS.MEGA.FORWARD_SKIP, seconds: 5},
            {condition: event.key === "ArrowLeft", type: MAT.__ACTIONS.MEGA.BACKWARD_SKIP, seconds: 5},
            {condition: event.key === " ", type: MAT.__ACTIONS.MEGA.TOGGLE_PLAY},
            {condition: event.key === "ArrowUp", type: MAT.__ACTIONS.MEGA.VOL_UP},
            {condition: event.key === "ArrowDown", type: MAT.__ACTIONS.MEGA.VOL_DOWN},
            {condition: event.key.toLowerCase() === "m", type: MAT.__ACTIONS.MEGA.TOGGLE_MUTE},
            {condition: event.key.toLowerCase() === "f", type: MAT.__ACTIONS.MEGA.TOGGLE_FULLSCREEN},
            {condition: Number(event.key) >= 0 && Number(event.key) <= 9, type: MAT.__ACTIONS.MEGA.SEEK_PERCENTAGE, percent: Number(event.key) * 10}
        ];
        for (const action of actions) {
            if (action.condition) {
                event.preventDefault();
                iframe.contentWindow.postMessage({
                    plugin: MAT.__NAME,
                    type: action.type,
                    seconds: action.seconds || 0,
                    percent: action.percent || 0
                }, "*");
                break;
            }
        }
    });
    logger.log("Shortcuts added to the page.");
}

/**
 * Function to add shortcuts to the page
 */
function addShortcutsToPage() {
    if (!location.href.includes("resz")) return;
    document.addEventListener("keydown", (event) => {
        if (settings.nextEpisode.enabled &&
            !settingsUI.isOpened &&
            checkShortcut(event, settings.nextEpisode.keyBind)) {
            nextEpisode();
        } else if (
            settings.previousEpisode.enabled &&
            !settingsUI.isOpened &&
            checkShortcut(event, settings.previousEpisode.keyBind)) {
            previousEpisode();
        }
    });
    logger.log("Shortcuts added to the page.");
}

// ---------------------------- End of Shortcuts ----------------------------

// ---------------------------- Bookmarking ----------------------------

/**
 * Function to get the current time of the video from the Mega player
 * @returns {Promise<number>} - Returns the current time of the video
 * @since v0.1.8
 */
async function getMegaCurrentTime() {
    return  await new Promise((resolve) => {
        window.addEventListener("message", (event) => {
            if (event.data.plugin === MAT.__NAME && event.data.type === MAT.__ACTIONS.MEGA.CURRENT_TIME) {
                resolve(event.data.currentTime);
            }
        });
        document.querySelector("iframe").contentWindow.postMessage({
            plugin: MAT.__NAME,
            type: MAT.__ACTIONS.MEGA.GET_CURRENT_TIME
        }, "*");
    });
}

/**
 * Function to get the current time of the video
 * @returns {Promise<number>} - Returns the current time of the video
 */
async function getCurrentTime() {
    return new Promise(async (resolve, reject) => {
        if (player.isMega) {
            let time = getMegaCurrentTime().then((time) => {
                return time;
            }).catch(() => {
                logger.error("Error while getting the current time.");
                reject(0);
            });
            return resolve(time);
        } else {
            if (player.plyr) {
                return resolve(player.plyr.currentTime)
            } else if (!player.plyr) {
                return resolve(document.querySelector("video").currentTime)
            } else {
                logger.error("Error while getting the current time.");
                popup.showErrorPopup("Hiba történt a jelenlegi idő lekérdezése közben.");
                reject(0);
            }
        }
    });
}
/**
 * Function to add a bookmark
 * @returns {Promise<void>} - Returns when the bookmark is added
 */
async function addBookmark() {
    getCurrentTime().then((currentTime) => {
        bookmarks.addBookmark(
            MA.EPISODE.getTitle() || "Ismeretlen",
            MA.EPISODE.getEpisodeNumber() | 0,
            window.location.href,
            `${MA.EPISODE.getTitle() || "Ismeretlen"} - ${MA.EPISODE.getEpisodeNumber() | 0}.rész, ${(currentTime % 3600 / 60).toFixed(0).padStart(2, "0")}:${(currentTime % 60).toFixed(0).padStart(2, "0")}`,
            currentTime,
            MA.EPISODE.getId()) || popup.showErrorPopup("Hiba történt a könyvjelző hozzáadása közben.");
    });
}

/**
 * Function that adds a button to the resz page to add a bookmark
 */
function addBookmarkButton() {
    let button = document.createElement("button");
    button.innerHTML = "Könyvjelző hozzáadása";
    let cooldown = false;
    button.addEventListener("click", () => {
        if (cooldown) return;
        addBookmark();
        popup.showInfoPopup("Könyvjelző hozzáadva.");
        logger.log("Bookmark added.");
        cooldown = true;
        setTimeout(() => {
            cooldown = false;
        }, 2000);
    });
    button.classList.add("MATweaks-bookmark-button");
    if (document.getElementById("adatlap")) document.getElementById("adatlap")?.after(button)
    else document.querySelector(".gentech-tv-show-img-holder")?.after(button);
    logger.log("Bookmark button added.");
}

/**
 * Function to seek player to the bookmarked time
 * @param {number} time - The time to seek to
 */
function seekToBookmark(time) {
    let tryCount = 0;
    let interval = setInterval(() => {
        if (player.isReplaced) {
            if (player.isMega) {
                document.querySelector("iframe").contentWindow.postMessage({
                    plugin: MAT.__NAME,
                    type: MAT.__ACTIONS.MEGA.SEEK,
                    time: time
                }, "*");
                clearInterval(interval);
            } else {
                if (player.plyr && player.plyr.duration > 0) {
                    player.plyr.currentTime = time;
                    clearInterval(interval);
                } else if (!player.plyr && document.querySelector("video").duration > 0) {
                    document.querySelector("video").currentTime = time;
                    clearInterval(interval);
                }
            }
        } else if (tryCount > 10) {
            logger.error("Error while seeking to the bookmarked time.");
            popup.showErrorPopup("Hiba történt a könyvjelzőhöz való ugrás közben.");
            clearInterval(interval);
        }
        tryCount++;
    }, 100);
}

/**
 * Function to check for bookmarks to be opened
 *
 * Logic:
 * - Get the bookmarks from the temporary storage
 * - Check if the current URL is in the bookmarks
 * - If it is, seek to the bookmarked time
 * - Remove the bookmark from the temporary storage
 */
function checkForBookmarks() {
    chrome.runtime.sendMessage({plugin: MAT.__NAME, type: "getOpenBookmarks"}, (response) => {
        if (response) {
            response.forEach((bookmark) => {
                if (bookmark.url.split("/")[4] === MA.EPISODE.getId().toString()) {
                    let i = bookmarks.getBookmark(bookmark.id) || 0;
                    if (Number(i.id) !== Number(bookmark.id)) {logger.error("Error while getting the bookmark."); return;}
                    seekToBookmark(i.time);
                    chrome.runtime.sendMessage({plugin: MAT.__NAME, type: "removeOpenBookmark", id: bookmark.id}, (response) => {
                        if (response) {
                            logger.log("Bookmark opened.");
                            popup.showInfoPopup("Könyvjelző sikeresen megnyitva.");
                        } else {
                            logger.error("Error while opening the bookmark.");
                            popup.showErrorPopup("Hiba történt a könyvjelző megnyitása közben.");
                        }
                    });
                } else {
                    logger.log("No bookmark found for the current URL.");
                }
            });
        } else {
            logger.error("Error while getting the bookmarks.");
        }
    });
}


// ---------------------------- End of Bookmarking ----------------------------

/**
 * Initialize the extension
 */
initializeExtension();






