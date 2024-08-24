document.querySelector("#grant-premissions").addEventListener("click", () => {
    chrome.permissions.request({origins: chrome.runtime.getManifest()['host_permissions'] }, granted => {
        if (granted) {
            document.querySelector("#grant-premissions").remove();
            document.querySelector("p").remove();
            const p = document.createElement("p");
            p.textContent = "Jogok engedélyezve";
            Object.assign(p.style, { color: "green", fontWeight: "bold", fontSize: "20px" });
            document.body.appendChild(p);
            console.log("Permissions granted");
            setTimeout(() => window.close(), 1000);
        } else {
            console.log("Permissions not granted");
        }
    });
});