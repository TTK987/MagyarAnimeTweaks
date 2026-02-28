let obs: MutationObserver = new MutationObserver(async (mutations, obs) => {
    if (document.head.querySelector('matweaksget')) {
        try {
            obs.disconnect()
            preloadObserver.disconnect()
            ;(document.head.querySelector('matweaksget') as HTMLElement).remove()
            let match = window.location.href.match(
                /https?:\/\/(?:(?:embed\.)?indavideo\.hu\/player\/video\/|assets\.indavideo\.hu\/swf\/player\.swf\?.*\bv(?:ID|id)=)([\da-f]+)/,
            )
            let videoId = match ? match[1] : ''
            let timestamp = Date.now()
            const script = document.createElement('script')
            script.src = `https://amfphp.indavideo.hu/SYm0json.php/player.playerHandler.getVideoData/${videoId}/12////?directlink&callback=JQuery_${timestamp}&_=${Math.floor(timestamp / 1000)}`
            document.head.appendChild(script)
            let response: { data: any } = await new Promise((resolve, reject) => {
                let timeout = setTimeout(() => {
                    reject(new Error('Script load timeout'))
                }, 5000)
                ;(window as any)[`JQuery_${timestamp}`] = (data: { data: any }) => {
                    clearTimeout(timeout)
                    resolve(data)
                }
            })
            script.remove()
            let data = document.createElement('MATweaks')
            data.className = 'matweaks-data'
            data.setAttribute('data-video-id', videoId)
            data.setAttribute('data-video-data', JSON.stringify(response.data))
            document.head.appendChild(data)
            document.dispatchEvent(new Event('MATweaksIndavideo'))
        } catch (error) {
            console.error(error)
        }
    }
})

document.addEventListener('DOMContentLoaded', () => {
    obs.observe(document.head, { childList: true, subtree: true })
})

let preloadObserver: MutationObserver = new MutationObserver((mutations, obs) => {
    const removePreloadFromElement = (el: Element | null) => {
        if (!el || !(el instanceof Element)) return
        const tag = el.tagName
        if (tag === 'VIDEO' || tag === 'SOURCE' || el instanceof HTMLMediaElement || el instanceof HTMLSourceElement) {
            if ((el as Element).hasAttribute('preload')) {
                (el as Element).removeAttribute('preload')
            }
        }
    }

    const walkAndRemove = (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            removePreloadFromElement(node as Element)
            ;(node as Element).querySelectorAll && (node as Element)
                .querySelectorAll('video[preload], source[preload]')
                .forEach((el) => removePreloadFromElement(el))
        }
    }

    // Handle mutations
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => walkAndRemove(node))
        if (mutation.type === 'attributes' && mutation.target) {
            removePreloadFromElement(mutation.target as Element)
        }
    })
})

// Initial sweep for elements already in DOM
document.querySelectorAll('video[preload], source[preload]').forEach((el) => {
    el.removeAttribute('preload')
})

;(function hardenPreloadPrevention() {
    // Override the preload property to prevent setting it
    try {
        const mediaProto: any = HTMLMediaElement.prototype
        const sourceProto: any = HTMLSourceElement.prototype

        const overrideProp = (proto: any) => {
            const desc = Object.getOwnPropertyDescriptor(proto, 'preload')
            if (!desc || !desc.configurable) return
            Object.defineProperty(proto, 'preload', {
                configurable: true,
                enumerable: desc.enumerable,
                get: function () {
                    return this.getAttribute ? this.getAttribute('preload') : ''
                },
                set: function (_v: any) {
                    this.removeAttribute && this.removeAttribute('preload')
                },
            })
        }

        overrideProp(mediaProto)
        overrideProp(sourceProto)
    } catch (e) {}

    const wrapSrcSetter = (proto: any) => {
        const desc = Object.getOwnPropertyDescriptor(proto, 'src')
        if (!desc || !desc.set) return
        Object.defineProperty(proto, 'src', {
            configurable: true,
            enumerable: desc.enumerable,
            get: desc.get,
            set: function (v: any) {
                try {
                    this.removeAttribute && this.removeAttribute('preload')
                } catch (e) {
                    /* ignore */
                }
                return desc.set!.call(this, v)
            },
        })
    }

    try {
        wrapSrcSetter(HTMLMediaElement.prototype)
        wrapSrcSetter(HTMLSourceElement.prototype)
    } catch (e) {
        /* ignore */
    }
})()

if (document.body) {
    preloadObserver.observe(document.body, { childList: true, subtree: true })
} else {
    document.addEventListener('DOMContentLoaded', () => {
        preloadObserver.observe(document.body, { childList: true, subtree: true })
    })
}
