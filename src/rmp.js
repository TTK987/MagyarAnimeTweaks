let sessionID;
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

document.addEventListener('DOMContentLoaded', () => {
    if (sessionID) {
        let element = document.createElement("mat-data")
        element.setAttribute("session-id", sessionID);
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
