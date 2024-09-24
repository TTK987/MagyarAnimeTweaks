import {MAT, logger} from "./API";
window.addEventListener('message', async function (event) {
    if (event.data && event.data.plugin === MAT.__NAME) {
        if (event.data.type === MAT.__ACTIONS.GET_SOURCE_URL) {
            window.parent.postMessage({plugin: MAT.__NAME, type: MAT.__ACTIONS.SOURCE_URL, data: await getData()}, '*');
        }
    }
});

/**
 * Function to get the .m3u8 file URL
 * @returns {Promise<string>} - .m3u8 file URL
 * @since v0.1.7
 */
async function getM3U8FileURL() {
    const url = window.location.href;
    const mediaID = extractMediaID(url);
    if (!mediaID) {
        logger.error('[dailymotion.js] Media ID could not be extracted');
        return null;
    }
    const videoData = await getVideoData(mediaID);
    if (!videoData) {
        logger.error('[dailymotion.js] Video data could not be fetched');
        return null;
    }
    return videoData.qualities.auto[0].url;
}

/**
 * Function to get the .m3u8 file
 * @param {string} url - .m3u8 file URL
 * @returns {Promise<string>} - .m3u8 file
 * @since v0.1.7
 */
async function getM3U8File(url) {
    const response = await fetch(url);
    return await response.text();
}

/**
 * Function to parse the m3u8 file
 * @param {string} videoData - .m3u8 file
 * @returns {Array} - Video data
 * @since v0.1.7
 */
function parseVideoData(videoData) {
    const lines = videoData.split('\n');
    const data = [];
    for (const line of lines) {
        if (line.startsWith('#EXT-X-STREAM-INF:')) {
            const qualityMatch = line.match(/RESOLUTION=(\d+)x(\d+),NAME="(\d+)"/);
            const urlMatch = line.match(/PROGRESSIVE-URI="([^"]+)"/);
            if (qualityMatch) {
                const quality = qualityMatch[3];
                const url = urlMatch ? urlMatch[1] : '';
                data.push({ quality, url });
            }
        }
    }
    data.sort((a, b) => b.quality - a.quality);

    return data;
}

/**
 * Function to extract the media ID from the URL
 * @param {string} mediaID - URL
 * @returns {Promise<Object>} - Video data
 * @since v0.1.7
 */
async function getVideoData(mediaID) {
    const response = await fetch(`https://www.dailymotion.com/player/metadata/video/${mediaID}`);
    return await response.json();
}

/**
 * Function to extract the media ID from the URL
 * @param {string} url - URL
 * @returns {string} - Media ID
 * @since v0.1.7
 */
function extractMediaID(url) {
    const match = url.match(/video=([^&]+)/);
    return match ? match[1] : null;
}

/**
 * Function to get the data
 * @returns {Promise<Array>} - Video data
 * @since v0.1.7
 */
async function getData() {
    let M3U8url = await getM3U8FileURL();
    if (!M3U8url) {
        logger.error('[dailymotion.js] M3U8 file URL could not be fetched');
        return null;
    }
    let M3U8file = await getM3U8File(M3U8url);
    if (!M3U8file) {
        logger.error('[dailymotion.js] M3U8 file could not be fetched');
        return null;
    }
    return parseVideoData(M3U8file);
}

document.addEventListener('DOMContentLoaded', function () {
    window.parent.postMessage({plugin: MAT.__NAME, type: MAT.__ACTIONS.FRAME_LOADED}, '*');
});

console.log('dailymotion.js loaded');



