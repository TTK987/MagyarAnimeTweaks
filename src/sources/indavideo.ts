import { ACTIONS } from '@lib/actions';
import Logger from "@/Logger";
import { EpisodeVideoData } from '@/global'
import onLoad from '@/lib/load';

/**
 * The Gateway solution is not reliable, improvements are needed.
 * Sometimes the indavideo.hu iframe loads before this script could stream the data up to the parent window.
 * (postMessage blocker?)
 * But this should work on modern systems... probably :D
 */


const GATEWAY_ACTIONS = {
    READY: 'indaReady',
    TIMEOUT: 'indaTimeout',
} as const;

let isGateway = location.hostname === 'indavideo.hu';

const isSamePageAsParent = (() => {
    return window.parent === window || (() => {
        try {
            return window.parent.location.href === window.location.href;
        } catch {
            return false;
        }
    })();
})();

function gatewayDown(event: string, data?: any) {
    (document.querySelector('iframe[src*="indavideo.hu"]') as HTMLIFrameElement).contentWindow?.postMessage({ type: event, ...data, }, '*');
}

function gatewayUp(event: string, data?: any) {
    window.parent.postMessage({ type: event, ...data, gatewayUp: true }, '*');
}

function checkEmbedBan(): boolean {
    return document.querySelector(
        'img[src="https://assets.indavideo.hu/images/default/video_box/embed_ban_video.jpg"]',
    ) !== null;
}


window.addEventListener('message', async (event) => {
    if (!event.data || typeof event.data.type !== 'string') return

    if (isSamePageAsParent) {
        Logger.log('[indavideo.js] Skipping message handling: gateway parent is same as current page', true);
        return;
    }

    switch (event.data.type) {
        case ACTIONS.IFRAME.FRAME_LOADED:
            if (isGateway) {
                gatewayUp(GATEWAY_ACTIONS.READY)
            }
            break

        case GATEWAY_ACTIONS.READY:
            if (event.data.gatewayUp) break // Prevent loops
            gatewayDown(ACTIONS.GET_SOURCE_URL, { gateway: true })
            break

        case ACTIONS.SOURCE_URL:
            if (isGateway) {
                gatewayUp(ACTIONS.SOURCE_URL, { data: event.data.data })
            } else {
                window.parent.postMessage({ type: ACTIONS.SOURCE_URL, data: event.data.data }, '*')
            }
            break

        case ACTIONS.INDA_NO_VIDEO:
            if (isGateway) {
                gatewayUp(ACTIONS.INDA_NO_VIDEO)
            } else {
                window.parent.postMessage({ type: ACTIONS.INDA_NO_VIDEO }, '*')
            }
            break

        case ACTIONS.VIDEO_ONLY_ON_INDAVIDEO:
            if (isGateway) {
                gatewayUp(ACTIONS.VIDEO_ONLY_ON_INDAVIDEO)
            } else {
                window.parent.postMessage({ type: ACTIONS.VIDEO_ONLY_ON_INDAVIDEO }, '*')
            }
            break

        case ACTIONS.GET_SOURCE_URL:
            if (checkEmbedBan()) {
                if (event.data.gateway) {
                    return gatewayUp(ACTIONS.VIDEO_ONLY_ON_INDAVIDEO)
                }
                const gatewayIframe = document.createElement('iframe')
                gatewayIframe.src =
                    (document.querySelector('.video-box a[href*="/video/"]') as HTMLAnchorElement)
                        ?.href || ''
                gatewayIframe.style.display = 'none'
                document.body.appendChild(gatewayIframe)
            } else if (!isGateway) {
                try {
                    let data = addExpiry(await getIndavideoToken())
                    if (data.length === 0) {
                        data = addExpiry(await getIndavideoToken2())
                    }
                    if (data.length > 0) {
                        window.parent.postMessage({ type: ACTIONS.SOURCE_URL, data }, '*')
                    } else {
                        Logger.error('[indavideo.js] No video data found', true)
                    }
                } catch (error: any) {
                    Logger.error(
                        `[indavideo.js] Error in getIndavideoToken: ${error.message}`,
                        true,
                    )
                    try {
                        Logger.log(
                            '[indavideo.js] Falling back to getIndavideoToken2 after error',
                            true,
                        )
                        const data = addExpiry(await getIndavideoToken2())
                        Logger.log(
                            `[indavideo.js] getIndavideoToken2 (fallback) returned ${data.length} entries`,
                            true,
                        )
                        if (data.length > 0) {
                            Logger.log(
                                '[indavideo.js] Sending SOURCE_URL with video data to parent (fallback)',
                                true,
                            )
                            window.parent.postMessage({ type: ACTIONS.SOURCE_URL, data }, '*')
                        } else {
                            Logger.error('[indavideo.js] No video data found (fallback)', true)
                        }
                    } catch (error: any) {
                        Logger.error(
                            `[indavideo.js] Error in getIndavideoToken2: ${error.message}`,
                            true,
                        )
                    }
                }
            } else {
                gatewayDown(ACTIONS.GET_SOURCE_URL)
            }
            break

        default:
            Logger.log(`[indavideo.js] Unhandled message type: ${event.data.type}`, true)
            return
    }
})

function addExpiry(data: EpisodeVideoData[]): EpisodeVideoData[] {
    return data.map((video) => ({
        ...video,
        expiry: Math.floor(Date.now() / 1000) + 60 * 60 * 5.5, // Current time + 5.5 hours to be safe
    }))
}


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
        }, 10000);
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

onLoad(init);


function init() {
    if (isSamePageAsParent) {
        Logger.log('[indavideo.js] Skipping init: gateway parent is same as current page', true);
        return;
    }

    window.parent.postMessage({ type: ACTIONS.IFRAME.FRAME_LOADED }, '*');
}

Logger.log('[indavideo.js] Script loaded', true);
