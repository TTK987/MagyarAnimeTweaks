import MAT from '../MAT'
import {EpisodeVideoData, FansubData} from "../global";

class IFramePlayerComm {
    private isIFrameLoaded: boolean
    public IFrame: Window | null | undefined
    private messageListener: (event: MessageEvent) => void
    private activeResponseHandlers: Set<(event: MessageEvent) => void>

    /**
     * The IFramePlayerComm class is responsible for handling communication with the IFrame player instance.
     * It uses the postMessage API to send and receive messages between the IFrame and the parent window.
     */
    constructor() {
        this.IFrame = document.querySelector('iframe')?.contentWindow
        this.isIFrameLoaded = true
        this.activeResponseHandlers = new Set()

        // Bind the message listener to maintain proper 'this' context
        this.messageListener = this.MSGListeners.bind(this)
        this.addMSGListeners()
    }

    /**
     * Adds message event listeners to handle communication with the IFrame.
     */
    addMSGListeners() {
        window.addEventListener('message', this.messageListener)
    }

    removeMSGListeners() {
        window.removeEventListener('message', this.messageListener)
        // Clean up any active response handlers
        this.activeResponseHandlers.forEach(handler => {
            window.removeEventListener('message', handler)
        })
        this.activeResponseHandlers.clear()
    }

    private MSGListeners(event: MessageEvent) {
        switch (event.data.type) {
            case MAT.__ACTIONS__.IFRAME.FRAME_LOADED:
                this.isIFrameLoaded = true
                this.onFrameLoaded()
                break
            case MAT.__ACTIONS__.IFRAME.AUTO_NEXT_EPISODE:
                this.autoNextEpisode()
                break
            case MAT.__ACTIONS__.IFRAME.NEXT_EPISODE:
                this.nextEpisode()
                break
            case MAT.__ACTIONS__.IFRAME.PREVIOUS_EPISODE:
                this.previousEpisode()
                break
            case MAT.__ACTIONS__.IFRAME.PLAYER_READY:
                this.onPlayerReady()
                break
            case MAT.__ACTIONS__.IFRAME.TOAST:
                this.onToast(
                    event.data.message.type,
                    event.data.message.title,
                    event.data.message.description,
                    event.data.message.options || {},
                )
                break
            case MAT.__ACTIONS__.IFRAME.PLAYER_REPLACED:
                this.onPlayerReplaced()
                break
            case MAT.__ACTIONS__.IFRAME.PLAYER_REPLACE_FAILED:
                this.onPlayerReplaceFailed()
                break
            default:
                break
        }
    }

    /**
     * Handler for when the IFrame is loaded.
     */
    onFrameLoaded() {
    }

    /**
     * Handler for auto-playing the next episode.
     */
    autoNextEpisode() {
    }

    /**
     * Handler for playing the next episode.
     */
    nextEpisode() {
    }

    /**
     * Handler for playing the previous episode.
     */
    previousEpisode() {
    }

    /**
     * Handler for when the player is ready.
     */
    onPlayerReady() {
    }

    /**
     * Handler for displaying a popup message.
     * @param {"success" | "info" | "warning" | "error" | "default"} type - The type of the message.
     * @param {string} title - The title of the message.
     * @param {string} [description] - The description of the message.
     * @param {Object} [options={}] - Additional options for the popup.
     */
    onToast(
        type: 'success' | 'info' | 'warning' | 'error' | 'default' = 'default',
        title: string,
        description?: string,
        options: {
            position?: string
            duration?: number
            id?: string
        } = {},
    ) {
    }

    /**
     * Handler for when the player is replaced.
     */
    onPlayerReplaced() {
    }

    /**
     * Handler for when the player replacement fails.
     */
    onPlayerReplaceFailed() {
    }

    /**
     * Gets the current playback time of the IFrame player.
     * @returns {Promise<number>} The current playback time in seconds.
     */
    getCurrentTime() {
        return new Promise((resolve) => {
            this.sendAction(
                MAT.__ACTIONS__.IFRAME.GET_CURRENT_TIME,
                {},
                (event: MessageEvent) => {
                    if (event.data.type === MAT.__ACTIONS__.IFRAME.CURRENT_TIME) {
                        resolve(event.data.currentTime)
                    }
                },
            )
        })
    }

    /**
     * Gets the source URL of the IFrame player.
     * @returns {Promise<EpisodeVideoData[]>} A promise that resolves with the video data.
     */
    getVideoData(): Promise<EpisodeVideoData[]> {
        return new Promise((resolve, reject) => {
            this.sendAction(MAT.__ACTIONS__.GET_SOURCE_URL, {}, (event: MessageEvent) => {
                if (event.data.type === MAT.__ACTIONS__.SOURCE_URL) {
                    resolve(event.data.data)
                } else if (event.data.type === MAT.__ACTIONS__.INDA_NO_VIDEO) {
                    reject("No video available")
                }
            })
        })
    }

    /**
     * Replaces the player with a new instance.
     * @param {string} title - The title of the episode.
     * @param {number} episodeNumber - The episode number.
     * @param {string} episodeId - The episode ID.
     * @param animeID
     * @param {string} fansub - The fansub group.
     */
    replacePlayer(title: string, episodeNumber: number, episodeId: number, animeID: number, fansub: FansubData[]) {
        this.sendAction(MAT.__ACTIONS__.IFRAME.REPLACE_PLAYER, {
            animeTitle: title,
            epNum: episodeNumber,
            epID: episodeId,
            animeID: animeID,
            fansub: JSON.stringify(fansub),
        })
    }

    /**
     * Toggles the play/pause state of the IFrame player.
     */
    togglePlay() {
        this.sendAction(MAT.__ACTIONS__.IFRAME.TOGGLE_PLAY)
    }

    /**
     * Increases the volume of the IFrame player.
     */
    volUp() {
        this.sendAction(MAT.__ACTIONS__.IFRAME.VOL_UP)
    }

    /**
     * Decreases the volume of the IFrame player.
     */
    volDown() {
        this.sendAction(MAT.__ACTIONS__.IFRAME.VOL_DOWN)
    }

    /**
     * Toggles the mute state of the IFrame player.
     */
    toggleMute() {
        this.sendAction(MAT.__ACTIONS__.IFRAME.TOGGLE_MUTE)
    }

    /**
     * Toggles the fullscreen state of the IFrame player.
     */
    toggleFullscreen() {
        this.sendAction(MAT.__ACTIONS__.IFRAME.TOGGLE_FULLSCREEN)
    }

    /**
     * Seeks to a specific time in the IFrame player.
     * @param {number} time - The time to seek to in seconds.
     */
    seek(time: number) {
        this.sendAction(MAT.__ACTIONS__.IFRAME.SEEK, {time})
    }

    /**
     * Seeks to a specific percentage of the IFrame player's duration.
     * @param {number} percentage - The percentage to seek to.
     */
    seekPercentage(percentage: number) {
        this.sendAction(MAT.__ACTIONS__.IFRAME.SEEK_PERCENTAGE, {percentage})
    }

    /**
     * Skips backward in the IFrame player.
     */
    skipBackward() {
        this.sendAction(MAT.__ACTIONS__.IFRAME.BACKWARD_SKIP)
    }

    /**
     * Skips forward in the IFrame player.
     */
    skipForward() {
        this.sendAction(MAT.__ACTIONS__.IFRAME.FORWARD_SKIP)
    }

    /**
     * Sends an action to the IFrame player.
     * @param {string} action - The action to send.
     * @param {Object} [data={}] - The data to send with the action.
     * @param {Function} [responseHandler=null] - The handler for the response.
     */
    private sendAction(action: string, data = {}, responseHandler: Function | null = null) {
        if (responseHandler) {
            const handler = (event: MessageEvent) => {
                const result = responseHandler(event)
                if (result !== undefined) {
                    window.removeEventListener('message', handler)
                    this.activeResponseHandlers.delete(handler)
                    return result
                }
            }
            this.activeResponseHandlers.add(handler)
            window.addEventListener('message', handler)

            // Add timeout to clean up handler if no response is received
            setTimeout(() => {
                if (this.activeResponseHandlers.has(handler)) {
                    window.removeEventListener('message', handler)
                    this.activeResponseHandlers.delete(handler)
                }
            }, 10000) // 10 second timeout
        }
        this.IFrame?.postMessage({type: action, ...data}, '*')
    }

    /**
     * Delays execution until the IFrame is loaded.
     * @returns {Promise<void>} A promise that resolves when the IFrame is loaded.
     * @deprecated
     */
    private delayUntilIFrameLoaded(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (this.isIFrameLoaded) {
                resolve()
            } else {
                const interval = setInterval(() => {
                    if (this.isIFrameLoaded) {
                        clearInterval(interval)
                        resolve()
                    }
                }, 100)
            }
        })
    }
}

export default IFramePlayerComm
