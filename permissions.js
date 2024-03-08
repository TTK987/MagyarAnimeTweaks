document.querySelector("#grant-premissions").addEventListener("click",() => {
    // Request permissions for the extension and check if the user granted them
    chrome.permissions.request({"origins":chrome.runtime.getManifest()['host_permissions']},(granted) => {
        if (granted) {
            // If the user granted the permissions, close the popup
            window.close();
        }
    });
});
