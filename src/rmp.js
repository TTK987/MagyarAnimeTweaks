document.addEventListener("MATweaks", function(event) {
    if (event.detail.type === "removePlayer") {
        if (player) {
            player.destroy();
        }
    }
});
// This is only relevant for users who have the "Premium Player" on the site.

