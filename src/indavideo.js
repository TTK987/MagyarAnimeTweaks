import {MAT, Logger} from "./API";
window.addEventListener('message', function (event) {
    if (event.data && event.data.plugin === MAT.__NAME__) {
        if (event.data.type === MAT.__ACTIONS__.GET_SOURCE_URL) {
            let retry = 10;
            let interval = setInterval(function () {
                if (f720() === false && f360() === false) {
                    Logger.log('[indavideo.js] Retrying to get the source URL... Retry count: ' + retry);
                }
                if (f720() || f360() || retry <= 0) {
                    clearInterval(interval);
                    let data = []
                    let f720Url = f720();
                    let f360Url = f360();
                    if (f360Url !== false) {
                        data.push({quality: 360, url: f360Url});
                    }
                    if (f720Url !== false) {
                        data.push({quality: 720, url: f720Url});
                    }
                    window.parent.postMessage({plugin: MAT.__NAME__, type: MAT.__ACTIONS__.SOURCE_URL, data: data}, '*');
                    return;
                }
                retry--;
            }, 100);
        }
    }
});

/**
 * Function to get the 720p source URL
 * @returns {string|boolean} The 720p source URL or false if not found
 * @since v0.1.0
 */
function f720() {
    let hdbutton = document.querySelector('.hd_button span');
    if (hdbutton === null) {
        return false;
    }
    hdbutton.click();
    let sourceUrl720p = document.getElementById('html5video').src;
    if (sourceUrl720p.includes('.720.')) {
        return sourceUrl720p;
    } else {
        return false;
    }
}

/**
 * Function to get the 360p source URL
 * @returns {string|boolean} The 360p source URL or false if not found
 * @since v0.1.0
 */
function f360() {
    let sdbutton = document.querySelector('.sd_button span');
    if (sdbutton === null) {
        let sourceUrl360p = document.getElementById('html5video').src;
        if (sourceUrl360p.includes('.360.')) {
            return sourceUrl360p;
        } else {
            return false;
        }
    }
    sdbutton.click();
    let sourceUrl360p = document.getElementById('html5video').src;
    if (sourceUrl360p.includes('.360.')) {
        return sourceUrl360p;
    } else {
        return false;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    window.parent.postMessage({plugin: MAT.__NAME__, type: MAT.__ACTIONS__.FRAME_LOADED}, '*');
});
