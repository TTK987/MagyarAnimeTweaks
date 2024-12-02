import {footer, header} from "../commons";
import {Popup, MAT, MA, Logger} from "../../API";
let currentSettings = MAT.getSettings();
function init() {
    document.body.innerHTML = `
        ${header('options')}
        <main>
            <div class="container">
                <div id="settings">
                    ${renderSettings()}
                </div>
                <div id="advanced">
                    <h2>Haladó beállítások</h2>
                    ${renderAdvancedSettings()}
                </div>
            </div>
        </main>
        ${footer()}
    `;
}
function addMenu() {
    const menu = document.createElement('div');
    menu.id = 'menu';
    menu.innerHTML = `
        <button id="save">Mentés</button>
        <button id="reset">Visszaállítás</button>
        <button id="default">Alapértelmezett</button>
        <button id="help">Segítség</button>
    `;
    document.body.appendChild(menu);
    document.getElementById('save').onclick = function () {
        MAT.setSettings(currentSettings);
        MAT.saveSettings();
        resetPage();
        Popup.showSuccessPopup('Beállítások mentve');
        Logger.log('Settings saved');
    };
    document.getElementById('reset').onclick = function () {
        MAT.loadSettings().then((data) => {
            currentSettings = data;
            resetPage();
            Popup.showSuccessPopup('Beállítások visszaállítva');
            Logger.log('Settings reset');
        });
    };
    document.getElementById('default').onclick = function () {
        MAT.setSettings(MAT.getDefaultSettings()); // Black magic here...
        currentSettings = MAT.getSettings();
        resetPage();
        Popup.showSuccessPopup('Beállítások alapértelmezettre állítva');
        Logger.log('Settings set to default');
    };
    document.getElementById('help').onclick = function () {
        chrome.tabs.create({url: 'https://github.com/TTK987/MagyarAnimeTweaks/blob/main/SETTINGS.md'});
    }
}
function separateColors(color) {
    return {color: color.slice(0, -2), opacity: parseInt(color.slice(-2), 16) / 255};
}
function renderAdvancedSettings() {
    return `
        <label class="toggle-control checkbox" for="advanced-enabled">
            <input type="checkbox" id="advanced-enabled" ${currentSettings.advanced.enabled ? "checked" : ""} hidden>
            <span class="control"></span> Ki/Be kapcsolás
        </label>
        <div class="setting console-log ${currentSettings.advanced.settings.ConsoleLog.enabled ? '' : 'dimmer'}">
            <h3>Console log</h3>
            <label class="toggle-control checkbox" for="console-log-enabled">
                <input type="checkbox" id="console-log-enabled" ${currentSettings.advanced.settings.ConsoleLog.enabled ? "checked" : ""} hidden>
                <span class="control"></span> Ki/Be kapcsolás
            </label>
        </div>
        <div class="setting default-player ${currentSettings.advanced.settings.DefaultPlayer.player === 'plyr' ? '' : 'dimmer'}">
            <h3>Alapértelmezett lejátszó</h3>
            <label for="default-player">Lejátszó</label>
            <select id="default-player">
                <option value="plyr" ${currentSettings.advanced.settings.DefaultPlayer.player === 'plyr' ? 'selected' : ''}>Plyr</option>
                <option value="default" ${currentSettings.advanced.settings.DefaultPlayer.player === 'default' ? 'selected' : ''}>Alapértelmezett</option>
            </select>
            <p>Lényegében kikapcsolja a bővítményt, ha az alapértelmezett lejátszó van használva.</p>
        </div>
        <div class="setting dlname">
            <h3>Letöltési név</h3>
            <label for="download-name">Fájlnév sablon</label>
            <textarea id="download-name" rows="1" cols="30" maxlength="100" placeholder="%title% - %episode%.rész (%MAT%)">${currentSettings.advanced.downloadName}</textarea>
            <p>Az alábbi változókat használhatod:</p>
            <ul>
                <li>%title% - Az anime címe</li>
                <li>%episode% - Az epizód sorszáma</li>
                <li>%0episode% - Az epizód sorszáma vezető nullával (pl. "1" helyett "01")</li>
                <li>%MAT% - "MATweaks" szöveg</li>
                <li>%source% - Forrás neve (pl. "indavideo")</li>
                <li>%quality% - A videó minősége (pl. "720p")</li>
                <li>%fansub% - Fansub csoport neve</li>
            </ul>
        </div>
        <div class="setting plyr-setting ${currentSettings.advanced.plyr.design.enabled ? '' : 'dimmer'}">
            <h3>Plyr kinézet</h3>
            <label class="toggle-control checkbox" for="plyr-design-enabled">
                <input type="checkbox" id="plyr-design-enabled" ${currentSettings.advanced.plyr.design.enabled ? "checked" : ""} hidden>
                <span class="control"></span> Ki/Be kapcsolás
            </label>
            <div class="color">
                <label for="plyr-video-control-color">SVG szín</label>
                <input type="color" data-id="svgColor" id="plyr-video-control-color" value="${separateColors(currentSettings.advanced.plyr.design.settings.svgColor).color}" ${currentSettings.advanced.plyr.design.enabled ? '' : 'disabled'}>
                <input type="range" data-id="svgColor" id="plyr-video-control-color" min="0" max="1" step="0.1" value="${separateColors(currentSettings.advanced.plyr.design.settings.svgColor).opacity}" ${currentSettings.advanced.plyr.design.enabled ? '' : 'disabled'}>
            </div>
            <div class="color">
                <label for="plyr-video-control-background-hover">Háttérszín</label>
                <input type="color" data-id="hoverBGColor" id="plyr-video-control-background-hover" value="${separateColors(currentSettings.advanced.plyr.design.settings.hoverBGColor).color}" ${currentSettings.advanced.plyr.design.enabled ? '' : 'disabled'}>
                <input type="range" data-id="hoverBGColor" id="plyr-video-control-background-hover" min="0" max="1" step="0.1" value="${separateColors(currentSettings.advanced.plyr.design.settings.hoverBGColor).opacity}" ${currentSettings.advanced.plyr.design.enabled ? '' : 'disabled'}>
            </div>
            <div class="color">
                <label for="plyr-color-main">Főszín</label>
                <input type="color" data-id="mainColor" id="plyr-color-main" value="${separateColors(currentSettings.advanced.plyr.design.settings.mainColor).color}" ${currentSettings.advanced.plyr.design.enabled ? '' : 'disabled'}>
                <input type="range" data-id="mainColor" id="plyr-color-main" min="0" max="1" step="0.1" value="${separateColors(currentSettings.advanced.plyr.design.settings.mainColor).opacity}" ${currentSettings.advanced.plyr.design.enabled ? '' : 'disabled'}>
            </div>
            <div class="color">
                <label for="plyr-video-control-color-hover">Szín</label>
                <input type="color" data-id="hoverColor" id="plyr-video-control-color-hover" value="${separateColors(currentSettings.advanced.plyr.design.settings.hoverColor).color}" ${currentSettings.advanced.plyr.design.enabled ? '' : 'disabled'}>
                <input type="range" data-id="hoverColor" id="plyr-video-control-color-hover" min="0" max="1" step="0.1" value="${separateColors(currentSettings.advanced.plyr.design.settings.hoverColor).opacity}" ${currentSettings.advanced.plyr.design.enabled ? '' : 'disabled'}>
            </div>
        </div>
        <div id="plyr-design-test" class="${currentSettings.advanced.plyr.design.enabled ? '' : 'dimmer'} test setting">
            <video src="../../blank.mp4"></video>
        </div>
    `;
}
function addAdvancedListeners() {
    document.querySelector('#advanced > .toggle-control input').onchange = function (event) {
        event.preventDefault();
        currentSettings.advanced.enabled = !currentSettings.advanced.enabled;
        document.querySelector('#advanced').classList.toggle('dimmer');
        document.querySelectorAll(`#advanced input:not(#advanced-enabled), #advanced select, #advanced textarea, #advanced button`).forEach(input => {input.disabled = !currentSettings.advanced.enabled;});
        Logger.log(`Advanced settings are now ${currentSettings.advanced.enabled ? 'enabled' : 'disabled'}`);
    };
    document.querySelector('#advanced .console-log .toggle-control').onchange = function (event) {
        if (currentSettings.advanced.enabled === false) {event.preventDefault();return;}
        currentSettings.advanced.settings.ConsoleLog.enabled = !currentSettings.advanced.settings.ConsoleLog.enabled;
        document.querySelector('#advanced .console-log').classList.toggle('dimmer');
        Logger.log(`Console log is now ${currentSettings.advanced.settings.ConsoleLog.enabled ? 'enabled' : 'disabled'}`);
    };
    document.querySelector('#advanced .default-player select').onchange = function () {
        currentSettings.advanced.settings.DefaultPlayer.player = document.querySelector('#advanced .default-player select').value;
        Logger.log(`Default player is now ${currentSettings.advanced.settings.DefaultPlayer.player}`);
    };
    document.querySelector('#advanced .dlname textarea').oninput = function () {
        currentSettings.advanced.downloadName = document.querySelector('#advanced .dlname textarea').value;
        Logger.log(`Download name is now ${currentSettings.advanced.downloadName}`);
    };
    document.querySelector('#advanced .plyr-setting .toggle-control').onchange = function (event) {
        if (currentSettings.advanced.enabled === false) {event.preventDefault();return;}
        currentSettings.advanced.plyr.design.enabled = !currentSettings.advanced.plyr.design.enabled;
        document.querySelector('#advanced .plyr-setting').classList.toggle('dimmer');
        document.getElementById('plyr-design-test').classList.toggle('dimmer');
        document.querySelectorAll(`#advanced .plyr-setting input:not(#plyr-design-enabled),#plyr-design-test button,#plyr-design-test input`).forEach(input => {input.disabled = !currentSettings.advanced.plyr.design.enabled});
        loadCustomCss();
        Logger.log(`Plyr design is now ${currentSettings.advanced.plyr.design.enabled ? 'enabled' : 'disabled'}`);
    };
    document.querySelectorAll('#advanced .color input[type="color"]').forEach(input => {
        input.oninput = function () {
            const dataid = input.dataset.id;
            const id = input.id;
            const color = input.value;
            const opacity = document.querySelector(`#advanced .color input[type="range"][data-id="${dataid}"]#${id}`).value;
            document.body.style.setProperty(`--${id}`, `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`);
            currentSettings.advanced.plyr.design.settings[dataid] = `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
            Logger.log(`Plyr design ${dataid} is now ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`);
         };
    });
    document.querySelectorAll('#advanced .color input[type="range"]').forEach(input => {
        input.oninput = function () {
            const dataid = input.dataset.id;
            const id = input.id;
            const color = document.querySelector(`#advanced .color input[type="color"][data-id="${dataid}"]#${id}`).value;
            const opacity = input.value;
            document.body.style.setProperty(`--${id}`, `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`);
            currentSettings.advanced.plyr.design.settings[dataid] = `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
            Logger.log(`Plyr design ${dataid} is now ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`);
        };
    });
}
function setupPlyr() {
    new Plyr(document.querySelector('video'), {controls: ["play-large", "play", "progress", "current-time", "mute", "volume", "settings", "pip", "airplay", "download", "fullscreen"], keyboard: {focused: true, global: true,}, settings: ["quality", "speed"], tooltips: {controls: true, seek: true,}, i18n: {restart: "Újraindítás", play: "Lejátszás", pause: "Megállítás", seek: "Keresés", seekLabel: "{currentTime} másodpercnél", played: "Lejátszott", currentTime: "Jelenlegi idő", duration: "Teljes idő", volume: "Hangerő", mute: "Némítás", unmute: "Némítás kikapcsolása", download: "Letöltés", enterFullscreen: "Teljes képernyő", exitFullscreen: "Kilépés a teljes képernyőből", settings: "Beállítások", menuBack: "Vissza", speed: "Sebesség", normal: "Normál", quality: "Minőség", loop: "Ismétlés", start: "Kezdés", end: "Befejezés", all: "Összes", reset: "Visszaállítás", disabled: "Letiltva", enabled: "Engedélyezve", qualityBadge: {2160: "4K", 1440: "2K", 1080: "FHD", 720: "HD", 480: "SD", 360: "", 240: "", 144: "",},}, speed: {selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],},});
    if (!currentSettings.advanced.plyr.design.enabled) {
        document.querySelectorAll(`#advanced .plyr-setting input:not(#plyr-design-enabled),#plyr-design-test button,#plyr-design-test input`).forEach(input => {input.disabled = !currentSettings.advanced.plyr.design.enabled});
    }
}
function renderSettings() {
    return `
    ${renderSetting({id: "forwardSkip", title: "Előre ugrás", description: "A videóban X másodperccel előre ugrás."})}
    ${renderSetting({id: "backwardSkip", title: "Hátra ugrás", description: "A videóban X másodperccel hátra ugrás."})}
    ${renderSetting({id: "nextEpisode", title: "Következő rész", description: "Következő részre ugrás."})}
    ${renderSetting({id: "previousEpisode", title: "Előző rész", description: "Előző részre ugrás."})}
    ${renderSetting({id: "autoNextEpisode", title: "Automatikus következő rész", description: "Automatikusan a következő részre ugrás."})}
    ${renderSetting({id: "autoplay", title: "Automatikus lejátszás", description: "Automatikusan elindul a videó.<br>Ez a funkció nem működik minden esetben.<br>Ha egymás után több részt nézel, <br> akkor többnyire működik."})}
    ${renderSetting({id: "bookmarks", title: "Könyvjelzők", description: "Könyvjelzők használata."})}
    ${renderSetting({id: "resume", title: "Előzmények", description: "Az utoljára megtekintett rész folytatása."})}
    `;
}
function renderSetting(setting) {
    let settingJSON = currentSettings[setting.id];
    return `
        <div class="setting ${setting.id} ${settingJSON?.enabled ? '' : 'dimmer'}">
            <h3>${setting.title}</h3>
            ${settingJSON.enabled !== undefined ? `
                <label class="toggle-control checkbox" for="${setting.id}-enabled">
                    <input type="checkbox" id="${setting.id}-enabled" ${settingJSON.enabled ? "checked" : ""} hidden>
                    <span class="control"></span> Ki/Be kapcsolás
                </label>
            ` : ''}
            ${settingJSON.time !== undefined ? `
            <div class="duration">
                <label for="${setting.id}-duration">Időtartam (másodpercben)</label>
                <input type="number" id="${setting.id}-duration" value="${settingJSON.time}" ${settingJSON?.enabled ? '' : 'disabled'}>
            </div>
            ` : ''}
            ${settingJSON.keyBind !== undefined ? `
            <div class="key">
                <label for="${setting.id}-key">Billentyűkombináció</label>
                <input type="text" id="${setting.id}-key" value="${keyBindRender(settingJSON.keyBind)}" ${settingJSON?.enabled ? '' : 'disabled'}>
            </div>
            ` : ''}
            <p>${setting.description}</p>
        </div>
    `;
}
function keyBindRender(data) {
    return `${data.altKey ? 'Alt + ' : ''}${data.ctrlKey ? 'Ctrl + ' : ''}${data.shiftKey ? 'Shift + ' : ''}${data.key}`;
}
function addListeners() {
    document.querySelectorAll('#settings .toggle-control').forEach(toggle => {
        toggle.onchange = function () {
            const id = toggle.htmlFor.split('-')[0];
            currentSettings[id].enabled = !currentSettings[id].enabled;
            document.querySelector(`.${id}`).classList.toggle('dimmer');
            document.querySelectorAll(`.${id} input[type="number"], .${id} input[type="text"]`).forEach(input => {
                input.disabled = !currentSettings[id].enabled;
            });
            Logger.log(`Setting ${id} is now ${currentSettings[id].enabled ? 'enabled' : 'disabled'}`);
        };
    });

    document.querySelectorAll('#settings .duration input').forEach(input => {
        input.oninput = function () {
            const id = input.id.split('-')[0];
            currentSettings[id].time = parseInt(input.value) || 0;
            if (currentSettings[id].time < 0) currentSettings[id].time = 0;
            Logger.log(`Setting ${id} time is now ${currentSettings[id].time}`);
        };
    });

    document.querySelectorAll('#settings .key input').forEach(input => {
        input.onkeydown = function (event) {
            event.preventDefault();
            const id = input.id.split('-')[0];
            currentSettings[id].keyBind = {
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                key: event.key
            };
            input.value = keyBindRender(currentSettings[id].keyBind);
            Logger.log(`Setting ${id} key is now ${keyBindRender(currentSettings[id].keyBind)}`);
        }
    });
}
function resetPage() {
    document.body.innerHTML = '';
    init();
    addListeners();
    setupPlyr();
    addAdvancedListeners();
    addMenu();
    loadCustomCss();
    handleResume();
    if (currentSettings.advanced.enabled === false) {
        document.querySelectorAll(`#advanced input:not(#advanced-enabled), #advanced select, #advanced textarea, #advanced button`).forEach(input => {input.disabled = true;});
        document.querySelector('#advanced').classList.add('dimmer');
    }
}
function loadCustomCss() {
    if (currentSettings.advanced.enabled && currentSettings.advanced.plyr.design.enabled) {
        MA.addCSS(`
        :root {
            --plyr-video-control-color: ${currentSettings.advanced.plyr.design.settings.svgColor};
            --plyr-video-control-background-hover: ${currentSettings.advanced.plyr.design.settings.hoverBGColor};
            --plyr-color-main: ${currentSettings.advanced.plyr.design.settings.mainColor};
            --plyr-video-control-color-hover: ${currentSettings.advanced.plyr.design.settings.hoverColor};
        }
        `);
        Logger.log("Custom CSS loaded.");
    } else {
        MA.removeCSS();
        Logger.log("Custom CSS removed.");
    }
}
function handleResume() {
    let resume = document.querySelector('.resume .checkbox');
    if (resume) {
        let dropdown = document.createElement('select');
        dropdown.id = 'resume-dropdown';
        dropdown.className = 'dropdown';
        resume.after(dropdown);
        dropdown.innerHTML += `
            <option value="ask">Kérdezzen rá minden alkalommal</option>
            <option value="auto">Automatikusan folytassa</option>
        `;
        dropdown.value = currentSettings.resume.mode;
        dropdown.onchange = function () {
            currentSettings.resume.mode = dropdown.value;
            Logger.log(`Resume mode is now ${currentSettings.resume.mode}`);
        };
    }
}
window.addEventListener('DOMContentLoaded', () => {
    MAT.loadSettings().then((data) => {
        currentSettings = data;
        resetPage();
    });
});
