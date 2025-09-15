import { EpisodeListItem, EpisodeData, SourceData, FansubData } from './global'
import MAT from './MAT'

/**
 * This class is responsible for fetching Data from the MagyarAnime page by scraping it.
 * @since v0.1.9
 */
class MagyarAnime {
    document: Document
    url: string
    isDatasheetPage: boolean
    isEpisodePage: boolean | null
    ANIME: Anime
    EPISODE: Episode
    /**
     * The constructor of the MagyarAnime class
     * @param {Document} document - The document object of the page to scrape from
     * @param {String} url - The URL of the page to scrape from
     * @since v0.1.9
     */
    constructor(document: Document, url: string) {
        this.document = document
        this.url = url
        this.isDatasheetPage = /leiras\/.*/.test(this.url)
        this.isEpisodePage =
                /resz(?:-s\d)?\/.*|inda-play(?:-\d+)?\/.*/.test(this.url) ||
            this.document.querySelector('#lejatszo') !== null
        this.ANIME = new Anime(this.document, this.url)
        this.EPISODE = new Episode(this.document, this.url)
    }

    /**
     * Returns whether the page is a maintenance page or not
     * @returns {Boolean} Whether the page is a maintenance page or not
     */
    isMaintenancePage(): boolean {
        return /karbantartás/gms.test(<string>this.document.querySelector("h3")?.innerText.toLowerCase()) || false
    }

    /**
     * Adds custom CSS to the page
     * @param {String} css - The CSS to add (Automatically minifies the CSS)
     * @since v0.1.8
     */
    addCSS(css: string) {
        const style = document.createElement('style')
        style.textContent = css
            .replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '')
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        style.id = 'MAT_CSS'
        document.head.appendChild(style)
    }
}

/**
 * This class is responsible for fetching Anime Data from the MagyarAnime page by scraping it.
 * @since v0.1.9
 */
class Anime {
    document: Document
    url: string
    /**
     * The constructor of the Anime class
     * @param {Document} document - The document object of the page to scrape from
     * @param {String} url - The URL of the page to scrape from
     * @since v0.1.9
     */
    constructor(document: Document, url: string) {
        this.document = document
        this.url = url
    }


    getMALLink(): string {
        try {
            return (
                (
                    this.document.querySelector(
                        '.gen-button.gen-button-dark.adatlap_gomb2'
                    ) as HTMLAnchorElement
                )?.href || ''
            )
        } catch {
            return ''
        }
    }

    /**
     * Get the title of the anime
     * @returns {String} The title of the anime
     * @since v0.1.8
     */
    getImage(): string {
        try {
            return (
                (this.document.querySelector('.gentech-tv-show-img-holder img') as HTMLImageElement)
                    ?.src || ''
            )
        } catch (e) {
            return ''
        }
    }

    /**
     * Get the title of the anime
     * @returns {String} The title of the anime
     * @since v0.1.8
     */
    getTitle(): string {
        try {
            return (
                (this.document.querySelector('.gen-title.aname1') as HTMLHeadingElement)
                    ?.innerText || ''
            )
        } catch (e) {
            return ''
        }
    }

    /**
     * Get the description of the anime
     * @returns {String} The description of the anime
     * @since v0.1.8
     */
    getDescription(): string {
        try {
            return (
                /Ismertető:(.*)(\[[Ff]orrás:|\([Ff]orrás:|\([Ss]ource:|\[[Ss]ource:)?/gms
                    .exec(
                        (this.document.querySelector('.leiras_text') as HTMLDivElement)?.innerText,
                    )?.[1]
                    ?.trim() || ''
            )
        } catch {
            return ''
        }
    }

    /**
     * Get the age rating of the anime
     * @returns {String} The age rating of the anime
     * @since v0.1.8
     */
    getAgeRating(): string {
        try {
            return (
                (
                    this.document.querySelector(
                        '.gen-single-meta-holder > ul > li:nth-child(1) > span',
                    ) as HTMLParagraphElement
                )?.innerText || ''
            )
        } catch {
            return ''
        }
    }

    /**
     * Get the season of the anime (e.g. "Winter 2023")
     * @returns {String} The season of the anime
     * @since v0.1.8
     */
    getSeason(): string {
        try {
            return (
                (
                    this.document.querySelector(
                        '.gen-single-meta-holder > ul > li:nth-child(2)',
                    ) as HTMLLIElement
                )?.innerText || ''
            )
        } catch {
            return ''
        }
    }

    /**
     * Get the episode count of the anime
     * @returns {Number} The episode count of the anime
     * @since v0.1.8
     */
    getEpisodeCount(): number {
        try {
            const match = (
                this.document
                    .querySelectorAll('.gen-single-meta-holder')[1]
                    ?.querySelector('ul > li:nth-child(2)') as HTMLLIElement
            )?.innerText.match(/Epizódok: (\d+) /)
            if (match) {
                return parseInt(match[1]) || -1
            }
            return -1
        } catch {
            return -1
        }
    }

    /**
     * Get the max episode count of the anime
     * @returns {Number} The max episode count of the anime (Infinity if it's unknown)
     * @since v0.1.8
     */
    getMaxEpisodeCount(): number {
        try {
            const match = (
                this.document
                    .querySelectorAll('.gen-single-meta-holder')[1]
                    ?.querySelector('ul > li:nth-child(2)') as HTMLLIElement
            )?.innerText
            const maxEpisodes = match?.match(/Epizódok: \d+ \/ (\d+|∞)/)
            if (!maxEpisodes) return -1
            const data = maxEpisodes[1]
            if (!data) return -1
            if (data === '∞') return Infinity
            return parseInt(data) || -1
        } catch {
            return -1
        }
    }

    /**
     * Get the release date of the anime
     * @returns {String} The release date of the anime
     * @since v0.1.8
     */
    getReleaseDate(): string {
        try {
            return (
                (
                    this.document
                        .querySelectorAll('.gen-single-meta-holder')[1]
                        ?.querySelector('ul > li:nth-child(3)') as HTMLLIElement
                )?.innerText || ''
            )
        } catch {
            return ''
        }
    }

    /**
     * Get the views of the anime
     * @returns {Number} The views of the anime
     * @since v0.1.8
     */
    getViews(): number {
        try {
            return (
                parseInt(
                    (
                        this.document
                            .querySelectorAll('.gen-single-meta-holder')[1]
                            ?.querySelector('ul > li:nth-child(5) span') as HTMLParagraphElement
                    )?.innerText.replace(',', ''),
                ) || -1
            )
        } catch {
            return -1
        }
    }

    /**
     * Get the episodes of the anime
     * @returns {Array<{title: String, link: String, epNumber: Number, status: String}>} The episodes of the anime
     * @since v0.1.8
     */
    getEpisodes(): EpisodeListItem[] {
        try {
            return (
                [...this.document.querySelectorAll('.owl-stage > .owl-item, .owl-stage > .item')].map((item) => ({
                    title: item.querySelector('.gen-episode-info h3 a')?.textContent || '',
                    link:
                        (item.querySelector('.gen-episode-info h3 a') as HTMLAnchorElement)?.href ||
                        '',
                    epNumber:
                        parseInt(
                            <string>(
                                (
                                    item.querySelector(
                                        '.gen-episode-info h3 a',
                                    ) as HTMLAnchorElement
                                )?.textContent?.match(/(\d+)\.?\s?[rR]ész/)?.[1]
                            ),
                        ) || -1,
                    status: item.querySelector('.badge')?.textContent || '',
                    thumbnail:
                        (item.querySelector('.gen-episode-img img') as HTMLImageElement)?.src || '',
                })) || []
            )
        } catch {
            return []
        }
    }

    /**
     * Get the source of the anime
     * @returns {Array<{site: String, link: String}>} The source of the anime
     * @since v0.1.8
     */
    getSource(): SourceData[] {
        try {
            return (
                [
                    ...this.document.querySelectorAll('.gen-button.gen-button-dark.adatlap_gomb2'),
                ].map((sourceItem) => ({
                    site: sourceItem.textContent?.toLowerCase().trim() || '',
                    link: (sourceItem as HTMLAnchorElement).href || '',
                })) || []
            )
        } catch {
            return []
        }
    }
}

/**
 * This class is responsible for fetching Episode Data from the MagyarAnime page by scraping it.
 * @since v0.1.9
 */
class Episode {
    document: Document
    url: string
    /**
     * The constructor of the Episode class
     * @param {Document} document - The document object of the page to scrape from
     * @param {String} url - The URL of the page to scrape from
     * @since v0.1.9
     */
    constructor(document: Document, url: string) {
        this.document = document
        this.url = url
    }

    /**
     * Get the MyAnimeList ID of the anime
     *
     * ALERT: This function is expensive, as it makes a network request, should be used only when necessary and only once.
     * @returns {Promise<Number>} The MyAnimeList ID of the anime (or -1 if not found)
     * @since v0.1.9.6
     */
    getMALId(): Promise<number> {
        return new Promise((resolve, reject) => {
            try {
                fetch(this.getAnimeLink(), {
                    method: 'GET',
                    headers: {
                        "MagyarAnimeTweaks": "v"+MAT.getVersion(),
                        "x-requested-with": "XMLHttpRequest"
                    },
                    credentials: 'include',
                })
                .then(response => response.text())
                .then(html => {
                    let tempMA = new MagyarAnime(new DOMParser().parseFromString(html, 'text/html'), this.getAnimeLink());
                    const malLink = tempMA.ANIME.getMALLink();
                    if (malLink) {
                        const malMatch = malLink.match(/myanimelist.net\/anime\/(\d+)\//);
                        if (malMatch) {
                            resolve(parseInt(malMatch[1]) || -1);
                        }
                    } else {
                        resolve(-1);
                    }
                })
                .catch(() => resolve(-1));
            } catch {
                resolve(-1);
            }
        });
    }

    /**
     * Get the title of the episode
     * @returns {String} The title of the episode
     * @since v0.1.8
     */
    getTitle(): string {
        return (this.document.querySelector('#InfoBox h2 a') as HTMLAnchorElement)?.innerText.trim() || ''
    }

    /**
     * Get the episode number of the episode
     * @returns {Number} The episode number of the episode
     * @since v0.1.8
     */
    getEpisodeNumber(): number {
        try {
            let match = (
                this.document.querySelector(
                    '#epizodlista .active .episode-title',
                ) as HTMLParagraphElement
            )?.innerText.match(/(\d+)\.?\s?[rR]ész/)
            if (match) {
                return parseInt(match[1]) || -1
            }

            match = (
                this.document.querySelector(
                    "#DailyLimits"
                ) as HTMLDivElement
            )?.innerText.match(/(\d+)\.?\s?[rR]ész/)
            if (match) {
                return parseInt(match[1]) || -1
            }

            return -1
        } catch {
            return -1
        }
    }

    /**
     * Get the release date of the episode
     * @returns {String} The release date of the episode
     * @since v0.1.8
     */
    getReleaseDate(): string {
        try {
            return (
                (this.document.querySelector('#epizodlista .active .linkdate') as HTMLLIElement)
                    ?.innerText || ''
            )
        } catch {
            return ''
        }
    }

    /**
     * Get the views of the episode
     * @returns {Number} The views of the episode
     * @since v0.1.8
     */
    getViews(): number {
        try {
            const match = (
                this.document.querySelector(
                    '#InfoBox .inline-list:nth-child(2) span',
                ) as HTMLLIElement
            )?.innerText.match(/(\d+)/)
            if (match) {
                return parseInt(match[1]) || -1
            }
            return -1
        } catch {
            return -1
        }
    }

    /**
     * Get the fansub data using regex
     * @returns {Array<{name: String, url: String}>} The fansub data
     * @since v0.1.8
     * @since v0.1.9 - Changed return type to array (to catch if there are multiple fansubs)
     */
    getFansub(): FansubData[] {
        try {
            const fansubs = []
            const regex = /Az animét a\s+([^,]+(?:,\s*[^,]+)*)\s+csapat\(ok\) fordította\(k\)\./gm
            const htmlContent = (
                this.document.querySelector('#InfoBox > p:nth-child(5)') as HTMLParagraphElement
            ).innerHTML
            const match = regex.exec(htmlContent)
            if (match) {
                const fansubData = match[1]
                    .split(',')
                    .map((fansub) => {
                        if (fansub.trim().toLowerCase() === '') return undefined
                        const nameMatch = fansub.match(/<a[^>]*>([^<]+)<\/a>/)
                        const linkMatch = fansub.match(/<a href="([^"]+)"/)
                        return {
                            name: nameMatch ? nameMatch[1] : fansub.trim(),
                            link: linkMatch ? linkMatch[1] : '',
                        }
                    })
                    .filter((fansub) => fansub !== undefined) as FansubData[]
                fansubs.push(...fansubData)
            }
            return fansubs
        } catch {
            return []
        }
    }

    /**
     * Get the link for the datasheet of the anime
     * @returns {String} The link for the datasheet of the anime
     * @since v0.1.8
     */
    getAnimeLink(): string {
        try {
            return (
                (this.document.querySelector('#InfoBox > h2 > a') as HTMLAnchorElement)?.href || ''
            )
        } catch {
            return ''
        }
    }

    /**
     * Get all episode links
     * @returns {Array<{eposodeNumber: Number, title: String, link: String}>} All episode links
     * @since v0.1.8
     */
    getAllEpisodes(): EpisodeData[] {
        try {
            return (
                [...this.document.querySelectorAll('#epizodlista .list-group-item')].map(
                    (episodeItem) => ({
                        episodeNumber: parseInt(
                            episodeItem
                                .querySelector('.episode-title')
                                ?.textContent?.match(/(\d+)\.?\s?[rR]ész/)?.[1] || '-1',
                        ),
                        title: episodeItem.querySelector('.episode-title')?.textContent || '',
                    }),
                ) || []
            )
        } catch {
            return []
        }
    }

    /**
     * Returns the id of the episode
     * @returns {number} The id of the episode (if the episode is from /inda-play-<...>/, it offsets the id by 100000)
     */
    getId(): number {
        try {
            const path = window.location.pathname
            const dataMatch = path.match(/(-s\d+)?\/(\d+)\//)
            const playMatch = path.match(/\/inda-play-(\d+)\//)
            if (playMatch) return (parseInt(playMatch[1]) || -1) + 100000
            if (dataMatch) return parseInt(dataMatch[2]) || -1
            return -1
        } catch {
            return -1
        }
    }

    /**
     * Get the datasheet of the episode
     * @returns {Number} The datasheet of the episode
     */
    getAnimeID(): number {
        try {
            const match = (
                this.document.querySelector('#InfoBox > h2 > a') as HTMLAnchorElement
            )?.href.match(/\/leiras\/(\d+)\//)
            if (match) {
                return parseInt(match[1]) || -1
            }
            return -1
        } catch {
            return -1
        }
    }
}

export default MagyarAnime
