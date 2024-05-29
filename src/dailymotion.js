window.addEventListener('message', async function (event) {
    // A message has been received from the parent window
    if (event.data && event.data.plugin === 'MATweaks') {
        // The message is from the "MATweaks" extension
        if (event.data.type === 'getSourceUrl') {
            // The parent window requested the source URL of the video
            window.parent.postMessage({plugin: 'MATweaks', type: 'sourceUrl', data: await getData()}, '*');
        }
    }
});

/**
 * Function to get the .m3u8 file URL
 */
async function getM3U8FileURL() {
    const url = window.location.href;
    const mediaID = extractMediaID(url);
    if (!mediaID) {
        console.error('Media ID could not be extracted');
        return;
    }
    const videoData = await getVideoData(mediaID);
    if (!videoData) {
        console.error('Video data could not be fetched');
        return;
    }
    return videoData.qualities.auto[0].url;
}

/**
 * Function to get the .m3u8 file
 */
async function getM3U8File(url) {
    const response = await fetch(url);
    return await response.text();
}

/**
 * Function to parse the m3u8 file
 */
function parseVideoData(videoData) {
    const lines = videoData.split('\n');
    const data = [];
    let quality = '';
    // return: [{quality: 720, url: 'https://...'}, {quality: 360, url: 'https://...'}, ...]
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('#EXT-X-STREAM-INF:')) {
            const match = line.match(/RESOLUTION=(\d+)x(\d+),NAME="(\d+)"/);
            quality = match[3];
            const urlmatch = line.match(/PROGRESSIVE-URI="([^"]+)"/);
            data.push({ quality: quality, url: urlmatch ? urlmatch[1] : '' });
        }
    }
    // sort the data by quality
    data.sort((a, b) => b.quality - a.quality);
    return data;
}

/**
 * Function to extract the media ID from the URL
 */
async function getVideoData(mediaID) {
    const response = await fetch(`https://www.dailymotion.com/player/metadata/video/${mediaID}`);
    return await response.json();
}

/**
 * Function to extract the media ID from the URL
 * @param {string} url - URL
 * @returns {string} - Media ID
 */
function extractMediaID(url) {
    const match = url.match(/dailymotion.com\/player.html\?video=([^&]+)/);
    return match ? match[1] : null;
}

/**
 * Function to get the data
 */
async function getData() {
    let M3U8url = await getM3U8FileURL();
    let M3U8file = await getM3U8File(M3U8url);
    return parseVideoData(M3U8file);
}

// Send a message to the parent window that the iframe has been loaded and ready
document.addEventListener('DOMContentLoaded', function () {
    window.parent.postMessage({ plugin: 'MATweaks', type: 'iframeLoaded' }, '*');
});





