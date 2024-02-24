window.addEventListener('message', function (event) {
    // A message has been received from the parent window
    if (event.data && event.data.plugin === 'MATweaks') {
        // The message is from the "MA Tweaks" extension
        if (event.data.type === 'getSourceUrl') {
            // The parent window requested the source URL of the video
            let retry = 10;  // The number of retries
            let interval = setInterval(function () {  // The interval function
                if (f720() === false && f360() === false) {
                    // Retrying to get the source URL
                    console.log('retrying... ' + retry);
                }
                if (f720() || f360() || retry <= 0) {
                    // Sending the source URL to the parent window
                    clearInterval(interval); // Clear the interval
                    window.parent.postMessage({'plugin': 'MATweaks', 'type': 'sourceUrl', 'data': {'720p': f720(), '360p': f360()}}, '*'); // Send the source URL to the parent window
                    return;
                }
                retry--; // Decrement the retry counter
            }, 100);
        }
    }
});
function f720() {
    // The function to get the 720p source URL
    let hdbutton = document.querySelector('.hd_button span'); // The 720p button
    if (hdbutton === null) { // If the 720p button is not found
        return false; // Return false
    }
    hdbutton.click(); // Click the 720p button
    let sourceUrl720p = document.getElementById('html5video').src; // Get the source URL
    if (sourceUrl720p.includes('.720.')) { // If the source URL contains ".720."
        return sourceUrl720p; // Return the source URL
    } else { // If the source URL does not contain ".720."
        return false; // Return false
    }
}
function f360() {
    let sdbutton = document.querySelector('.sd_button span');  // The 360p button
    if (sdbutton === null) { // If the 360p button is not found
        let sourceUrl360p = document.getElementById('html5video').src; // Get the source URL
        if (sourceUrl360p.includes('.360.')) { // If the source URL contains ".360."
            return sourceUrl360p; // Return the source URL
        } else { // If the source URL does not contain ".360."
            return false; // Return false
        }
    }
    sdbutton.click(); // Click the 360p button
    let sourceUrl360p = document.getElementById('html5video').src; // Get the source URL
    if (sourceUrl360p.includes('.360.')) { // If the source URL contains ".360."
        return sourceUrl360p; // Return the source URL
    } else { // If the source URL does not contain ".360."
        return false; // Return false
    }
}
// Send a message to the parent window that the iframe has been loaded and ready
document.addEventListener('DOMContentLoaded', function () {
    window.parent.postMessage({'plugin': 'MATweaks', 'type': 'iframeLoaded'}, '*');
});
