import MAT from "../MAT";
import Logger from "../Logger";

// TEST URL: https://magyaranime.eu/resz/12029/

window.addEventListener('message', async (event) => {
    if (event.data?.type === MAT.__ACTIONS__.GET_SOURCE_URL) {
        Logger.log('[indavideo.js] Received GET_SOURCE_URL message', true);
        try {
            let data = await getIndavideoToken();
            if (data.length === 0) {
                Logger.error('[indavideo.js] No video data found; Trying Method 2', true);
                data = await getIndavideoToken2();
            }
            if (data.length > 0) {
                window.parent.postMessage({ type: MAT.__ACTIONS__.SOURCE_URL, data }, '*');
            } else {
                Logger.error('[indavideo.js] No video data found', true);
            }
        } catch (error) {
            Logger.error(`[indavideo.js] Error: ${error.message}`, true);
            try {
                const data = await getIndavideoToken2();
                if (data.length > 0) {
                    window.parent.postMessage({ type: MAT.__ACTIONS__.SOURCE_URL, data }, '*');
                } else {
                    Logger.error('[indavideo.js] No video data found', true);
                }
            } catch (error) {
                Logger.error(`[indavideo.js] Error in getIndavideoToken2: ${error.message}`, true);
            }
        }
    }
});

/**
 * Get token from indavideo.hu embed URL (method 1 (new method))
 * @return {Promise<[{quality: number, url: string}]>} - The quality data for the video
 */
function getIndavideoToken() {
    let isResolved = false;
    return new Promise((resolve, reject) => {
        const customTag = document.createElement('matweaksget');
        document.head.appendChild(customTag);
        // Create a MutationObserver to watch for changes in the DOM
        const observer = new MutationObserver((mutations, obs) => {
            let data = document.head.querySelector('matweaks');
            if (data) {
                obs.disconnect();
                data.remove();
                let response = JSON.parse(data.getAttribute('data-video-data'));
                let videoFiles = response.video_files || [];
                if (typeof videoFiles === 'object') {
                    videoFiles = Object.values(videoFiles);
                }
                const filesh = response.filesh || {};
                const tokens = [];
                for (const videoUrl of videoFiles) {
                    const heightMatch = videoUrl.match(/.(\d{3,4}).mp4(?:\?|$)/);
                    if (heightMatch) {
                        const height = heightMatch[1];
                        const token = filesh[height];
                        if (token) {
                            const urlParts = new URL(videoUrl);
                            urlParts.searchParams.set('token', token);
                            tokens.push({ quality: parseInt(height), url: urlParts.href });
                        }
                    }
                }
                isResolved = true;
                resolve(tokens);
            }
        });
        // Start observing the document head for changes
        observer.observe(document.head, { childList: true, subtree: true });
        // Timeout to reject the promise if data is not available within a certain time
        setTimeout(() => {
            observer.disconnect();
            if (!isResolved) {
                reject(new Error('Script load timeout'));
            }
        }, 1000);
    });
}




/**
 * Get token from indavideo.hu embed URL (method 2 (old method))
 *
 * Use this method if the new method does not work for some reason
 * @return {Promise<[{quality: number, url: string}]>} - The quality data for the video
 * @deprecated
 */
async function getIndavideoToken2() {
    return new Promise((resolve, reject) => {
        try {
            let f720 = () => {
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
            let f360 = () => {
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
            let retry = 10;
            let interval = setInterval(() => {
                let f720Url = f720();
                let f360Url = f360();
                if (f720Url === false && f360Url === false) {
                    Logger.log('[indavideo.js] Retrying to get the source URL... Retry count: ' + retry, true);
                }
                if (f720Url || f360Url || retry <= 0) {
                    clearInterval(interval);
                    let data = []
                    if (f360Url !== false) {
                        data.push({quality: 360, url: f360Url});
                    }
                    if (f720Url !== false) {
                        data.push({quality: 720, url: f720Url});
                    }
                    resolve(data);
                }
                retry--;
            }, 100);
            reject(new Error('Failed to get the source URL'));
        } catch (error) {
            Logger.error(`[indavideo.js] Error in method_one: ${error.message}`);
            reject(error);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    Logger.log('[indavideo.js] Sending message to get source URL', true);
    window.parent.postMessage({ type: MAT.__ACTIONS__.IFRAME.FRAME_LOADED }, '*');
});

Logger.log('[indavideo.js] Script loaded', true);
