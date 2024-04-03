document.querySelector("#grant-premissions").addEventListener("click",(details) => {
    chrome.permissions.request({"origins":chrome.runtime.getManifest()['host_permissions']});
});
