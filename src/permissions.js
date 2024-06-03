document.querySelector("#grant-premissions").addEventListener("click",(details) => {
    chrome.permissions.request({"origins":chrome.runtime.getManifest()['host_permissions']}
    ,function(granted){
        if(granted){
            document.querySelector("#grant-premissions").remove();
            document.querySelector("p").remove();
            const p = document.createElement("p");
            p.textContent = "Jogok engedélyezve";
            document.body.appendChild(p);
            p.style.color = "green";
            p.style.fontWeight = "bold";
            p.style.fontSize = "20px";
            console.log("Permissions granted");
            setTimeout(function(){
                window.close();
            },1000);
        }else{
            console.log("Permissions not granted");
        }
    });
});
