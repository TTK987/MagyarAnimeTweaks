window.addEventListener('message', async function (event) {
    // A message has been received from the parent window
    if (event.data && event.data.plugin === 'MATweaks') {
        // The message is from the "MATweaks" extension
        if (event.data.type === 'getSourceUrl') {
            // The parent window requested the source URL of the video
            window.parent.postMessage({plugin: 'MATweaks', type: 'sourceUrl', data: getQualityData(document.body.innerHTML)}, '*');
        }
    }
});

/**
 * Function to get the quality data
 */
function getQualityData(html) {
    const regexp = /"(\d{3,4})":{"url":"([^"]+)"/g;
    let data = {};
    for (const match of html.matchAll(regexp)) {
        data[match[1]] = match[2];
    }
    // Return a sorted array of objects
    data = Object.keys(data).map(key => ({ quality: key, url: data[key] })).sort((a, b) => b.quality - a.quality);
    // Remove 180 quality
    data = data.filter(item => item.quality !== '180');
    return data;
}

// Send a message to the parent window that the iframe has been loaded and ready
document.addEventListener('DOMContentLoaded', function () {
    window.parent.postMessage({ plugin: 'MATweaks', type: 'iframeLoaded' }, '*');
});



