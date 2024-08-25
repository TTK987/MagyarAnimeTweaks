document.addEventListener("MATweaks", function(event) {
    if (event.detail.type === "removePlayer") {
        if (player) {
            player.destroy();
        }
    }
});


