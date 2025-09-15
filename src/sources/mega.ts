import Bookmark from '../Bookmark'
import Logger from '../Logger'
import MAT from '../MAT'
import MegaPlayer from '../player/MegaPlayer'
import Resume from '../Resume'


let  Player = new MegaPlayer("", MAT.settings, 0, 0, "", 0, 0);
Logger.success('[mega.js] Script loaded successfully', true);

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === MAT.__ACTIONS__.IFRAME.REPLACE_PLAYER) {
        Logger.log("Player replace event received.", true);
        Player.animeTitle = event.data.animeTitle;
        Player.epNum = Number(event.data.epNum);
        Player.epID = Number(event.data.epID);
        Player.animeID = Number(event.data.animeID);
        Player.malId = Number(event.data.malId);
        MAT.loadSettings().then((settings) => {
            if (settings.advanced.consoleLog) Logger.enable(); else Logger.disable();
            Bookmark.loadBookmarks().then(() => {
                Resume.loadData().then(() => {
                    Player.settings = settings;
                    Player.selector = "video";
                    Player.replace();
                }).catch((error) => {
                    Logger.error("Error while loading resume data: " + error, true);
                    Player.Toast("error","Hiba történt a folytatás adatok betöltése közben.", "error");
                });
            }).catch((error) => {
                Logger.error("Error while loading bookmarks: " + error, true);
                Player.Toast("error","Hiba történt a könyvjelzők betöltése közben.", "error");
            });
        });
    }
})

window.parent.postMessage({type: MAT.__ACTIONS__.IFRAME.FRAME_LOADED}, "*");
