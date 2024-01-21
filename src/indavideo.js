// THIS FILE IS LOADED IN AN IFRAME ON INDAVIDEO
// IT SENDS THE SOURCE URL OF THE VIDEO TO THE PARENT WINDOW
window.addEventListener('message', function (event) {
    if (event.data && event.data.plugin === 'MATweaks') {
        if (event.data.type === 'getSourceUrl') {
            // Add a retry system if the video src is embed.indavideo.hu/*
            for (var i = 0; i < 50; i++) {
                var sourceUrlDefault = document.getElementById('html5video').src;
                if (sourceUrlDefault.includes('embed.indavideo.hu/')) {
                    // Retry
                    console.log('Indavideo: The video\'s source url is invalid. Retrying...' + i);
                } else {
                    if (sourceUrlDefault.includes('.360.')) {
                        window.parent.postMessage({
                            'plugin': 'MATweaks',
                            'type': 'sourceUrl',
                            'data': {'720p': false, '360p': sourceUrlDefault}
                        }, '*')
                        return;
                    } else {
                        // The video is available in 720p and 360p
                        window.parent.postMessage({
                            'plugin': 'MATweaks',
                            'type': 'sourceUrl',
                            'data': {'720p': sourceUrlDefault, '360p': f()}
                        }, '*');
                        return;
                    }
                }
            }

                window.location.reload();

        }
    }
});

function f() {
    var sdbutton = document.querySelector('.sd_button span');
    sdbutton.click();
    var sourceUrl360p = document.getElementById('html5video').src;
    if (sourceUrl360p.includes('.360.')) {
        return sourceUrl360p;
    } else {
        return false;
    }
}

window.parent.postMessage({'plugin': 'MATweaks', 'type': 'iframeLoaded'}, '*');
//----------------------------------------------

// COPYRIGHT NOTICE:
// This code is part of the "MA Tweaks" extension for MagyarAnime.eu.
// The extension is not affiliated with MagyarAnime.eu in any way.
// The extension is not affiliated with Indavideo.hu in any way.
// The extension is not affiliated with Mega.nz in any way.
// The extension is not affiliated with any of the fansub groups in any way.
// This project is not used for commercial purposes.
// This project is under the MIT licence.