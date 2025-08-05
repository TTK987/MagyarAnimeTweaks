document.addEventListener("MATweaksGetSourceUrl", async () => {
    const intervalId = setInterval(() => {
        if (videojs.players.videojs_player) {
            let srcs = videojs.players.videojs_player.currentSources();
            if (srcs.length === 0) return;
            clearInterval(intervalId);
            let qualityData = [];
            for (let src of srcs) {
                qualityData.push({
                    quality: Number(src.label.replace("p", "")),
                    url: src.src
                });
            }
            let dataelement = document.createElement("matweaks");
            dataelement.className = "matweaks-data";
            dataelement.setAttribute("data-video-data", JSON.stringify(qualityData));
            document.head.appendChild(dataelement);
            document.dispatchEvent(new Event("MATweaksSourceUrl"));
        }
    }, 100);
});