const observer = new MutationObserver(async (mutations, obs) => {
    if (document.head.querySelector('matweaksget')) {
        try {
            obs.disconnect();
            document.head.querySelector('matweaksget').remove();
            let videoId = window.location.href.match(/https?:\/\/(?:(?:embed\.)?indavideo\.hu\/player\/video\/|assets\.indavideo\.hu\/swf\/player\.swf\?.*\bv(?:ID|id)=)([\da-f]+)/)[1];
            let timestamp = Date.now();
            const script = document.createElement('script');
            script.src = `https://amfphp.indavideo.hu/SYm0json.php/player.playerHandler.getVideoData/${videoId}/12////?directlink&callback=JQuery_${timestamp}&_=${Math.floor(timestamp / 1000)}`;
            document.head.appendChild(script);
            let response = await new Promise((resolve, reject) => {
                let timeout = setTimeout(() => {
                    reject(new Error('Script load timeout'));
                }, 5000);
                window[`JQuery_${timestamp}`] = (data) => {
                    clearTimeout(timeout);
                    resolve(data);
                }
            });
            script.remove();
            let data = document.createElement("MATweaks");
            data.className = "matweaks-data";
            data.setAttribute("data-video-id", videoId);
            data.setAttribute("data-video-data", JSON.stringify(response.data));
            document.head.appendChild(data);
            document.dispatchEvent(new Event("MATweaksIndavideo"));
        } catch (error) {
            console.error(error);
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    observer.observe(document.head, { childList: true, subtree: true });
});