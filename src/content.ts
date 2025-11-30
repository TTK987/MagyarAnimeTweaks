import MAT from './MAT'
import Bookmarks from './Bookmark'
import Resume from './Resume'
import Logger from './Logger'
import MagyarAnime from './MagyarAnime'
import {ServerResponse, SettingsV019, EpisodeVideoData} from './global'
import Toast, {Options} from './Toast'
import NativePlayer from './player/NativePlayer'
import { parseVideoData, prettyFileSize, renderFileName } from './lib/utils'
import HLSPlayer from "./player/HLSPlayer";
import IFramePlayerComm from "./player/IFrameComm";
import {download, downloadHLS} from "./downloads";
import { showVideoRemovedError, showError } from './lib/video-error-utils'
import { ERROR_CODES, ERROR_MESSAGES } from './lib/error-catalog'
import { decidePlayerType, genVideoHTML } from './lib/player-utils'
import { checkShortcut } from './lib/shortcuts'
import { getIcon } from './lib/icons'
import { initDatasheetNav } from './handlers/Datasheet'
import { initMainPageNavigation } from './handlers/MainPage'


let settings: SettingsV019 = MAT.getDefaultSettings()
let MA: MagyarAnime = new MagyarAnime(document, window.location.href)
let isRoadblockCalled = false
let currentServer: "s1" | "s2" | "s3" | "s4" = "s1";
let csrfToken = ''
let Player: NativePlayer | HLSPlayer | undefined = undefined
let IFrameComm: IFramePlayerComm | undefined = undefined
let currentServerData: ServerResponse | undefined = undefined
let epSwitchCooldown = false
let downloadCooldown = false
let isInitialized = false
let vData: EpisodeVideoData[] = []
let MALId: number = 0
let videoID: number = 0

function genErrorSchema(area: string, shortcode: string, errorCode: string): string {
    return `EP${MA.EPISODE.getId()}-${currentServer.toUpperCase()}-${area}-${shortcode}-${errorCode}`;
}
function clearVideoPlayer() {
    const videoPlayer = document.querySelector("#VideoPlayer") as HTMLDivElement;
    if (!videoPlayer) return;

    videoPlayer.innerHTML = `
        <div class="mat-player-loading" role="status" aria-live="polite" aria-label="Videó betöltése">
            <div class="mat-pl-shimmer" aria-hidden="true"></div>
            <div class="mat-pl-spinner" aria-hidden="true"></div>
            <div class="mat-pl-title">Videó betöltése...</div>
            <div class="mat-pl-subtitle">Linkek lekérdezése...</div>
            <div class="mat-pl-dots" aria-hidden="true">
                <span class="mat-pl-dot"></span>
                <span class="mat-pl-dot"></span>
                <span class="mat-pl-dot"></span>
            </div>
        </div>
`;
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

    Logger.error(message);
    showError(`Hiba történt: ${message}`, schema);
}


if (window.location.href.includes("inda-play")) {
    loadSettings().then(() => {
        if (document.querySelector('#lejatszo')) {
            let videoElement = document.querySelector('#lejatszo video') as HTMLVideoElement;
            if (videoElement) {
                let sources = Array.from(videoElement.querySelectorAll('source'));
                if (sources.length === 0) {
                    handleError('VIDEO', 'NO_SOURCES', 'Nincsenek videó források a videó elemben.');
                    return;
                }

                let videoData = sources.map((source) => {
                    let url = source.getAttribute('src');
                    let size = parseInt(source.getAttribute('size') || '');
                    return url && !isNaN(size) ? { quality: size, url } : null;
                }).filter((data): data is EpisodeVideoData => data !== null);

                if (videoData.length === 0) {
                    handleError('VIDEO', 'DATA_ERROR', 'Nem sikerült videó adatokat kinyerni a videó elemből.');
                    return;
                }

                vData = videoData.sort((a, b) => b.quality - a.quality);
            }
        } else {
            IFrameComm = new IFramePlayerComm()
            IFrameComm.onFrameLoaded = () => {
                IFrameComm!.IFrame = (document.querySelector("iframe[id='indavideoframe']") as HTMLIFrameElement).contentWindow
                IFrameComm!
                    .getVideoData()
                    .then((videoData) => {
                        if (videoData.length === 0) {
                            handleError(
                                'VIDEO',
                                'DATA_ERROR',
                                'Indavideo videó adatok nem találhatók az iframe-ben.',
                            )
                            return
                        }
                        vData = videoData
                    })
                    .catch((error) => {
                        showVideoRemovedError(
                            MA.EPISODE.getTitle(),
                            MA.EPISODE.getEpisodeNumber(),
                            currentServer,
                            MA.EPISODE.getId(),
                        )
                    })
            }
        }
    }
    ).catch((error) => {
        Logger.error('Error while loading settings: ' + error, true)
    })
}


window.addEventListener('load', () => {initializeExtension()})
window.addEventListener('readystatechange', (event: Event) => {
    if (document.readyState === 'complete') {
        Logger.log('Document is fully loaded.');
        initializeExtension()
    }
})
if (document.readyState === 'complete') {
    Logger.log('Document is already fully loaded.');
    initializeExtension()
}

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
    if (isInitialized) return
    isInitialized = true
    loadSettings().then(() => {
        if (MA.isMaintenancePage()) MaintenancePage()
        else if (MA.isMainPage()) {
            if (MAT.isEAP()) initMainPageNavigation()
            addSettingsButton()
        } else {
            addSettingsButton()
            if (MA.isEpisodePage) EpisodePage()
            else if (MA.isDatasheetPage) DatasheetPage()
        }
        Logger.success('Extension initialized.')
    }).catch((error) => {
        Logger.error('Error while initializing extension: ' + error, true)
        showError('Hiba történt az kiterjesztés inicializálása közben.', 'EP' + MA.EPISODE.getId() + '-INIT-001')
    })
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
    });
    if (MAT.isEAP()) initDatasheetNav();
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

    Bookmarks.loadBookmarks().then(() => Logger.success('Bookmarks loaded.'))
    Resume.loadData().then(() => Logger.success('Resume data loaded.'))

    if (!location.href.includes("/inda-play/")) MA.EPISODE.getMALId().then((id) => {MALId = id})

    document.querySelector('#ttkeztkapcsoldki')?.remove()

    MA.addCSS(`#lejatszo, #indavideoframe {max-width: 100%;} .plyr {max-width: 100%; width: 100%; height: 100%;}`);

    videoID = MA.EPISODE.getId()

    if (vData.length > 0) {
        Logger.log("Using indavideo iframe data for video playback.");
        loadHTML5Player({
            error: '',
            servers: [],
            output: '',
            hls: false,
            hls_url: '',
            needRefleshPage: false,
            daily_limit: '',
            download_link: '',
            button_vid_prev: 0,
            button_vid_next: 0,
            button_aid: 0,
            playerid: 0
        }, vData);
        return;
    }

    if (!location.href.includes("/inda-play/")) {
        loadVideo(currentServer, Number((document.querySelector('#VideoPlayer') as HTMLVideoElement).getAttribute('data-vid')))
        let listener = (visibilityEvent: Event) => {
            if (document.visibilityState === 'visible') {
                if (isRoadblockCalled) {document.removeEventListener('visibilitychange', listener); return}
                document.removeEventListener('visibilitychange', listener)
                loadVideo(currentServer, Number((document.querySelector('#VideoPlayer') as HTMLVideoElement).getAttribute('data-vid')))
            }
        }
        document.addEventListener('visibilitychange', listener, { once: true })
    }


    csrfToken = MA.getCSRFTokenFromHTML();
    if (csrfToken === "") {
        handleError("CSRF", "NOT_FOUND");
        return;
    }

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

    currentServer = server as "s1" | "s2" | "s3" | "s4";

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
            window.location.href = `https://magyaranime.eu/resz/${vid}/`;
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
            <div id="loadingBar" style="height: 100%;width: 0;background: linear-gradient(90deg, #3F9FFF, #60b0ff, #3F9FFF);background-size: 200% 100%;border-radius: 8px;transition: width 20ms cubic-bezier(0.4, 0, 0.2, 1);animation: shimmer 4s infinite linear;box-shadow: 0 0 15px rgba(0, 162, 255, 0.5);"></div>
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

    currentServer = server as "s1" | "s2" | "s3" | "s4";

    window.history.replaceState({}, '', `https://magyaranime.eu/resz/${vid}/`);
    document.querySelector('#VideoPlayer')!.setAttribute('data-server', server);
    document.querySelector('#VideoPlayer')!.setAttribute('data-vid', String(vid));
    Logger.log(`Loading video from server: ${server}, video ID: ${vid}`);

    getServerResponse(server, vid)
        .then((data: ServerResponse) => {
            handleServerResponse(data);
        })
        .catch((error) => {
            handleError("PLAYER", "LOAD_ERROR", `Videó betöltési hiba: ${error}`);
        });

}
function handleServerResponse(data: ServerResponse) {
    setDailyLimit(data);
    setServers(data);

    console.log(data);

    if (settings.advanced.consoleLog) console.log(data);

    currentServerData = data;

    if (data.needRefleshPage) {
        MA.fetchCSRFToken().then(token => {
            if (token && token !== "") {
                csrfToken = token;
                loadVideo(currentServer, Number((document.querySelector('#VideoPlayer') as HTMLVideoElement).getAttribute('data-vid')));
                return;
            } else {
                handleError("CSRF", "EXPIRED");
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                return;
            }
        }).catch(() => {
            handleError("CSRF", "EXPIRED");
            setTimeout(() => {
                window.location.reload();
            });
        });
        return;
    }


    if (data.error && data.error !== "") {
        handleError("SERVER", "RESPONSE_ERROR", data.error);
    }


    if (Player?.plyr) Player.plyr.destroy();
    Player = undefined;
    IFrameComm?.removeMSGListeners()
    IFrameComm = undefined;
    removeIFrameEventListeners();
    clearVideoPlayer();


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
            if (data.output.match(/<video[^>]*src="([^"]+)"[^>]*>/) || data.output.match(/<iframe[^>]*src="([^"]+)"[^>]*>/)) {
                handleError('VIDEO', 'INVALID_TYPE', `Nem támogatott lejátszó típus: ${decidePlayerType(data)}`,)
                break
            } else {
                const videoPlayer = document.querySelector('#VideoPlayer') as HTMLDivElement;
                videoPlayer.innerHTML = data.output;
                Logger.log('Unknown player type, but video or iframe found. Using provided output HTML.')
                Toast.error("Hiba lépett fel a lejátszó betöltése közben.", "Ellenőrizd, hogy nem tiltott-e ki a rendszer", { duration: 10000 })
                break
            }
    }
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
        IFrameComm.IFrame = (document.querySelector("iframe#indavideoframe") as HTMLIFrameElement).contentWindow as Window;
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
            }).catch(error => {
                iframe.remove()
                showVideoRemovedError(
                    MA.EPISODE.getTitle(),
                    MA.EPISODE.getEpisodeNumber(),
                    currentServer,
                    MA.EPISODE.getId()
                );
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

    document.querySelector("#VideoPlayer")!.innerHTML = '';
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
            MA.EPISODE.getFansub(),
            MALId,
            data.playerid || 0
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
            options?: Options
        ) => {
        if (!options) options = {};
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
    let videoData: EpisodeVideoData[];
    if (!qualityData) {
        videoData = getQualityDataHTML5(data);
        if (videoData.length === 0) {
            handleError("VIDEO", "NO_SOURCES", "HTML5 videó források nem találhatók.");
            return;
        }
    } else {
        videoData = qualityData;
    }

    let element = document.querySelector("#VideoPlayer") as HTMLDivElement || document.querySelector(".gen-video-holder") as HTMLDivElement;

    element.innerHTML = genVideoHTML(videoData);
    Player = new NativePlayer(
        "#player",
        videoData,
        true,
        MAT.settings,
        MA.EPISODE.getId(),
        MA.EPISODE.getAnimeID(),
        MA.EPISODE.getTitle(),
        MA.EPISODE.getEpisodeNumber(),
        MALId,
        data.playerid || 0
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


        if (!Player || !Player.curQuality) {
            handleError("VIDEO", "DOWNLOAD_ERROR", "Aktuális videó adatok nem találhatók.");
            return;
        }

        download(
            Player.curQuality.url,
            MA.EPISODE.getTitle(),
            MA.EPISODE.getEpisodeNumber(),
            Player.curQuality.quality,
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
        if (videoData.length === 0) {
            handleError("VIDEO", "NO_SOURCES", "HLS videó források nem találhatók.");
            return;
        }
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
            MALId,
            data.playerid || 0
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

            let currentVideoData = videoData[Player?.plyr?.quality ?? 0]

            if (!currentVideoData) {
                handleError("VIDEO", "DOWNLOAD_ERROR", "Aktuális videó adatok nem találhatók.");
                return;
            }

            let toastId = `download-toast-${Math.random().toString(36).substring(2, 15)}`

            let onStatusUpdate = (status: {
                percentage: number
                packets: number
                totalPackets: number
                size: number
                totalSize: number
            }) => {
                Toast.info(
                    'Letöltés folyamatban',
                    `Letöltés ${status.percentage}% kész (${status.packets}/${status.totalPackets}, ${prettyFileSize(status.size)} / ${prettyFileSize(status.totalSize)})`,
                    {
                        position: 'top-left',
                        duration: 15000,
                        id: toastId,
                    },
                )
            }

            let onError = (error: Error) => {
                Toast.error('Hiba történt a videó letöltése közben.', error.message, {
                    position: 'top-left',
                    duration: 5000,
                    id: toastId,
                })
                Logger.error('Download failed: ' + error.message, true)
            }

            let onSuccess = () => {
                Toast.success(
                    'Letöltés befejezve',
                    `${renderFileName(
                        MAT.settings.advanced.downloadName,
                        MA.EPISODE.getTitle(),
                        MA.EPISODE.getEpisodeNumber(),
                        currentVideoData.quality,
                        MA.EPISODE.getFansub(),
                        "Rumble",
                    )}.mp4 letöltése befejeződött.`,
                    {
                        position: 'top-left',
                        duration: 3000,
                        id: toastId,
                    },
                )
                Logger.success('Download completed successfully.', true)
            }

            if (videoData[0].url.includes("magyaranime")) Toast.warning("A videó letöltése lassú lesz!",
                "Erről a szerverről a videó letöltése lassú, hogy elkerüljük a Rate Limit-et. Ha gyorsabb letöltést szeretnél, kérlek válts egy másik szerverre.",
                {
                    duration: 10000,
                    position: 'top-left'
                }
            )


            downloadHLS(
                currentVideoData.url,
                MA.EPISODE.getTitle(),
                MA.EPISODE.getEpisodeNumber(),
                currentVideoData.quality,
                MA.EPISODE.getFansub(),
                "Rumble",
                MAT.settings.advanced.downloadName,
                onStatusUpdate,
                onSuccess,
                onError,
            )
        }
        Player.autoNextEpisode = nextEpisode
        Player.nextEpisode = nextEpisode
        Player.previousEpisode = previousEpisode
        Player.replace()
        if (Player instanceof HLSPlayer) {
            Player.onTokenExpired = () => {
                Logger.warn("Expired token. Reloading page...");
                handleError("VIDEO", "TOKEN_EXPIRED", "A videó elérésének ideje lejárt. Az oldal újratöltése...");
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
            Player.onRateLimit = () => {
                Toast.warning("Túl sok kérést küldtél.", "", { duration: 5000 });
            }
        }
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
        Toast.warning("Nincs következő rész. Átirányítás az anime adatlapra...", "", { duration: 3000 });
        setTimeout(() => {
            window.location.href = `https://magyaranime.eu/leiras/${MA.EPISODE.getAnimeID()}/`;
        }, 3000);
        return;
    }
    Toast.success("Következő rész betöltése...", "", { duration: 2000 });
    setTimeout(() => {
        document.querySelectorAll('.videoChange').forEach(button => {
            button.classList.remove('active');
            if (Number(button.getAttribute('data-vid')) === Number(nextEpID)) {
                button.classList.add('active');
            }
        });

        silentLoadVideo(currentServer, nextEpID);
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
        Toast.warning("Nincs előző rész. Átirányítás az anime adatlapra...", "", { duration: 3000 });
        setTimeout(() => {
            window.location.href = `https://magyaranime.eu/leiras/${MA.EPISODE.getAnimeID()}/`;
        }, 3000);
        return;
    }

    Toast.success("Előző rész betöltése...", "", { duration: 1000 });
    setTimeout(() => {
        document.querySelectorAll('.videoChange').forEach(button => {
            button.classList.remove('active');
            if (Number(button.getAttribute('data-vid')) === Number(prevEpID)) {
                button.classList.add('active');
            }
        });

        silentLoadVideo(currentServer, prevEpID);
    }, 1000);

}
function silentLoadVideo(server: string, vid: number, retryAttempt: number = 0) {
    if (!server || !vid) {
        handleError("REQUEST", "INVALID_ARGS", "Szerver vagy videó ID nem definiált.");
        return;
    }

    getServerResponse(server, vid).then((data: ServerResponse) => {
            if (data.needRefleshPage) {
                Logger.log("Server requested CSRF refresh. Attempting background token refresh...");
                if (retryAttempt >= 1) {
                    Logger.error("CSRF refresh already attempted. Failing silently and reloading.");
                    handleError("CSRF", "EXPIRED");
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                    return false;
                }
                MA.fetchCSRFToken().then(token => {
                    if (token && token !== "") {
                        csrfToken = token;
                        Logger.log("CSRF token refreshed in background. Retrying silent load...");
                        silentLoadVideo(server, vid, retryAttempt + 1);
                        return false;
                    } else {
                        handleError("CSRF", "EXPIRED");
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                        return false;
                    }
                }).catch((e) => {
                    Logger.error("Background CSRF refresh failed: " + e);
                    handleError("CSRF", "EXPIRED");
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                });
                return false;
            }

            if (data.error && data.error !== "") {
                Logger.error(`Hiba a videó háttérben történő betöltése közben: ${data.error}`)
                handleError("SERVER", "RESPONSE_ERROR", data.error);
                return false;
            }
            videoID = vid;
            currentServerData = data;
            setDailyLimit(data);
            setServers(data);

            const newPlayerType = decidePlayerType(data);

            let currentImpl: 'Native' | 'HLS' | 'IFrame' = Player instanceof NativePlayer ? 'Native' : Player instanceof HLSPlayer ? 'HLS' : 'IFrame';

            if (["dailymotion", "mega"].includes(newPlayerType)) {
                Logger.warn("Cannot silently load video for iframe-based players. Falling back to full load.");
                handleServerResponse(data);
                return true
            }

            if (currentImpl === 'Native' && ["HTML5", "indavideo", "videa"].includes(newPlayerType)) {
                Logger.log("Silently loading video using NativePlayer...");
                let qualityDataPromise: Promise<EpisodeVideoData[]> = ["indavideo", "videa"].includes(newPlayerType) ? getQualityDataFromIFrame(data) : Promise.resolve(getQualityDataHTML5(data));
                qualityDataPromise.then((videoData) => {
                    if (videoData.length === 0) {
                        handleError("VIDEO", "NO_SOURCES", "Videó források nem találhatók.");
                        return true
                    }
                    window.history.pushState({}, '', `https://magyaranime.eu/resz/${vid}/`);
                    document.querySelector('#VideoPlayer')!.setAttribute('data-server', server);
                    document.querySelector('#VideoPlayer')!.setAttribute('data-vid', String(vid));
                    Player!.epID = vid;
                    Player!.loadNewVideo(videoData, MA.EPISODE.getEpisodeNumber());
                    Player!.curQuality = videoData[0];
                    Logger.success("Video silently loaded using NativePlayer.");
                }).catch((error) => {
                    handleError("VIDEO", "DATA_ERROR", `Videó adatok betöltési hiba: ${error}`);
                });
                return true
            }

            if (currentImpl === 'HLS' && newPlayerType === 'HLS') {
                Logger.log("Silently loading video using HLSPlayer...");
                if (!data.hls_url) {
                    handleError("VIDEO", "NO_SOURCES", "HLS URL nem található.");
                    return true
                }
                parseVideoData(atob(data.hls_url)).then(videoData => {
                    if (videoData.length === 0) {
                        handleError("VIDEO", "NO_SOURCES", "Videó források nem találhatók.");
                        return true
                    }
                    window.history.pushState({}, '', `https://magyaranime.eu/resz/${vid}/`);
                    document.querySelector('#VideoPlayer')!.setAttribute('data-server', server);
                    document.querySelector('#VideoPlayer')!.setAttribute('data-vid', String(vid));
                    (Player as HLSPlayer).epID = vid;
                    (Player as HLSPlayer).loadNewVideo(videoData, MA.EPISODE.getEpisodeNumber());
                    (Player as HLSPlayer).curQuality = videoData[0];
                    Logger.success("Video silently loaded using HLSPlayer.");
                }).catch((error) => {
                    handleError("VIDEO", "DATA_ERROR", `Videó adatok betöltési hiba: ${error}`);
                });
                return true
            }

            Logger.warn("Cannot silently load video for the current player type combination. Performing full reload.");
            handleServerResponse(data);
            return true
        }).then((success) => {
            if (success) Toast.success(`Most nézed: ${MA.EPISODE.getEpisodeNumber()}. rész`, "", { duration: 3000, position: "top-center" });
        })
        .catch((error) => {
            handleError("PLAYER", "LOAD_ERROR", `Videó betöltési hiba (silent load): ${error}`);
            Logger.error(`Hiba történt a videó háttérben történő betöltése közben: ${error}`);
        })
}

// UI Related Functions
function setDailyLimit(data: ServerResponse) {

    let dailyLimit = document.querySelector("#DailyLimits") as HTMLDivElement;
    if (data.daily_limit) {
        dailyLimit.innerHTML = data.daily_limit;
    }

    let sessionID: number;
    let MATData = document.querySelector("mat-data") as HTMLDivElement;
    if (MATData) {
        sessionID = Number(MATData.getAttribute("session-id"));
    } else sessionID = -1;

    const existingButtons = dailyLimit.querySelectorAll('.Btn, hr');
    existingButtons.forEach(button => button.remove());

    dailyLimit.insertAdjacentHTML("beforeend",  `
    <hr class="my-2" style="border: none; height: 2px; background: linear-gradient(to right, transparent, var(--primary-color), transparent);">
    ${data.button_vid_prev !== -1 ? `<button class="Btn prevBtn" id="prevBtn"><i class="fas fa-chevron-left"></i> Előző rész</button>` : `<button class="Btn prevBtn MAT_disabled" id="prevBtn"><i class="fas fa-ban"></i></button>`}
    ${data.button_vid_next !== -1 ? `<button class="Btn nextBtn" id="nextBtn">Következő rész <i class="fas fa-chevron-right"></i></button>` : `<button class="Btn nextBtn MAT_disabled" id="nextBtn"><i class="fas fa-ban"></i></button>`}
    ${data.button_aid !== -1 ? `<a class="Btn dataBtn" id="datasheetBtn" href="https://magyaranime.eu/leiras/${data.button_aid}/"><i class="fas fa-book"></i> Adatlap</a>` : `<button class="Btn dataBtn MAT_disabled" id="datasheetBtn"><i class="fas fa-ban"></i></button>`}
    `)

    if (data.button_vid_prev !== -1) {
        const prevButton = document.querySelector("#prevBtn") as HTMLButtonElement
        if (prevButton) {
            prevButton.onclick = () => {
                if (epSwitchCooldown) {
                    Logger.warn("Episode switch cooldown is active, skipping previous episode action.");
                    Toast.warning("Kérlek várj egy kicsit, mielőtt váltasz a részek között.", "", { duration: 3000 });
                    return;
                }
                epSwitchCooldown = true;
                setTimeout(() => {
                    epSwitchCooldown = false;
                }, 3000);

                const activeButton = document.querySelector(".videoChange.active") as HTMLButtonElement;
                if (activeButton) {
                    const epTags = activeButton.querySelector(".episode-tags");
                    if (epTags && !epTags.querySelector(".watched")) {
                        epTags.innerHTML += `<span class="watched">Láttam</span>`;
                    }
                    activeButton.classList.remove("active");
                }
                const prevButton = document.querySelector(".videoChange[data-vid='" + data.button_vid_prev + "']") as HTMLButtonElement;
                if (prevButton) {
                    prevButton.classList.add("active");
                }

                loadVideo(currentServer, data.button_vid_prev)
            }
        }
    }

    if (data.button_vid_next !== -1) {
        const nextButton = document.querySelector("#nextBtn") as HTMLButtonElement
        if (nextButton) {
            nextButton.onclick = () => {
                if (epSwitchCooldown) {
                    Logger.warn("Episode switch cooldown is active, skipping next episode action.");
                    Toast.warning("Kérlek várj egy kicsit, mielőtt váltasz a részek között.", "", { duration: 3000 });
                    return;
                }
                epSwitchCooldown = true;
                setTimeout(() => {
                    epSwitchCooldown = false;
                }, 3000);

                const activeButton = document.querySelector(".videoChange.active") as HTMLButtonElement;
                if (activeButton) {
                    const epTags = activeButton.querySelector(".episode-tags");
                    if (epTags && !epTags.querySelector(".watched")) {
                        epTags.innerHTML += `<span class="watched">Láttam</span>`;
                    }
                    activeButton.classList.remove("active");
                }
                const nextButton = document.querySelector(".videoChange[data-vid='" + data.button_vid_next + "']") as HTMLButtonElement;
                if (nextButton) {
                    nextButton.classList.add("active");
                }

                loadVideo(currentServer, data.button_vid_next)
            }
        }
    }

    if (sessionID !== -1) {
        let sessionInfo = document.createElement("div")
        sessionInfo.style.fontSize = "8px"
        sessionInfo.style.color = "var(--text-secondary)"
        sessionInfo.style.marginTop = "5px"
        sessionInfo.style.textAlign = "center"
        sessionInfo.innerText = `Session ID: ${sessionID}`
        dailyLimit.appendChild(sessionInfo)
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

    serverList.innerHTML = ""

    let serversHTML = `
      <div class="mat-servers-grid">
  `

    servers.forEach((server) => {
        const isActive = server.active === 1
        const qualityIcon = getIcon(Number(server.hq.replace("hq", "")))

        serversHTML += `
      <button
        class="mat-server-btn ${isActive ? "mat-server-active" : ""}"
        data-server="${server.server}"
        data-vid="${videoID}"
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

    const activeServerData = servers.find((server) => server.active === 1)
    if (activeServerData) {
        currentServer = activeServerData.server
        serversHTML += `
      <button class="mat-action-btn mat-error-btn" data-error-report="${videoID}/${activeServerData.server.replace("s", "")}" ${(!data.download_link || data.download_link === "") ? 'style="width: 100% !important;"' : ""}>
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
    } else currentServer = 's1'

    serversHTML += `
    </div>
  `

    serverList.innerHTML = serversHTML

    serverList.querySelectorAll(".mat-server-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
            const target = event.currentTarget as HTMLButtonElement
            const server = target.getAttribute("data-server") as string
            const vid = Number(target.getAttribute("data-vid"))

            serverList.querySelectorAll(".mat-server-btn").forEach((btn) => {
                btn.classList.remove("mat-server-active")
            })

            target.classList.add("mat-server-active")

            loadVideo(server, vid)
        })
    })

    const downloadBtn = serverList.querySelector(".mat-download-btn") as HTMLButtonElement
    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            const downloadLink = downloadBtn.getAttribute("data-download")
            if (downloadLink) {
                window.open(downloadLink, "_blank")
            }
        })
    }

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
