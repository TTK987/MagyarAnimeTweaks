import BasePlayer from "./BasePlayer";
import {SettingsV019, EpisodeVideoData} from "../global";

class NativePlayer extends BasePlayer {
    curQuality: EpisodeVideoData | null

    /**
     * Create a new NativePlayer instance, which is used in the main player
     * @param {String} selector - The selector for the video element
     * @param {{quality: number, url: string}[]} qualityData - The quality data for the video
     * @param {Boolean} isDownloadable - Whether the video is downloadable
     * @param {Object} settings - The settings object
     * @param {Number} epID - The ID of the episode
     * @param {Number} animeID - The ID of the anime
     * @param {String} animeTitle - The title of the anime
     * @param {Number} epNum - The episode number
     * @param {Number} malId - The MyAnimeList ID of the anime
     */
    constructor(
        selector: string,
        qualityData: EpisodeVideoData[],
        isDownloadable: boolean = true,
        settings: SettingsV019,
        epID: number,
        animeID: number,
        animeTitle: string,
        epNum: number,
        malId: number
    ) {
        super(selector, qualityData, isDownloadable, settings, epID, animeID, animeTitle, epNum, malId);
        this.curQuality = null
    }

    changeQuality(quality: number, videoElement: HTMLVideoElement) {
        let currentTime = videoElement.currentTime;
        const selectedQuality = this.epData.find(data => data.quality === quality);
        if (selectedQuality) {
            this.curQuality = selectedQuality;
            videoElement.src = selectedQuality.url;
        }
        videoElement.currentTime = currentTime;
    }
}

export default NativePlayer;
