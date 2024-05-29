let MAT = window.MAT;
let settings =  MAT.getDefaultSettings();
let logger = window.MATLogger;

/**
 * Function to save the settings to the storage
 * @param {Object} newSettings - The settings to save
 */
function saveSettings(newSettings) {
    settings = Object.assign(settings, newSettings);
    MAT.setSettings(settings);
    MAT.saveSettings();
}

/**
 * Function to load the settings from the storage and set the settings variable
 */
function loadSettings() {
    MAT.loadSettings().then((data) => {
        settings = data;
        logger.log("Settings loaded!");
        if (settings.advanced.enabled && settings.advanced.settings.ConsoleLog.enabled) logger.enable();
    }).catch((error) => {
        logger.error(error);
    });
}


/**
 * Function to reset the settings to the default values
 */
function resetSettings() {
    settings = MAT.getDefaultSettings();
    saveSettings(settings);
}

/**
 * Function to add event listeners to each setting input
 */
function addEventListeners() {
    handleCancel();
    handleSave();
    handleReset();
    handleSetting("forwardSkip", "frwdskp");
    handleSetting("backwardSkip", "bckwrdskp");
    handleSetting("nextEpisode", "nxtep");
    handleSetting("previousEpisode", "prvsep");
    handleSetting("autoNextEpisode", "autoep");
    handleSetting("autoplay", "autoplay");
    handleDeveloperSettings();
    handleDownloadName();
    handlePlyrSettings();
}
/**
 * Function to handle download name settings
 */
function handleDownloadName() {
    const downloadName = document.querySelector(".download-name textarea");
    downloadName.addEventListener("change", () => {
        if (downloadName.value.length > 0) {
            downloadName.value = downloadName.value.replace(/[/\\?*:|"<>]/g, '_');
            settings.advanced.downloadName = downloadName.value;
            logger.log("Download name: " + settings.advanced.downloadName);
        }
    });
}

/**
 * Function to handle plyr settings
 */
function handlePlyrSettings() {
    const plyrCheckbox = document.querySelector(".plyr-setting .checkbox");
    const svgColor = document.querySelector(".plyr-setting .color #plyr-design-svg-color");
    const hoverBGColor = document.querySelector(".plyr-setting .color #plyr-design-hover-bg-color");
    const mainColor = document.querySelector(".plyr-setting .color #plyr-design-main-color");
    const hoverColor = document.querySelector(".plyr-setting .color #plyr-design-hover-color");
    const svgOpacity = document.querySelector(".plyr-setting .color #plyr-design-svg-opacity");
    const hoverBGOpacity = document.querySelector(".plyr-setting .color #plyr-design-hover-bg-opacity");
    const mainOpacity = document.querySelector(".plyr-setting .color #plyr-design-main-opacity");
    const hoverOpacity = document.querySelector(".plyr-setting .color #plyr-design-hover-opacity");
    plyrCheckbox.addEventListener("click", () => {
        let input = plyrCheckbox.querySelector("input");
        input.checked = !input.checked;
        settings.advanced.plyr.design.enabled = input.checked;
        logger.log("Plyr design enabled: " + settings.advanced.plyr.design.enabled);
    });
    svgColor.addEventListener("input", () => {
        let color = combineColors(svgColor.value, svgOpacity.value);
        settings.advanced.plyr.design.settings.svgColor = color;
        window.document.documentElement.style.setProperty("--plyr-video-control-color", color);
        logger.log("Plyr svg color modified");
    });
    svgOpacity.addEventListener("change", () => {
        let color = combineColors(svgColor.value, svgOpacity.value);
        settings.advanced.plyr.design.settings.svgColor = color;
        window.document.documentElement.style.setProperty("--plyr-video-control-color", color);
        logger.log("Plyr svg color modified");
    });
    hoverBGColor.addEventListener("input", () => {
        let color = combineColors(hoverBGColor.value, hoverBGOpacity.value);
        settings.advanced.plyr.design.settings.hoverBGColor = color;
        window.document.documentElement.style.setProperty("--plyr-video-control-background-hover", color);
        logger.log("Plyr hover background color modified");
    });
    hoverBGOpacity.addEventListener("change", () => {
        let color = combineColors(hoverBGColor.value, hoverBGOpacity.value);
        settings.advanced.plyr.design.settings.hoverBGColor = color;
        window.document.documentElement.style.setProperty("--plyr-video-control-background-hover", color);
        logger.log("Plyr hover background color modified");
    });
    mainColor.addEventListener("input", () => {
        let color = combineColors(mainColor.value, mainOpacity.value);
        settings.advanced.plyr.design.settings.mainColor = color;
        window.document.documentElement.style.setProperty("--plyr-color-main", color);
        logger.log("Plyr main color modified");
    });
    mainOpacity.addEventListener("change", () => {
        let color = combineColors(mainColor.value, mainOpacity.value);
        settings.advanced.plyr.design.settings.mainColor = color;
        window.document.documentElement.style.setProperty("--plyr-color-main", color);
        logger.log("Plyr main color modified");
    });
    hoverColor.addEventListener("input", () => {
        let color = combineColors(hoverColor.value, hoverOpacity.value);
        settings.advanced.plyr.design.settings.hoverColor = color;
        window.document.documentElement.style.setProperty("--plyr-video-control-color-hover", color);
        logger.log("Plyr hover color modified");
    });
    hoverOpacity.addEventListener("change", () => {
        let color = combineColors(hoverColor.value, hoverOpacity.value);
        settings.advanced.plyr.design.settings.hoverColor = color;
        window.document.documentElement.style.setProperty("--plyr-video-control-color-hover", color);
        logger.log("Plyr hover color modified");
    });
}

/**
 * Function to handle the developer settings
 */
function handleDeveloperSettings() {
    const developerCheckbox = document.querySelector(".dev .checkbox");
    const consoleLogCheckbox = document.querySelector(".dev .console-log .checkbox");
    const defaultPlayer = document.querySelector(".dev .default-player select");
    developerCheckbox.addEventListener("click", () => {
        let input = developerCheckbox.querySelector("input");
        input.checked = !input.checked;
        settings.advanced.enabled = input.checked;
        logger.log("Developer settings enabled: " + settings.advanced.enabled);
    });
    consoleLogCheckbox.addEventListener("click", () => {
        let input = consoleLogCheckbox.querySelector("input");
        input.checked = !input.checked;
        settings.advanced.settings.ConsoleLog.enabled = input.checked;
        if (settings.advanced.enabled) {
            logger.enabled = input.checked;
        }
        logger.log("Console log enabled: " + settings.advanced.settings.ConsoleLog.enabled);
    });
    defaultPlayer.addEventListener("change", () => {
        settings.advanced.settings.DefaultPlayer.player = defaultPlayer.value;
        logger.log("Default player: " + settings.advanced.settings.DefaultPlayer.player);
    });

}

/**
 * Function to handle cancel button
 */
function handleCancel() {
    const cancelButton = document.getElementById("cancel");
    cancelButton.addEventListener("click", () => {
        // reset settings to the user's last saved settings
        loadSettings();
        setUpSettings();
        setResult("A beállítások visszaállítva az utolsó mentett értékekre!")
    });
}

/**
 * Function to handle save button
 */
function handleSave() {
    const saveButton = document.getElementById("save");
    saveButton.addEventListener("click", () => {
        saveSettings(settings);
        loadSettings();
        setUpSettings();
        setResult("A beállítások elmentve!");
    });
}

/**
 * Function to handle reset button
 */
function handleReset() {
    const resetButton = document.getElementById("reset");
    resetButton.addEventListener("click", () => {
        resetSettings();
        setUpSettings();
        setResult("A beállítások visszaállítva az alapértelmezett értékekre!");
    });
}

/**
 * Function to handle setting
 * @param {string} settingName - The name of the setting
 * @param {string} elements - The elements of the setting
 * @example handleSetting("forwardSkip", document.querySelectorAll(".frwdskp"));
 */
function handleSetting(settingName, elements) {
    const checkbox = document.querySelector(`.${elements} .checkbox`);
    const duration = document.querySelector(`.${elements} .duration input`);
    const key = document.querySelector(`.${elements} .key input`);

    checkbox.addEventListener("click", () => {
        let input = checkbox.querySelector("input");
        input.checked = !input.checked;
        settings[settingName].enabled = input.checked;
        logger.log(`${settingName} enabled: ${settings[settingName].enabled}`);
    });

    if (duration) {
        duration.addEventListener("change", () => {
            settings[settingName].time = duration.value;
            logger.log(`${settingName} duration: ${settings[settingName].time}`);
        });
    }

    if (key) {
        key.addEventListener("keydown", (event) => {
            event.preventDefault();
            setText(event, key);
            setKeySettings(event, settings[settingName]);
            logger.log(`${settingName} key: Key: ${settings[settingName].key} Ctrl: ${settings[settingName].ctrlKey} Alt: ${settings[settingName].altKey} Shift: ${settings[settingName].shiftKey}`);
        });
    }
}





/**
 * Helper function to combine colors and opacities to a rgba string
 * @param {string} color - The color
 * @param {number} opacity - The opacity
 * @returns {string} The rgba string (e.g. #aabbccdd)
 * @example combineColors("#ffffff", 0.5) // returns #ffffff80
 */
function combineColors(color, opacity) {
    return color + Math.round(opacity * 255).toString(16);
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
 * Function to set the key settings
 * @param {Event} event - The keydown event
 * @param {Object} setting - The setting to change
 */
function setKeySettings(event, setting) {
    setting.ctrlKey = event.ctrlKey;
    setting.altKey = event.altKey;
    setting.shiftKey = event.shiftKey;
    setting.key = event.key;
}



/**
 * Function to set up a single setting
 * @param {string} settingName - The name of the setting
 * @param {string} elements - The elements of the setting
 */
function setUpSetting(settingName, elements) {
    const checkbox = document.querySelector(`.${elements} .checkbox input`);
    const duration = document.querySelector(`.${elements} .duration input`);
    const key = document.querySelector(`.${elements} .key input`);

    checkbox.checked = settings[settingName].enabled;

    if (duration) {
        duration.value = settings[settingName].time;
    }

    if (key) {
        setText(settings[settingName], key);
    }
}
/**
 * Function to set up the settings page
 */
function setUpSettings() {
    // Forward skip settings
    setUpSetting("forwardSkip", "frwdskp");

    // Backward skip settings
    setUpSetting("backwardSkip", "bckwrdskp");

    // Next episode settings
    setUpSetting("nextEpisode", "nxtep");

    // Previous episode settings
    setUpSetting("previousEpisode", "prvsep");

    // Auto next episode settings
    setUpSetting("autoNextEpisode", "autoep");

    // Autoplay settings
    setUpSetting("autoplay", "autoplay")

    // Developer settings
    const developerCheckbox = document.querySelector(".dev .checkbox input");
    const consoleLogCheckbox = document.querySelector(".dev .console-log .checkbox input");
    const defaultPlayer = document.querySelector(".dev .default-player select");
    developerCheckbox.checked = settings.advanced.enabled;
    consoleLogCheckbox.checked = settings.advanced.settings.ConsoleLog.enabled;
    defaultPlayer.value = settings.advanced.settings.DefaultPlayer.player;


    // Download name settings
    const downloadName = document.getElementById("download-name");
    downloadName.value = settings.advanced.downloadName;

    // Plyr settings
    const plyrCheckbox =   document.querySelector(".plyr-setting .checkbox input");
    const svgColor =       document.querySelector(".plyr-setting .color #plyr-design-svg-color");
    const hoverBGColor =   document.querySelector(".plyr-setting .color #plyr-design-hover-bg-color");
    const mainColor =      document.querySelector(".plyr-setting .color #plyr-design-main-color");
    const hoverColor =     document.querySelector(".plyr-setting .color #plyr-design-hover-color");
    const svgOpacity =     document.querySelector(".plyr-setting .color #plyr-design-svg-opacity");
    const hoverBGOpacity = document.querySelector(".plyr-setting .color #plyr-design-hover-bg-opacity");
    const mainOpacity =    document.querySelector(".plyr-setting .color #plyr-design-main-opacity");
    const hoverOpacity =   document.querySelector(".plyr-setting .color #plyr-design-hover-opacity");
    plyrCheckbox.checked = settings.advanced.plyr.design.enabled;
    svgColor.value =       separateColors(settings.advanced.plyr.design.settings.svgColor).color;
    hoverBGColor.value =   separateColors(settings.advanced.plyr.design.settings.hoverBGColor).color;
    mainColor.value =      separateColors(settings.advanced.plyr.design.settings.mainColor).color;
    hoverColor.value =     separateColors(settings.advanced.plyr.design.settings.hoverColor).color;
    svgOpacity.value =     separateColors(settings.advanced.plyr.design.settings.svgColor).opacity;
    hoverBGOpacity.value = separateColors(settings.advanced.plyr.design.settings.hoverBGColor).opacity;
    mainOpacity.value =    separateColors(settings.advanced.plyr.design.settings.mainColor).opacity;
    hoverOpacity.value =   separateColors(settings.advanced.plyr.design.settings.hoverColor).opacity;
    window.document.documentElement.style.setProperty("--plyr-video-control-color", settings.advanced.plyr.design.settings.svgColor);
    window.document.documentElement.style.setProperty("--plyr-video-control-background-hover", settings.advanced.plyr.design.settings.hoverBGColor);
    window.document.documentElement.style.setProperty("--plyr-color-main", settings.advanced.plyr.design.settings.mainColor);
    window.document.documentElement.style.setProperty("--plyr-video-control-color-hover", settings.advanced.plyr.design.settings.hoverColor);

    if (settings.eap) {
        document.querySelectorAll(".eap").forEach((element) => {
            element.style.display = "inline";
        });
    }
    document.getElementById("version").innerText = `v${settings.version}`;
}

/**
 * Function to set the result of the current action
 */
function setResult(result) {
    const resultElement = document.getElementById("result");
    resultElement.innerText = result;
    resultElement.style.display = "block";
    setTimeout(() => {
        resultElement.style.display = "none";
    }, 3000);
}

/**
 * Function to separate colors and opacities from a rgba string
 * @param {string} color - The rgba string
 * @returns {Object} The color and opacity
 * @example separateColors("#ffffffff") // returns {color: "#ffffff", opacity: 1}
 */
function separateColors(color) {
    return {color: color.slice(0, -2), opacity: parseInt(color.slice(-2), 16) / 255};
}

window.addEventListener("load", () => {
    addEventListeners();
    setUpSettings();
    let player = new Plyr('video', {
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
        speed: {
            selected: 1,
            options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
        },
    });
});
loadSettings();

// In case there is someone who wants to mess with the settings from the console :)
window.saveSettings = saveSettings;
window.loadSettings = loadSettings;
window.resetSettings = resetSettings;
window.setUpSettings = setUpSettings; // <- Reloads the settings page with the current settings (useful when the settings are changed)
window.reload = e => {window.location.reload(); } // <- Reloads the page
window.settings = settings;
window.logger = logger; // The same as window.MATLogger

