document.querySelector("#grant-premissions").addEventListener("click",(details) => { // add a click event to the element where id="grant-premissions"
    chrome.permissions.request({"origins":chrome.runtime.getManifest()['host_permissions']}); // on click request all website premissions (browser will only ask the user what is not granted)
});
