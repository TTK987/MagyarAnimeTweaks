document.addEventListener("MATweaks", function(event) {
    if (event.detail.type === "removePlayer" && player) {
        player.destroy();
    }
});
