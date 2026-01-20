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
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLVideoElement) {
                node.preload = 'none'
            }
        })
    })
})

preloadObserver.observe(document.body, { childList: true, subtree: true })
