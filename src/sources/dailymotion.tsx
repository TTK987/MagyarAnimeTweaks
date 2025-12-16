import { ACTIONS } from '../lib/actions'
import Logger from '../Logger'
import HLSPlayer from '../player/HLSPlayer'
import Bookmark from '../Bookmark'
import Resume from '../Resume'
import { EpisodeVideoData } from '../global'
import { renderFileName, getQualityData } from '../lib/utils'
import {downloadHLS} from "../downloads";
import {prettyFileSize} from "../lib/utils";
import MAT from '../MAT'

Logger.success('[dailymotion.js] Script loaded', true)
let Player = new HLSPlayer('#player', [], true, MAT.settings, 0, 0, '', 0,0, 0)

function messageHandler(event: MessageEvent) {
    if (!event.data || !event.data.type) return; // Ignore messages without a type
    switch (event.data.type) {
        case (ACTIONS.IFRAME.REPLACE_PLAYER): {
            Logger.log('[Dailymotion] Replacing player', true)
            document.open();
            // document.write() is deprecated, but let's use it for now...
            // https://developer.mozilla.org/en-US/docs/Web/API/Document/write
            document.write('<!DOCTYPE html><html lang="hu"><head><title>MATweaks | Dailymotion</title></head><body><div id="player" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"></div></body></html>');
            document.close();
            window.addEventListener('message', messageHandler); // Re-add the message handler after replacing the document
            Player.addCSS(`
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
                body {
                    font-family: 'Roboto', sans-serif;
                    font-weight: 700;
                    position: absolute;
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    background-color: #0a0e17;
                }
                .plyr {
                    margin: 0;
                    z-index: 1000;
                    height: 100%;
                    width: 100%;
                }
                `)
            Player.animeTitle = event.data.animeTitle
            Player.epNum = Number(event.data.epNum)
            Player.epID = Number(event.data.epID)
            Player.animeID = Number(event.data.animeID)
            Player.fansub = JSON.parse(event.data.fansub)
            Player.malId = Number(event.data.malId)
            Player.playerID = Number(event.data.playerID)
            MAT.loadSettings().then((settings) => {
                Logger.enabled = settings.advanced.consoleLog
                Bookmark.loadBookmarks()
                    .then(() => {
                        Resume.loadData()
                            .then(() => {
                                Player.settings = settings
                                handleDailymotionReplace()
                            })
                            .catch((error) => {
                                Logger.error('Error while loading resume data: ' + error, true)
                                Player.Toast(
                                    'error',
                                    'Hiba történt a folytatás adatok betöltése közben.',
                                )
                            })
                    })
                    .catch((error) => {
                        Logger.error('Error while loading bookmarks: ' + error, true)
                        Player.Toast('error', 'Hiba történt a könyvjelzők betöltése közben.')
                    })
            })
            break;
        }
        case (ACTIONS.IFRAME.VOL_UP): {
            Player.plyr.increaseVolume(0.1)
            break;
        }
        case (ACTIONS.IFRAME.VOL_DOWN): {
            Player.plyr.increaseVolume(-0.1)
            break;
        }
        case (ACTIONS.IFRAME.TOGGLE_MUTE): {
            Player.plyr.muted = !Player.plyr.muted
            break;
        }
        case (ACTIONS.IFRAME.TOGGLE_FULLSCREEN): {
            let fullscreenButton = document.querySelector('.plyr__controls__item.plyr__control[data-plyr="fullscreen"]') as HTMLButtonElement | null;
            if (fullscreenButton) {
                fullscreenButton.focus()
                fullscreenButton.click()
                fullscreenButton.blur()
            }
            break;
        }
        case (ACTIONS.IFRAME.TOGGLE_PLAY): {
            if (Player.plyr.playing) {
                Player.plyr.pause()
            } else {
                Player.plyr.play()
            }
            break;
        }
        case (ACTIONS.IFRAME.SEEK): {
            Player.seekTo(Player.plyr.currentTime + Number(event.data.time));
            break;
        }
        case (ACTIONS.IFRAME.SEEK_PERCENTAGE): {
            Player.plyr.currentTime = Player.plyr.duration * (event.data.percentage / 100)
            break;
        }
        case (ACTIONS.IFRAME.BACKWARD_SKIP): {
            if (!Player.settings.backwardSkip.enabled) return;
            Player.skipBackward()
            break;
        }
        case (ACTIONS.IFRAME.FORWARD_SKIP): {
            if (!Player.settings.forwardSkip.enabled) return;
            Player.skipForward()
            break;
        }
        default: return;
    }
}

window.addEventListener('message', messageHandler)


function handleDailymotionReplace() {
    Logger.log('[Dailymotion] Handling dailymotion replace', true)

    let dlDelay = false

    Logger.log('[Dailymotion] mediaID:' + extractMediaID(window.location.href))
    getQualityData(extractMediaID(window.location.href)).then((qualities) => {
        Logger.log('[Dailymotion] Quality data received:' + JSON.stringify(qualities))

        Player.download = () => {
            if (dlDelay) {
                Player.Toast('error', 'Kérlek várj egy kicsit, mielőtt újra letöltenéd a videót.')
                return
            }

            let url = Player.curQuality?.url
            let toastId = `download-toast-${Math.random().toString(36).substring(2, 15)}`
            if (!url) {
                Player.Toast('error', 'Hiba történt a videó letöltése közben.', "A letöltési URL üres vagy nem meghatározott.", { id: toastId })
                Logger.error('Download failed: URL is empty or undefined.')
                return
            }

            let quality = Player.curQuality?.quality

            if (!quality) {
                Player.Toast('error', 'Hiba történt a videó letöltése közben.', "A minőség üres vagy nem meghatározott.", { id: toastId })
                Logger.error('Download failed: quality is empty or undefined.')
                return
            }

            let onStatusUpdate = (status: {
                percentage: number
                packets: number
                totalPackets: number
                size: number
                totalSize: number
            }) => {
                Player.Toast(
                    'info',
                    'Letöltés folyamatban',
                    `Letöltés ${status.percentage}% kész (${status.packets}/${status.totalPackets}, ${prettyFileSize(status.size)} / ${prettyFileSize(status.totalSize)})`,
                    {
                        position: 'top-left',
                        duration: 3000,
                        id: toastId,
                    },
                )
            }

            let onError = (error: Error) => {
                Player.Toast('error', 'Hiba történt a videó letöltése közben.', error.message, {
                    position: 'top-left',
                    duration: 5000,
                    id: toastId,
                })
                Logger.error('Download failed: ' + error.message, true)
            }

            let onSuccess = () => {
                Player.Toast(
                    'success',
                    'Letöltés befejezve',
                    `${renderFileName(
                        Player.settings.advanced.downloadName,
                        Player.animeTitle,
                        Player.epNum,
                        Player.curQuality?.quality || 0,
                        Player.fansub,
                        'Dailymotion'
                    )}.mp4 letöltése befejeződött.`,
                    {
                        position: 'top-left',
                        duration: 3000,
                        id: toastId,
                    },
                )
                Logger.success('Download completed successfully.', true)
            }

            downloadHLS(
                url,
                Player.animeTitle,
                Player.epNum,
                quality,
                Player.fansub,
                'Dailymotion',
                Player.settings.advanced.downloadName,
                onStatusUpdate,
                onSuccess,
                onError
            )

            dlDelay = true
            setTimeout(() => (dlDelay = false), 2000)
        }
        Player.epData = qualities as EpisodeVideoData[]
        Player.replace()
        window.parent.postMessage({ type: ACTIONS.IFRAME.PLAYER_REPLACED }, '*')
    })
}

/**
 * Function to extract the media ID from the URL
 * @param {string} url - URL
 * @returns {string} - Media ID
 * @since v0.1.7
 */
function extractMediaID(url: string): string | null {
    const match = url.match(/video=([^&]+)/)
    return match ? match[1] : null
}


window.parent.postMessage({ type: ACTIONS.IFRAME.FRAME_LOADED }, '*')
