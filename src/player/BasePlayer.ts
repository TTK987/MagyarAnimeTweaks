import Plyr from 'plyr'
import Bookmarks from '../Bookmark'
import Resume, {Episode} from '../Resume'
import Logger from '../Logger'
import MAT from '../MAT'
import Toast from '../Toast'
import { SettingsV019, EpisodeVideoData, keyBind } from '../global'
import 'plyr/dist/plyr.css'
import {formatTime} from "../lib/time-utils";

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
    private skipForwardCooldown: number | undefined
    private skipBackwardCooldown: number | undefined
    private isANEpTrigger: boolean
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
    ) {
        this.selector = selector
        this.epData = qualityData
        // @ts-ignore
        this.plyr = undefined
        this.isDownloadable = isDownloadable
        this.settings = settings
        this.epID = epID
        this.animeTitle = animeTitle
        this.epNum = epNum
        this.animeID = animeID
        this.isANEpTrigger = false
        Logger.log(JSON.stringify({
            selector: this.selector,
            qualityData: this.epData,
            isDownloadable: this.isDownloadable,
            settings: this.settings,
            epID: this.epID,
            animeID: this.animeID,
            animeTitle: this.animeTitle,
            epNum: this.epNum,
        }))
    }

    /**
     * Currently not used. An attempt to load a new video without reloading the plyr instance.
     */
    loadNewVideo( data: EpisodeVideoData[],
                  epID: number,
                  epNum: number
    ) {
        if (data.length === 0) {
            Logger.error('No video data provided.')
            return
        }
        this.epData = data
        this.epID = epID
        this.epNum = epNum
        this.isANEpTrigger = false

        this.plyr.destroy(()=> {},true)

        this.replace()

        this.BookmarkFeature()
        this.ResumeFeature()
    }


    /**
     * Go to the previous episode
     */
    previousEpisode() {}

    /**
     * Go to the next episode
     */
    nextEpisode() {

    }

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
        options: {
            position?: string
            duration?: number
            id?: string
        } = {},
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
            let playerElement = document.querySelector(this.selector)
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
            const width = videoElement.videoWidth;
            const height = videoElement.videoHeight;
            const plyrContainer = videoElement.closest('.plyr') as HTMLElement;
            if (plyrContainer) {
                plyrContainer.style.aspectRatio = '16 / 9';
                plyrContainer.style.maxWidth = '';
                plyrContainer.style.width = '100%';
                plyrContainer.style.height = '';
                if (width && height && Math.abs(width / height - 4/3) < 0.05) {
                    videoElement.style.aspectRatio = '4 / 3';
                    videoElement.style.margin = '0 auto';
                    plyrContainer.style.display = 'flex';
                    plyrContainer.style.alignItems = 'center';
                    plyrContainer.style.justifyContent = 'center';
                } else {
                    videoElement.style.aspectRatio = '16 / 9';
                    videoElement.style.margin = '0';
                    plyrContainer.style.display = 'block';
                    plyrContainer.style.alignItems = '';
                    plyrContainer.style.justifyContent = '';
                }
            }
        });
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
                container: "#MATweaks-player-wrapper"
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
                onChange: (quality) => this.changeQuality(quality, videoElement),
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
        this.plyr.currentTime =
            Number(this.plyr.currentTime) + Number(this.settings.forwardSkip.time)
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
        this.plyr.currentTime =
            Number(this.plyr.currentTime) - Number(this.settings.backwardSkip.time)
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
            this.handleShortcutEvent(event, this.settings.backwardSkip, this.skipBackward.bind(this))
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
        Resume.loadData().then(() => {
            if (this.epID === undefined) return
            this.addResumeEventListeners()
            this.checkResume().then((response) => {
                if (response) return
                this.addCSS(` #MATweaks-resume-Toast { left: 50%; transform: translateX(-50%); background: var(--black-color); color: white; border-radius: 5px; z-index: 1000; transition: opacity 1s; justify-content: center; display: flex; position: absolute; width: auto; bottom: 4em; background: #00000069; align-items: center; padding: 3px; } #MATweaks-resume-button { border-radius: 5px; box-shadow: 3px 3px 3px 2px rgb(0 0 0 / 20%); cursor: pointer; color: var(--white-color); border: none; height: auto; line-height: 2; text-transform: uppercase; -webkit-border-radius: 5px; -moz-border-radius: 5px; transition: all 0.5s ease-in-out; -moz-transition: all 0.5s ease-in-out; -ms-transition: all 0.5s ease-in-out; -o-transition: all 0.5s ease-in-out; -webkit-transition: all 0.5s ease-in-out; text-shadow: 1px 1px #000; font-weight: 500; background: #ffffff26; font-size: x-small; margin: 3px; display: flex; align-items: center; justify-content: space-between; width: 120px; padding: 5px; } #MATweaks-resume-button:hover { background: #ffffff4d; }#MATweaks-resume-button svg { width: 16px; height: 16px; margin-left: 5px; }`)
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
        const video = document.querySelector("video") as HTMLVideoElement
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
            window.location.href.startsWith('https://magyaranime.eu') ? window.location.href : `https://magyaranime.eu/resz/${this.epID}/`,
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
        window.addEventListener('MATweaksAutoNextEpisode', removeData)
        document.addEventListener('visibilitychange', updateData)
    }
}
