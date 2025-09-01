import MAT from "../MAT";
import Logger from "../Logger";
import { EpisodeVideoData } from '../global'

window.addEventListener('message', async (event) => {
    console.log(event);
    if (event.data?.type === MAT.__ACTIONS__.GET_SOURCE_URL) {
        Logger.log('[indavideo.js] Received GET_SOURCE_URL message', true);

        // Check if the current video is even available
        // Check for https://assets.indavideo.hu/images/default/video_box/no.jpg in an image tag
        const noVideoImage = document.querySelector('img[src="https://assets.indavideo.hu/images/default/video_box/no.jpg"]');
        if (noVideoImage) {
            Logger.error('[indavideo.js] No video available', true);
            window.parent.postMessage({ type: MAT.__ACTIONS__.INDA_NO_VIDEO }, '*');
            return;
        }

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
        } catch (error: any) {
            Logger.error(`[indavideo.js] Error: ${error.message}`, true);
            try {
                const data = await getIndavideoToken2();
                if (data.length > 0) {
                    window.parent.postMessage({ type: MAT.__ACTIONS__.SOURCE_URL, data }, '*');
                } else {
                    Logger.error('[indavideo.js] No video data found', true);
                }
            } catch (error: any) {
                Logger.error(`[indavideo.js] Error in getIndavideoToken2: ${error.message}`, true);
            }
        }
    }
});

/**
 * Get token from indavideo.hu embed URL (method 1 (new method))
 * @return {Promise<EpisodeVideoData[]>} - The quality data for the video
 */
function getIndavideoToken(): Promise<EpisodeVideoData[]> {
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
                let response = JSON.parse(data.getAttribute('data-video-data') || '{}');
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
                resolve(tokens as EpisodeVideoData[]);
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
        }, 5000);
    });
}




/**
 * Get token from indavideo.hu embed URL (method 2 (old method))
 *
 * Use this method if the new method does not work for some reason
 * @return {Promise<EpisodeVideoData[]>} - The quality data for the video
 * @deprecated
 */
async function getIndavideoToken2(): Promise<EpisodeVideoData[]> {
    return new Promise((resolve, reject) => {
        let retry = 10;
        let interval: NodeJS.Timeout | null = null;

        const tryGetUrls = () => {
            try {
                let f720 = () => {
                    let hdbutton = document.querySelector('.hd_button span') as HTMLSpanElement;
                    if (hdbutton === null) {
                        return false;
                    }
                    hdbutton.click();
                    let sourceUrl720p = (document.getElementById('html5video') as HTMLVideoElement).src;
                    if (sourceUrl720p.includes('.720.')) {
                        return sourceUrl720p;
                    } else {
                        return false;
                    }
                }
                let f360 = () => {
                    let sdbutton = document.querySelector('.sd_button span') as HTMLSpanElement;
                    if (sdbutton === null) {
                        let sourceUrl360p = (document.getElementById('html5video') as HTMLVideoElement).src;
                        if (sourceUrl360p.includes('.360.')) {
                            return sourceUrl360p;
                        } else {
                            return false;
                        }
                    }
                    sdbutton.click();
                    let sourceUrl360p = (document.getElementById('html5video') as HTMLVideoElement).src;
                    if (sourceUrl360p.includes('.360.')) {
                        return sourceUrl360p;
                    } else {
                        return false;
                    }
                }
                let f720Url = f720();
                let f360Url = f360();
                if (f720Url === false && f360Url === false) {
                    Logger.log('[indavideo.js] Retrying to get the source URL... Retry count: ' + retry, true);
                }
                if (f720Url || f360Url || retry <= 0) {
                    if (interval) clearInterval(interval);
                    let data = [];
                    if (f360Url !== false) {
                        data.push({ quality: 360, url: f360Url });
                    }
                    if (f720Url !== false) {
                        data.push({ quality: 720, url: f720Url });
                    }
                    resolve(data as EpisodeVideoData[]);
                }
            } catch (error: any) {
                Logger.error(`[indavideo.js] Error in method_one: ${error.message}`);
                if (retry <= 0) {
                    if (interval) clearInterval(interval);
                    reject(error);
                } else {
                    Logger.log('[indavideo.js] Retrying after error... Retry count: ' + retry, true);
                    retry--;
                }
            } finally {
                if (retry <= 0 && interval) {
                    clearInterval(interval);
                    Logger.log('[indavideo.js] No more retries left, rejecting promise', true);
                    reject(new Error('Failed to get the source URL'));
                }
                retry--;
            }
        };

        interval = setInterval(tryGetUrls, 100);

        // Additional safeguard to reject the promise
        setTimeout(() => {
            if (interval) clearInterval(interval);
            reject(new Error('Failed to get the source URL'));
        }, 1000);
    });
}

let isInitialized = false;


document.addEventListener('DOMContentLoaded', () => {
    init()
});
window.addEventListener('load', () => {
    init()
})
window.addEventListener('readystatechange', (event) => {
    if (document.readyState === 'complete') {
        init();
    }
})
if (document.readyState === 'complete') {
    init();
}



function init() {
    if (isInitialized) return
    else isInitialized = true
    window.parent.postMessage({ type: MAT.__ACTIONS__.IFRAME.FRAME_LOADED }, '*');
}

Logger.log('[indavideo.js] Script loaded', true);
