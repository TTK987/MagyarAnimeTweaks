let sessionID, sitekey;
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.tagName === 'SCRIPT' && node.innerText.includes('const icons = {')) {
                const match = node.innerText.match(/Session ID:\s*([\d,]+)/);
                if (match && match[1]) {
                    sessionID = Number(match[1].trim().replace(/,/g, ''));
                    console.log('Session ID found:', sessionID);
                } else {
                    console.warn('Session ID not found in the script.');
                }

                const sitekeyMatch = node.innerText.match(/sitekey:\s*(['"])([^'"]+)\1/);
                if (sitekeyMatch) {
                    sitekey = sitekeyMatch[2].trim();
                    console.log('Site key found:', sitekey);
                } else {
                    console.warn('Site key not found in the script.');
                }

                // Remove the script tag
                node.parentNode.removeChild(node);
                observer.disconnect();
            } else if (node.tagName === 'STYLE') {
                // Remove the
                // "#VideoPlayer .plyr {
                // 	  max-width: 1200px !important;
                // 	  margin: 0 !important;
                // 	  max-height: 100%;
                // 	}"
                // 	style from the page
                node.textContent = node.textContent.replace(/#VideoPlayer\s*\.plyr\s*{[^}]*}/g, '')
            }
        });
    });
});

observer.observe(document.documentElement, { childList: true, subtree: true });

Object.defineProperty(window, 'currentPlyr', {
    value: null,
    writable: false,
});

let turnstileWidgetId;
let turnstileRequestId;
let turnstileLoadTimer;

function removeTurnstile() {
    clearTimeout(turnstileLoadTimer);
    turnstileRequestId = undefined;
    if (turnstileWidgetId !== undefined) {
        window.turnstile?.remove(turnstileWidgetId);
        turnstileWidgetId = undefined;
    }
}

document.addEventListener('MAT-CFTurnstileDestroy', (event) => {
    if (event.detail?.requestId === turnstileRequestId) removeTurnstile();
});

document.addEventListener('MAT-CFTurnstileInit', (event) => {
    removeTurnstile();
    const requestId = event.detail?.requestId;
    turnstileRequestId = requestId;
    const finish = (result) => {
        if (turnstileRequestId === requestId) {
            document.dispatchEvent(new CustomEvent('MAT-CFTurnstile', {
                detail: { requestId, ...result },
            }));
        }
    };
    const div = document.getElementById('turnstile-player');
    if (!div || !sitekey) {
        finish({ success: false, error: !div ? 'Turnstile div not found' : 'Turnstile site key not found' });
        return;
    }

    const loadStarted = Date.now();
    const render = () => {
        if (turnstileRequestId !== requestId) return;
        if (!window.turnstile) {
            if (Date.now() - loadStarted >= 30000) {
                finish({ success: false, error: 'Turnstile not loaded' });
            } else {
                turnstileLoadTimer = setTimeout(render, 100);
            }
            return;
        }
        try {
            const widgetId = window.turnstile.render(div, {
                sitekey,
                theme: 'dark',
                size: div.clientWidth < 300 ? 'compact' : 'normal',
                callback: (token) => finish({ success: true, token }),
                'error-callback': () => finish({ success: false, error: 'Turnstile error' }),
                'expired-callback': () => finish({ success: false, error: 'Turnstile token expired' }),
                'timeout-callback': () => finish({ success: false, error: 'Turnstile timeout' }),
            });
            if (turnstileRequestId === requestId) {
                turnstileWidgetId = widgetId;
            } else {
                window.turnstile.remove(widgetId);
            }
        } catch (error) {
            finish({ success: false, error: error instanceof Error ? error.message : 'Turnstile error' });
        }
    };
    render();
})

document.addEventListener('DOMContentLoaded', () => {
    if (sessionID) {
        let element = document.createElement("mat-data")
        element.setAttribute("session-id", sessionID);
        document.body.appendChild(element);
    }
    if (sitekey) {
        let element = document.createElement("mat-data")
        element.setAttribute("site-key", sitekey);
        document.body.appendChild(element);
    }
    let list = $('#epizodlista');
    let watchedItems = list.find('li.active');
    if (watchedItems.length > 0) {
        let lastWatched = watchedItems.last().closest('li');
        list.animate({
            scrollTop: list.scrollTop() + lastWatched.position().top - list.height() * 0.55 + lastWatched.outerHeight() / 2
        }, 400);
    }
})
