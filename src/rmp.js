const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.tagName === 'SCRIPT' && node.innerText.includes('const icons = {')) {
                node.parentNode.removeChild(node);
                observer.disconnect();
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
    let list = $('#epizodlista');
    let watchedItems = list.find('li .watched');
    if (watchedItems.length > 0) {
        let lastWatched = watchedItems.last().closest('li');
        list.animate({
            scrollTop: list.scrollTop() + lastWatched.position().top - list.height() / 2 + lastWatched.outerHeight() / 2
        }, 400);
    }
})

// Used to copy error ID to clipboard, if there is an error ( utils.ts -> showError )
window.copyToClipboard = (text, btn) => {
    navigator.clipboard.writeText(text).then(() => {
        const original = btn.innerHTML
        btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        setTimeout(() => {
            btn.innerHTML = original
        }, 1500)
    }).catch(() => {
        console.error('Failed to copy error ID to clipboard.')
    })
}
