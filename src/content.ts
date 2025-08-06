import MAT from './MAT'
import Bookmarks from './Bookmark'
import Resume from './Resume'
import Logger from './Logger'
import MagyarAnime from './MagyarAnime'
import {keyBind, ServerResponse, SettingsV019, EpisodeVideoData} from './global'
import Toast from './Toast'
import {showError} from './lib/utils'
import "./styles/tailwind.css"
import NativePlayer from './player/NativePlayer'
import {parseVideoData} from './Helpers'
import HLSPlayer from "./player/HLSPlayer";
import IFramePlayerComm from "./player/IFrameComm";
import {download, downloadHLS} from "./downloads";




let settings: SettingsV019 = MAT.getDefaultSettings()
let MA: MagyarAnime = new MagyarAnime(document, window.location.href)
let isRoadblockCalled = false
let currentServer = 's1'
let csrfToken = ''
let Player: NativePlayer | HLSPlayer | undefined = undefined
let IFrameComm: IFramePlayerComm | undefined = undefined
let currentServerData: ServerResponse | undefined = undefined
let epSwitchCooldown = false
let downloadCooldown = false

window.addEventListener('load', () => { loadSettings().then(() => initializeExtension()).catch((error) => Logger.error('Error while loading settings: ' + error, true)) })

function loadSettings(): Promise<boolean> {
    return new Promise((resolve: (value: boolean) => void, reject: (reason?: any) => void) => {
        MAT.loadSettings()
            .then((data) => {
                settings = data as SettingsV019
                if (settings.advanced.consoleLog) Logger.enable()
                else Logger.disable()
                resolve(true)
            })
            .catch((error) => {
                settings = MAT.getDefaultSettings()
                Toast.error(
                    'Hiba történt a beállítások betöltése közben. Alapértelmezett beállítások lesznek használva.',
                    '',
                    { duration: 5000 },
                )
                Logger.error('Error while loading settings: ' + error, true)
                reject(error)
            })
    })
}

function initializeExtension() {
    if (MA.isMaintenancePage()) MaintenancePage()
    else {
        addSettingsButton()
        if (MA.isEpisodePage) EpisodePage()
        else if (MA.isDatasheetPage) DatasheetPage()
    }
    Logger.success('Extension initialized.')
}

const ERROR_CODES = {
    CSRF: {
        NOT_FOUND: "001",
        EXPIRED: "002"
    },
    SERVER: {
        NOT_FOUND: "001",
        INVALID: "002",
        DATA_MISSING: "003",
        RESPONSE_ERROR: "004"
    },
    VIDEO: {
        PLAYER_NOT_FOUND: "001",
        NO_SOURCES: "002",
        IFRAME_MISSING: "003",
        DATA_ERROR: "004",
        INVALID_TYPE: "005",
        DOWNLOAD_ERROR: "006"
    },
    REQUEST: {
        INVALID_ARGS: "001",
        FETCH_ERROR: "002",
        RESPONSE_ERROR: "003",
        TIMEOUT: "004"
    },
    PLAYER: {
        INIT_ERROR: "001",
        LOAD_ERROR: "002",
        TYPE_ERROR: "003"
    }
} as const;
const ERROR_MESSAGES = {
    CSRF: {
        NOT_FOUND: "CSRF token nem található.",
        EXPIRED: "CSRF token lejárt, oldal újratöltése..."
    },
    SERVER: {
        NOT_FOUND: "Videó lejátszó nem található.",
        INVALID: "Érvénytelen szerver.",
        DATA_MISSING: "Szerver adatok nem találhatók.",
        RESPONSE_ERROR: "Szerver válasz hiba."
    },
    VIDEO: {
        PLAYER_NOT_FOUND: "Videó lejátszó nem található.",
        NO_SOURCES: "Videó források nem találhatók.",
        IFRAME_MISSING: "IFrame nem található.",
        DATA_ERROR: "Videó adatok betöltési hiba.",
        INVALID_TYPE: "Támogatatlan lejátszó típus.",
        DOWNLOAD_ERROR: "Videó letöltési hiba."
    },
    REQUEST: {
        INVALID_ARGS: "Érvénytelen argumentumok.",
        FETCH_ERROR: "Hálózati hiba.",
        RESPONSE_ERROR: "Szerver kommunikációs hiba.",
        TIMEOUT: "Kérés időtúllépés."
    },
    PLAYER: {
        INIT_ERROR: "Lejátszó inicializálási hiba.",
        LOAD_ERROR: "Videó betöltési hiba.",
        TYPE_ERROR: "Lejátszó típus hiba."
    }
} as const;

function genErrorSchema(area: string, shortcode: string, errorCode: string): string {
    return `EP${MA.EPISODE.getId()}-${currentServer.toUpperCase()}-${area}-${shortcode}-${errorCode}`;
}

function handleError(area: keyof typeof ERROR_CODES, type: string, customMessage?: string): void {
    const errorCode = ERROR_CODES[area][type as keyof typeof ERROR_CODES[typeof area]] || "999";
    const message = customMessage || ERROR_MESSAGES[area][type as keyof typeof ERROR_MESSAGES[typeof area]] || "Ismeretlen hiba történt.";
    const schema = genErrorSchema(area.toUpperCase(), type.toUpperCase(), errorCode);


    if (Player?.plyr) Player.plyr.destroy();
    Player = undefined;
    IFrameComm?.removeMSGListeners()
    IFrameComm = undefined;
    removeIFrameEventListeners();
    document.querySelector("#VideoPlayer")!.innerHTML = "";



    Logger.error(message);
    showError(`Hiba történt: ${message}`, schema);
}


function MaintenancePage() {
    Logger.error('MagyarAnime is under maintenance.')
    Toast.error(
        'Karbantartás alatt',
        'A MagyarAnime karbantartás alatt van. Kérlek próbáld meg később. És lehetőleg légy türelmes, amíg a karbantartás tart.',
        { duration: 1000000 },
    )
    return
}

function DatasheetPage() {
    // Currently, this function only logs the anime data
    console.log({
        image: MA.ANIME.getImage(),
        title: MA.ANIME.getTitle(),
        description: MA.ANIME.getDescription(),
        ageRating: MA.ANIME.getAgeRating(),
        season: MA.ANIME.getSeason(),
        episodeCount: MA.ANIME.getEpisodeCount(),
        maxEpisodeCount: MA.ANIME.getMaxEpisodeCount(),
        releaseDate: MA.ANIME.getReleaseDate(),
        views: MA.ANIME.getViews(),
        episodes: MA.ANIME.getEpisodes(),
        source: MA.ANIME.getSource(),
        checks: {
            isEpisodePage: MA.isEpisodePage,
            isAnimePage: MA.isDatasheetPage,
            isMaintenancePage: MA.isMaintenancePage(),
        },
    })
}

function EpisodePage() {
    console.log({
        anTitle: MA.EPISODE.getTitle(),
        epNum: MA.EPISODE.getEpisodeNumber(),
        releaseDate: MA.EPISODE.getReleaseDate(),
        views: MA.EPISODE.getViews(),
        fansub: MA.EPISODE.getFansub(),
        animeLink: MA.EPISODE.getAnimeLink(),
        allEpisodes: MA.EPISODE.getAllEpisodes(),
        epID: MA.EPISODE.getId(),
        anID: MA.EPISODE.getAnimeID(),
        checks: {
            isEpisodePage: MA.isEpisodePage,
            isAnimePage: MA.isDatasheetPage,
            isMaintenancePage: MA.isMaintenancePage(),
        },
    })

    const triggerBox = document.getElementById("triggerBox");
    if (triggerBox) {
        triggerBox.addEventListener('click', () => {
            (document.getElementById('descBox') as HTMLDivElement).classList.toggle('active');
        });
    }

    if (settings.advanced.player !== 'plyr') return

    // Load
    Bookmarks.loadBookmarks().then(() => Logger.success('Bookmarks loaded.'))
    Resume.loadData().then(() => Logger.success('Resume data loaded.'))

    // Fix some CSS issues
    MA.addCSS(`#lejatszo, #indavideoframe {max-width: 100%;}`)

    loadVideo(currentServer, Number((document.querySelector('#VideoPlayer') as HTMLVideoElement).getAttribute('data-vid')))
    let listener = (visibilityEvent: Event) => {
        if (document.visibilityState === 'visible') {
            if (isRoadblockCalled) {document.removeEventListener('visibilitychange', listener); return}
            document.removeEventListener('visibilitychange', listener)
            loadVideo(currentServer, Number((document.querySelector('#VideoPlayer') as HTMLVideoElement).getAttribute('data-vid')))
        }
    }
    document.addEventListener('visibilitychange', listener)

    // Get the current server and video ID
    let csrf = (document.querySelector("meta[name='magyaranime']") as HTMLMetaElement).getAttribute("content") as string;
    if (!csrf) {
        handleError("CSRF", "NOT_FOUND");
        return;
    }
    csrfToken = csrf;

    let videoPlayer = document.querySelector("#VideoPlayer") as HTMLVideoElement;
    if (!videoPlayer) {
        handleError("SERVER", "NOT_FOUND");
        return;
    }

    let server = videoPlayer.getAttribute("data-server") as string;
    if (!server || !["s1", "s2", "s3", "s4"].includes(server)) {
        handleError("SERVER", "INVALID", `Érvénytelen szerver: ${server}`);
        return;
    }

    currentServer = server;

    document.querySelectorAll('.videoChange').forEach((button) => {
        button.addEventListener('click', (event) => {
            let target = event.target as HTMLButtonElement;
            if (!target.classList.contains("videoChange")) {
                target = target.closest(".videoChange") as HTMLButtonElement;
            }
            let server = target.getAttribute("data-server") as string;
            let vid = Number(target.getAttribute("data-vid"));
            if (!server || !["s1", "s2", "s3", "s4"].includes(server) || isNaN(vid) || vid < 1 || vid > 80000) {
                handleError("REQUEST", "INVALID_ARGS", `Érvénytelen szerver vagy videó ID: szerver: ${server}, vid: ${vid}`);
                return;
            }
            window.location.href = `https://magyaranime.eu/${server === 's1' ? 'resz' : `resz-${server.toLowerCase()}`}/${vid}/`;
        })
    })

}

function roadblock() {
    if (isRoadblockCalled) return
    isRoadblockCalled = true

    let videoPlayer = document.querySelector('#VideoPlayer .error-container') as HTMLDivElement
    videoPlayer.innerHTML = `
<div class="error-container">
    <img src="https://magyaranime.eu/images/machan/Ma-chan_laugh_emot.png" width="200" height="200" alt="Ma-chan nevetés">
    <div style="text-align: center;font-weight: bold;background-color: #05070b;border-color: #ffffff;padding: .75rem 1.25rem;border: 1px solid var(--primary-color);border-radius: .25rem;">
        <div style="width: 350px; text-align: center;">
          <div id="loadingText" style="margin-bottom: 5px;font-size: 18px;font-weight: 500;letter-spacing: 1px;">Betöltés alatt... Kérjük, várj!</div>
          <div style="width: 100%; height: 6px; background-color: rgba(255, 255, 255, 0.1); border-radius: 8px; overflow: hidden; position: relative; box-shadow: 0 0 10px rgba(0, 0, 0, 0.2) inset; backdrop-filter: blur(5px);">
            <div id="loadingBar" style="height: 100%;width: 0;background: linear-gradient(90deg, #3F9FFF, #60b0ff, #3F9FFF);background-size: 200% 100%;border-radius: 8px;transition: width 20ms cubic-bezier(0.4, 0, 0.2, 1);animation: shimmer 4s infinite linear;box-shadow: 0 0 15px rgba(0, 162, 255, 0.5);">
            </div>
          </div>
          <div style="margin-top: 5px;font-size: 10px;font-weight: 500;color: rgba(255, 255, 255, 0.7);display: flex;justify-content: space-between;">
            <span>Ha nem történik semmi, kérlek próbáld meg újra!</span>
            <span id="loadingPercentage" style="color: #00a2ff; font-weight: 600;">0%</span>
          </div>
        </div>
    </div>
</div>
    `

    let loadingBar = document.querySelector('#loadingBar') as HTMLDivElement
    let loadingText = document.querySelector('#loadingText') as HTMLDivElement
    let loadingPercentage = document.querySelector('#loadingPercentage') as HTMLDivElement

    let progress = 0
    let interval = setInterval(() => {
        progress += 1
        loadingBar.style.width = `${progress}%`
        loadingPercentage.innerHTML = `${progress}%`
        if (progress >= 100) {
            clearInterval(interval)
            loadingText.innerHTML = 'Betöltés kész!'
            loadingBar.style.animation = 'none'
            loadingBar.style.width = '100%'
            loadingPercentage.innerHTML = '100%'
            setTimeout(() => {
                isRoadblockCalled = true
                loadVideo(currentServer, Number((document.querySelector('#VideoPlayer') as HTMLVideoElement).getAttribute('data-vid')));
            }, 200)
        }
    }, 20) // 2000ms (2 seconds) total loading time

    let style = `
    <style>
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
    </style>
    `
    document.head.insertAdjacentHTML('beforeend', style)
}

function getServerResponse(server: string, vid: number): Promise<ServerResponse> {
    if (!["s1", "s2", "s3", "s4"].includes(server) || vid < 1 || vid > 80000 || !csrfToken) {
        if (!csrfToken) {
            handleError("CSRF", "NOT_FOUND");
        } else if (!["s1", "s2", "s3", "s4"].includes(server)) {
            handleError("REQUEST", "INVALID_ARGS", `Érvénytelen szerver: ${server}`);
        } else {
            handleError("REQUEST", "INVALID_ARGS", `Érvénytelen videó ID: ${vid}`);
        }
        return Promise.reject("Invalid arguments");
    }

    const requestBody = new URLSearchParams({
        server: server,
        vid: vid.toString(),
        csrf_token: csrfToken
    });

    return fetch("https://magyaranime.eu/data/lejatszo/data_player.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "MagyarAnimeTweaks": "v" + MAT.getVersion(),
            "Accept": "application/json, text/javascript; q=0.01",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": navigator.userAgent,
            "Referer": window.location.href,
            "Origin": window.location.href
        },
        body: requestBody.toString()
    }).then(response => {
        if (!response.ok) {
            handleError("REQUEST", "RESPONSE_ERROR", `Szerver hiba: ${response.statusText}`);
            return Promise.reject(`Error while loading video: ${response.statusText}`);
        }
        return response.json();
    }).catch(e => {
        handleError("REQUEST", "FETCH_ERROR", `Hálózati hiba: ${e}`);
        return Promise.reject(e);
    });
}

function loadVideo(server: string, vid: number) {
    if (!isRoadblockCalled) {
        roadblock();
        return;
    }

    if (!server || !vid) {
        handleError("REQUEST", "INVALID_ARGS", "Szerver vagy videó ID nem definiált.");
        return;
    }

    currentServer = server;

    window.history.replaceState({}, '', `https://magyaranime.eu/${server === 's1' ? 'resz' : `resz-${server.toLowerCase()}`}/${vid}/`);
    document.querySelector('#VideoPlayer')!.setAttribute('data-server', server);
    document.querySelector('#VideoPlayer')!.setAttribute('data-vid', String(vid));


    Logger.log(`Loading video from server: ${server}, video ID: ${vid}`);

    getServerResponse(server, vid)
        .then((data: ServerResponse) => {
            handleServerResponse(data, server);
        })
        .catch((error) => {
            handleError("PLAYER", "LOAD_ERROR", `Videó betöltési hiba: ${error}`);
        });


}

function decidePlayerType(data: ServerResponse): "HLS" | "HTML5" | "indavideo" | "videa" | "dailymotion" | "mega" | "Unknown" {
    if (data.hls) return "HLS";
    if (data.output) {
        if (data.output.includes("<iframe")) {
            const iframeSources = ["indavideo.hu", "videa.hu", "dailymotion.com", "mega.nz"];
            for (const source of iframeSources) {
                if (data.output.includes(source)) {
                    if (source === "indavideo.hu") return "indavideo";
                    if (source === "videa.hu") return "videa";
                    if (source === "dailymotion.com") return "dailymotion";
                    if (source === "mega.nz") return "mega";
                }
            }
        } else if (data.output.includes("<video")) {
            return "HTML5";
        }
    }
    return "Unknown";
}

function handleServerResponse(data: ServerResponse, server: string) {
    setDailyLimit(data);
    setServers(data);

    currentServerData = data;

    if (data.error && data.error !== "") {
        handleError("SERVER", "RESPONSE_ERROR", data.error);
    }

    if (data.needRefleshPage) {
        handleError("CSRF", "EXPIRED");
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        return;
    }

    if (Player?.plyr) Player.plyr.destroy();
    Player = undefined;
    IFrameComm?.removeMSGListeners()
    IFrameComm = undefined;
    removeIFrameEventListeners();
    document.querySelector("#VideoPlayer")!.innerHTML = "";


    switch (decidePlayerType(data)) {
        case "HLS":
            if (data.hls_url) {
                Logger.log("HLS player detected, loading video...");
                loadHLSPlayer(data)
            } else {
                handleError("VIDEO", "NO_SOURCES", "HLS URL nem található.");
            }
            break;
        case "HTML5":
            Logger.log("HTML5 player detected, loading video...");
            loadHTML5Player(data);
            break;
        case "dailymotion":
            Logger.log("Dailymotion player detected, loading video...");
            loadIFramePlayer(data)
            break;
        case "mega":
            Logger.log(`${decidePlayerType(data)} player detected, loading video...`);
            loadIFramePlayer(data)
            break;
        case "indavideo":
            Logger.log("Indavideo player detected, loading video...");
            getQualityDataFromIFrame(data).then((videoData => {
                loadHTML5Player(data, videoData);
            })).catch((error) => {
                handleError("VIDEO", "DATA_ERROR", `Indavideo videó adatok betöltési hiba: ${error}`);
            })
            break;
        case "videa":
            Logger.log("Videa player detected, loading video...");
            getQualityDataFromIFrame(data).then((videoData => {
                loadHTML5Player(data, videoData);
            })).catch((error) => {
                handleError("VIDEO", "DATA_ERROR", `Videa videó adatok betöltési hiba: ${error}`);
            })
            break;
        case "Unknown":
            handleError("VIDEO", "INVALID_TYPE", `Támogatatlan lejátszó típus: ${decidePlayerType(data)}`);
            break;
    }


}

function genVideoHTML(videoData: EpisodeVideoData[]): string {
    return `
<video id="player" tabindex="0" controls autoplay playsinline>
    ${videoData.map(video => `<source src="${video.url}" type="video/mp4; codecs=avc1.42E01E, mp4a.40.2" size="${video.quality}"/>`).join('')}
</video>`;
}

function checkShortcut(event: KeyboardEvent, shortcut: keyBind): boolean {
    return (
        event.ctrlKey === shortcut.ctrlKey &&
        event.altKey === shortcut.altKey &&
        event.shiftKey === shortcut.shiftKey &&
        event.key === shortcut.key
    )
}

function getQualityDataHTML5(data: ServerResponse): EpisodeVideoData[] {
   const videoSources = [...data.output.matchAll(/<source\s+src="([^"]+)"[^>]*size="(\d+)"/g)];
   if (videoSources.length === 0) {
       handleError("VIDEO", "NO_SOURCES");
       return [];
   }

   return videoSources.map(match => {
       const url = match[1].startsWith("//") ? "https:" + match[1] : match[1];
       const quality = parseInt(match[2], 10);
       const expiresMatch = url.match(/expires=(\d+)/);
       return {
           url,
           quality,
           expires: expiresMatch ? parseInt(expiresMatch[1], 10) : null,
       } as EpisodeVideoData;
   });
}

function getQualityDataFromIFrame(data: ServerResponse): Promise<EpisodeVideoData[]> {
    return new Promise((resolve, reject) => {
        IFrameComm = new IFramePlayerComm();
        const iframeMatch = data.output.match(/<iframe[^>]*src="([^"]+)"[^>]*>/);
        if (!iframeMatch) {
            handleError("VIDEO", "IFRAME_MISSING");
            reject("No iframe found in the output.");
            return
        }
        let iframe = document.createElement('iframe');
        iframe.src = iframeMatch[1];
        iframe.id = "indavideoframe";
        iframe.style.width = "0px";
        iframe.style.height = "0px";
        iframe.style.display = "none";
        iframe.style.border = "none";
        IFrameComm.IFrame = iframe.contentWindow
        document.body.appendChild(iframe);
        IFrameComm.IFrame = (document.querySelector("iframe") as HTMLIFrameElement).contentWindow as Window;
        IFrameComm.onFrameLoaded = () => {
            IFrameComm!.getVideoData().then((videoData: EpisodeVideoData[]) => {
                if (videoData.length === 0) {
                    handleError("VIDEO", "DATA_ERROR", "Videó adatok nem találhatók az iframe-ben.");
                    reject("No video data found in the iframe.");
                    iframe.remove()
                    return;
                }
                iframe.remove()
                resolve(videoData);
            })
        };
    })
}

function IFrameEventListener(e: KeyboardEvent) {
    if (["INPUT", "TEXTAREA"].includes((document.activeElement as HTMLElement).tagName)) return;
    if (!IFrameComm) {
        Logger.error("PlayerComm is not defined.");
        return;
    }
    if (settings.forwardSkip.enabled && checkShortcut(e, settings.forwardSkip.keyBind)) IFrameComm.skipForward();  // Forward skip
    else if (settings.backwardSkip.enabled && checkShortcut(e, settings.backwardSkip.keyBind)) IFrameComm.skipBackward(); // Backward skip
    else  if (settings.nextEpisode.enabled && checkShortcut(e, settings.nextEpisode.keyBind)) nextEpisode()
    else if (settings.previousEpisode.enabled && checkShortcut(e, settings.previousEpisode.keyBind)) previousEpisode()
    else if (e.key === " " || e.key === "Spacebar") IFrameComm.togglePlay(); // Play/Pause toggle
    else if (e.key === "ArrowUp") IFrameComm.volUp(); // Volume up
    else if (e.key === "ArrowDown") IFrameComm.volDown(); // Volume down
    else if (e.key === "ArrowRight") IFrameComm.seek(settings.skip.time); // Seek forward
    else if (e.key === "ArrowLeft") IFrameComm.seek(-settings.skip.time); // Seek backward
    else if (e.key === "m" || e.key === "M") IFrameComm.toggleMute(); // Mute toggle
    else if (e.key === "f" || e.key === "F") IFrameComm.toggleFullscreen(); // Fullscreen toggle
    else if (e.key === "k" || e.key === "K") IFrameComm.togglePlay(); // Play/Pause toggle
    else if (e.key.match(/[0-9]/)) IFrameComm.seekPercentage(Number(e.key) * 10); // Seek to percentage
    else {
        return; // If no shortcut matches, do nothing
    }
    e.preventDefault();
    e.stopPropagation();
}

function addIFrameEventListeners() {
    document.addEventListener("keydown", IFrameEventListener);
}

function removeIFrameEventListeners() {
    document.removeEventListener("keydown", IFrameEventListener);
}

function loadIFramePlayer(data: ServerResponse) {
    IFrameComm = new IFramePlayerComm();
    const iframeMatch = data.output.match(/<iframe[^>]*src="([^"]+)"[^>]*>/);
    if (!iframeMatch) {
        handleError("VIDEO", "IFRAME_MISSING");
        return;
    }
    let iframe = document.createElement('iframe');
    iframe.src = iframeMatch[1];
    iframe.id = "indavideoframe";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.setAttribute('title', 'video-player');
    iframe.setAttribute('type', 'text/html');
    IFrameComm.IFrame = iframe.contentWindow

    document.querySelector("#VideoPlayer")!.innerHTML = ""
    document.querySelector("#VideoPlayer")?.appendChild(iframe);
    IFrameComm.IFrame = (document.querySelector("#indavideoframe") as HTMLIFrameElement).contentWindow as Window;

    let isIframeLoaded = false;

    IFrameComm.onFrameLoaded = () => {
        if (isIframeLoaded) return;
        isIframeLoaded = true;
        if (!IFrameComm || settings.advanced.player !== 'plyr') return;
        IFrameComm.replacePlayer(
            MA.EPISODE.getTitle(),
            MA.EPISODE.getEpisodeNumber(),
            MA.EPISODE.getId(),
            MA.EPISODE.getAnimeID(),
            MA.EPISODE.getFansub()
        )
    };

    IFrameComm.nextEpisode = nextEpisode;
    IFrameComm.previousEpisode = previousEpisode;
    IFrameComm.autoNextEpisode = nextEpisode;

    IFrameComm.onPlayerReplaced = () => {
        addIFrameEventListeners();
        IFrameComm!.IFrame = (document.querySelector("#indavideoframe") as HTMLIFrameElement).contentWindow as Window;
    }

    IFrameComm.onToast = (
            type: "error" | "success" | "info" | "warning" | "default" | undefined,
            title: string,
            description?: string | undefined,
            options?: {
                position?: string | undefined;
                duration?: number | undefined;
                id?: string | undefined;
            }
        ) => {
        switch (type) {
            case "error":
                Toast.error(title, description, options);
                break;
            case "success":
                Toast.success(title, description, options);
                break;
            case "warning":
                Toast.warning(title, description, options);
                break;
            default:
                Toast.info(title, description, options);
                break;
        }
    }
}

function loadHTML5Player(data: ServerResponse, qualityData?: EpisodeVideoData[]) {
    let videoData: EpisodeVideoData[] = [];
    if (!qualityData) {
        videoData = getQualityDataHTML5(data);
        if (videoData.length === 0) {
            handleError("VIDEO", "NO_SOURCES", "HTML5 videó források nem találhatók.");
            return;
        }
    } else {
        videoData = qualityData;
    }

    document.querySelector("#VideoPlayer")!.innerHTML = genVideoHTML(videoData);
    Player = new NativePlayer(
        "#player",
        videoData,
        true,
        MAT.settings,
        MA.EPISODE.getId(),
        MA.EPISODE.getAnimeID(),
        MA.EPISODE.getTitle(),
        MA.EPISODE.getEpisodeNumber(),
    );
    Player.download = () => {
        if (downloadCooldown) {
            Logger.warn("Download cooldown is active, skipping download action.");
            Toast.warning("Kérlek várj egy kicsit, mielőtt letöltesz egy videót.", "", { duration: 3000 });
            return;
        }
        downloadCooldown = true;
        setTimeout(() => {
            downloadCooldown = false;
        }, 5000);

        let currentVideoData = videoData.find(video => video.quality ===  Player!.plyr.quality);
        if (!currentVideoData) {
            handleError("VIDEO", "DOWNLOAD_ERROR", "Aktuális videó adatok nem találhatók.");
            return;
        }
        download(
            currentVideoData.url,
            MA.EPISODE.getTitle(),
            MA.EPISODE.getEpisodeNumber(),
            currentVideoData.quality,
            MA.EPISODE.getFansub(),
            data.output.match(/indavideo/i) ? "Indavideo" : "Videa",
            MAT.settings.advanced.downloadName,
            () => {
                Toast.success("Videó letöltése sikeresen elindult.", "", { duration: 3000 });
            },
            (e: Error) => {
                Logger.error("Videó letöltése sikertelen: " + e.message);
                Toast.error("Videó letöltése sikertelen.", "Hiba történt a videó letöltése közben.", { duration: 5000 });
            }
        )
    }
    Player.autoNextEpisode = nextEpisode
    Player.nextEpisode = nextEpisode
    Player.previousEpisode = previousEpisode
    Player.replace()
}

function loadHLSPlayer(data: ServerResponse) {
    parseVideoData(atob(data.hls_url)).then(videoData => {
        document.querySelector("#VideoPlayer")!.innerHTML = genVideoHTML(videoData);
        Player = new HLSPlayer(
            "#player",
            videoData,
            true,
            MAT.settings,
            MA.EPISODE.getId(),
            MA.EPISODE.getAnimeID(),
            MA.EPISODE.getTitle(),
            MA.EPISODE.getEpisodeNumber(),
        );
        Player.download = () => {
            if (downloadCooldown) {
                Logger.warn("Download cooldown is active, skipping download action.");
                Toast.warning("Kérlek várj egy kicsit, mielőtt letöltesz egy videót.", "", { duration: 3000 });
                return;
            }
            downloadCooldown = true;
            setTimeout(() => {
                downloadCooldown = false;
            }, 5000);

            let currentVideoData = videoData[Player!.plyr.quality];

            downloadHLS(
                currentVideoData.url,
                MA.EPISODE.getTitle(),
                MA.EPISODE.getEpisodeNumber(),
                currentVideoData.quality,
                MA.EPISODE.getFansub(),
                "Rumble",
                MAT.settings.advanced.downloadName,
                () => {},
                () => {},
                (error) => {
                    handleError("VIDEO", "DOWNLOAD_ERROR", `HLS videó letöltési hiba: ${error}`);
                }
            )
        }
        Player.autoNextEpisode = nextEpisode
        Player.nextEpisode = nextEpisode
        Player.previousEpisode = previousEpisode
        Player.replace()
    })
}

function nextEpisode() {
    if (epSwitchCooldown) {
        Logger.warn("Episode switch cooldown is active, skipping next episode action.");
        Toast.warning("Kérlek várj egy kicsit, mielőtt váltasz a részek között.", "", { duration: 3000 });
        return;
    }
    epSwitchCooldown = true;
    setTimeout(() => {
        epSwitchCooldown = false;
    }, 5000);

    let nextEpID = currentServerData?.button_vid_next || -1;
    if (nextEpID === -1) {
        Logger.warn("No next episode found.");
        Toast.warning("Nincs következő rész.", "", { duration: 3000 });
        return;
    }
    Toast.success("Következő rész betöltése...", "", { duration: 1000 });
    setTimeout(() => {
        window.location.href = currentServer === "s1"
            ? `https://magyaranime.eu/resz/${nextEpID}/`
            : `https://magyaranime.eu/resz-${currentServer.toLowerCase()}/${nextEpID}/`;
    }, 1000);

}

function previousEpisode() {
    if (epSwitchCooldown) {
        Logger.warn("Episode switch cooldown is active, skipping previous episode action.");
        Toast.warning("Kérlek várj egy kicsit, mielőtt váltasz a részek között.", "", { duration: 3000 });
        return;
    }
    epSwitchCooldown = true;
    setTimeout(() => {
        epSwitchCooldown = false;
    }, 5000);

    let prevEpID = currentServerData?.button_vid_prev || -1;
    if (prevEpID === -1) {
        Logger.warn("No previous episode found.");
        Toast.warning("Nincs előző rész.", "", { duration: 3000 });
        return;
    }

    Toast.success("Előző rész betöltése...", "", { duration: 1000 });
    setTimeout(() => {
        window.location.href = currentServer === "s1"
            ? `https://magyaranime.eu/resz/${prevEpID}/`
            : `https://magyaranime.eu/resz-${currentServer.toLowerCase()}/${prevEpID}/`;
    }, 1000);

}

// UI Related Functions
function setDailyLimit(data: ServerResponse) {

    let dailyLimit = document.querySelector("#DailyLimits") as HTMLDivElement;
    if (data.daily_limit) {
        dailyLimit.innerHTML = data.daily_limit;
    }
    let html = `
    <hr class="my-2" style="border: none; height: 2px; background: linear-gradient(to right, transparent, var(--primary-color), transparent);">
    ${data.button_vid_prev !== -1 ? `<button class="Btn prevBtn" id="prevBtn"><i class="fas fa-chevron-left"></i> Előző rész</button>` : `<button class="Btn prevBtn MAT_disabled" id="prevBtn"><i class="fas fa-ban"></i></button>`}
    ${data.button_vid_next !== -1 ? `<button class="Btn nextBtn" id="nextBtn">Következő rész <i class="fas fa-chevron-right"></i></button>` : `<button class="Btn nextBtn MAT_disabled" id="nextBtn"><i class="fas fa-ban"></i></button>`}
    ${data.button_aid !== -1 ? `<button class="Btn dataBtn" id="datasheetBtn"><i class="fas fa-book"></i> Adatlap</button>` : `<button class="Btn dataBtn MAT_disabled" id="datasheetBtn"><i class="fas fa-ban"></i></button>`}
    `

    dailyLimit.insertAdjacentHTML("beforeend", html)

    // Add event listeners with proper error handling
    if (data.button_vid_prev !== -1) {
        const prevButton = document.querySelector("#prevBtn") as HTMLButtonElement
        if (prevButton) {
            prevButton.onclick = () => {
                loadVideo(currentServer, data.button_vid_prev)
            }
        }
    }

    if (data.button_vid_next !== -1) {
        const nextButton = document.querySelector("#nextBtn") as HTMLButtonElement
        if (nextButton) {
            nextButton.onclick = () => {
                loadVideo(currentServer, data.button_vid_next)
            }
        }
    }

    if (data.button_aid !== -1) {
        const datasheetButton = document.querySelector("#datasheetBtn") as HTMLButtonElement
        if (datasheetButton) {
            datasheetButton.onclick = () => {
                window.location.href = `https://magyaranime.eu/leiras/${data.button_aid}/`
            }
        }
    }
}
function setServers(data: ServerResponse) {
    if (!data.servers) {
        handleError("SERVER", "DATA_MISSING", "Szerver lista nem található.");
        return
    }

    const servers = data.servers
    const serverList = document.querySelector("#VideoPlayerServers") as HTMLDivElement

    if (!serverList) {
        handleError("SERVER", "DATA_MISSING", "Szerver lista konténer nem található.");
        return
    }

    // Clear existing content
    serverList.innerHTML = ""

    // Create server buttons HTML
    let serversHTML = `
      <div class="mat-servers-grid">
  `

    // Add server buttons
    servers.forEach((server) => {
        const isActive = server.active === 1
        const qualityIcon = getIcon(Number(server.hq.replace("hq", "")))

        serversHTML += `
      <button
        class="mat-server-btn ${isActive ? "mat-server-active" : ""}"
        data-server="${server.server}"
        data-vid="${data.videoid}"
        data-quality="${server.hq}"
      >
        <div class="mat-server-content">
          <div class="mat-server-icon">${qualityIcon}</div>
          <span class="mat-server-title">${server.title}</span>
        </div>
      </button>
    `
    })

    serversHTML += `
      </div>
      <div class="mat-action-buttons" ${data.download_link && data.download_link !== "" ? "": 'style="display: block !important;"'}>
  `

    // Add download button if available
    if (data.download_link && data.download_link !== "") {
        serversHTML += `
      <button class="mat-action-btn mat-download-btn" data-download="${data.download_link}">
        <div class="mat-server-content">
          <div class="mat-server-icon">
            <svg class="mat-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <span class="mat-server-title">Letöltés</span>
        </div>
      </button>
    `
    }

    // Add error report button
    const activeServer = servers.find((server) => server.active === 1)
    if (activeServer) {
        serversHTML += `
      <button class="mat-action-btn mat-error-btn" data-error-report="${data.videoid}/${activeServer.server.replace("s", "")}" ${(!data.download_link || data.download_link === "") ? 'style="width: 100% !important;"' : ""}>
        <div class="mat-server-content">
          <div class="mat-server-icon">
            <svg class="mat-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <span class="mat-server-title">Hibajelentés</span>
        </div>
      </button>
    `
    }

    serversHTML += `
    </div>
  `

    // Insert HTML and styles
    serverList.innerHTML = serversHTML

    // Add event listeners
    serverList.querySelectorAll(".mat-server-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
            const target = event.currentTarget as HTMLButtonElement
            const server = target.getAttribute("data-server") as string
            const vid = Number(target.getAttribute("data-vid"))

            // Remove active class from all buttons
            serverList.querySelectorAll(".mat-server-btn").forEach((btn) => {
                btn.classList.remove("mat-server-active")
            })

            // Add active class to clicked button
            target.classList.add("mat-server-active")

            // Load video
            loadVideo(server, vid)
        })
    })

    // Download button event listener
    const downloadBtn = serverList.querySelector(".mat-download-btn") as HTMLButtonElement
    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            const downloadLink = downloadBtn.getAttribute("data-download")
            if (downloadLink) {
                window.open(downloadLink, "_blank")
            }
        })
    }

    // Error report button event listener
    const errorBtn = serverList.querySelector(".mat-error-btn") as HTMLButtonElement
    if (errorBtn) {
        errorBtn.addEventListener("click", () => {
            const errorReport = errorBtn.getAttribute("data-error-report")
            if (errorReport) {
                window.open(`https://magyaranime.eu/hibajelentes/${errorReport}`, "_blank")
            }
        })
    }
}
function getIcon(res: number): string {
    const icons: { [key: number]: string } = {
        0: '',
        240: '<svg xmlns="http://www.w3.org/2000/svg" width="30px" height="25px" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 512 414.888"><g fill-rule="nonzero"><path fill="#FFCB00" d="M80.056 0h351.888c21.907 0 41.859 9.115 56.362 23.618C502.912 38.224 512 58.366 512 80.229v254.43c0 21.815-9.169 41.902-23.754 56.492-14.579 14.579-34.596 23.737-56.302 23.737H80.056c-21.75 0-41.826-9.076-56.427-23.677C9.115 376.702 0 356.685 0 334.659V80.229c0-22.07 9.028-42.135 23.569-56.676C38.089 9.028 58.094 0 80.056 0z"/><path fill="#262626" d="M431.944 33.341H80.056c-12.999 0-24.781 5.285-33.282 13.786-8.495 8.495-13.77 20.218-13.77 33.102v254.43c0 12.809 5.334 24.487 13.83 32.977 8.572 8.572 20.397 13.911 33.222 13.911h351.888c12.749 0 24.52-5.394 33.097-13.971 8.566-8.571 13.955-20.282 13.955-32.917V80.229c0-12.71-5.329-24.47-13.895-33.037-8.507-8.506-20.239-13.851-33.157-13.851z"/><path fill="#FD5" d="M206.113 180.665c-.396-4.671-2.14-8.322-5.231-10.924-3.128-2.629-7.832-3.943-14.144-3.943-4.014 0-7.273.494-9.837 1.445-2.537.956-4.444 2.27-5.628 3.883-1.216 1.646-1.841 3.52-1.906 5.622-.098 1.712.228 3.26.956 4.639.722 1.385 1.874 2.635 3.449 3.721 1.613 1.114 3.623 2.102 6.122 2.993 2.466.885 5.394 1.679 8.816 2.368l11.776 2.532c7.958 1.678 14.737 3.916 20.397 6.643 5.654 2.765 10.293 6.024 13.878 9.739 3.585 3.683 6.252 7.86 7.963 12.499 1.711 4.606 2.564 9.674 2.629 15.133-.065 9.441-2.4 17.437-7.104 23.982-4.672 6.546-11.315 11.51-20.001 14.932-8.653 3.39-19.077 5.101-31.217 5.101-12.466 0-23.357-1.841-32.634-5.53-9.273-3.683-16.481-9.375-21.576-17.072-5.133-7.697-7.697-17.529-7.762-29.539h37.007c.261 4.378 1.347 8.094 3.319 11.087 1.939 2.96 4.704 5.23 8.289 6.779 3.585 1.542 7.833 2.33 12.798 2.33 4.144 0 7.631-.522 10.429-1.543 2.83-1.054 4.932-2.466 6.383-4.274 1.444-1.848 2.199-3.917 2.232-6.253-.033-2.205-.755-4.112-2.135-5.79-1.347-1.646-3.617-3.156-6.746-4.476-3.123-1.347-7.366-2.596-12.695-3.748l-14.28-3.091c-12.727-2.765-22.727-7.371-30.033-13.851-7.333-6.448-10.95-15.296-10.918-26.513-.032-9.11 2.401-17.105 7.333-23.949 4.938-6.839 11.776-12.168 20.527-16.019 8.784-3.813 18.816-5.725 30.169-5.725 11.608 0 21.608 1.945 30.098 5.823 8.452 3.851 14.965 9.31 19.571 16.35 4.606 7.04 6.942 15.231 6.975 24.639h-37.269zm109.312 98.686h-55.232V135.798h54.672c14.77 0 27.535 2.856 38.322 8.582 10.755 5.725 19.083 13.949 24.933 24.671 5.855 10.723 8.821 23.586 8.821 38.523 0 14.965-2.927 27.795-8.783 38.518-5.823 10.728-14.112 18.952-24.808 24.672-10.69 5.725-23.351 8.587-37.925 8.587zm-16.252-33.09h14.867c7.11 0 13.161-1.12 18.191-3.423 5.003-2.303 8.849-6.252 11.483-11.841 2.629-5.628 3.949-13.422 3.949-23.423 0-10-1.32-17.794-4.014-23.389-2.7-5.628-6.611-9.571-11.776-11.874-5.166-2.271-11.483-3.423-18.947-3.423h-13.753v77.373z"/></g></svg>',
        720: '<svg width="30px" height="22px" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 512 464.889"><g fill-rule="nonzero"><path fill="#FFCB00" d="M80.055 0h351.89c21.907 0 41.858 9.115 56.361 23.618C502.912 38.224 512 58.366 512 80.229V334.66c0 21.814-9.169 41.901-23.754 56.491-14.579 14.58-34.596 23.738-56.301 23.738H80.055c-21.749 0-41.825-9.077-56.427-23.678C9.115 376.703 0 356.686 0 334.66V80.229c0-22.07 9.028-42.135 23.569-56.676C38.094 9.022 58.094 0 80.055 0z"/><path fill="#262626" d="M431.945 33.341H80.055c-12.998 0-24.78 5.285-33.281 13.786-8.496 8.496-13.77 20.218-13.77 33.102V334.66c0 12.808 5.334 24.487 13.83 32.977 8.571 8.571 20.397 13.911 33.221 13.911h351.89c12.748 0 24.519-5.394 33.096-13.971 8.567-8.572 13.955-20.283 13.955-32.917V80.229c0-12.71-5.329-24.47-13.895-33.037-8.506-8.506-20.239-13.851-33.156-13.851z"/><path fill="#FD5" d="M118.611 279.221V135.667h38.979v56.085h51.582v-56.085h38.979v143.554h-38.979v-56.084H157.59v56.084h-38.979zm203.262 0h-55.232V135.667h54.672c14.77 0 27.535 2.857 38.322 8.583 10.755 5.725 19.083 13.949 24.933 24.671 5.855 10.723 8.821 23.586 8.821 38.523 0 14.965-2.928 27.795-8.783 38.518-5.823 10.728-14.112 18.952-24.808 24.672-10.69 5.725-23.351 8.587-37.925 8.587zm-16.253-33.09h14.867c7.111 0 13.162-1.12 18.192-3.423 5.003-2.303 8.849-6.252 11.483-11.841 2.629-5.628 3.949-13.422 3.949-23.423 0-10-1.32-17.794-4.014-23.389-2.7-5.628-6.611-9.572-11.777-11.874-5.165-2.271-11.483-3.423-18.946-3.423H305.62v77.373z"/></g></svg>',
        1080: '<svg id="Layer_1" width="30px" height="25px" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 100.82"><defs><style>.cls-1{fill:#ffcb00;}.cls-1,.cls-2{fill-rule:evenodd;}.cls-2,.cls-3{fill:#262626;}.cls-4{fill:#fd5;}</style></defs><title>full-hd</title><path class="cls-1" d="M10.32,0H112.56a10.35,10.35,0,0,1,10.32,10.32V79.5a10.33,10.33,0,0,1-10.32,10.32H10.32A10.33,10.33,0,0,1,0,79.5V10.32A10.35,10.35,0,0,1,10.32,0Z"/><path class="cls-2" d="M4.9,41.51H118V11A6.11,6.11,0,0,0,111.9,4.9H11A6.11,6.11,0,0,0,4.9,11V41.51Z"/><path class="cls-3" d="M27.07,49.13h10.4V60.89H48.86V49.13H59.31V82.82H48.86V69.18H37.47V82.82H27.07V49.13Zm37.73,0H80.27a18.46,18.46,0,0,1,7.39,1.24,12,12,0,0,1,4.66,3.56A14.84,14.84,0,0,1,95,59.33a24.76,24.76,0,0,1,.83,6.53,22.69,22.69,0,0,1-1.23,8.38,13.81,13.81,0,0,1-3.41,5,11.16,11.16,0,0,1-4.69,2.69,24.33,24.33,0,0,1-6.21.91H64.8V49.13Zm10.4,7.62v18.4h2.55a10.86,10.86,0,0,0,4.66-.72,4.94,4.94,0,0,0,2.17-2.52,16,16,0,0,0,.78-5.86q0-5.34-1.75-7.32c-1.17-1.32-3.1-2-5.81-2Z"/><path class="cls-4" d="M31.65,17.11l-.11,4.32h2l4.33-.11.41.52-.45,5.44-4.81-.11H31.39v.49l.3,7.82h-7.5l.38-7.08-.38-17H40.3l.41.53-.49,5.44-6-.22ZM81.58,29.89l-.44,5.59H66.78l.38-7.08-.38-17h7.61L74,27.66l.07,1.71h7.12l.41.52Zm17.11,0-.45,5.59H83.89l.37-7.08-.37-17h7.6l-.41,16.3.07,1.71h7.12l.42.52Zm-35.07-6.3,0,3.84a7.74,7.74,0,0,1-2.76,6.3C59,35.2,56.42,35.93,53,35.93s-5.75-.73-7.48-2.2a7.54,7.54,0,0,1-2.48-6.3l.12-3.84L43,11.36h7.5l-.34,15.07a4,4,0,0,0,.73,2.75,3.13,3.13,0,0,0,2.48.86,3.25,3.25,0,0,0,2.53-.86,3.92,3.92,0,0,0,.75-2.75l-.34-15.07h7.61l-.27,12.23Z"/></svg>',
        1440: '<span class="resu_2k">2K</span>',
        2160: '<svg id="Layer_1" width="40px" height="30px" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 85.53"><defs><style>.cls-1{fill:#ffcb00;}.cls-1,.cls-2{fill-rule:evenodd;}.cls-2,.cls-3{fill:#262626;}.cls-4{fill:#fd5;}</style></defs><title>full-hd-4k</title><path class="cls-1" d="M8.11,0H114.77a8.13,8.13,0,0,1,8.11,8.11V62.42a8.13,8.13,0,0,1-8.11,8.11H8.11A8.13,8.13,0,0,1,0,62.42V8.11A8.13,8.13,0,0,1,8.11,0Z"/><path class="cls-2" d="M3.33,32.08H119.55v-24a4.81,4.81,0,0,0-4.78-4.78H8.11A4.81,4.81,0,0,0,3.33,8.11v24Z"/><path class="cls-3" d="M48.07,59.69H35.24V53.9L48.07,38.65h6.12V54.24h3.19v5.45H54.19v4.75H48.07V59.69Zm0-5.45v-8l-6.78,8ZM60.75,39.07h7.83v9.59l8.21-9.59H87.21L78,48.6l9.69,15.84H78L72.65,54l-4.07,4.24v6.18H60.75V39.07Z"/><path class="cls-4" d="M17.18,13.43l-.09,3.4h2l3.4-.09.32.41-.35,4.27-3.78-.09H17v.38l.24,6.15H11.32l.3-5.56-.3-13.38H24l.32.41-.38,4.28-4.68-.18ZM56,23.47l-.35,4.39H44.35l.29-5.56L44.35,8.92h6L50,21.71l.06,1.35h5.59l.32.41Zm13,0-.35,4.39H57.39l.3-5.56-.3-13.38h6L63,21.71l.06,1.35h5.59l.32.41Zm22.13-1.76.23,6.15H85.49l.29-5.56,0-1.46-3.16-.06-2.72.08,0,.85.24,6.15H74.19l.3-5.56-.3-13.38h6L80,16.09l3,.06,2.7-.06-.15-7.17h6l-.32,12.79Zm11.75-12.9a8.53,8.53,0,0,1,6.43,2.26,9,9,0,0,1,2.24,6.55c0,3.37-.88,6-2.61,7.78s-4.22,2.72-7.46,2.72c-2,0-4.41-.08-7.14-.26l.29-5.56L94.35,8.92l8.54-.11Zm-.29,15a2.33,2.33,0,0,0,2.09-1.1,6.88,6.88,0,0,0,.72-3.61,16.29,16.29,0,0,0-.29-3.37,3.27,3.27,0,0,0-.94-1.77,2.73,2.73,0,0,0-1.79-.54,19.82,19.82,0,0,0-2.19.12L100,21.71l.06,1.82a22.93,22.93,0,0,0,2.55.23ZM42.21,18.52l0,3A6.05,6.05,0,0,1,40,26.48a9.45,9.45,0,0,1-6.12,1.73A8.76,8.76,0,0,1,28,26.48a5.88,5.88,0,0,1-2-4.94l.09-3L26,8.92h5.88l-.26,11.83a3.14,3.14,0,0,0,.57,2.16,2.49,2.49,0,0,0,2,.68,2.57,2.57,0,0,0,2-.68,3,3,0,0,0,.58-2.16L36.44,8.92h6l-.2,9.6Z"/></svg>',
    }
    if ([240, 360, 480, 576].includes(res)) return icons[240]
    return icons[res] || ''
}
function addSettingsButton() {
    let accountMenu = document.querySelector(
        '#gen-header > div > div > div > div > nav > div.gen-header-info-box > div.gen-account-holder > div > ul',
    )
    if (accountMenu) {
        let settingsButton = document.createElement('li')
        settingsButton.className = 'gen-account-menu-item'
        settingsButton.innerHTML = `<a class="gen-account-menu-link" id="MATweaks-settings-button"><i class="fas fa-cog"></i>MATweaks beállítások</a>`
        accountMenu.insertBefore(settingsButton, accountMenu.children[4])
        settingsButton.onclick = () => {
            chrome.runtime.sendMessage({ type: 'openSettings' }).then((res) => {
                  if (res) {
                    Logger.log('Settings opened successfully.');
                  } else {
                    Logger.error('Failed to open settings.');
                    Toast.error('Nem sikerült megnyitni a beállításokat.', '', { duration: 3000 });
                  }
            }).catch((error) => {
                Logger.error('Error opening settings:', error);
                Toast.error('Hiba történt a beállítások megnyitásakor.', '', { duration: 3000 });
            });
        }
        Logger.log('Settings button added.')
    }
}
