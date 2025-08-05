import Logger from './Logger'

class Resume {
    animes: Anime[]
    /**
     * Create a new Episode class
     * @since v0.1.8
     * @constructor Episode - Create a new Episode class
     * @property {Array<Anime>} animes - The animes with resume data
     */
    constructor() {
        this.animes = []
    }

    /**
     * Add resume data
     * @param epID
     * @param epTime
     * @param animeID
     * @param animeTitle
     * @param epURL
     * @param epNum
     * @param {Number} currentTime - The current time in real life (in milliseconds)
     * @since v0.1.8
     */
    addData(
        epID: number,
        epTime: number,
        animeID: number,
        animeTitle: string,
        epURL: string,
        epNum: number,
        currentTime: number,
    ): void {
        this.loadData().then(() => {
            let anime = this.animes.find(
                (anime) => Number(anime.animeID) === Number(animeID),
            )
            if (!anime) {
                anime = new Anime(Number(animeID), animeTitle)
                this.animes.push(anime)
            }
            anime.addEpisode({
                epID: Number(epID),
                epTime: Number(epTime),
                epURL: epURL,
                epNum: Number(epNum),
                updateTime: Number(currentTime),
            })
            this.saveData()
        })
    }


    removeAnime(animeID: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const animeIndex = this.animes.findIndex(
                (anime) => Number(anime.animeID) === Number(animeID),
            )
            if (animeIndex !== -1) {
                this.animes.splice(animeIndex, 1)
                this.saveData()
                resolve(true)
            } else {
                reject(new Error('Anime not found'))
            }
        })
    }

    /**
     * Remove resume data
     * @param {Number} id - The ID of the episode
     * @since v0.1.8
     */
    removeData(id: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            for (const anime of this.animes) {
                anime.removeEpisode(id)
            }
            this.animes = this.animes.filter((anime) => anime.episodes.length > 0)
            this.saveData()
            if (this.getDataByEpisodeId(id) === null) {
                resolve(true)
            } else {
                reject(new Error('Resume data not removed'))
            }
        })
    }

    /**
     * Save the resume data
     * @since v0.1.8
     */
    saveData() {
        chrome.storage.local
            .set({
                resume: this.animes.map(anime => ({
                    animeID: anime.animeID,
                    animeTitle: anime.animeTitle,
                    episodes: anime.episodes.map(ep => ({
                        epID: ep.epID,
                        epTime: ep.epTime,
                        epURL: ep.epURL,
                        epNum: ep.epNum,
                        updateTime: ep.updateTime,
                    }))
                }))
            })
            .catch(() => {
                Logger.error('Error: Resume data not saved', true)
            })
    }

    /**
     * Load the resume data
     * @returns {Promise<Array<Anime>>} The resume data
     * @since v0.1.8
     */
    loadData(): Promise<Anime[]> {
        return new Promise((resolve) => {
            chrome.storage.local
                .get('resume')
                .then((data) => {
                    this.animes = (data.resume || []).map(
                        (anime: any) => {
                            const animeInstance = new Anime(anime.animeID, anime.animeTitle)
                            animeInstance.episodes = (anime.episodes || []).map((ep: any) => ({
                                ...ep,
                                epID: Number(ep.epID),
                                epTime: Number(ep.epTime),
                                epNum: Number(ep.epNum),
                                updateTime: Number(ep.updateTime),
                            }))
        return animeInstance
    }
)
resolve(this.animes)
                })
                .catch(() => {
                    resolve([])
                })
        })
    }

    /**
     * Get the resume data by episode ID
     * @param {Number} id - The ID of the episode
     * @returns {Episode | null} The resume data
     * @since v0.1.8
     */
    getDataByEpisodeId(id: number): Episode | null {
        for (const anime of this.animes) {
            const episode = anime.getEpisodeById(id)
            if (episode) return episode
        }
        return null
    }

    /**
     * Update resume data
     * @param epID
     * @param epTime
     * @param animeID
     * @param animeTitle
     * @param epURL
     * @param epNum
     * @param {Number} currentTime - The current time in real life (in milliseconds)
     * @since v0.1.8
     */
    updateData(
        epID: number,
        epTime: number,
        animeID: number,
        animeTitle: string,
        epURL: string,
        epNum: number,
        currentTime: number,
    ) {
        const episode = this.getDataByEpisodeId(epID)
        if (episode) {
            episode.epTime = epTime
            episode.updateTime = currentTime
            episode.epURL = epURL
            episode.epNum = epNum
            this.saveData()
        } else {
            this.addData(
                epID,
                epTime,
                animeID,
                animeTitle,
                epURL,
                epNum,
                currentTime,
            )
        }
    }

    /**
     * Get the last updated resume data
     * @returns {{episode: Episode | null, anime: Anime | null}} The last updated resume data
     */
    getLastUpdated(): { episode: Episode | null; anime: Anime | null } {
        let lastUpdated = null
        let lastAnime = null
        for (const anime of this.animes) {
            for (const episode of anime.episodes) {
                if (!lastUpdated || episode.updateTime > lastUpdated.updateTime) {
                    lastUpdated = episode
                    lastAnime = anime
                }
            }
        }
        return { episode: lastUpdated, anime: lastAnime }
    }

    openEpisode(id: number) {
        const episode = this.getDataByEpisodeId(id)
        if (episode) {
            chrome.runtime.sendMessage(
                {
                    type: 'openResume',
                    epID: episode.epID,
                    epTime: episode.epTime,
                    epURL: episode.epURL
                },
                (response) => {
                    if (response) {
                        Logger.log('Episode opened', true)
                    } else {
                        Logger.error('Error: Episode not opened', true)
                    }
                },
            )
        } else {
            Logger.error('Episode not found', true)
        }
    }
}
export class Anime {
    animeID: number
    animeTitle: string
    episodes: Episode[]
    constructor(animeID: number, animeTitle: string) {
        this.animeID = animeID
        this.animeTitle = animeTitle
        this.episodes = []
    }

    /**
     * Add an episode to the anime
     * @param {Episode} episode - The episode to add
     */
    addEpisode(episode: Episode) {
        this.episodes.push(episode)
    }

    /**
     * Remove an episode from the anime
     * @param {Number} episodeID - The ID of the episode to remove
     */
    removeEpisode(episodeID: number): void {
        this.episodes = this.episodes.filter((ep) => Number(ep.epID) !== Number(episodeID))
    }

    getEpisodeById(episodeID: number): Episode | null {
        return this.episodes.find((ep) => Number(ep.epID) === Number(episodeID)) || null
    }

    getLastEpisode(): Episode | null {
        return this.episodes.sort((a, b) => b.updateTime - a.updateTime)[0]
    }
}

export type Episode = {
    // The ID of the episode
    epID: number
    // The time in the episode (in seconds)
    epTime: number
    // The URL of the episode
    epURL: string
    // The episode number
    epNum: number
    // The timestamp when the episode was last updated (in milliseconds)
    updateTime: number
}

export default new Resume()
