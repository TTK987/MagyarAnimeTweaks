import Plyr from 'plyr'
import Bookmarks from '../Bookmark'
import Resume, { Episode } from '../Resume'
import Logger from '../Logger'
import MAT from '../MAT'
import Toast, { Options } from '../Toast'
import { SettingsV019, EpisodeVideoData, keyBind } from '../global'
import 'plyr/dist/plyr.css'
import {formatTime} from "../lib/time-utils";
import AniSkip, { SkipInterval } from '../AniSkip'

export default class BasePlayer {
    selector: string
    epData: EpisodeVideoData[]
    plyr: Plyr
    isDownloadable: boolean
    settings: SettingsV019
    epID: number
    animeTitle: string
    epNum: number
    animeID: number
    malId: number
    playerID: number
    private skipForwardCooldown: number | undefined
    private skipBackwardCooldown: number | undefined
    private isANEpTrigger: boolean
    private aniSkip?: AniSkip
    private aniSkipSegments: { op?: SkipInterval; ed?: SkipInterval } = {}
    private aniSkipCycleShown: { op?: boolean; ed?: boolean } = {}
    private aniSkipTimers: { op?: number; ed?: number } = {}
    private cursorAutoHideTimer?: number
    private readonly cursorAutoHideDelayMs: number = 2000
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
        // @ts-ignore
        this.plyr = undefined
        this.isDownloadable = isDownloadable
        this.settings = settings
        this.epID = epID
        this.animeTitle = animeTitle
        this.malId = malId
        this.epNum = epNum
        this.animeID = animeID
        this.isANEpTrigger = false
        this.playerID = playerID
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
        this.plyr.destroy(() => {Logger.log('Plyr instance destroyed')}, false)

        document.querySelector('.plyr')?.remove()
        this.epNum = epNum
        this.isANEpTrigger = false

        document.querySelector('.plyr')?.remove()

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
                    type: MAT.__ACTIONS__.IFRAME.TOAST,
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
                window.dispatchEvent(new Event('PlayerReplaceFailed'))
                return
            }
            let playerElement = document.querySelector(this.selector) || document.querySelector('video')
            let videoElement = this.createVideoElement()
            if (!playerElement) {
                Logger.error('Player element not found. Selector: ' + this.selector)
                window.dispatchEvent(new Event('PlayerReplaceFailed'))
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
                `
                wrapper.append(style, videoElement)
                playerElement.replaceWith(wrapper)
            } else {
                playerElement.replaceWith(videoElement)
            }

            this.setupPlyr(videoElement)
            this.selector = '.plyr'
            this.loadCustomCss()
            window.dispatchEvent(new Event('PlayerReplaced'))
            Logger.success('Player replaced successfully.')
        } catch (e) {
            Logger.error('Error while replacing with Plyr player. Error: ' + e)
            window.dispatchEvent(new Event('PlayerReplaceFailed'))
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
     * Load custom CSS
     */
    loadCustomCss() {
        if (this.settings.plyr.design.enabled) {
            MAT.loadPlyrCSS().then((css) => this.addCSS(css))
            Logger.log('Custom CSS loaded.')
        }
    }

    /**
     * Adjusts the Plyr container to match the video's aspect ratio (e.g., 4:3)
     * @param {HTMLVideoElement} videoElement - The video element
     */
    adjustAspectRatio(videoElement: HTMLVideoElement) {
        videoElement.addEventListener('loadedmetadata', () => {
            const width = videoElement.videoWidth
            const height = videoElement.videoHeight
            const plyrContainer = videoElement.closest('.plyr') as HTMLElement
            if (plyrContainer) {
                plyrContainer.style.aspectRatio = '16 / 9'
                plyrContainer.style.maxWidth = ''
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
        })
    }

    /**
     * Create a new video element
     * @returns {HTMLVideoElement} The created video element
     */
    createVideoElement(): HTMLVideoElement {
        let existingVideoElement = document.getElementById('video') as HTMLVideoElement
        let videoElement: HTMLVideoElement = document.createElement('video')
        if (existingVideoElement) videoElement = existingVideoElement
        videoElement.id = 'video'
        if (this.settings.autoplay.enabled) videoElement.setAttribute('autoplay', 'autoplay')
        videoElement.setAttribute('type', 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"')
        videoElement.playsInline = true
        videoElement.controls = true
        videoElement.preload = 'metadata'
        videoElement.src = this.epData[0].url
        videoElement.innerHTML = this.epData.map((data) => `<source src="${data.url}" size="${data.quality}">`).join('')
        this.setupAutoNextEpisode(videoElement)
        this.adjustAspectRatio(videoElement)
        return videoElement
    }

    /**
     * Setup the auto next episode feature
     * @param {HTMLVideoElement} videoElement - The video element
     */
    setupAutoNextEpisode(videoElement: HTMLVideoElement) {
        if (!this.settings.autoNextEpisode.enabled) return
        this.settings.autoNextEpisode.time = Math.max(
            Number(this.settings.autoNextEpisode.time || 0),
            0,
        )
        videoElement.addEventListener('timeupdate', () => {
            if (
                this.plyr?.duration - this.plyr?.currentTime <=
                    Number(this.settings.autoNextEpisode.time || 0) &&
                !this.isANEpTrigger &&
                this.plyr.currentTime !== 0 &&
                this.plyr.duration !== 0
            ) {
                Logger.log('Auto next episode triggered.')
                window.dispatchEvent(new Event('AutoNextEpisode'))
                this.autoNextEpisode()
                this.isANEpTrigger = true
            }
        })
        videoElement.addEventListener('ended', () => {
            if (!this.isANEpTrigger && this.plyr.currentTime !== 0 && this.plyr.duration !== 0) {
                Logger.log('Auto next episode triggered.')
                window.dispatchEvent(new Event('AutoNextEpisode'))
                this.autoNextEpisode()
                this.isANEpTrigger = true
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
    setupPlyr(videoElement: HTMLVideoElement) {
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
                points: this.getBookmarks(),
            },
            autoplay: this.settings.autoplay.enabled,
        })
        this.addShortcutsToPlyr()
        if (this.settings.resume.enabled) this.ResumeFeature()
        if (this.settings.bookmarks.enabled) this.BookmarkFeature()
        if (this.settings.eap) this.initAniSkip(videoElement)
        this.setupAutoHideCursor()
        this.handlePlayerID()
    }

    /**
     * Setup the bookmark feature
     */
    BookmarkFeature() {
        if (this.epID === undefined) return
        chrome.runtime.sendMessage({ type: 'getOpenBookmarks' }, (response) => {
            if (response) {
                for (let i = 0; i < response.length; i++) {
                    const path = new URL(response[i].epURL).pathname
                    const playMatch = path.match(/\/inda-play-(\d+)\//)
                    const dataMatch = path.match(/(-s\d+)?\/(\d+)\//)
                    const idFromUrl = playMatch
                        ? parseInt(playMatch[1], 10) + 100000
                        : dataMatch
                            ? parseInt(dataMatch[2], 10)
                            : -1

                    if (idFromUrl !== this.epID) {
                        Logger.log('No bookmark data found for the current URL.')
                        continue
                    }
                    let bookmark = Bookmarks.getBookmark(response[i].epID)
                    if (!bookmark) {
                        Logger.error('Error while getting the bookmark. (bookmark is null)')
                        return
                    }
                    if (Number(bookmark.epID) !== this.epID) {
                        Logger.error('Error while getting the bookmark. (epID mismatch)')
                        return
                    }
                    this.seekTo(Number(bookmark.epTime))
                    chrome.runtime.sendMessage(
                        { type: 'removeOpenBookmark', id: response[i].epID },
                        (removeResponse) => {
                            if (removeResponse) {
                                Logger.log('Bookmark opened.')
                                this.Toast('info', 'Könyvjelző megnyitva')
                            } else {
                                Logger.error('Error while opening the bookmark.')
                                this.Toast('error', 'Hiba történt', 'Hiba a könyvjelző megnyitása közben.',)
                            }
                        },
                    )
                }
            } else {
                Logger.error('Error while getting the bookmarks. (response is null)')
                this.Toast('error', 'Hiba történt', 'Hiba a könyvjelzők lekérdezése közben.')
            }
        })

        if (document.querySelector('.plyr__controls__item[data-plyr="bookmark"]')) {
            Logger.log('Bookmark button already exists.')
            return
        }

        const bookmarkButton = document.createElement('button')
        bookmarkButton.className = 'plyr__controls__item plyr__control'
        bookmarkButton.setAttribute('data-plyr', 'bookmark')
        bookmarkButton.setAttribute('role', 'button')
        bookmarkButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M192 64C156.7 64 128 92.7 128 128L128 544C128 555.5 134.2 566.2 144.2 571.8C154.2 577.4 166.5 577.3 176.4 571.4L320 485.3L463.5 571.4C473.4 577.3 485.7 577.5 495.7 571.8C505.7 566.1 512 555.5 512 544L512 128C512 92.7 483.3 64 448 64L192 64z"/></svg>
        <span class="plyr__tooltip">Könyvjelző hozzáadása</span>`
        bookmarkButton.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            if (this.plyr.currentTime <= 5 || this.plyr.currentTime >= this.plyr.duration - 5) {
                this.Toast('warning', 'Könyvjelző hozzáadása sikertelen', 'A könyvjelző hozzáadásához a videónak legalább 5 másodpercesnek kell lennie.')
                return
            }
            let currentTime = this.plyr.currentTime
            Bookmarks.addBookmark(
                Date.now(),
                this.animeTitle,
                this.epNum,
                `${this.animeTitle} - ${this.epNum}.rész, ${(Number(currentTime) % 3600 / 60).toFixed(0).padStart(2, "0")}:${(Number(currentTime) % 60).toFixed(0).padStart(2, "0")}`,
                currentTime,
                this.epID,
                this.animeID,
            )
            this.Toast('success', 'Könyvjelző hozzáadva', 'A könyvjelző sikeresen hozzáadva.')
        })
        const controls = document.querySelector('.plyr__menu') as HTMLElement
        if (controls) {
            controls.after(bookmarkButton)
        }
    }

    /**
     * Get the i18n translations for Plyr
     * @returns {Object} The i18n translations
     */
    getPlyrI18n(): object {
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
     * Get the bookmarks for the current episode
     * @returns {Array<Object>} The bookmarks
     */
    getBookmarks(): Array<{ time: number; label: string }> {
        let bmks: Array<{ time: number; label: string }> = []
        if (!this.settings.bookmarks.enabled) return bmks
        Bookmarks.bookmarks.forEach((bm) => {
            if (bm.epID !== this.epID) return
            bmks.push({
                time: bm.epTime,
                label: formatTime(bm.epTime),
            })
        })
        return bmks
    }

    /**
     * Download the video
     */
    download() {}

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
    addShortcutsToPlyr() {
        this.addDownloadButton()

        document.addEventListener('keydown', (event) => {
            this.handleShortcutEvent(event, this.settings.forwardSkip, this.skipForward.bind(this))
            this.handleShortcutEvent(
                event,
                this.settings.backwardSkip,
                this.skipBackward.bind(this),
            )
        })
        document.addEventListener('keyup', (event) => {
            this.handleShortcutEvent(event, this.settings.nextEpisode, () => {
                window.dispatchEvent(new Event('NextEpisode'))
                this.nextEpisode()
            })
            this.handleShortcutEvent(event, this.settings.previousEpisode, () => {
                window.dispatchEvent(new Event('PreviousEpisode'))
                this.previousEpisode()
            })
        })
    }

    /**
     * Handle a shortcut event
     * @param {KeyboardEvent} event - The keyboard event
     * @param {Object} shortcut - The shortcut configuration
     * @param {Function} action - The action to perform
     */
    handleShortcutEvent(
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
     * Check if a keyboard event matches a shortcut
     * @param {KeyboardEvent} event - The keyboard event
     * @param {Object} shortcut - The shortcut configuration
     * @returns {boolean} Whether the event matches the shortcut
     */
    checkShortcut(event: KeyboardEvent, shortcut: keyBind): boolean {
        return (
            event.ctrlKey === shortcut.ctrlKey &&
            event.altKey === shortcut.altKey &&
            event.shiftKey === shortcut.shiftKey &&
            event.key === shortcut.key
        )
    }

    /**
     * Setup the resume feature
     */
    ResumeFeature() {
        Resume.loadData()
            .then(() => {
                if (this.epID === undefined) return
                this.addResumeEventListeners()
                this.checkResume().then((response) => {
                    if (response) return
                    this.addCSS(
                        ` #MATweaks-resume-Toast { left: 50%; transform: translateX(-50%); background: var(--black-color); color: white; border-radius: 5px; z-index: 1000; transition: opacity 1s; justify-content: center; display: flex; position: absolute; width: auto; bottom: 4em; background: #00000069; align-items: center; padding: 3px; } #MATweaks-resume-button { border-radius: 5px; box-shadow: 3px 3px 3px 2px rgb(0 0 0 / 20%); cursor: pointer; color: var(--white-color); border: none; height: auto; line-height: 2; text-transform: uppercase; -webkit-border-radius: 5px; -moz-border-radius: 5px; transition: all 0.5s ease-in-out; -moz-transition: all 0.5s ease-in-out; -ms-transition: all 0.5s ease-in-out; -o-transition: all 0.5s ease-in-out; -webkit-transition: all 0.5s ease-in-out; text-shadow: 1px 1px #000; font-weight: 500; background: #ffffff26; font-size: x-small; margin: 3px; display: flex; align-items: center; justify-content: space-between; width: 120px; padding: 5px; } #MATweaks-resume-button:hover { background: #ffffff4d; }#MATweaks-resume-button svg { width: 16px; height: 16px; margin-left: 5px; }`,
                    )
                    let curResumeData = Resume.getDataByEpisodeId(this.epID)
                    if (!curResumeData) return
                    if (this.settings.resume.mode === 'auto') {
                        this.seekTo(curResumeData.epTime)
                        Logger.log('Resumed playback.')
                        this.Toast('success', 'Folytatás sikeres.')
                    } else if (this.settings.resume.mode === 'ask')
                        this.askUserToResume(curResumeData).then((response) => {
                            if (response) {
                                this.seekTo(curResumeData?.epTime)
                                Logger.log('Resumed playback.')
                                this.Toast('success', 'Folytatás sikeres.')
                            } else {
                                Logger.log('User chose not to resume.')
                            }
                        })
                    else {
                        Logger.error('Invalid resume mode: ' + this.settings.resume.mode)
                        this.Toast(
                            'error',
                            'Hiba történt',
                            'Érvénytelen folytatás mód: ' + this.settings.resume.mode,
                        )
                    }
                })
            })
            .catch((error) => {
                Logger.error('Error while loading resume data: ' + error)
                this.Toast('error', 'Hiba történt', 'Hiba a folytatás adatok betöltése közben.')
            })
    }

    /**
     * Check if the current episode has a resume data
     * @returns {Promise<boolean>} - If the episode has a resume data
     */
    checkResume(): Promise<boolean> {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'getOpenResume' }, (response) => {
                if (response) {
                    for (let i = 0; i < response.length; i++) {
                        const path = new URL(response[i].epURL).pathname
                        const playMatch = path.match(/\/inda-play-(\d+)\//)
                        const dataMatch = path.match(/(-s\d+)?\/(\d+)\//)
                        const idFromUrl = playMatch
                            ? parseInt(playMatch[1], 10) + 100000
                            : dataMatch
                              ? parseInt(dataMatch[2], 10)
                              : -1

                        if (idFromUrl !== this.epID) {
                            Logger.log('No resume data found for the current URL.')
                            continue
                        }
                        this.seekTo(response[i].epTime)
                        chrome.runtime.sendMessage(
                            {
                                type: 'removeOpenResume',
                                id: response[i].epID,
                            },
                            (r) => {
                                if (r) {
                                    Logger.log('Resumed playback.')
                                    Toast.info('Folytatás sikeres.')
                                } else {
                                    Logger.error('Error while resuming playback.')
                                    Toast.error('Hiba történt a folytatás közben.')
                                }
                            },
                        )
                        resolve(true)
                    }
                    resolve(false)
                } else {
                    Logger.error('Error while getting the resume data.')
                    Toast.error('Hiba történt az epizód adatai lekérdezése közben.')
                    resolve(false)
                }
            })
        })
    }

    /**
     * Seek to a specific time in the video
     * @param {number} time - The time to seek to
     */
    seekTo(time: number) {
        const video = document.querySelector('video') as HTMLVideoElement
        let target: Plyr | HTMLVideoElement = this.plyr || video
        const seekHandler = () => {
            if (target.duration > 0) {
                target.currentTime = time
                video.removeEventListener('loadeddata', seekHandler)
                video.removeEventListener('playing', seekHandler)
            }
        }
        if (target instanceof HTMLVideoElement && target.readyState >= 2) {
            target.currentTime = time
        } else if (target.duration > 0) {
            target.currentTime = time
        } else {
            video.addEventListener('loadeddata', seekHandler)
            video.addEventListener('playing', seekHandler)
        }
    }

    /**
     * Ask the user if they want to resume playback
     * @param {Object} data - The resume data
     * @returns {Promise<boolean>} Whether the user wants to resume
     */
    askUserToResume(data: Episode): Promise<boolean> {
        const div = document.createElement('div')
        div.id = 'MATweaks-resume-Toast'
        const button = document.createElement('button')
        button.id = 'MATweaks-resume-button'
        button.innerHTML = `Folytatás: ${formatTime(data.epTime)} <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="#ffffff"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>`
        div.appendChild(button)
        ;(document.querySelector('.plyr') as HTMLElement).appendChild(div)

        return new Promise((resolve) => {
            const cleanupAndResolve = (shouldResume: boolean) => {
                div.style.transition = 'opacity 0.5s'
                div.style.opacity = '0'
                setTimeout(() => {
                    div.remove()
                }, 500)
                resolve(shouldResume)
            }

            button.addEventListener('click', () => cleanupAndResolve(true))
            setTimeout(() => cleanupAndResolve(false), 10000)
        })
    }

    /**
     * Update the resume data
     */
    updateResumeData() {
        Resume.updateData(
            this.epID,
            this.plyr.currentTime,
            this.animeID,
            this.animeTitle,
            window.location.href.startsWith('https://magyaranime.eu')
                ? window.location.href
                : `https://magyaranime.eu/resz/${this.epID}/`,
            this.epNum,
            Date.now(),
        )
        Logger.log('Resume data updated.')
    }

    /**
     * Add event listeners for the resume feature
     */
    addResumeEventListeners() {
        let updateData = () => {
            if (
                this.plyr.duration <= 10 || // Makes sure the video is loaded
                this.plyr.currentTime <= 5 ||
                this.plyr.currentTime >= this.plyr.duration - 5 ||
                this.isANEpTrigger
            )
                return
            let curResumeData = Resume.getDataByEpisodeId(this.epID)
            if (curResumeData && Math.abs(this.plyr.currentTime - curResumeData.epTime) > 5) {
                this.updateResumeData()
            } else if (!curResumeData) {
                this.updateResumeData()
            }
        }
        let removeData = () => {
            this.isANEpTrigger = true
            Resume.removeData(this.epID)
                .then(() => {
                    Logger.log('Removed resume data.')
                })
                .catch((e) => {
                    Logger.error('Error while removing resume data: ' + e)
                    this.Toast(
                        'error',
                        'Hiba történt',
                        'Hiba a folytatás adatok eltávolítása közben.',
                    )
                })
        }
        let video = document.querySelector(this.selector) as HTMLVideoElement
        video.addEventListener('pause', updateData)
        video.addEventListener('ended', removeData)
        window.addEventListener('beforeunload', updateData)
        window.addEventListener('unload', updateData)
        document.addEventListener('visibilitychange', updateData)
    }

    private async initAniSkip(videoElement: HTMLVideoElement) {
        if (!this.malId || this.malId <= 0) {
            Logger.error('AniSkip disabled (missing malId).')
            return
        }

        Logger.log(`AniSkip: initializing (malId=${this.malId}, ep=${this.epNum})`)
        this.injectAniSkipCss()

        const duration = videoElement.duration || this.plyr?.duration || 0

        if (!this.aniSkip) this.aniSkip = new AniSkip()

        let resp: any
        try {
            resp = await this.aniSkip.getMalSkipTimes(this.malId, this.epNum, {
                types: ['op', 'ed'],
                episodeLength: duration,
            })
        } catch (err: any) {
            if (err?.message?.includes('404')) {
                Logger.warn('AniSkip: no skip segments found (404).')
                return
            }
            Logger.error('AniSkip: failed to fetch skip times. Error: ' + err)
            return
        }

        if (!resp || !resp.results || resp.results.length === 0) {
            Logger.warn('AniSkip: OP/ED segments array empty after processing.')
            return
        }

        Logger.log(`AniSkip: ${resp.results.length} segment(s) returned.`)

        // Ensure internal state objects exist
        this.aniSkipSegments = this.aniSkipSegments || { op: undefined, ed: undefined }
        this.aniSkipCycleShown = this.aniSkipCycleShown || { op: false, ed: false }
        this.aniSkipTimers = this.aniSkipTimers || { op: undefined, ed: undefined }

        type SegmentType = 'op' | 'ed'
        type Interval = { startTime: number; endTime: number }

        resp.results.forEach((r: any) => {
            const type = r?.skipType as SegmentType
            if (type !== 'op' && type !== 'ed') {
                Logger.log(`AniSkip: ignoring non OP/ED segment type=${r?.skipType}`)
                return
            }
            const interval: Interval | undefined = r?.interval
            if (!interval) {
                Logger.warn('AniSkip: invalid interval data; skipping.')
                return
            }

            this.aniSkipSegments[type] = interval
            this.aniSkipCycleShown[type] = false

            Logger.log(
                `AniSkip: registered ${type.toUpperCase()} segment start=${interval.startTime.toFixed(2)} (${formatTime(interval.startTime)}) end=${interval.endTime.toFixed(2)} (${formatTime(interval.endTime)})`,
            )

            if (document.querySelector(`.mat-aniskip-button[data-segment="${type}"]`)) {
                Logger.log(`AniSkip: button for ${type} already exists; skipping create.`)
                return
            }

            const overlay = this.ensureAniSkipOverlay()
            if (!overlay) {
                Logger.error('AniSkip: overlay container missing, cannot create button.')
                return
            }

            const btn = document.createElement('button')
            const human = type === 'op' ? 'OP átugrása' : 'ED átugrása'
            btn.className = 'mat-aniskip-button'
            btn.setAttribute('data-segment', type)
            btn.innerHTML = `
            <svg viewBox="0 0 384 512" aria-hidden="true" focusable="false" fill="currentColor">
              <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/>
            </svg>
            <span>${human}</span>
        `

            btn.addEventListener('click', (e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!this.plyr) return
                Logger.log(
                    `AniSkip: user clicked ${type.toUpperCase()} skip -> jumping to ${interval.endTime.toFixed(2)}`,
                )
                this.plyr.currentTime = interval.endTime
                this.hideAniSkipButton(type)
                this.Toast('info', human, '', { duration: 600 })
            })

            overlay.appendChild(btn)
            Logger.log(`AniSkip: button created for ${type.toUpperCase()}`)
        })

        // Attach timeupdate handler once
        const boundKey = 'data-aniskip-timeupdate-bound'
        if (!videoElement.hasAttribute(boundKey)) {
            videoElement.addEventListener('timeupdate', () => this.handleAniSkipTime())
            videoElement.setAttribute(boundKey, '1')
            Logger.log('AniSkip: timeupdate listener attached.')
        }
    }

    private showAniSkipButton(type: 'op' | 'ed') {
        const btn = document.querySelector(
            `.mat-aniskip-button[data-segment="${type}"]`,
        ) as HTMLElement | null
        if (!btn) {
            Logger.warn(`AniSkip: show requested but button not found for ${type}`)
            return
        }
        btn.style.display = 'flex'
        btn.style.opacity = '1'
        Logger.log(`AniSkip: displaying ${type.toUpperCase()} skip button (will auto-hide).`)
        if (this.aniSkipTimers[type]) window.clearTimeout(this.aniSkipTimers[type] as number)
        this.aniSkipTimers[type] = window.setTimeout(() => this.hideAniSkipButton(type), 5000)
    }

    private hideAniSkipButton(type: 'op' | 'ed') {
        const btn = document.querySelector(
            `.mat-aniskip-button[data-segment="${type}"]`,
        ) as HTMLElement | null
        if (!btn) return
        if (btn.style.display !== 'none') {
            Logger.log(`AniSkip: hiding ${type.toUpperCase()} skip button.`)
        }
        btn.style.opacity = '0'
        btn.style.display = 'none'
    }

    private handleAniSkipTime() {
        if (!this.plyr) return
        const t = this.plyr.currentTime
        ;(['op', 'ed'] as const).forEach((seg) => {
            const interval = this.aniSkipSegments[seg]
            if (!interval) return
            if (t < interval.startTime - 1.0) {
                if (this.aniSkipCycleShown[seg]) {
                    Logger.log(
                        `AniSkip: reset display cycle for ${seg.toUpperCase()} (current=${t.toFixed(
                            2,
                        )} start=${interval.startTime.toFixed(2)})`,
                    )
                }
                this.aniSkipCycleShown[seg] = false
            }
            if (
                !this.aniSkipCycleShown[seg] &&
                t >= interval.startTime &&
                t <= interval.startTime + 0.8
            ) {
                Logger.log(
                    `AniSkip: trigger show window for ${seg.toUpperCase()} at ${t.toFixed(
                        2,
                    )} (segment start=${interval.startTime.toFixed(2)})`,
                )
                this.aniSkipCycleShown[seg] = true
                this.showAniSkipButton(seg)
            }
        })
    }

    private ensureAniSkipOverlay(): HTMLElement | null {
        const plyrContainer = document.querySelector('.plyr') as HTMLElement
        if (!plyrContainer) {
            Logger.warn('AniSkip: cannot find .plyr container for overlay creation.')
            return null
        }
        let overlay = document.getElementById('MATweaks-aniskip-overlay') as HTMLElement | null
        if (!overlay) {
            overlay = document.createElement('div')
            overlay.id = 'MATweaks-aniskip-overlay'
            plyrContainer.appendChild(overlay)
            Logger.log('AniSkip: overlay container created.')
        }
        return overlay
    }

    private injectAniSkipCss() {
        if (document.getElementById('MATweaks-aniskip-style')) {
            Logger.log('AniSkip: CSS already injected.')
            return
        }
        const style = document.createElement('style')
        style.id = 'MATweaks-aniskip-style'
        style.textContent = `
        #MATweaks-aniskip-overlay { position:absolute; right:1rem; bottom:4.2rem; display:flex; flex-direction:column; gap:6px; z-index:1000; align-items:flex-end; pointer-events:none; }
        #MATweaks-aniskip-overlay .mat-aniskip-button { pointer-events:auto; border-radius:8px; cursor:pointer; border:none; padding:6px 12px 6px 10px; font-size:12px; line-height:1.2; display:none; align-items:center; gap:6px; color:#fff; background:rgba(0,0,0,.55); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); font-weight:500; letter-spacing:.25px; box-shadow:0 4px 12px -2px rgba(0,0,0,.4); transition:background .25s, transform .25s, opacity .35s; }
        #MATweaks-aniskip-overlay .mat-aniskip-button:hover { background:rgba(0,0,0,.7); }
        #MATweaks-aniskip-overlay .mat-aniskip-button:active { transform:scale(.96); }
        #MATweaks-aniskip-overlay .mat-aniskip-button svg { width:16px; height:16px; }
        @media (max-width: 700px) {
          #MATweaks-aniskip-overlay { bottom:4.8rem; }
          #MATweaks-aniskip-overlay .mat-aniskip-button { font-size:11px; padding:5px 10px; }
        }
    `
        document.head.appendChild(style)
        Logger.log('AniSkip: CSS injected.')
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

        const onActivity = () => {
            if (!isFsActive()) return
            showCursor()
            scheduleHide()
        }

        // Pointer/touch activity on the container
        ['mousemove', 'mousedown', 'mouseup', 'wheel', 'touchstart', 'touchmove', 'pointermove']
                .forEach(evt => container.addEventListener(evt, onActivity, { passive: true }))

        // Keyboard activity anywhere should show cursor if fullscreen is active
        document.addEventListener('keydown', onActivity, { passive: true })

        // Fullscreen changes
        const onFsChange = () => {
            if (isFsActive()) {
                showCursor()
                scheduleHide()
            } else {
                showCursor()
                if (this.cursorAutoHideTimer) window.clearTimeout(this.cursorAutoHideTimer)
            }
        }
        document.addEventListener('fullscreenchange', onFsChange)

        // Start cycle if we are already in fullscreen
        if (isFsActive()) {
            showCursor()
            scheduleHide()
        }
    }

    private handlePlayerID() {
        if (!this.playerID || this.playerID === 0) return
        // TODO: implement playerID handling
        Logger.warn("Unimplemented: handlePlayerID()");
        return
    }
}
