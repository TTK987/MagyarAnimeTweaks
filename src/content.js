// DON'T TOUCH THESE VARIABLES!
var MATweaksVersion = "0.1.3";
var LastUpdate = "2024.02.07";
// ---------------------------------------------------------------------------------------------------------------------
var settings = { // Default settings
    forwardSkip: { // Forward skip settings (default: ctrl + →)
        enabled: true,
        duration: 85,
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        key: "ArrowRight",
    },
    backwardSkip: { // Backward skip settings (default: ctrl + ←)
        enabled: true,
        duration: 85,
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        key: "ArrowLeft",
    },
    nextEpisode: { // Next episode settings (default: alt + →)
        enabled: true,
        ctrlKey: false,
        altKey: true,
        shiftKey: false,
        key: "ArrowRight",
    },
    previousEpisode: { // Previous episode settings (default: alt + ←)
        enabled: true,
        ctrlKey: false,
        altKey: true,
        shiftKey: false,
        key: "ArrowLeft",
    },
    fixes: { // Fixes the buttons (default: true)
        enabled: true,
    },
    devSettings: { // Developer settings (default: false)
        enabled: false,
        settings: { // Developer settings
            ConsoleLog: { // Console log (default: false)
                enabled: false,
            },
            DefaultPlayer: { // Default player (default: "plyr")
                player: "plyr",
            },
        }
    }
}
var downloadInProgress = false; // Download in progress (User can't download the video while this is true)
var SourceUrl360p = ""; // 360p source url
var SourceUrl720p = ""; // 720p source url
var IndavideoIframeUrl = ""; // Indavideo iframe url
var CurrentQuerrySelector = "#indavideoframe"; // Current querry selector for the player
var IsSettingsWindowOpen = false; // Is the settings window open
var lastLogTime = 0; // Last log time (Used for the download progress log)
// ---------------------------------------------------------------------------------------------------------------------
class ConsoleLogger { // Console logger (Used for disabling the logs easily)
    log(message) {
        // If the console log is enabled and the dev settings are enabled, log the message.
        if (settings.devSettings.settings.ConsoleLog.enabled && settings.devSettings.enabled) console.log(`[MATweaks]: ` + message);
    }

    warn(message) {
        // If the console log is enabled and the dev settings are enabled, log the message as a warning.
        if (settings.devSettings.settings.ConsoleLog.enabled && settings.devSettings.enabled) console.warn(`[MATweaks]: ` + message);
    }

    error(message) {
        // If the console log is enabled and the dev settings are enabled, log the message as an error.
        if (settings.devSettings.settings.ConsoleLog.enabled && settings.devSettings.enabled) console.error(`[MATweaks]: ` + message);
    }
}
// ---------------------------------------------------------------------------------------------------------------------
const logger = new ConsoleLogger(); // Create a new console logger
// ---------------------------------------------------------------------------------------------------------------------
// All the functions for the extension
function addSettingsButton() {
    /* Add the settings button to the account menu */
    var accountMenu = document.querySelector("#gen-header > div > div > div > div > nav > div.gen-header-info-box > div.gen-account-holder > div > ul");
    if (accountMenu) {
        // Create the settings button
        var settingsButton = document.createElement("li");
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
    var settingsWindow = document.querySelector("#MATweaks-settings-window");
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
    var settingsWindow = document.createElement("div");
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
                                <!-- Get shortcut by listening to the keydown event. -->
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
                            <p>Fejlesztői beállítások</p>
                            <div class="MATweaks-settings-window-body-content-item-feature" id="MATweaks-devSettings">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-devSettings-enabled">Engedélyezve</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-checkbox" type="checkbox" id="MATweaks-devSettings-enabled" name="MATweaks-devSettings-enabled" ${settings.devSettings.enabled ? "checked" : ""}>
                                <span class="MATweaks-settings-window-body-content-item-feature-checkbox-custom"></span>
                            </div>
                            <div class="MATweaks-settings-window-body-content-item-feature">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-devSettings-DefaultPlayer-player">Alapértelmezett lejátszó</label>
                                <select class="MATweaks-settings-window-body-content-item-feature-input" id="MATweaks-devSettings-DefaultPlayer-player" name="MATweaks-devSettings-DefaultPlayer-player">
                                    <option value="html5" ${settings.devSettings.settings.DefaultPlayer.player === "html5" ? "selected" : ""}>html5</option>
                                    <option value="indavideo" ${settings.devSettings.settings.DefaultPlayer.player === "indavideo" ? "selected" : ""}>indavideo</option>
                                    <option value="plyr" ${settings.devSettings.settings.DefaultPlayer.player === "plyr" ? "selected" : ""}>plyr</option>
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
                        <p>Verzió: ${MATweaksVersion}</p>
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
            top: 65%;
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
    var newSettings = {
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
        }
    };
    // add the settings window to the body
    document.querySelector("body").appendChild(settingsWindow);
    // --------------------------
    // Add the event listeners for exiting the settings window (save or cancel)
    document.querySelector(".MATweaks-settings-window-close").addEventListener("click", closeSettingsWithouSaving);
    document.querySelector("#MATweaks-settings-window-body-content-buttons-button-cancel").addEventListener("click", closeSettingsWithouSaving);
    document.querySelector("#MATweaks-settings-window-body-content-buttons-button-save").addEventListener("click", () => {
        closeSettings(newSettings);
    });
    // --------------------------
    // Add the event listeners for each setting
    document.querySelector("#MATweaks-forwardSkip").addEventListener("click", (event) => {
        newSettings.forwardSkip.enabled = !newSettings.forwardSkip.enabled;
        document.querySelector("#MATweaks-forwardSkip-enabled").checked = newSettings.forwardSkip.enabled;
        if (settings.devSettings.enabled) console.log("forwardSkip.enabled: " + newSettings.forwardSkip.enabled);
    });
    document.querySelector("#MATweaks-backwardSkip").addEventListener("click", (event) => {
        newSettings.backwardSkip.enabled = !newSettings.backwardSkip.enabled;
        document.querySelector("#MATweaks-backwardSkip-enabled").checked = newSettings.backwardSkip.enabled;
        if (settings.devSettings.enabled) console.log("backwardSkip.enabled: " + newSettings.backwardSkip.enabled);
    });
    document.querySelector("#MATweaks-nextEpisode").addEventListener("click", (event) => {
        newSettings.nextEpisode.enabled = !newSettings.nextEpisode.enabled;
        document.querySelector("#MATweaks-nextEpisode-enabled").checked = newSettings.nextEpisode.enabled;
        if (settings.devSettings.enabled) console.log("nextEpisode.enabled: " + newSettings.nextEpisode.enabled);
    });
    document.querySelector("#MATweaks-previousEpisode").addEventListener("click", (event) => {
        newSettings.previousEpisode.enabled = !newSettings.previousEpisode.enabled;
        document.querySelector("#MATweaks-previousEpisode-enabled").checked = newSettings.previousEpisode.enabled;
        if (settings.devSettings.enabled) console.log("previousEpisode.enabled: " + newSettings.previousEpisode.enabled);
    });
    document.querySelector("#MATweaks-fixes").addEventListener("click", (event) => {
        newSettings.fixes.enabled = !newSettings.fixes.enabled;
        document.querySelector("#MATweaks-fixes-enabled").checked = newSettings.fixes.enabled;
        if (settings.devSettings.enabled) console.log("fixes.enabled: " + newSettings.fixes.enabled);
    });
    document.querySelector("#MATweaks-devSettings").addEventListener("click", (event) => {
        newSettings.devSettings.enabled = !newSettings.devSettings.enabled;
        document.querySelector("#MATweaks-devSettings-enabled").checked = newSettings.devSettings.enabled;
        if (settings.devSettings.enabled) console.log("devSettings.enabled: " + newSettings.devSettings.enabled);
    });
    document.querySelector("#MATweaks-devSettings-ConsoleLog").addEventListener("click", (event) => {
        newSettings.devSettings.settings.ConsoleLog.enabled = !newSettings.devSettings.settings.ConsoleLog.enabled;
        document.querySelector("#MATweaks-devSettings-ConsoleLog-enabled").checked = newSettings.devSettings.settings.ConsoleLog.enabled;
        if (settings.devSettings.enabled) console.log("devSettings.settings.ConsoleLog.enabled: " + newSettings.devSettings.settings.ConsoleLog.enabled);
    });
    document.querySelector("#MATweaks-forwardSkip-duration").addEventListener("change", (event) => {
        newSettings.forwardSkip.duration = event.target.value;
    });
    document.querySelector("#MATweaks-backwardSkip-duration").addEventListener("change", (event) => {
        newSettings.backwardSkip.duration = event.target.value;
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
    var settingsWindow = document.querySelector("#MATweaks-settings-window");
    if (settingsWindow) {
        // If the settings window is found, close it and save the settings.
        settingsWindow.style.display = "none";
        // Save the settings
        settings = newSettings;
        saveSettings();
        logger.log("Settings window closed.");
        IsSettingsWindowOpen = false;
        // Reload the page to apply the new settings
        window.location.reload();
    } else {
        logger.error("Settings window not found, cannot close it.");
    }
}

function closeSettingsWithouSaving() {
    /* Close the settings window without saving */
    // Get the settings window
    var settingsWindow = document.querySelector("#MATweaks-settings-window");
    if (settingsWindow) {
        // If the settings window is found, close it without saving the settings.
        IsSettingsWindowOpen = false;
        settingsWindow.style.display = "none";
        logger.log("Settings window closed without saving.");
    }
}

function receiveMessage(event) {
    /* Receive the messages from the indavideo iframe */
    // Check if the message is from the extension
    if (event.data && event.data.plugin === "MATweaks") {
        // If the message is from the extension, check the type of the message
        if (event.data.type === "iframeLoaded") {
            // If the message is that the iframe is loaded, send a message to the iframe to get the source url
            var iframe = document.querySelector('iframe[src*="embed.indavideo.hu"]')
            iframe.contentWindow.postMessage({"plugin": "MATweaks", "type": "getSourceUrl"}, "*");
            logger.log("Indavideo iframe loaded.");
        } else if (event.data.type === "sourceUrl") {
            // If the message is the source url, save it and replace the player
            logger.log("Indavideo 720p source URL received. Url: " + event.data.data["720p"]);
            logger.log("Indavideo 360p source URL received. Url: " + event.data.data["360p"]);
            // Save the source urls
            SourceUrl720p = event.data.data["720p"];
            SourceUrl360p = event.data.data["360p"];
            IndavideoIframeUrl = document.querySelector('iframe[src*="embed.indavideo.hu"]').src; // Currently not used (Later it will be used to reload the iframe, to fix a problem, where the user leaves the page opened for a long time, and the video's source url token expires.)
            // Replace the player
            if (settings.devSettings.enabled && settings.devSettings.settings.DefaultPlayer.player === "indavideo") {
                // If the default player is indavideo, replace the player with the indavideo player
                // Basically, leave it as it is, because the indavideo player is already loaded.
                replacePlayerIndavideo();
            } else if (settings.devSettings.enabled && settings.devSettings.settings.DefaultPlayer.player === "plyr" || !settings.devSettings.enabled) {
                // If the default player is plyr, or the dev settings are not enabled, replace the player with the plyr player
                replacePlayerPlyr();
            } else if (settings.devSettings.enabled && settings.devSettings.settings.DefaultPlayer.player === "html5") {
                // If the default player is html5, replace the player with the html5 player
                // Note: If the user wants to use the html5 player, for idk what reason (Maybe to user their own player, or to use the browser's player...??), then the user has the option.
                replacePlayerHtml5();
            } else {
                // In case of a miracle, show an error message.
                // Should never happen, but just in case...
                showErrorMessage("Hát, valami hiba történt...<br>Próbáld újra.");
            }
        }
    }
}

function showErrorMessage(message) {
    /* Show an error message */
    logger.error("Error while playing video. Message: " + message);
    // Create the error message
    var error = document.createElement("p");
    error.setAttribute("class", "MATweaks-error");
    error.innerHTML = "[MATweaks] Hiba történt a videó lejátszása közben.<br>" + message;
    error.style.color = "red";
    error.style.fontSize = "xx-large";
    // Replace the player with the error message
    var iframe = document.querySelector(CurrentQuerrySelector);
    iframe.parentNode.replaceChild(error, iframe);
    return false;
}

function replacePlayerIndavideo() {
    /* Replace the player with the indavideo player */
    // Note: this should be future proof, because later, if we want a "fast" player switch, we can just call this function, and it will replace the player with the indavideo player.
    // Check if the current player is the indavideo player
    if (CurrentQuerrySelector === "#indavideoframe") {
        logger.log("Indavideo player is already the current player.");
        return false;
    }
    // Create the indavideo iframe
    var iframe = document.createElement("iframe");
    iframe.setAttribute("id", "indavideoframe");
    iframe.setAttribute("style", "float: none;");
    iframe.setAttribute("src", IndavideoIframeUrl);
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    iframe.setAttribute("allowfullscreen", "");
    // Replace the player
    var video = document.querySelector(CurrentQuerrySelector);
    video.parentNode.replaceChild(iframe, video);
    // set the current querry selector to the new player
    CurrentQuerrySelector = "#indavideoframe";
    logger.log("Indavideo player loaded.");
    return true;
}

function replacePlayerPlyr() {
    /* Replace the player with the plyr player */
    // Check if there is a valid source url
    if (SourceUrl720p === false && SourceUrl360p === false) {
        // If there is no valid source url, show an error message
        showErrorMessage("Nem sikerült betölteni a videót. (Hibás videó URL)<br>Töltsd újra az oldalt.");
        return false;
    }
    // Create the plyr player
    var videoElement = document.createElement("video");
    videoElement.setAttribute("autoplay", "autoplay");
    videoElement.setAttribute("src", SourceUrl720p || SourceUrl360p);
    videoElement.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
    videoElement.setAttribute("playsinline", "");
    videoElement.setAttribute("controls", "");
    videoElement.setAttribute("preload", "metadata");
    videoElement.setAttribute("id", "video");
    // Add the source urls
    if (SourceUrl720p) {
        var source720p = document.createElement("source");
        source720p.setAttribute("src", SourceUrl720p);
        source720p.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
        videoElement.appendChild(source720p);
    }
    if (SourceUrl360p) {
        var source360p = document.createElement("source");
        source360p.setAttribute("src", SourceUrl360p);
        source360p.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
        videoElement.appendChild(source360p);
    }
    // Replace the player
    var iframe = document.querySelector(CurrentQuerrySelector);
    iframe.parentNode.replaceChild(videoElement, iframe);
    // add all available quality options to the plyr
    var qualityOptions = [];
    if (SourceUrl720p) qualityOptions.push(720);
    if (SourceUrl360p) qualityOptions.push(360);
    videoElement.setAttribute("class", "plyr--video");
    // Create the plyr player, with the settings
    var video = new Plyr("#video", {
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
            default: qualityOptions.includes(720) ? 720 : 360, // Default quality is the highest available quality
            options: qualityOptions,
            forced: true,
            onChange: (quality) => { // When the quality is changed, change the source url
                if (quality === 720) {
                    // get the current time of the video
                    var currentTime = Number(videoElement.currentTime);
                    // set the source url to the 720p source url
                    document.querySelector("video").setAttribute("src", SourceUrl720p);
                    // set the current time of the video
                    videoElement.currentTime = currentTime;
                } else if (quality === 360) {
                    // get the current time of the video
                    var currentTime = Number(videoElement.currentTime);
                    // set the source url to the 360p source url
                    document.querySelector("video").setAttribute("src", SourceUrl360p);
                    // set the current time of the video
                    videoElement.currentTime = currentTime;
                }
                logger.log("Quality changed to " + quality);
            },
        },
        speed: {
            selected: 1,
            options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
        },
    });
    logger.log("Creating a plyr player.");
    // Add the shortcuts to the player
    addShortcutsToPlayer(video);
    // Add the download button to the player
    fixDownloadButton();
    // fixes the plyr buffer position
    fixplyrbuffer(); // Most useful function, that I've ever created...
    // set the current querry selector to the new player
    CurrentQuerrySelector = "#video";
}

function replacePlayerHtml5() {
    /* Replace the player with the html5 player */
    // Check if there is a valid source url
    if (SourceUrl720p === false && SourceUrl360p === false) {
        // If there is no valid source url, show an error message
        showErrorMessage("Nem sikerült betölteni a videót. (Rossz URL)<br>Töltsd újra az oldalt.");
        return false;
    }
    // Create the html5 player
    var videoElement = document.createElement("video");
    videoElement.setAttribute("autoplay", "autoplay");
    videoElement.setAttribute("src", SourceUrl720p || SourceUrl360p);
    videoElement.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
    videoElement.setAttribute("playsinline", "");
    videoElement.setAttribute("controls", "");
    videoElement.setAttribute("preload", "metadata");
    videoElement.setAttribute("id", "video");
    // Add the source urls
    if (SourceUrl720p) {
        var source720p = document.createElement("source");
        source720p.setAttribute("src", SourceUrl720p);
        source720p.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
        videoElement.appendChild(source720p);
    }
    if (SourceUrl360p) {
        var source360p = document.createElement("source");
        source360p.setAttribute("src", SourceUrl360p);
        source360p.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
        videoElement.appendChild(source360p);
    }
    // Replace the player
    var iframe = document.querySelector(CurrentQuerrySelector);
    iframe.parentNode.replaceChild(videoElement, iframe);
    // set the current querry selector to the new player
    CurrentQuerrySelector = "#video";
}

function skipForward(video) {
    /* Skip forward in the video */
    // Check if the video is null (not given as a parameter), if it is, get the video from the page
    if (video === null) video = document.querySelector("video");
    // Skip forward
    video.currentTime = Number(video.currentTime) + Number(settings.forwardSkip.duration);
    logger.log("Skipped forward " + settings.forwardSkip.duration + " seconds.");
}

function skipBackward(video) {
    /* Skip backward in the video */
    // Check if the video is null (not given as a parameter), if it is, get the video from the page
    if (video === null) video = document.querySelector("video");
    // Skip backward
    video.currentTime = Number(video.currentTime) - Number(settings.backwardSkip.duration);
    logger.log("Skipped backward " + settings.backwardSkip.duration + " seconds.");
}

function fixplyrbuffer() {
    /* Fixes the plyr buffer position */
    // Note: Yes, I created a function for this... I know, it's a bit overkill
    // Get the plyr buffer
    var plyrbuffer = document.querySelector(".plyr__progress__buffer");
    if (plyrbuffer) {
        // If the plyr buffer is found, fix it's position
        plyrbuffer.style.top = "9.5px"; // (Could be solved with css)
        logger.log("plyrbuffer fixed."); // LOG THIS USEFUL INFORMATION!!!
    } else {
        logger.error("plyrbuffer not found."); // And what if there is no plyrbuffer?? LOG IT AS AN ERROR!!!
    }
}

function addShortcutsToPlayer(player) {
    /* Add the shortcuts to the player */
    // Add the event listener to the player
    window.addEventListener("keydown", (event) => {
        // Check if the event is a shortcut
        // This is messy, but it works...
        if (settings.forwardSkip.enabled &&
            event.ctrlKey === settings.forwardSkip.ctrlKey &&
            event.altKey === settings.forwardSkip.altKey &&
            event.shiftKey === settings.forwardSkip.shiftKey &&
            event.key === settings.forwardSkip.key &&
            IsSettingsWindowOpen === false) {
            // If the event is forward skip, skip forward
            skipForward(player)
        } else if (settings.backwardSkip.enabled &&
            event.ctrlKey === settings.backwardSkip.ctrlKey &&
            event.altKey === settings.backwardSkip.altKey &&
            event.shiftKey === settings.backwardSkip.shiftKey &&
            event.key === settings.backwardSkip.key &&
            IsSettingsWindowOpen === false) {
            // If the event is backward skip, skip backward
            skipBackward(player);
        } else if (settings.nextEpisode.enabled &&
            event.ctrlKey === settings.nextEpisode.ctrlKey &&
            event.altKey === settings.nextEpisode.altKey &&
            event.shiftKey === settings.nextEpisode.shiftKey &&
            event.key === settings.nextEpisode.key &&
            IsSettingsWindowOpen === false) {
            // If the event is next episode, move to the next episode
            nextEpisode();
        } else if (settings.previousEpisode.enabled &&
            event.ctrlKey === settings.previousEpisode.ctrlKey &&
            event.altKey === settings.previousEpisode.altKey &&
            event.shiftKey === settings.previousEpisode.shiftKey &&
            event.key === settings.previousEpisode.key &&
            IsSettingsWindowOpen === false) {
            // If the event is previous episode, move to the previous episode
            previousEpisode();
        }
    });
    logger.log("Shortcuts added to the player.");
}

function nextEpisode() {
    /* Move to the next episode */
    // Get the next episode button
    var nextEpisodeButton = document.querySelector(".gomb.bg-green");
    // If the next episode button is found, click it
    if (nextEpisodeButton) nextEpisodeButton.click();
    logger.log("Moved to the next episode.");
}

function previousEpisode() {
    /* Move to the previous episode */
    // Get the previous episode button
    var previousEpisodeButton = document.querySelector(".gomb.bg-orange");
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
}

function fixURLs() {
    /* Fix the URLs */
    // Check if the current location is a 1080p episode
    var currentLocation = window.location.href;
    if (currentLocation.includes("/resz-1080p/")) {
        // If the current location is a 1080p episode, fix the next and previous episode buttons, and the episode links
        var nextEpisodeButton = document.querySelector(".gomb.bg-green");
        var previousEpisodeButton = document.querySelector(".gomb.bg-orange");
        // Fix the next and previous episode buttons
        if (nextEpisodeButton) {
            // If the next episode button is found, fix it's URL
            var nextEpisodeUrl = nextEpisodeButton.href;
            nextEpisodeUrl = nextEpisodeUrl.replace("/resz/", "/resz-1080p/");
            nextEpisodeButton.href = nextEpisodeUrl;
            console.log("Next episode button fixed.");
        } else {
            logger.log("Next episode button not found.");
        }
        if (previousEpisodeButton) {
            // If the previous episode button is found, fix it's URL
            var previousEpisodeUrl = previousEpisodeButton.href;
            previousEpisodeUrl = previousEpisodeUrl.replace("/resz/", "/resz-1080p/");
            previousEpisodeButton.href = previousEpisodeUrl;
            logger.log("Previous episode button fixed.");
        } else {
            logger.log("Previous episode button not found.");
        }
        // Fix the episode links
        var episodeLinks = document.querySelectorAll(".epizod_link_normal");
        episodeLinks.forEach((episodeLink) => {
            // For each episode link, fix it's URL
            var episodeUrl = episodeLink.href;
            episodeUrl = episodeUrl.replace("/resz/", "/resz-1080p/");
            episodeLink.href = episodeUrl;
        });
    } else {
        // If the current location is not a 1080p episode, no need to fix the URLs
        logger.log("Next and previous episode buttons are already redirecting to the correct URL.");
    }
}

async function downloadFile(url, filename) {
    /* Download a file */
    if (downloadInProgress) {
        // If a download is already in progress, log it as an error and return false
        logger.error("Download already in progress.");
        return false;
    }
    // Try to download the file
    try {
        // Get the file
        const response = await fetch(url);
        const contentLength = response.headers.get('content-length'); // Get the content length
        const total = parseInt(contentLength, 10); // Parse the content length to an integer
        let loaded = 0; // Set the loaded to 0
        var downloadProgressBar = document.querySelector("#download-progress-bar"); // Get the download progress bar
        var downloadProgressBarcontainer = document.querySelector(".download-progress-bar-container"); // Get the download progress bar container
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
    var downloadProgressBar = document.querySelector("#download-progress-bar");
    var downloadProgressBarText = document.querySelector("#download-progress-bar-text");
    downloadProgressBar.setAttribute("value", loaded);
    downloadProgressBarText.innerHTML = `${((loaded / max) * 100).toPrecision(5)}% (${(loaded / 1000000).toPrecision(5)} MB / ${(max / 1000000).toPrecision(5)} MB)`;
    logger.log(`Downloaded ${(loaded / 1000000).toPrecision(5)} MB of ${(max / 1000000).toPrecision(5)} MB`);

}

function fixDownloadButton() {
    /* Fix the download button to the player (Fixes the download button) */
    var url = SourceUrl720p || SourceUrl360p; // Get the source url
    // Get the download button
    var downloadButton = document.querySelector("#tryideput > div > div.plyr__controls > a")
    downloadButton.href = ""; // Remove the default href
    // Add the event listener to the download button
    downloadButton.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent the default action
        logger.log("Download requested."); // Log the download request
        downloadFile(url, document.title + ".mp4"); // Download the file with the source url and the title of the page as the filename
    });
    // Create the download progress bar
    var downloadProgressBarContainer = document.createElement("div");
    downloadProgressBarContainer.setAttribute("class", "download-progress-bar-container");
    downloadProgressBarContainer.innerHTML = `
        <progress id="download-progress-bar" value="0" max="100"></progress>
        <p id="download-progress-bar-text">0% (0 MB / 0 MB)</p>
    `;
    // Add css to the download progress bar
    var css = `
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
    var style = document.createElement("style");
    style.innerHTML = css;
    // add the css to the head
    document.querySelector("head").appendChild(style);
    // Get the video player
    var videoPlayer = document.querySelector(".plyr--video");
    // Add the download progress bar below the video player
    videoPlayer.parentNode.insertBefore(downloadProgressBarContainer, videoPlayer.nextSibling);
    logger.log("Download button fixed.");
}

function loadSettings() {
    /* Load the settings */
    // Send a message to the background script to get the settings
    chrome.runtime.sendMessage({plugin: "MATweaks", type: "loadSettings"}, function (response) {
        if (response) {
            settings = response;
            logger.log("Settings loaded.");
        } else {
            logger.error("Error while loading settings.");
        }
    });
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
// ---------------------------------------------------------------------------------------------------------------------
// COPYRIGHT NOTICE:
// - The code above is part of the "MA Tweaks" extension for MagyarAnime.eu.
// - The extension is NOT related to the magyaranime.eu website or the indavideo.hu website other than it's purpose.
// - The program is protected by the MIT licence.
// - The extension is NOT used for any commercial purposes.
// - The extension can only be used on the magyaranime.eu website.
// - The developers are not responsible for any damages caused by the use of the extension.
// - The extension was created in accordance with the "The content on the site is freely available" terms of the Magyar Anime website.
// - The extension was created in accordance with the DMCA rules of the Magyar Anime website. https://magyaranime.eu/web/dmca/
// - The developers (/s) reserve the right to modify the extension at any time.
// - If the developer (/s) of Magyar Anime requests it, I will remove the extension from GitHub and any other platform.
// - The extension is only available in Hungarian.
// - By using the extension you accept the above.
