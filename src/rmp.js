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

                const sitekeyMatch = node.innerText.match(/(?:\bsitekey|['"]sitekey['"])\s*:\s*(['"])([^'"]+)\1/);
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
let turnstileWidgetApi;
let turnstileLoadCleanup;
const failedTurnstileScripts = new WeakSet();

function parseTurnstileRequest(event) {
    try {
        if (typeof event.detail !== 'string') return;
        const data = JSON.parse(event.detail);
        if (data && Number.isSafeInteger(data.requestId) && data.requestId > 0) return data;
    } catch {}
}

function removeTurnstileWidget(api, widgetId) {
    try {
        api?.remove(widgetId);
    } catch (error) {
        console.warn('Cannot remove Turnstile widget:', error);
    }
}

function removeTurnstile() {
    turnstileRequestId = undefined;
    turnstileLoadCleanup?.();
    turnstileLoadCleanup = undefined;
    if (turnstileWidgetId !== undefined) {
        const widgetId = turnstileWidgetId;
        const api = turnstileWidgetApi;
        turnstileWidgetId = undefined;
        turnstileWidgetApi = undefined;
        removeTurnstileWidget(api, widgetId);
    }
}

function loadTurnstile(requestId, onReady, onError) {
    let finished = false;
    let script;
    let ownsScript = false;
    let pollTimer;
    let timeout;
    const cleanup = () => {
        if (finished) return;
        finished = true;
        clearInterval(pollTimer);
        clearTimeout(timeout);
        script?.removeEventListener('load', check);
        script?.removeEventListener('error', failed);
        if (turnstileLoadCleanup === cancel) turnstileLoadCleanup = undefined;
    };
    const failed = () => {
        if (finished) return;
        if (script) failedTurnstileScripts.add(script);
        cleanup();
        if (turnstileRequestId === requestId) {
            onError('A Cloudflare ellenőrzés nem tölthető be. Ellenőrizd, hogy a challenges.cloudflare.com nincs-e letiltva.');
        }
    };
    const check = () => {
        if (finished) return;
        if (turnstileRequestId !== requestId) {
            cleanup();
            return;
        }
        const api = window.turnstile;
        if (typeof api?.render !== 'function') return;
        cleanup();
        onReady(api);
    };

    const cancel = () => {
        if (!finished && ownsScript && !window.turnstile) {
            failedTurnstileScripts.add(script);
            script.remove();
        }
        cleanup();
    };

    turnstileLoadCleanup = cancel;
    pollTimer = setInterval(check, 100);
    timeout = setTimeout(failed, 30000);
    check();
    if (finished) return;

    script = Array.from(document.scripts).find((candidate) => {
        try {
            const url = new URL(candidate.src);
            return url.origin === 'https://challenges.cloudflare.com' && url.pathname === '/turnstile/v0/api.js';
        } catch {
            return false;
        }
    });

    if (script && failedTurnstileScripts.has(script)) {
        script.remove();
        script = undefined;
    }
    if (!script) {
        script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        ownsScript = true;
        const nonce = document.querySelector('script[nonce]')?.nonce;
        if (nonce) script.nonce = nonce;
    }
    script.addEventListener('load', check);
    script.addEventListener('error', failed);
    if (ownsScript) {
        try {
            (document.head || document.documentElement).appendChild(script);
        } catch {
            failed();
        }
    }
}

document.addEventListener('MAT-CFTurnstileDestroy', (event) => {
    if (parseTurnstileRequest(event)?.requestId === turnstileRequestId) removeTurnstile();
});

document.addEventListener('MAT-CFTurnstileInit', (event) => {
    const data = parseTurnstileRequest(event);
    if (!data || typeof data.containerId !== 'string') return;
    const div = document.getElementById(data.containerId);
    if (!div?.closest('dialog.mat-captcha')) return;
    removeTurnstile();
    const requestId = data.requestId;
    turnstileRequestId = requestId;
    let lastStatus;
    const emit = (result) => {
        if (turnstileRequestId === requestId) {
            lastStatus = result.status;
            document.dispatchEvent(new CustomEvent('MAT-CFTurnstile', {
                detail: JSON.stringify({ requestId, ...result }),
            }));
        }
    };
    if (!sitekey) {
        emit({ status: 'error', error: 'Nem található a Cloudflare ellenőrzéshez szükséges sitekey.' });
        return;
    }
    emit({ status: 'loading' });
    loadTurnstile(requestId, (api) => {
        if (turnstileRequestId !== requestId) return;
        try {
            const widgetId = api.render(div, {
                sitekey,
                theme: 'dark',
                size: div.clientWidth < 300 ? 'compact' : 'normal',
                retry: 'auto',
                'refresh-expired': 'auto',
                'refresh-timeout': 'auto',
                callback: (token) => emit({ status: 'success', token }),
                'error-callback': (errorCode) => {
                    const code = String(errorCode || 'unknown');
                    const fatal = /^(110100|110110|110200|400020|400021|400070)$/.test(code);
                    emit({ status: fatal ? 'error' : 'retrying', error: 'Cloudflare Turnstile hiba.', code });
                    return fatal;
                },
                'expired-callback': () => emit({ status: 'retrying', error: 'Az ellenőrzés lejárt. Új ellenőrzés betöltése...' }),
                'timeout-callback': () => emit({ status: 'retrying', error: 'Az ellenőrzés időtúllépés miatt újraindul...' }),
            });
            if (turnstileRequestId === requestId) {
                turnstileWidgetId = widgetId;
                turnstileWidgetApi = api;
                if (lastStatus === 'loading') emit({ status: 'ready' });
            } else {
                removeTurnstileWidget(api, widgetId);
            }
        } catch (error) {
            emit({ status: 'error', error: error instanceof Error ? error.message : 'Turnstile error' });
        }
    }, (error) => emit({ status: 'error', error }));
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
