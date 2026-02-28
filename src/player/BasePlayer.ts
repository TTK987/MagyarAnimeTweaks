// @ts-ignore TS1192
import Plyr from 'plyr'
import Logger from '../Logger'
import MAT from '../MAT'
import Toast, { Options } from '../Toast'
import { EpisodeVideoData, keyBind, Settings } from '../global'
import 'plyr/dist/plyr.css'
import { ACTIONS } from '../lib/actions'
import { HistoryPlugin } from './plugins/history'
import { BookmarkPlugin } from './plugins/bookmark'
import { AniSkipPlugin } from './plugins/aniskip'
import { AntiFocusPlugin } from './plugins/antifocus'
import { isExpired } from '../lib/expiry'
import { checkShortcut, createKeyBind } from '../lib/shortcuts'
import { addCSS, applyStyles, createElement } from '../lib/dom-utils'

export default class BasePlayer {
    selector: string
    epData: EpisodeVideoData[]
    plyr: Plyr
    isDownloadable: boolean
    settings: Settings
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
    private fullscreenChangeHandler?: () => void
    private cursorActivityHandler?: () => void
    protected hasTriggeredExpiry: boolean = false

    // Plugins for the player
    History: HistoryPlugin
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
     * @param {Settings} settings - The settings object
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
        settings: Settings = MAT.getDefaultSettings(),
        epID: number = 0,
        animeID: number = 0,
        animeTitle: string = '',
        epNum: number = 0,
        malId: number = 0,
        playerID: number = 0,
    ) {
        this.selector = selector
        this.epData = qualityData
        this.plyr = undefined as unknown as Plyr
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
        this.History = new HistoryPlugin(this)
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
        if (data.length === 0) {
            Logger.error('No video data provided.')
            return
        }
        this.epData = data
        this.plyr.destroy(() => {
            Logger.log('Plyr instance destroyed')
        }, false)

        this.epNum = epNum
        this.isANEpTriggered = false
        this.hasTriggeredExpiry = false

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
            let playerElement = document.querySelector(this.selector) ?? document.querySelector('video')
            let videoElement = this.createVideoElement()

            if (!document.getElementById('MATweaks-player-wrapper')) {
                if (!document.getElementById('MATweaks-player-style'))
                    addCSS(
                        `#MATweaks-player-wrapper .plyr {max-width: 100% !important;height: 100% !important;}`,
                        'MATweaks-player-style',
                    )

                let wrapper = createElement('div', {
                    id: 'MATweaks-player-wrapper',
                    styles: {
                        height: '100%',
                        width: '100%',
                        maxWidth: '1200px',
                        margin: '0 auto',
                    },
                    children: [videoElement],
                })
                if (!playerElement) {
                    let existingWrapper = document.getElementById('MATweaks-player-wrapper')!
                    existingWrapper.innerHTML = ''
                    existingWrapper.appendChild(videoElement)
                } else playerElement.replaceWith(wrapper)
            } else {
                if (!playerElement) {
                    let existingWrapper = document.getElementById('MATweaks-player-wrapper')!
                    existingWrapper.innerHTML = ''
                    existingWrapper.appendChild(videoElement)
                } else playerElement.replaceWith(videoElement)
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
     * Handle video expiry
     */
    onVideoExpire() {}

    /**
     * Load custom CSS
     */
    protected loadCustomCss() {
        if (this.settings.plyr.design) {
            MAT.loadPlyrCSS().then((css) => addCSS(css, 'MATweaks-plyr-style'))
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
            applyStyles(plyrContainer, { maxWidth: '100% !important', width: '100%', height: '' })
            if (width && height && Math.abs(width / height - 4 / 3) < 0.05)
                 applyStyles(plyrContainer, { aspectRatio: '4 / 3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' })
            else applyStyles(plyrContainer, { aspectRatio: '16 / 9', display: 'block', alignItems: '', justifyContent: '', margin: '0' })
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
        videoElement.innerHTML = this.epData.map((data) => `<source src="${data.url}" size="${data.quality}">`).join('')
        this.setupAutoNextEpisode(videoElement)
        return videoElement
    }

    /**
     * Setup the auto next episode feature
     * @param {HTMLVideoElement} videoElement - The video element
     */
    protected setupAutoNextEpisode(videoElement: HTMLVideoElement) {
        if (!this.settings.autoNextEpisode.enabled) return
        this.settings.autoNextEpisode.time = Math.max(Number(this.settings.autoNextEpisode.time || 0), 0)
        videoElement.addEventListener('timeupdate', () => {
            if (
                this.plyr &&
                this.plyr.duration &&
                this.plyr.duration - this.plyr.currentTime <= Number(this.settings.autoNextEpisode.time || 0) &&
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
            keyboard: { focused: false, global: false },
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
        if (this.settings.history.enabled) this.History.init()
        if (this.settings.bookmarks.enabled) this.Bookmark.init()
        if (this.settings.plyr.plugins.aniSkip.enabled) this.AniSkip.init(videoElement)
        this.setupAutoHideCursor()
        this.monitorVideoExpiry()
        this.AntiFocus.init()
    }

    /**
     * Skip forward in the video
     */
    skipForward() {
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

    /**
     *
     */
    public seek(time: number) {
        this.plyr.currentTime += time
    }


    private addDownloadButton() {
        document.querySelector('.plyr__controls__item[data-plyr="download"]')?.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            this.download()
        })
    }

    private stringifyKeyBind = (data: KeyboardEvent | keyBind): string => {
        return `${data.ctrlKey ? '1' : '0'}|${data.altKey ? '1' : '0'}|${data.shiftKey ? '1' : '0'}|${data.metaKey ? '1' : '0'}|${data.key.toLowerCase()}`
    }
    /**
     * Add keyboard shortcuts to the Plyr player
     */
    private addShortcutsToPlyr() {
        this.addDownloadButton()

        document.removeEventListener('keydown', this.keydownHandler as EventListener)

        this.keydownHandler = (e: KeyboardEvent) => {
            console.log('Keydown event:', this.stringifyKeyBind(e))
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) || (e.target as HTMLElement).isContentEditable) return
            if (this.settings.forwardSkip.enabled && checkShortcut(e, this.settings.forwardSkip.keyBind))
                this.skipForward() // Forward skip
            else if (this.settings.backwardSkip.enabled && checkShortcut(e, this.settings.backwardSkip.keyBind))
                this.skipBackward() // Backward skip
            else if (this.settings.nextEpisode.enabled && checkShortcut(e, this.settings.nextEpisode.keyBind)) {
                window.dispatchEvent(new Event('NextEpisode')); this.nextEpisode() }
            else if (this.settings.previousEpisode.enabled && checkShortcut(e, this.settings.previousEpisode.keyBind)) {
                window.dispatchEvent(new Event('PreviousEpisode')); this.previousEpisode() }
            else if (checkShortcut(e, this.settings.plyr.shortcuts.playPause))
                this.plyr.playing ? this.plyr.pause() : this.plyr.play() // Play/Pause toggle
            else if (checkShortcut(e, this.settings.plyr.shortcuts.muteUnmute))
                this.plyr.muted = !this.plyr.muted // Mute/Unmute toggle
            else if (checkShortcut(e, this.settings.plyr.shortcuts.volumeUp))
                this.plyr.increaseVolume(0.1) // Volume up
            else if (checkShortcut(e, this.settings.plyr.shortcuts.volumeDown))
                this.plyr.decreaseVolume(0.1) // Volume down
            else if (checkShortcut(e, this.settings.plyr.shortcuts.fullscreen))
                this.plyr.fullscreen.toggle() // Fullscreen toggle
            else if (checkShortcut(e, createKeyBind(false, false, false, false, 'ArrowRight')))
                this.seek(this.settings.skip.time) // Seek forward
            else if (checkShortcut(e, createKeyBind(false, false, false, false, 'ArrowLeft')))
                this.seek(-this.settings.skip.time) // Seek backward
            else if (e.key.match(/[0-9]/) && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey)
                this.seekTo((this.plyr.duration * Number(e.key)) / 10) // Number key seek (0-9)
            else return // If no shortcut matches, do nothing
            e.preventDefault()
            e.stopPropagation()
        }
        document.addEventListener('keydown', this.keydownHandler as EventListener)
    }

    /**
     * Remove all event listeners and destroy the player
     */
    destroy() {
        if (this.keydownHandler) document.removeEventListener('keydown', this.keydownHandler)
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

    private setupAutoHideCursor() {
        const getContainer = () => document.getElementById('MATweaks-player-wrapper') as HTMLElement | null
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

    private monitorVideoExpiry() {
        const checkAndHandleExpiry = () => {
            if (this.hasTriggeredExpiry) return
            this.epData.forEach((video) => {
                if (video.expires && isExpired(video.expires) && !this.hasTriggeredExpiry) {
                    Logger.warn('Video has expired. Attempting to reload source.')
                    this.hasTriggeredExpiry = true
                    this.onVideoExpire()
                }
            })
        }

        // Run an initial check when the player is ready
        if (this.plyr) {
            checkAndHandleExpiry()
        }

        // If playback stalls, it might be due to an expired token
        this.plyr.on('stalled', () => {
            checkAndHandleExpiry()
        })

        // Also check periodically during playback
        this.plyr.on('timeupdate', () => {
            checkAndHandleExpiry()
        })
    }
}
