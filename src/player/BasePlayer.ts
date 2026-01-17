// @ts-ignore TS1192
import Plyr from 'plyr'
import Logger from '../Logger'
import MAT from '../MAT'
import Toast, { Options } from '../Toast'
import { SettingsV019, EpisodeVideoData, keyBind } from '../global'
import 'plyr/dist/plyr.css'
import { ACTIONS } from '../lib/actions'
import { ResumePlugin } from './plugins/resume'
import { BookmarkPlugin } from './plugins/bookmark'
import { AniSkipPlugin } from './plugins/aniskip'
import { AntiFocusPlugin } from './plugins/antifocus'
import { isExpired } from '../lib/expiry'

export default class BasePlayer {
    selector: string
    epData: EpisodeVideoData[]
    plyr: Plyr | undefined
    isDownloadable: boolean
    settings: SettingsV019
    epID: number
    animeTitle: string
    epNum: number
    animeID: number
    malId: number
    playerID: number
    isANEpTriggered: boolean
    private skipForwardCooldown: number | undefined
    private skipBackwardCooldown: number | undefined
    private cursorAutoHideTimer?: number
    private readonly cursorAutoHideDelayMs: number = 2000
    private keydownHandler?: (event: KeyboardEvent) => void
    private keyupHandler?: (event: KeyboardEvent) => void
    private fullscreenChangeHandler?: () => void
    private cursorActivityHandler?: () => void

    // Plugins for the player
    Resume: ResumePlugin
    Bookmark: BookmarkPlugin
    AniSkip: AniSkipPlugin
    AntiFocus: AntiFocusPlugin

    /**
     * Base player class
     *
     * Events:
     * - PlayerReplaceFailed: When the player replacement failed
     * - PlayerReplaced: When the player is replaced, and ready to use
     * - AutoNextEpisode: When the auto next episode feature is triggered
     * - NextEpisode: When the next episode button is clicked
     * - PreviousEpisode: When the previous episode button is clicked
     *
     * @param {string} selector - The selector of the player element
     * @param {EpisodeVideoData[]} qualityData - The quality data of the video
     * @param {boolean | undefined} isDownloadable - Is the video downloadable
     * @param {SettingsV019} settings - The settings object
     * @param {number} epID - The ID of the episode
     * @param {number} animeID - The ID of the anime
     * @param {string} animeTitle - The title of the anime
     * @param {number} epNum - The episode number
     * @param {number} malId - The MyAnimeList ID of the anime
     * @param {number} playerID - The player instance ID from the server
     * @constructor
     */
    constructor(
        selector: string = 'video',
        qualityData: EpisodeVideoData[] = [],
        isDownloadable: boolean = true,
        settings: SettingsV019 = MAT.getDefaultSettings(),
        epID: number = 0,
        animeID: number = 0,
        animeTitle: string = '',
        epNum: number = 0,
        malId: number = 0,
        playerID: number = 0,
    ) {
        this.selector = selector
        this.epData = qualityData
        this.plyr = undefined
        this.isDownloadable = isDownloadable
        this.settings = settings
        this.epID = epID
        this.animeTitle = animeTitle
        this.malId = malId
        this.epNum = epNum
        this.animeID = animeID
        this.isANEpTriggered = false
        this.playerID = playerID

        // Initialize plugins
        this.Resume = new ResumePlugin(this)
        this.Bookmark = new BookmarkPlugin(this)
        this.AniSkip = new AniSkipPlugin(this)
        this.AntiFocus = new AntiFocusPlugin(this)

        Logger.log(
            JSON.stringify({
                selector: this.selector,
                qualityData: this.epData,
                isDownloadable: this.isDownloadable,
                settings: this.settings,
                epID: this.epID,
                animeID: this.animeID,
                animeTitle: this.animeTitle,
                epNum: this.epNum,
                malId: this.malId,
                playerID: this.playerID,
            }),
        )
    }

    loadNewVideo(data: EpisodeVideoData[], epNum: number) {
        if (!this.plyr) return
        if (data.length === 0) {
            Logger.error('No video data provided.')
            return
        }
        this.epData = data
        this.plyr.destroy(() => {
            Logger.log('Plyr instance destroyed')
        }, false)

        document.querySelector('.plyr')?.remove()
        this.epNum = epNum
        this.isANEpTriggered = false

        this.replace()
    }

    /**
     * Go to the previous episode
     */
    previousEpisode() {}

    /**
     * Go to the next episode
     */
    nextEpisode() {}

    /**
     * Change the quality of the video
     * @param {number} quality - The quality to change to
     * @param {HTMLVideoElement} videoElement - The video element
     */
    changeQuality(quality: number, videoElement: HTMLVideoElement) {}

    /**
     * Show a Toast message
     * @param {string} [type="info"] - The type of the Toast
     * @param title
     * @param description
     * @param options
     * @returns {void}
     */
    Toast(
        type: 'success' | 'info' | 'warning' | 'error' | 'default' = 'default',
        title: string,
        description?: string,
        options: Options = {},
    ): void {
        if (window.parent !== window && window.document.fullscreenElement === null) {
            window.parent.postMessage(
                {
                    type: ACTIONS.IFRAME.TOAST,
                    message: {
                        type: type,
                        title: title,
                        description: description || '',
                        options: {
                            position: options.position || 'bottom-right',
                            duration: options.duration || 2000,
                            id: options.id || undefined,
                        },
                    },
                },
                '*',
            )
        } else {
            Toast.show(type, title, description, {
                position: options.position || 'top-left',
                duration: options.duration || 2000,
                id: options.id || undefined,
            })
        }
    }

    /**
     * Replaces the player with the Plyr player
     */
    replace() {
        try {
            if (this.epData.length === 0) {
                Logger.error('Invalid source URL.')
                window.dispatchEvent(new Event(ACTIONS.IFRAME.PLAYER_REPLACE_FAILED))
                return
            }
            let playerElement =
                document.querySelector(this.selector) || document.querySelector('video')
            let videoElement = this.createVideoElement()
            if (!playerElement) {
                Logger.error('Player element not found. Selector: ' + this.selector)
                window.dispatchEvent(new Event(ACTIONS.IFRAME.PLAYER_REPLACE_FAILED))
                return
            }

            if (!document.getElementById('MATweaks-player-wrapper')) {
                let wrapper = document.createElement('div')
                wrapper.id = 'MATweaks-player-wrapper'
                wrapper.style.height = '100%'
                wrapper.style.width = '100%'
                wrapper.style.maxWidth = '1200px'
                wrapper.style.margin = '0 auto'
                let style = document.createElement('style')
                style.innerHTML = `
                #MATweaks-player-wrapper .plyr {
                    max-width: 100% !important;
                    height: 100% !important;
                }
                `
                wrapper.append(style, videoElement)
                playerElement.replaceWith(wrapper)
            } else {
                playerElement.replaceWith(videoElement)
            }

            this.setupPlyr(videoElement)
            this.selector = '.plyr'
            this.loadCustomCss()
            window.dispatchEvent(new Event(ACTIONS.IFRAME.PLAYER_REPLACED))
            Logger.success('Player replaced successfully.')
        } catch (e) {
            Logger.error('Error while replacing with Plyr player. Error: ' + e)
            window.dispatchEvent(new Event(ACTIONS.IFRAME.PLAYER_REPLACE_FAILED))
        }
    }

    /**
     * Add custom CSS to the page
     * @param {string} css - The CSS to add
     */
    addCSS(css: string) {
        let style = document.createElement('style')
        style.innerHTML = css
            .replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '')
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        document.head.appendChild(style)
    }

    /**
     * Handle video expiry
     */
    onVideoExpire() {}

    /**
     * Load custom CSS
     */
    protected loadCustomCss() {
        if (this.settings.plyr.design.enabled) {
            MAT.loadPlyrCSS().then((css) => this.addCSS(css))
            Logger.log('Custom CSS loaded.')
        }
    }

    /**
     * Adjusts the Plyr container to match the video's aspect ratio (e.g., 4:3)
     * @param {HTMLVideoElement} videoElement - The video element
     */
    protected adjustAspectRatio(videoElement: HTMLVideoElement) {
        Logger.log('Adjusting aspect ratio based on video metadata.')
        const width = videoElement.videoWidth
        const height = videoElement.videoHeight
        const plyrContainer = videoElement.closest('.plyr') as HTMLElement
        if (plyrContainer) {
            Logger.log('Video dimensions:' + width + 'x' + height)
            plyrContainer.style.maxWidth = '100% !important'
            plyrContainer.style.width = '100%'
            plyrContainer.style.height = ''
            if (width && height && Math.abs(width / height - 4 / 3) < 0.05) {
                videoElement.style.aspectRatio = '4 / 3'
                videoElement.style.margin = '0 auto'
                plyrContainer.style.display = 'flex'
                plyrContainer.style.alignItems = 'center'
                plyrContainer.style.justifyContent = 'center'
            } else {
                videoElement.style.aspectRatio = '16 / 9'
                videoElement.style.margin = '0'
                plyrContainer.style.display = 'block'
                plyrContainer.style.alignItems = ''
                plyrContainer.style.justifyContent = ''
            }
        }
    }

    /**
     * Create a new video element
     * @returns {HTMLVideoElement} The created video element
     */
    protected createVideoElement(): HTMLVideoElement {
        let existingVideoElement = document.getElementById('video') as HTMLVideoElement
        let videoElement: HTMLVideoElement = document.createElement('video')
        if (existingVideoElement) videoElement = existingVideoElement
        videoElement.id = 'video'
        if (this.settings.autoplay.enabled) videoElement.setAttribute('autoplay', 'autoplay')
        videoElement.setAttribute('type', 'video/mp4; codecs="avc1.64001F, mp4a.40.2"')
        videoElement.playsInline = true
        videoElement.controls = false
        videoElement.preload = 'metadata'
        videoElement.src = this.epData[0].url
        videoElement.innerHTML = this.epData
            .map((data) => `<source src="${data.url}" size="${data.quality}">`)
            .join('')
        this.setupAutoNextEpisode(videoElement)
        return videoElement
    }

    /**
     * Setup the auto next episode feature
     * @param {HTMLVideoElement} videoElement - The video element
     */
    protected setupAutoNextEpisode(videoElement: HTMLVideoElement) {
        if (!this.settings.autoNextEpisode.enabled) return
        this.settings.autoNextEpisode.time = Math.max(
            Number(this.settings.autoNextEpisode.time || 0),
            0,
        )
        videoElement.addEventListener('timeupdate', () => {
            if (
                this.plyr &&
                this.plyr.duration &&
                this.plyr.duration - this.plyr.currentTime <=
                    Number(this.settings.autoNextEpisode.time || 0) &&
                !this.isANEpTriggered &&
                this.plyr.currentTime !== 0 &&
                this.plyr.duration !== 0
            ) {
                Logger.log('Auto next episode triggered.')
                window.dispatchEvent(new Event('AutoNextEpisode'))
                this.autoNextEpisode()
                this.isANEpTriggered = true
            }
        })
        videoElement.addEventListener('ended', () => {
            if (!this.plyr) return
            if (!this.isANEpTriggered && this.plyr.currentTime !== 0 && this.plyr.duration !== 0) {
                Logger.log('Auto next episode triggered.')
                window.dispatchEvent(new Event('AutoNextEpisode'))
                this.autoNextEpisode()
                this.isANEpTriggered = true
            }
        })
    }

    /**
     * Automatically go to the next episode
     */
    autoNextEpisode() {}

    /**
     * Setup the Plyr player
     * @param {HTMLVideoElement} videoElement - The video element
     */
    protected setupPlyr(videoElement: HTMLVideoElement) {
        if (this.plyr) this.plyr.destroy()
        this.plyr = new Plyr(videoElement, {
            fullscreen: {
                container: '#MATweaks-player-wrapper',
            },
            controls: [
                'play-large',
                'play',
                'progress',
                'current-time',
                'mute',
                'volume',
                'settings',
                'pip',
                'airplay',
                this.isDownloadable ? 'download' : '',
                'fullscreen',
            ],
            keyboard: { focused: true, global: true },
            settings: ['quality', 'speed'],
            tooltips: { controls: true, seek: true },
            iconUrl: chrome.runtime.getURL('assets/plyr.svg'),
            blankVideo: chrome.runtime.getURL('assets/blank.mp4'),
            i18n: this.getPlyrI18n(),
            invertTime: false,
            seekTime: this.settings.skip.time || 5,
            quality: {
                default: Math.max(...this.epData.map((data) => data.quality)),
                options: [...this.epData.map((data) => data.quality).sort((a, b) => b - a)],
                forced: true,
                onChange: (quality: number) => this.changeQuality(quality, videoElement),
            },
            speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
            markers: {
                enabled: this.settings.bookmarks.enabled || false,
                points: this.Bookmark.getBookmarks(),
            },
            autoplay: this.settings.autoplay.enabled,
        })
        this.addShortcutsToPlyr()
        this.adjustAspectRatio(videoElement)
        if (this.settings.resume.enabled) this.Resume.init()
        if (this.settings.bookmarks.enabled) this.Bookmark.init()
        if (this.settings.eap) this.AniSkip.init(videoElement)
        this.setupAutoHideCursor()
        this.handlePlayerID()
        this.AntiFocus.init()
    }

    /**
     * Skip forward in the video
     */
    skipForward() {
        if (!this.plyr) return
        if (this.skipForwardCooldown && Date.now() - this.skipForwardCooldown < 200) {
            // 200ms cooldown
            Logger.log('Skip forward is on cooldown.')
            return
        }
        this.skipForwardCooldown = Date.now()
        this.plyr.currentTime += Number(this.settings.forwardSkip.time)
        this.Toast('info', '+' + this.settings.forwardSkip.time + ' sec.', '', { duration: 500 })
        Logger.log('Skipped forward ' + this.settings.forwardSkip.time + ' seconds.')
    }

    /**
     * Skip backward in the video
     */
    skipBackward() {
        if (!this.plyr) return
        if (this.skipBackwardCooldown && Date.now() - this.skipBackwardCooldown < 200) {
            // 200ms cooldown
            Logger.log('Skip backward is on cooldown.')
            return
        }
        this.skipBackwardCooldown = Date.now()
        this.plyr.currentTime -= Number(this.settings.backwardSkip.time)
        this.Toast('info', '-' + this.settings.backwardSkip.time + ' sec.', '', { duration: 500 })
        Logger.log('Skipped backward ' + this.settings.backwardSkip.time + ' seconds.')
    }

    /**
     * Download the video
     */
    download() {}

    /**
     * Seek to a specific time in the video
     * @param {number} time - The time to seek to
     */
    seekTo(time: number) {
        const video = document.querySelector('video') as HTMLVideoElement | null
        const target: Plyr | HTMLVideoElement | null = this.plyr || video
        if (!target || !video) return
        const seekHandler = () => {
            if ('duration' in target && target.duration > 0) {
                target.currentTime = time
                video.removeEventListener('loadeddata', seekHandler)
                video.removeEventListener('playing', seekHandler)
            }
        }
        if (target instanceof HTMLVideoElement && target.readyState >= 2) {
            target.currentTime = time
        } else if ('duration' in target && target.duration > 0) {
            target.currentTime = time
        } else {
            video.addEventListener('loadeddata', seekHandler)
            video.addEventListener('playing', seekHandler)
        }
    }

    private addDownloadButton() {
        document
            .querySelector('.plyr__controls__item[data-plyr="download"]')
            ?.addEventListener('click', (e) => {
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()
                this.download()
            })
    }

    /**
     * Add keyboard shortcuts to the Plyr player
     */
    private addShortcutsToPlyr() {
        this.addDownloadButton()

        this.keydownHandler = (event: KeyboardEvent) => {
            this.handleShortcutEvent(event, this.settings.forwardSkip, this.skipForward.bind(this))
            this.handleShortcutEvent(
                event,
                this.settings.backwardSkip,
                this.skipBackward.bind(this),
            )
        }
        this.keyupHandler = (event: KeyboardEvent) => {
            this.handleShortcutEvent(event, this.settings.nextEpisode, () => {
                window.dispatchEvent(new Event('NextEpisode'))
                this.nextEpisode()
            })
            this.handleShortcutEvent(event, this.settings.previousEpisode, () => {
                window.dispatchEvent(new Event('PreviousEpisode'))
                this.previousEpisode()
            })
        }
        document.addEventListener('keydown', this.keydownHandler)
        document.addEventListener('keyup', this.keyupHandler)
    }

    destroy() {
        if (this.keydownHandler) document.removeEventListener('keydown', this.keydownHandler)
        if (this.keyupHandler) document.removeEventListener('keyup', this.keyupHandler)
        if (this.cursorActivityHandler) {
            const container = document.getElementById('MATweaks-player-wrapper')
            if (container) {
                ;['mousemove', 'mousedown', 'mouseup', 'wheel', 'touchstart', 'touchmove', 'pointermove'].forEach(
                    (evt) => container.removeEventListener(evt, this.cursorActivityHandler as EventListener),
                )
            }
            document.removeEventListener('keydown', this.cursorActivityHandler as EventListener)
        }
        if (this.fullscreenChangeHandler) {
            document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler)
        }
        if (this.cursorAutoHideTimer) window.clearTimeout(this.cursorAutoHideTimer)
        this.plyr?.destroy()
    }

    /**
     * Handle a shortcut event
     * @param {KeyboardEvent} event - The keyboard event
     * @param {Object} shortcut - The shortcut configuration
     * @param {Function} action - The action to perform
     */
    private handleShortcutEvent(
        event: KeyboardEvent,
        shortcut: { enabled: any; time?: number; keyBind: keyBind },
        action: Function,
    ) {
        if (shortcut.enabled && this.checkShortcut(event, shortcut.keyBind)) {
            event.preventDefault()
            event.stopPropagation()
            event.stopImmediatePropagation()
            action()
        }
    }

    /**
     * Get the i18n translations for Plyr
     * @returns {Object} The i18n translations
     */
    private getPlyrI18n(): object {
        return {
            restart: 'Újraindítás',
            play: 'Lejátszás',
            pause: 'Megállítás',
            seek: 'Keresés',
            seekLabel: '{currentTime} másodpercnél',
            played: 'Lejátszott',
            currentTime: 'Jelenlegi idő',
            duration: 'Teljes idő',
            volume: 'Hangerő',
            mute: 'Némítás',
            unmute: 'Némítás kikapcsolása',
            download: 'Letöltés',
            enterFullscreen: 'Teljes képernyő',
            exitFullscreen: 'Kilépés a teljes képernyőből',
            settings: 'Beállítások',
            menuBack: 'Vissza',
            speed: 'Sebesség',
            normal: 'Normál',
            quality: 'Minőség',
            loop: 'Ismétlés',
            start: 'Kezdés',
            end: 'Befejezés',
            all: 'Összes',
            reset: 'Visszaállítás',
            disabled: 'Letiltva',
            enabled: 'Engedélyezve',
            qualityBadge: {
                2160: '4K',
                1440: '2K',
                1080: 'FHD',
                720: 'HD',
                576: 'SD',
                480: 'SD',
                360: '',
                240: '',
                144: '',
            },
        }
    }

    /**
     * Check if a keyboard event matches a shortcut
     * @param {KeyboardEvent} event - The keyboard event
     * @param {Object} shortcut - The shortcut configuration
     * @returns {boolean} Whether the event matches the shortcut
     */
    private checkShortcut(event: KeyboardEvent, shortcut: keyBind): boolean {
        return (
            event.ctrlKey === shortcut.ctrlKey &&
            event.altKey === shortcut.altKey &&
            event.shiftKey === shortcut.shiftKey &&
            event.key === shortcut.key
        )
    }

    private setupAutoHideCursor() {
        const getContainer = () =>
            document.getElementById('MATweaks-player-wrapper') as HTMLElement | null
        const isFsActive = () => {
            const container = getContainer()
            return !!container && document.fullscreenElement === container
        }
        const showCursor = () => {
            const container = getContainer()
            if (!container) return
            container.style.cursor = ''
        }
        const hideCursor = () => {
            const container = getContainer()
            if (!container) return
            if (isFsActive()) {
                container.style.cursor = 'none'
            }
        }
        const scheduleHide = () => {
            if (this.cursorAutoHideTimer) window.clearTimeout(this.cursorAutoHideTimer)
            this.cursorAutoHideTimer = window.setTimeout(() => hideCursor(), this.cursorAutoHideDelayMs)
        }

        const container = getContainer()
        if (!container) return
        if (container.hasAttribute('data-mat-cursorhide-bound')) return
        container.setAttribute('data-mat-cursorhide-bound', '1')

        this.cursorActivityHandler = () => {
            if (!isFsActive()) return
            showCursor()
            scheduleHide()
        }

        ;['mousemove', 'mousedown', 'mouseup', 'wheel', 'touchstart', 'touchmove', 'pointermove'].forEach((evt) =>
            container.addEventListener(evt, this.cursorActivityHandler as EventListener, {
                passive: true,
            }),
        )

        this.fullscreenChangeHandler = () => {
            if (isFsActive()) {
                showCursor()
                scheduleHide()
            } else {
                showCursor()
                if (this.cursorAutoHideTimer) window.clearTimeout(this.cursorAutoHideTimer)
            }
        }
        document.addEventListener('fullscreenchange', this.fullscreenChangeHandler)

        if (isFsActive()) {
            showCursor()
            scheduleHide()
        }
    }

    private handlePlayerID() {
        if (!this.playerID || this.playerID === 0) return
        // TODO: implement playerID handling
        return
    }

// private monitorVideoExpiry() {
//     if (!this.plyr) return
//     this.plyr.on('stalled', () => {
//         this.epData.forEach((video) => {
//             if (video.expires && isExpired(video.expires)) {
//                 Logger.warn('Video has expired. Attempting to reload source.')
//                 this.onVideoExpire()
//             }
//         })
//     })
// }
}
