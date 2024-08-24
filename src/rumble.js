import {MAT} from "./API";

window.addEventListener('message', async function (event) {
    if (event.data && event.data.plugin === MAT.__NAME) {
        if (event.data.type === MAT.__ACTIONS.GET_SOURCE_URL) {
            window.parent.postMessage({plugin: MAT.__NAME, type: MAT.__ACTIONS.SOURCE_URL, data: getQualityData(document.body.innerHTML)}, '*');
        }
    }
});

/**
 * Function to get the quality data
 * @param html The HTML content of the page
 * @returns {Array} The quality data array
 * @since v0.1.7
 */
function getQualityData(html) {
    const regexp = /"(\d{3,4})":{"url":"([^"]+)"/g;
    let data = {};
    for (const match of html.matchAll(regexp)) {
        data[match[1]] = match[2];
    }
    data = Object.keys(data).map(key => ({ quality: key, url: data[key] })).sort((a, b) => b.quality - a.quality);
    data = data.filter(item => item.quality !== '180');
    return data;
}

document.addEventListener('DOMContentLoaded', function () {
    window.parent.postMessage({ plugin: MAT.__NAME, type: MAT.__ACTIONS.FRAME_LOADED }, '*');
});



