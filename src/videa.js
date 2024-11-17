import {MAT} from "./API";

window.addEventListener('message', async function (event) {
    if (event.data && event.data.plugin === MAT.__NAME__) {
        if (event.data.type === MAT.__ACTIONS__.GET_SOURCE_URL) {
            window.parent.postMessage({plugin: MAT.__NAME__, type: MAT.__ACTIONS__.SOURCE_URL, data: await getQualityData()}, '*');
        }
    }
});

/**
 * Function to wait for a specified amount of time
 * @param ms The amount of time to wait in milliseconds
 * @returns {Promise<unknown>} A promise that resolves after the specified amount of time
 * @async
 * @function wait
 * @since v0.1.7
 */
async function wait(ms) {
    return new Promise(resolve => { setTimeout(resolve, ms); });
}

/**
 * Function to get the quality data
 * @returns {Array} The quality data array
 * @async
 * @function getQualityData
 * @since v0.1.7
 */
async function getQualityData() {
    const qualityButtons = document.querySelectorAll('#videa-toolbar > div.settings-panel > div.settings-version-selector-block.settings-submenu > div > a');
    const videoElement = document.querySelector('video');
    const data = [];
    for (const button of qualityButtons) {
        button.click();
        while (videoElement.src === '') {
            await wait(5);
        }
        let quality = Number(button.innerText.replace('p', ''));
        data.push({quality: quality, url: videoElement.src});
    }
    return data;
}

document.addEventListener('DOMContentLoaded', async function () {
    let interval = setInterval(function () {
        if (document.querySelectorAll('#videa-toolbar > div.settings-panel > div.settings-version-selector-block.settings-submenu > div > a').length > 0) {
            clearInterval(interval);
            window.parent.postMessage({plugin: MAT.__NAME__, type: MAT.__ACTIONS__.FRAME_LOADED}, '*');
        }
    }, 10);
});
