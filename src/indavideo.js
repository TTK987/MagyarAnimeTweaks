window.addEventListener('message', function (event) {
    if (event.data && event.data.plugin === 'MATweaks') {
        if (event.data.type === 'getSourceUrl') {
            var retry = 10;
            var interval = setInterval(function () {
                if (f720() === false && f360() === false) {
                    console.log('retrying... ' + retry);
                }
                if (f720() || f360() || retry <= 0) {
                    clearInterval(interval);
                    window.parent.postMessage({
                        'plugin': 'MATweaks',
                        'type': 'sourceUrl',
                        'data': {'720p': f720(), '360p': f360()}
                    }, '*');
                    return;
                }
                retry--;
            }, 100);
        }
    }
});
function f720() {
    var sdbutton = document.querySelector('.hd_button span');
    if (sdbutton === null) {
        return false;
    }
    sdbutton.click();
    var sourceUrl720p = document.getElementById('html5video').src;
    if (sourceUrl720p.includes('.720.')) {
        return sourceUrl720p;
    } else {
        return false;
    }
}
function f360() {
    var sdbutton = document.querySelector('.sd_button span');
    if (sdbutton === null) {
        var sourceUrl360p = document.getElementById('html5video').src;
        if (sourceUrl360p.includes('.360.')) {
            return sourceUrl360p;
        } else {
            return false;
        }
    }
    sdbutton.click();
    var sourceUrl360p = document.getElementById('html5video').src;
    if (sourceUrl360p.includes('.360.')) {
        return sourceUrl360p;
    } else {
        return false;
    }
}
window.parent.postMessage({'plugin': 'MATweaks', 'type': 'iframeLoaded'}, '*');
// ---------------------------------------------------------------------------------------------------------------------
// COPYRIGHT NOTICE:
// - The code above is part of the "MA Tweaks" extension for MagyarAnime.eu.
// - The extension is NOT related to the magyaranime.eu website or the indavideo.hu website other than it's purpose.
// - The program is protected by the MIT licence.
// - The extension is NOT used for any commercial purposes.
// - The extension can only be used on the magyaranime.eu website.
// - The developers are not responsible for any damages caused by the use of the extension.
// - The extension was created in accordance with the "The content on the site is freely available" terms of the Magyar Anime website.
// - The extension was created in accordance with the DMCA rules of the Magyar Anime website. https://magyaranime.eu/web/dmca/
// - The developers (/s) reserve the right to modify the extension at any time.
// - If the developer (/s) of Magyar Anime requests it, I will remove the extension from GitHub and any other platform.
// - The extension is only available in Hungarian.
// - By using the extension you accept the above.
