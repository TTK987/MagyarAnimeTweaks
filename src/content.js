// ---------------------------------------------------------------------------------------------------------------------
var settings = {
    forwardSkip: {
        enabled: true,
        duration: 85,
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        key: "ArrowRight",
    },
    backwardSkip: {
        enabled: true,
        duration: 85,
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        key: "ArrowLeft",
    },
    nextEpisode: {
        enabled: true,
        ctrlKey: false,
        altKey: true,
        shiftKey: false,
        key: "ArrowRight",
    },
    previousEpisode: {
        enabled: true,
        ctrlKey: false,
        altKey: true,
        shiftKey: false,
        key: "ArrowLeft",
    },
    toggleFullscreen: {
        enabled: true,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        key: "f",
    },
    fixNextAndPreviousEpisodeButtons: {
        enabled: true,
    },
    devSettings: {
        enabled: true,
        settings: {
            HotSwapPlayer: {
                enabled: true,
            },
            ConsoleLog: {
                enabled: true,
            },
            DefaultPlayer: {
                player: "plyr", // "html5", "indavideo" or "plyr"
            },
        }
    }

}
// ---------------------------------------------------------------------------------------------------------------------
class ConsoleLogger {
    log(message) {
        if (settings.devSettings.settings.ConsoleLog.enabled) console.log(`[MATweaks]: `+message);
    }
    warn(message) {
        if (settings.devSettings.settings.ConsoleLog.enabled) console.warn(`[MATweaks]: `+message);
    }
    error(message) {
        if (settings.devSettings.settings.ConsoleLog.enabled) console.error(`[MATweaks]: `+message);
    }
}
// ---------------------------------------------------------------------------------------------------------------------
const logger = new ConsoleLogger();
// ---------------------------------------------------------------------------------------------------------------------
function addSettingsButton() {
    var accountMenu = document.querySelector("ul.gen-account-menu");
    if (accountMenu) {
        var settingsButton = document.createElement("li");
        settingsButton.setAttribute("class", "gen-account-menu-item");
        settingsButton.innerHTML = `
            <a class="gen-account-menu-link" id="MATweaks-settings-button">
                <i class="fas fa-cog"></i>
                MATweaks beállítások
            </a>
        `;
        accountMenu.appendChild(settingsButton);
        document.querySelector("#MATweaks-settings-button").addEventListener("click", openSettings);
        logger.log("Settings button added.");
    } else {
        logger.error("Settings button not found and not added.");
    }
}
function openSettings() {
    var settingsWindow = document.querySelector("#MATweaks-settings-window");
    if (settingsWindow) {
        settingsWindow.style.display = "block";
        IsSettingsWindowOpen = true;
        logger.log("Settings window opened.");
    } else {
        createSettingsWindow();
        IsSettingsWindowOpen = true;
        logger.log("Settings window opened.");
    }
}
function createSettingsWindow() {
    var settingsWindow = document.createElement("div");
    settingsWindow.setAttribute("id", "MATweaks-settings-window");
    settingsWindow.setAttribute("class", "MA-Tweaks-settings-popup");
    const forwardSkip = `${settings.forwardSkip.altKey ? 'Alt + ' : ''}${settings.forwardSkip.ctrlKey ? 'Ctrl + ' : ''}${settings.forwardSkip.shiftKey ? 'Shift + ' : ''}${settings.forwardSkip.key}`;
    const backwardSkip = `${settings.backwardSkip.altKey ? 'Alt + ' : ''}${settings.backwardSkip.ctrlKey ? 'Ctrl + ' : ''}${settings.backwardSkip.shiftKey ? 'Shift + ' : ''}${settings.backwardSkip.key}`;
    const nextEpisode = `${settings.nextEpisode.altKey ? 'Alt + ' : ''}${settings.nextEpisode.ctrlKey ? 'Ctrl + ' : ''}${settings.nextEpisode.shiftKey ? 'Shift + ' : ''}${settings.nextEpisode.key}`;
    const previousEpisode = `${settings.previousEpisode.altKey ? 'Alt + ' : ''}${settings.previousEpisode.ctrlKey ? 'Ctrl + ' : ''}${settings.previousEpisode.shiftKey ? 'Shift + ' : ''}${settings.previousEpisode.key}`;
    const toggleFullscreen = `${settings.toggleFullscreen.altKey ? 'Alt + ' : ''}${settings.toggleFullscreen.ctrlKey ? 'Ctrl + ' : ''}${settings.toggleFullscreen.shiftKey ? 'Shift + ' : ''}${settings.toggleFullscreen.key}`;
    settingsWindow.innerHTML = `
        <div class="MA-Tweaks-settings-popup-content">
            <div class="MATweaks-settings-window-header">
                <span class="MATweaks-settings-window-close">&times;</span>
                <h2>MATweaks beállítások</h2>
            </div>
            <div class="MATweaks-settings-window-body">
                <div class="MATweaks-settings-window-body-content">
                    <h3>Általános</h3>
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
                            <p>Fullscreen</p>
                            <div class="MATweaks-settings-window-body-content-item-feature" id="MATweaks-toggleFullscreen">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-toggleFullscreen-enabled">Engedélyezve</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-checkbox" type="checkbox" id="MATweaks-toggleFullscreen-enabled" name="MATweaks-toggleFullscreen-enabled" ${settings.toggleFullscreen.enabled ? "checked" : ""}>
                                <span class="MATweaks-settings-window-body-content-item-feature-checkbox-custom"></span>
                            </div>
                            <div class="MATweaks-settings-window-body-content-item-feature">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-toggleFullscreen-key">Gomb</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-input" type="text" id="MATweaks-toggleFullscreen-key" name="MATweaks-toggleFullscreen-key" value="${toggleFullscreen}">
                            </div>
                        </div>
                        <div class="MATweaks-settings-window-body-content-item">
                            <p>Javítások</p>
                            <div class="MATweaks-settings-window-body-content-item-feature" id="MATweaks-fixNextAndPreviousEpisodeButtons">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-fixNextAndPreviousEpisodeButtons-enabled">Engedélyezve</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-checkbox" type="checkbox" id="MATweaks-fixNextAndPreviousEpisodeButtons-enabled" name="MATweaks-fixNextAndPreviousEpisodeButtons-enabled" ${settings.fixNextAndPreviousEpisodeButtons.enabled ? "checked" : ""}>
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
                            <div class="MATweaks-settings-window-body-content-item-feature" id="MATweaks-devSettings-hotSwapPlayer">
                                <label class="MATweaks-settings-window-body-content-item-feature-label" for="MATweaks-devSettings-HotSwapPlayer-enabled">Hot-swap player</label>
                                <input class="MATweaks-settings-window-body-content-item-feature-checkbox" type="checkbox" id="MATweaks-devSettings-HotSwapPlayer-enabled" name="MATweaks-devSettings-HotSwapPlayer-enabled" ${settings.devSettings.settings.HotSwapPlayer.enabled ? "checked" : ""}>
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
                </div>
            </div>
        </div>
        <style>
        .MATweaks-settings-window-body-content-item-feature {
            display: flex;
            padding: 10px;
            margin-bottom: 12px;
            cursor: pointer;
            font-size: 22px;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            align-content: center;
            align-items: center;
            justify-content: space-between;
        }
        
        .MATweaks-settings-window-body-content-item-feature input {
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }
        
        .MATweaks-settings-window-body-content-item-feature-checkbox-custom {
            height: 30px;
            width: 30px;
            background-color: #000000;
            border-radius: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            align-content: center;
            flex-direction: row;
            flex-wrap: nowrap;
        }
        
        .MATweaks-settings-window-body-content-item-feature:hover input ~ .MATweaks-settings-window-body-content-item-feature-checkbox-custom {
          background-color: #222222;
        }
        
        .MATweaks-settings-window-body-content-item-feature input:checked ~ .MATweaks-settings-window-body-content-item-feature-checkbox-custom {
          background-color: #2b2d30;
        }
        
        .MATweaks-settings-window-body-content-item-feature-checkbox-custom:after {
          content: "";
          display: none;
        }
        
        .MATweaks-settings-window-body-content-item-feature input:checked ~ .MATweaks-settings-window-body-content-item-feature-checkbox-custom:after {
          display: block;
        }
        
        .MATweaks-settings-window-body-content-item-feature .MATweaks-settings-window-body-content-item-feature-checkbox-custom:after {
          content: "✔";
        }
        .MA-Tweaks-settings-popup {
            position: absolute;
            top: 65%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #0a0e17;
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
            background: #0088ff;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 3px 3px 6px 0 #007bff;
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
            background-color: #3f9fff;
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
            background: black;
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
            color: red;
            transition: 0.3s;
        }
        .MATweaks-settings-window-header .MATweaks-settings-window-close:hover {
            color: white;
        }
        </style>
    `;

    document.querySelector("body").appendChild(settingsWindow);
    document.querySelector(".MATweaks-settings-window-close").addEventListener("click", closeSettingsWithouSaving);
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
        toggleFullscreen: {
            enabled: settings.toggleFullscreen.enabled,
            ctrlKey: settings.toggleFullscreen.ctrlKey,
            altKey: settings.toggleFullscreen.altKey,
            shiftKey: settings.toggleFullscreen.shiftKey,
            key: settings.toggleFullscreen.key,
        },
        fixNextAndPreviousEpisodeButtons: {
            enabled: settings.fixNextAndPreviousEpisodeButtons.enabled,
        },
        devSettings: {
            enabled: settings.devSettings.enabled,
            settings: {
                HotSwapPlayer: {
                    enabled: settings.devSettings.settings.HotSwapPlayer.enabled,
                },
                ConsoleLog: {
                    enabled: settings.devSettings.settings.ConsoleLog.enabled,
                },
                DefaultPlayer: {
                    player: settings.devSettings.settings.DefaultPlayer.player,
                },
            }
        }
    };
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
    document.querySelector("#MATweaks-toggleFullscreen").addEventListener("click", (event) => {
        newSettings.toggleFullscreen.enabled = !newSettings.toggleFullscreen.enabled;
        document.querySelector("#MATweaks-toggleFullscreen-enabled").checked = newSettings.toggleFullscreen.enabled;
        if (settings.devSettings.enabled) console.log("toggleFullscreen.enabled: " + newSettings.toggleFullscreen.enabled);
    });
    document.querySelector("#MATweaks-fixNextAndPreviousEpisodeButtons").addEventListener("click", (event) => {
        newSettings.fixNextAndPreviousEpisodeButtons.enabled = !newSettings.fixNextAndPreviousEpisodeButtons.enabled;
        document.querySelector("#MATweaks-fixNextAndPreviousEpisodeButtons-enabled").checked = newSettings.fixNextAndPreviousEpisodeButtons.enabled;
        if (settings.devSettings.enabled) console.log("fixNextAndPreviousEpisodeButtons.enabled: " + newSettings.fixNextAndPreviousEpisodeButtons.enabled);
    });
    document.querySelector("#MATweaks-devSettings").addEventListener("click", (event) => {
        newSettings.devSettings.enabled = !newSettings.devSettings.enabled;
        document.querySelector("#MATweaks-devSettings-enabled").checked = newSettings.devSettings.enabled;
        if (settings.devSettings.enabled) console.log("devSettings.enabled: " + newSettings.devSettings.enabled);
    });
    document.querySelector("#MATweaks-devSettings-hotSwapPlayer").addEventListener("click", (event) => {
        newSettings.devSettings.settings.HotSwapPlayer.enabled = !newSettings.devSettings.settings.HotSwapPlayer.enabled;
        document.querySelector("#MATweaks-devSettings-HotSwapPlayer-enabled").checked = newSettings.devSettings.settings.HotSwapPlayer.enabled;
        if (settings.devSettings.enabled) console.log("devSettings.settings.HotSwapPlayer.enabled: " + newSettings.devSettings.settings.HotSwapPlayer.enabled);
    });
    document.querySelector("#MATweaks-devSettings-ConsoleLog").addEventListener("click", (event) => {
        newSettings.devSettings.settings.ConsoleLog.enabled = !newSettings.devSettings.settings.ConsoleLog.enabled;
        document.querySelector("#MATweaks-devSettings-ConsoleLog-enabled").checked = newSettings.devSettings.settings.ConsoleLog.enabled;
        if (settings.devSettings.enabled) console.log("devSettings.settings.ConsoleLog.enabled: " + newSettings.devSettings.settings.ConsoleLog.enabled);
    });
    document.querySelector("#MATweaks-forwardSkip-duration").addEventListener("change", (event) => {newSettings.forwardSkip.duration = event.target.value;});
    document.querySelector("#MATweaks-backwardSkip-duration").addEventListener("change", (event) => {newSettings.backwardSkip.duration = event.target.value;});
    document.querySelector("#MATweaks-forwardSkip-key").addEventListener("keydown", (event) => {
        newSettings.forwardSkip.key = event.key;
        newSettings.forwardSkip.ctrlKey = event.ctrlKey;
        newSettings.forwardSkip.altKey = event.altKey;
        newSettings.forwardSkip.shiftKey = event.shiftKey;
        event.target.value = `${event.ctrlKey ? "Ctrl + " : ""}${event.altKey ? "Alt + " : ""}${event.shiftKey ? "Shift + " : ""}${event.key}`;
    });
    document.querySelector("#MATweaks-backwardSkip-key").addEventListener("keydown", (event) => {
        newSettings.backwardSkip.key = event.key;
        newSettings.backwardSkip.ctrlKey = event.ctrlKey;
        newSettings.backwardSkip.altKey = event.altKey;
        newSettings.backwardSkip.shiftKey = event.shiftKey;
        event.target.value = `${event.ctrlKey ? "Ctrl + " : ""}${event.altKey ? "Alt + " : ""}${event.shiftKey ? "Shift + " : ""}${event.key}`;
    });
    document.querySelector("#MATweaks-nextEpisode-key").addEventListener("keydown", (event) => {
        newSettings.nextEpisode.key = event.key;
        newSettings.nextEpisode.ctrlKey = event.ctrlKey;
        newSettings.nextEpisode.altKey = event.altKey;
        newSettings.nextEpisode.shiftKey = event.shiftKey;
        event.target.value = `${event.ctrlKey ? "Ctrl + " : ""}${event.altKey ? "Alt + " : ""}${event.shiftKey ? "Shift + " : ""}${event.key}`;
    });
    document.querySelector("#MATweaks-previousEpisode-key").addEventListener("keydown", (event) => {
        newSettings.previousEpisode.key = event.key;
        newSettings.previousEpisode.ctrlKey = event.ctrlKey;
        newSettings.previousEpisode.altKey = event.altKey;
        newSettings.previousEpisode.shiftKey = event.shiftKey;
        event.target.value = `${event.ctrlKey ? "Ctrl + " : ""}${event.altKey ? "Alt + " : ""}${event.shiftKey ? "Shift + " : ""}${event.key}`;
    });
    document.querySelector("#MATweaks-toggleFullscreen-key").addEventListener("keydown", (event) => {
        newSettings.toggleFullscreen.key = event.key;
        newSettings.toggleFullscreen.ctrlKey = event.ctrlKey;
        newSettings.toggleFullscreen.altKey = event.altKey;
        newSettings.toggleFullscreen.shiftKey = event.shiftKey;
        event.target.value = `${event.ctrlKey ? "Ctrl + " : ""}${event.altKey ? "Alt + " : ""}${event.shiftKey ? "Shift + " : ""}${event.key}`;
    });
    document.querySelector("#MATweaks-devSettings-DefaultPlayer-player").addEventListener("change", (event) => {newSettings.devSettings.settings.DefaultPlayer.player = event.target.value;});
    document.querySelector("#MATweaks-settings-window-body-content-buttons-button-save").addEventListener("click", () => {closeSettings(newSettings);} );
    document.querySelector("#MATweaks-settings-window-body-content-buttons-button-cancel").addEventListener("click", closeSettingsWithouSaving);
    logger.log("Settings window created.");
}
function saveSettings() {
    localStorage.setItem("MATweaks.settings", JSON.stringify(settings));
    loadSettings();
    logger.log("Settings saved.");
}
function closeSettings(newSettings) {
    var settingsWindow = document.querySelector("#MATweaks-settings-window");
    if (settingsWindow) {
        settingsWindow.style.display = "none";
        settings = newSettings;
        saveSettings();
        window.location.reload();
        logger.log("Settings window closed.");
    }
    logger.error("Settings window not found and not closed.");
}
function closeSettingsWithouSaving() {
    var settingsWindow = document.querySelector("#MATweaks-settings-window");
    if (settingsWindow) {
        settingsWindow.style.display = "none";
        logger.log("Settings window closed without saving.");
    }
    logger.error("Settings window not found and not closed.");
}
function receiveMessage(event) {
    if (event.data && event.data.plugin === "MATweaks") {
        if (event.data.type === "iframeLoaded") {
            var iframe = document.querySelector('iframe[src*="embed.indavideo.hu"]')
            iframe.contentWindow.postMessage({"plugin": "MATweaks", "type": "getSourceUrl"}, "*");
            logger.log("Indavideo iframe loaded.");
        } else if (event.data.type === "sourceUrl") {
            logger.log("Indavideo source URL received. Url: " + event.data.data["720p"] + "And:" + event.data.data["360p"]);
            if (settings.devSettings.enabled && settings.devSettings.settings.DefaultPlayer.player === "indavideo") {
            } else {
                replaceIFrame(event.data.data["360p"], event.data.data["720p"]);
            }
        }
    }
}
function replaceIFrame(SourceUrl360p, SourceUrl720p) {
    if (SourceUrl720p === false && SourceUrl360p === false) {
        logger.error("No video source URL found.");
        var error = document.createElement("p");
        error.setAttribute("class", "MATweaks-error");
        error.innerHTML = "[MATweaks] Hiba történt a videó lejátszása közben. Kérlek próbáld újra.";
        error.style.color = "red";
        error.style.fontSize = "xx-large";
        var iframe = document.querySelector('iframe[src*="embed.indavideo.hu"]')
        iframe.parentNode.replaceChild(error, iframe);
        return false;
    }
    var videoElement = document.createElement("video");
    videoElement.setAttribute("autoplay", "autoplay");
    videoElement.setAttribute("src", SourceUrl720p || SourceUrl360p);
    videoElement.setAttribute("type", 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
    videoElement.setAttribute("playsinline", "");
    videoElement.setAttribute("controls", "");
    videoElement.setAttribute("preload", "metadata");
    videoElement.setAttribute("id", "video");
    var iframe = document.querySelector('iframe[src*="embed.indavideo.hu"]')
    iframe.parentNode.replaceChild(videoElement, iframe);
    if ((settings.devSettings.settings.DefaultPlayer.player === "plyr" && settings.devSettings.enabled) || !settings.devSettings.enabled) {
        var qualityOptions = [];
        if (SourceUrl720p) qualityOptions.push(720);
        if (SourceUrl360p) qualityOptions.push(360);
        videoElement.setAttribute("class", "plyr--video");
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
                default: qualityOptions.includes(720) ? 720 : 360,
                options: qualityOptions,
                forced: true,
                onChange: (quality) => {
                    if (quality === 720) {
                        document.querySelector("video").setAttribute("src", SourceUrl720p);
                    } else if (quality === 360) {
                        document.querySelector("video").setAttribute("src", SourceUrl360p);
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
        addShortcutsToPlayer(video);
        addDownloadButton(SourceUrl720p || SourceUrl360p);
        fixplyrbuffer();
    } else if (settings.devSettings.settings.DefaultPlayer.player === "html5" && settings.devSettings.enabled) {
        logger.log("Creating a html5 player.");
        return true;
    }
    logger.log("Indavideo iframe replaced with a video element.");

}
function skipForward(video) {
    if (video === null) video = document.querySelector("video");
    video.currentTime += settings.forwardSkip.duration;
    logger.log("Skipped forward " + settings.forwardSkip.duration + " seconds.");
}
function skipBackward(video) {
    if (video === null) video = document.querySelector("video");
    video.currentTime -= settings.backwardSkip.duration;
    logger.log("Skipped backward " + settings.backwardSkip.duration + " seconds.");
}
function nextEpisode() {
    var nextEpisodeButton = document.querySelector(".gomb.bg-green");
    if (nextEpisodeButton) nextEpisodeButton.click();
    logger.log("Moved to the next episode.");
}
function previousEpisode() {
    var previousEpisodeButton = document.querySelector(".gomb.bg-orange");
    if (previousEpisodeButton) previousEpisodeButton.click();
    logger.log("Moved to the previous episode.");
}
function fixNextAndPreviousEpisodeButtons() {
    var currentLocation = window.location.href;
    if (currentLocation.includes("/resz-1080p/")) {
        var nextEpisodeButton = document.querySelector(".gomb.bg-green");
        var previousEpisodeButton = document.querySelector(".gomb.bg-orange");
        if (nextEpisodeButton) {
            var nextEpisodeUrl = nextEpisodeButton.href;
            nextEpisodeUrl = nextEpisodeUrl.replace("/resz/", "/resz-1080p/");
            nextEpisodeButton.href = nextEpisodeUrl;
            console.log("Next episode button fixed.");
        } else {
            logger.log("Next episode button not found.");
        }
        if (previousEpisodeButton) {
            var previousEpisodeUrl = previousEpisodeButton.href;
            previousEpisodeUrl = previousEpisodeUrl.replace("/resz/", "/resz-1080p/");
            previousEpisodeButton.href = previousEpisodeUrl;
            logger.log("Previous episode button fixed.");
        } else {
            logger.log("Previous episode button not found.");
        }
        var episodeLinks = document.querySelectorAll(".epizod_link_normal");
        episodeLinks.forEach((episodeLink) => {
            var episodeUrl = episodeLink.href;
            episodeUrl = episodeUrl.replace("/resz/", "/resz-1080p/");
            episodeLink.href = episodeUrl;
        });
    } else {
        logger.log("Next and previous episode buttons are already redirecting to the correct URL.");
    }
}
var downloadInProgress = false;
async function downloadFile(url, filename) {
    // Check if there is already a download in progress.
    if (downloadInProgress) {
        logger.error("Download already in progress.");
        return false;
    }
    try {
        const response = await fetch(url);
        const contentLength = response.headers.get('content-length');
        const total = parseInt(contentLength, 10);
        let loaded = 0;
        var downloadProgressBar = document.querySelector("#download-progress-bar");
        var downloadProgressBarText = document.querySelector("#download-progress-bar-text");
        var downloadProgressBarcontainer = document.querySelector(".download-progress-bar-container");
        downloadProgressBar.setAttribute("max", total);
        downloadProgressBarcontainer.style.display = "block";
        downloadInProgress = true;
        const reader = response.body.getReader();
        const stream = new ReadableStream({
            start(controller) {
                function pump() {
                    return reader.read().then(({ done, value }) => {
                        if (done) {
                            controller.close();
                            return;
                        }
                        loaded += value.byteLength;
                        LogDownloadProgress(total, loaded);

                        controller.enqueue(value);
                        return pump();
                    });
                }
                return pump();
            }
        });
        const blob = await new Response(stream).blob();
        const objectUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        downloadProgressBarcontainer.style.display = "none";
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
        logger.log(`Download finished: "${filename}"`);
        downloadInProgress = false;
    } catch (error) {
        logger.error(`Download failed: ${error}`);
        downloadInProgress = false;
    }
}
lastLogTime =  0;
function LogDownloadProgress(max, loaded) {
    if (Date.now() - lastLogTime < 1000) /* Update every second */ {
        return;
    } else {
        lastLogTime = Date.now();
    }
    var downloadProgressBar = document.querySelector("#download-progress-bar");
    var downloadProgressBarText = document.querySelector("#download-progress-bar-text");
    downloadProgressBar.setAttribute("value", loaded);
    downloadProgressBarText.innerHTML = `${((loaded / max) * 100).toPrecision(5)}% (${(loaded / 1000000).toPrecision(5)} MB / ${(max / 1000000).toPrecision(5)} MB)`;
    logger.log(`Downloaded ${(loaded / 1000000).toPrecision(5)} MB of ${(max / 1000000).toPrecision(5)} MB`);

}
function addShortcutsToPage_NoPlyr() {
    document.addEventListener("keydown", (event) => {
        var isCtrl = event.ctrlKey;
        var isAlt = event.altKey;
        var isShift = event.shiftKey;
        var key = event.key;
        if (settings.nextEpisode.enabled &&
            IsSettingsWindowOpen === false &&
            isCtrl === settings.nextEpisode.ctrlKey &&
            isAlt === settings.nextEpisode.altKey &&
            isShift === settings.nextEpisode.shiftKey &&
            key === settings.nextEpisode.key) {
            nextEpisode();
            return true;
        } else if (
            settings.previousEpisode.enabled &&
            IsSettingsWindowOpen === false &&
            isCtrl === settings.previousEpisode.ctrlKey &&
            isAlt === settings.previousEpisode.altKey &&
            isShift === settings.previousEpisode.shiftKey &&
            key === settings.previousEpisode.key) {
            previousEpisode();
            return true;
        }
        return false;
    });
}
function addShortcutsToPlayer(player) {
    player.on("keydown", (event) => {
        var isCtrl = event.ctrlKey;
        var isAlt = event.altKey;
        var isShift = event.shiftKey;
        var key = event.key;
        if (settings.forwardSkip.enabled &&
            isCtrl === settings.forwardSkip.ctrlKey &&
            isAlt === settings.forwardSkip.altKey &&
            isShift === settings.forwardSkip.shiftKey &&
            key === settings.forwardSkip.key &&
            IsSettingsWindowOpen === false) {
            skipForward(player)
        } else if (settings.backwardSkip.enabled &&
            isCtrl === settings.backwardSkip.ctrlKey &&
            isAlt === settings.backwardSkip.altKey &&
            isShift === settings.backwardSkip.shiftKey &&
            key === settings.backwardSkip.key &&
            IsSettingsWindowOpen === false) {
            skipBackward(player);
        } else if (settings.nextEpisode.enabled &&
            isCtrl === settings.nextEpisode.ctrlKey &&
            isAlt === settings.nextEpisode.altKey &&
            isShift === settings.nextEpisode.shiftKey &&
            key === settings.nextEpisode.key &&
            IsSettingsWindowOpen === false) {
            nextEpisode();
        } else if (settings.previousEpisode.enabled &&
            isCtrl === settings.previousEpisode.ctrlKey &&
            isAlt === settings.previousEpisode.altKey &&
            isShift === settings.previousEpisode.shiftKey &&
            key === settings.previousEpisode.key &&
            IsSettingsWindowOpen === false) {
            previousEpisode();
        }
    });
    logger.log("Shortcuts added to the player.");

}
function addDownloadButton(url) {
    var downloadButton = document.querySelector("#tryideput > div > div.plyr__controls > a")
    downloadButton.href = "";
    downloadButton.addEventListener("click", function (event) {
        event.preventDefault();
        logger.log("Download requested.");
        downloadFile(url, document.title + ".mp4");
    });
    var downloadProgressBarContainer = document.createElement("div");
    downloadProgressBarContainer.setAttribute("class", "download-progress-bar-container");
    downloadProgressBarContainer.innerHTML = `
        <progress id="download-progress-bar" value="0" max="100"></progress>
        <p id="download-progress-bar-text">0% (0 MB / 0 MB)</p>
    `;
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
    document.querySelector("head").appendChild(style);
    var videoPlayer = document.querySelector(".plyr--video");
    videoPlayer.parentNode.insertBefore(downloadProgressBarContainer, videoPlayer.nextSibling);
    logger.log("Download button fixed.");
}
function fixplyrbuffer() {
    var plyrbuffer = document.querySelector(".plyr__progress__buffer");
    if (plyrbuffer) {
        plyrbuffer.style.top = "9.5px";
        logger.log("plyrbuffer fixed.");
    } else {
        logger.error("plyrbuffer not found.");
    }
}
function loadSettings() {
    var loadedSettings = localStorage.getItem("MATweaks.settings");
    if (loadedSettings) {
        settings = JSON.parse(loadedSettings);
        logger.log("Settings loaded.");
    }
}
// ---------------------------------------------------------------------------------------------------------------------
// Load settings from localStorage.
loadSettings();
console.log(settings);
// ---------------------------------------------------------------------------------------------------------------------
// Variable to keep track of the settings window.
var IsSettingsWindowOpen = false;
// ---------------------------------------------------------------------------------------------------------------------
// Add a listener to the page for messages from the indavideo.hu player.
window.addEventListener("message", receiveMessage, false);
// ---------------------------------------------------------------------------------------------------------------------
// Add function to the page depending on the settings.
if (settings.fixNextAndPreviousEpisodeButtons.enabled) fixNextAndPreviousEpisodeButtons();
if (settings.devSettings.enabled) {
    if (settings.devSettings.settings.HotSwapPlayer.enabled) {} // TODO: Add hot-swap player.
}
addShortcutsToPage_NoPlyr();
addSettingsButton();
// ---------------------------------------------------------------------------------------------------------------------
// COPYRIGHT NOTICE:
// This code is part of the "MA Tweaks" extension for MagyarAnime.eu.
// The extension is not affiliated with MagyarAnime.eu in any way.
// The extension is not affiliated with Indavideo.hu in any way.
// The extension is not affiliated with Mega.nz in any way.
// The extension is not affiliated with any of the fansub groups in any way.
// This project is not used for commercial purposes.
// This project is under the MIT licence.
