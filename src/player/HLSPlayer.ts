import BasePlayer from './BasePlayer'
import Logger from '../Logger'
import MAT from '../MAT'
import Hls from 'hls.js'
import { SettingsV019, FansubData, EpisodeVideoData } from '../global'

/**
 * HLSPlayer class
 * This class is used to create a HLS player using Hls.js and Plyr.js
 *
 * @param {string} selector - The selector for the video element
 * @param {Array} qualityData - The quality data for the video
 * @param {boolean} isDownloadable - Whether the video is downloadable or not
 * @param {SettingsV019} settings - The settings for the player
 * @param {number} episodeId - The ID of the episode
 * @param {number} datasheetId - The ID of the datasheet
 * @param {string} title - The title of the anime
 * @param {number} episodeNumber - The episode number
 */
class HLSPlayer extends BasePlayer {
    hls: Hls | null
    fansub: FansubData[] | null
    curQuality: EpisodeVideoData | null
    constructor(
        selector: string,
        qualityData: EpisodeVideoData[],
        isDownloadable: boolean,
        settings: SettingsV019 = MAT.settings,
        episodeId: number,
        datasheetId: number,
        title: string,
        episodeNumber: number,
        malId: number,
    ) {
        super(
            selector,
            qualityData,
            isDownloadable,
            settings,
            episodeId,
            datasheetId,
            title,
            episodeNumber,
            malId,
        )
        this.hls = null
        this.fansub = null
        this.curQuality = null
        this.addEventListeners()
    }

    onTokenExpired() {}

    onRateLimit() {}

    addEventListeners() {
        window.addEventListener('message', (event) => {
            switch (event.data.type) {
                case MAT.__ACTIONS__.IFRAME.TOGGLE_PLAY:
                    let btn = document.querySelector(
                        ".plyr__controls__item[data-plyr='play']",
                    ) as HTMLElement
                    if (btn) {
                        btn.focus()
                        btn.click()
                        btn.blur()
                    } else {
                        this.plyr?.togglePlay()
                    }
                    break
                case MAT.__ACTIONS__.IFRAME.VOL_UP:
                    this.plyr?.increaseVolume(0.1)
                    break
                case MAT.__ACTIONS__.IFRAME.VOL_DOWN:
                    this.plyr?.decreaseVolume(0.1)
                    break
                case MAT.__ACTIONS__.IFRAME.TOGGLE_MUTE:
                    if (this.plyr) this.plyr.muted = !this.plyr.muted
                    break
                case MAT.__ACTIONS__.IFRAME.TOGGLE_FULLSCREEN:
                    let f = document.querySelector(
                        ".plyr__controls__item[data-plyr='fullscreen']",
                    ) as HTMLElement
                    if (f) {
                        f.focus()
                        f.click()
                        f.blur()
                    } else {
                        this.plyr?.fullscreen.toggle()
                    }
                    break
                case MAT.__ACTIONS__.IFRAME.SEEK:
                    this.seekTo(event.data.epTime)
                    break
                case MAT.__ACTIONS__.IFRAME.BACKWARD_SKIP:
                    this.skipBackward()
                    break
                case MAT.__ACTIONS__.IFRAME.FORWARD_SKIP:
                    this.skipForward()
                    break
                case MAT.__ACTIONS__.IFRAME.GET_CURRENT_TIME:
                    window.parent.postMessage(
                        {
                            type: MAT.__ACTIONS__.IFRAME.CURRENT_TIME,
                            currentTime: this.plyr?.currentTime,
                        },
                        '*',
                    )
                    break
                case MAT.__ACTIONS__.IFRAME.SEEK_PERCENTAGE:
                    this.seekTo(
                        (Math.max(0, Math.min(100, event.data.percentage)) / 100) *
                            (this.plyr?.duration || 0),
                    )
                    break
                case MAT.__ACTIONS__.IFRAME.GET_BOOKMARKS:
                    break
                default:
                    break
            }
            return true
        })
    }

    previousEpisode() {
        window.parent.postMessage({ type: MAT.__ACTIONS__.IFRAME.PREVIOUS_EPISODE }, '*')
    }

    nextEpisode() {
        window.parent.postMessage({ type: MAT.__ACTIONS__.IFRAME.NEXT_EPISODE }, '*')
    }

    autoNextEpisode() {
        window.parent.postMessage({ type: MAT.__ACTIONS__.IFRAME.AUTO_NEXT_EPISODE }, '*')
    }

    changeQuality(quality: number, videoElement: HTMLVideoElement) {
        if (!this.hls) return
        const currentTime = this.plyr?.currentTime || videoElement.currentTime || 0
        const qualityData = this.epData.find(
            (data) => Number(data.quality) === Number(quality),
        )
        if (!qualityData) {
            Logger.error('Quality data not found.')
            return
        }
        this.curQuality = qualityData
        this.hls.loadSource(qualityData.url)
        this.hls.once(Hls.Events.MANIFEST_PARSED, () => {
            Logger.log('HLS manifest loaded, starting playback.')
            videoElement.currentTime = currentTime
            if (this.settings.autoplay.enabled) videoElement.play()
        })
    }

    replace() {
        try {
            if (this.epData.length === 0) {
                Logger.error('Invalid source URL.', true)
                window.dispatchEvent(new Event('PlayerReplaceFailed'))
                window.parent.postMessage(
                    { type: MAT.__ACTIONS__.IFRAME.PLAYER_REPLACE_FAILED },
                    '*',
                )
                return
            }
            let videoElement = this.createVideoElement()
            this.curQuality = this.epData[0]
            this.setupPlyr(videoElement)
            this.loadCustomCss()
            window.dispatchEvent(new Event('PlayerReplaced'))
            window.parent.postMessage({ type: MAT.__ACTIONS__.IFRAME.PLAYER_REPLACED }, '*')
            Logger.success('Player replaced successfully.', true)
        } catch (e) {
            Logger.error('Error while replacing with Plyr player. Error: ' + e, true)
            window.dispatchEvent(new Event('PlayerReplaceFailed'))
            window.parent.postMessage({ type: MAT.__ACTIONS__.IFRAME.PLAYER_REPLACE_FAILED }, '*')
        }
    }

    createVideoElement() {
        let existingVideoElement = document.getElementById('video') as HTMLVideoElement
        let videoElement = document.createElement('video')
        if (existingVideoElement) videoElement = existingVideoElement
        videoElement.id = 'video'
        if (this.settings.autoplay.enabled) videoElement.setAttribute('autoplay', 'autoplay')
        videoElement.playsInline = true
        videoElement.controls = true
        videoElement.preload = 'metadata'
        videoElement.setAttribute('type', 'application/x-mpegURL')

        this.epData.forEach((data) => {
            videoElement.src = this.epData[0].url
            let source = document.createElement('source')
            source.src = data.url
            videoElement.setAttribute('type', source.type)
            videoElement.appendChild(source)
        })

        if (Hls.isSupported()) {
            if (this.epData[0].url.includes("magyaranime")){
                let url = new URL(this.epData[0].url);
                let token = url.searchParams.get('token')
                let expires = url.searchParams.get("expires");
                this.hls = new Hls({
                    xhrSetup: (xhr: XMLHttpRequest, url: string) => {
                        if (url.endsWith(".ts")){
                            let newUrl = new URL(url);
                            newUrl.searchParams.set("token", token || "");
                            newUrl.searchParams.set("expires", expires || "");
                            xhr.open("GET", newUrl.toString());
                        }
                    }
                });
            } else this.hls = new Hls()
            this.hls.loadSource(this.epData[0].url)
            this.hls.attachMedia(videoElement)
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                Logger.log('HLS manifest loaded, starting playback.')
                videoElement.play()
            })
            this.hls.on(Hls.Events.ERROR, (event, data) => {
                const responseCode = data?.response?.code
                if (responseCode === 403) this.onTokenExpired()
                else if (responseCode === 429) this.onRateLimit()
            })
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = this.epData[0].url
        } else {
            Logger.error('HLS is not supported in this browser.')
        }

        document.querySelector(this.selector)?.replaceWith(videoElement)

        this.selector = 'video'

        this.setupAutoNextEpisode(videoElement)
        return videoElement
    }
}

export default HLSPlayer
