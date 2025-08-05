import BasePlayer from "./BasePlayer";
import Logger from "../Logger";
import MAT from "../MAT";
import {SettingsV019} from "../global";

/**
 * MegaPlayer class extends BasePlayer to provide custom functionality for Mega.nz videos.
 */
class MegaPlayer extends BasePlayer {
    /**
     * Constructs a new MegaPlayer instance.
     * @param {string} selector - The CSS selector for the player container.
     * @param {Object} [settings=MAT.settings] - The player settings.
     * @param {number} epID - The episode ID.
     * @param {number} animeID - The anime ID.
     * @param {string} animeTitle - The title of the anime.
     * @param {number} epNum - The episode number.
     */
    constructor(
        selector: string,
        settings: SettingsV019 = MAT.settings,
        epID: number,
        animeID: number,
        animeTitle: string,
        epNum: number,
    ) {
        super(selector, [], false, settings, epID, animeID, animeTitle, epNum);
        this.addEventListeners();
    }

    /**
     * Replaces the current player with a new one.
     */
    replace() {
        const load = setInterval(() => {
            let playbtn = document.querySelector("div.play-video-button");
            if (!playbtn) return;
            (playbtn as  HTMLButtonElement).click();
            const video = document.querySelector("video");
            if (!video) {
                Logger.error("[Mega.nz] Video not found");
                window.dispatchEvent(new Event("PlayerReplaceFailed"));
                window.parent.postMessage({type: MAT.__ACTIONS__.IFRAME.PLAYER_REPLACE_FAILED}, "*");
                return;
            }
            if (!video.src) {
                Logger.error("[Mega.nz] Video source not found");
                window.dispatchEvent(new Event("PlayerReplaceFailed"));
                window.parent.postMessage({type: MAT.__ACTIONS__.IFRAME.PLAYER_REPLACE_FAILED}, "*");
                return;
            }
            this.removeElements();
            this.addCSS(".sharefile-block, .dropdown, .viewer-top-bl, .play-video-button, .viewer-pending, .logo-container, .viewer-vad-control, .video-progress-bar, .viewer-bottom-bl{display: none !important;}.transfer-limitation-block, .file-removed-block  {z-index: 1001 !important;}");
            this.setupPlyr(video);
            this.loadCustomCss();
            this.stylePlyr();
            this.setupAutoNextEpisode(video);
            this.adjustAspectRatio(video)
            window.dispatchEvent(new Event("PlayerReplaced"));
            Logger.success("Player replaced successfully.");
            window.parent.postMessage({type: MAT.__ACTIONS__.IFRAME.PLAYER_REPLACED}, "*");
            clearInterval(load);
        }, 10);
    }

    /**
     * Automatically plays the next episode if available.
     */
    autoNextEpisode() {
        window.parent.postMessage({type: MAT.__ACTIONS__.IFRAME.AUTO_NEXT_EPISODE}, "*");
    }

    /**
     * Plays the next episode.
     */
    nextEpisode() {
        window.parent.postMessage({type: MAT.__ACTIONS__.IFRAME.NEXT_EPISODE}, "*");
    }

    /**
     * Plays the previous episode.
     */
    previousEpisode() {
        window.parent.postMessage({type: MAT.__ACTIONS__.IFRAME.PREVIOUS_EPISODE}, "*");
    }

    /**
     * Styles the Plyr player.
     */
    stylePlyr() {
        const plyr = document.querySelector(".plyr") as HTMLDivElement
        if (!plyr) Logger.error("Plyr element not found");
        plyr.style.margin = "0";
        plyr.style.zIndex = "1000";
        // Mega's player messes up the plyr design, so we need to override some styles
        this.addCSS(".plyr__control--overlaid {background: #00b2ff;background: var(--plyr-video-control-background-hover, var(--plyr-color-main, var(--plyr-color-main, #00b2ff))) !important;}");
        Logger.log("Plyr styled successfully");
    }

    /**
     * Removes unnecessary elements from the DOM.
     */
    removeElements() {
        ["sharefile-block", "dropdown", "viewer-top-bl", "viewer-pending", "logo-container", "viewer-vad-control", "video-progress-bar", "viewer-bottom-bl"]
            .forEach(cls => document.querySelector(`.${cls}`)?.remove());
    }

    /**
     * Adds event listeners for player controls.
     */
    addEventListeners() {
        window.addEventListener("message", (event) => {
            switch (event.data.type) {
                case MAT.__ACTIONS__.IFRAME.TOGGLE_PLAY:
                    let btn = document.querySelector(".plyr__controls__item[data-plyr='play']") as HTMLButtonElement;
                    if (!btn) this.plyr.togglePlay();
                    btn.focus();
                    btn.click();
                    btn.blur();
                    break;
                case MAT.__ACTIONS__.IFRAME.VOL_UP:
                    this.plyr.increaseVolume(0.1);
                    break;
                case MAT.__ACTIONS__.IFRAME.VOL_DOWN:
                    this.plyr.increaseVolume(-0.1);
                    break;
                case MAT.__ACTIONS__.IFRAME.TOGGLE_MUTE:
                    this.plyr.muted = !this.plyr.muted;
                    break;
                case MAT.__ACTIONS__.IFRAME.TOGGLE_FULLSCREEN:
                    let f = document.querySelector(".plyr__controls__item[data-plyr='fullscreen']") as HTMLButtonElement;
                    if (f) this.plyr.fullscreen.toggle();
                    f.focus();
                    f.click();
                    f.blur();
                    break;
                case MAT.__ACTIONS__.IFRAME.SEEK:
                    this.seekTo(this.plyr.currentTime + Number(event.data.time));
                    break;
                case MAT.__ACTIONS__.IFRAME.BACKWARD_SKIP:
                    this.skipBackward();
                    break;
                case MAT.__ACTIONS__.IFRAME.FORWARD_SKIP:
                    this.skipForward();
                    break;
                case MAT.__ACTIONS__.IFRAME.GET_CURRENT_TIME:
                    window.parent.postMessage({
                        type: MAT.__ACTIONS__.IFRAME.CURRENT_TIME,
                        currentTime: this.plyr.currentTime
                    }, "*");
                    break;
                case MAT.__ACTIONS__.IFRAME.SEEK_PERCENTAGE:
                    this.seekTo((Math.max(0, Math.min(100, event.data.percentage)) / 100) * this.plyr.duration);
                    break;
                default:
                    break;
            }
            return true;
        });
    }
}

export default MegaPlayer;
