window.addEventListener('message', async function (event) {
    // A message has been received from the parent window
    if (event.data && event.data.plugin === 'MATweaks') {
        // The message is from the "MATweaks" extension
        if (event.data.type === 'getSourceUrl') {
            // The parent window requested the source URL of the video
            window.parent.postMessage({plugin: 'MATweaks', type: 'sourceUrl', data: await getQualityData()}, '*');
        }
    }
});
/**
 * Function to wait for a specified amount of time
 * @param ms The amount of time to wait in milliseconds
 * @returns {Promise<unknown>} A promise that resolves after the specified amount of time
 */
async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Function to get the quality data
 * @returns {Array} The quality data array
 */
async function getQualityData() {
    // Get the quality settings buttons
    const qualityButtons = document.querySelectorAll('#videa-toolbar > div.settings-panel > div.settings-version-selector-block.settings-submenu > div > a');
    const videoElement = document.querySelector('video');
    // Click through each quality setting button
    const data = [];
    for (const button of qualityButtons) {
        button.click(); // Click the button
        // Wait for the video to load
        while (videoElement.src === '') {
            await wait(5);
        }
        // Get the current quality setting and the video URL
        let quality = Number(button.innerText.replace('p', ''));
        data.push({quality: quality , url: videoElement.src});
    }
    return data;
}

// Send a message to the parent window that the iframe has been loaded and ready
document.addEventListener('DOMContentLoaded', async function () {
    // Wait until the quality buttons are loaded
    let interval = setInterval(function () {
        if (document.querySelectorAll('#videa-toolbar > div.settings-panel > div.settings-version-selector-block.settings-submenu > div > a').length > 0) {
            clearInterval(interval);
            window.parent.postMessage({plugin: 'MATweaks', type: 'iframeLoaded'}, '*');
        }
    },10);
});
