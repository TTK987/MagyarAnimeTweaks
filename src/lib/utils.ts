import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import MAT from '../MAT'
import { FansubData, EpisodeVideoData } from '../global'
import Logger from '../Logger'

export function cn(...inputs: (string | boolean | undefined)[]) {
    return twMerge(clsx(inputs))
}


/**
 * Converts a file size in bytes to a human-readable format.
 * @param {number} size - The file size in bytes.
 * @returns {string} The formatted file size.
 */
export function prettyFileSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}



/**
 * Function to render the file name using the template provided
 * @param {string} template The template to render
 * @param {string} title The title of the anime
 * @param {number} episodeNumber The episode number
 * @param {number} quality The quality of the video
 * @param {FansubData[]} fansub The fansub data
 * @param {"Dailymotion" | "Indavideo" | "Rumble" | "Videa" | "N/A"} source The source of the video
 * @returns {string} The rendered file name
 */
export function renderFileName(template: string, title: string, episodeNumber: number, quality: number, fansub: FansubData[] | null, source: "Dailymotion" | "Indavideo" | "Rumble" | "Videa" | "N/A"): string {
    if (template === '') {
        template = MAT.getDefaultSettings().advanced.downloadName + '.mp4'
    }
    return template
        .replace(/%title%/g, title)
        .replace(/%episode%/g, episodeNumber.toString())
        .replace(/%0episode%/g, episodeNumber.toString().padStart(2, '0'))
        .replace(/%MAT%/g, 'MATweaks')
        .replace(/%source%/g, source)
        .replace(/%quality%/g, quality + 'p')
        .replace(/%fansub%/g, fansub?.map((a: FansubData) => a.name).join(', ') || 'N/A')
        .replace(/[\\?%*:|"<>]/g, '-') // Replace invalid characters
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .replace(/[\n\r]/g, '') // Remove newlines
        .trim()
}

export function getQualityData(mediaID: string | null = null): Promise<EpisodeVideoData[]> {
    return new Promise((resolve, reject) => {
        getVideoData(mediaID)
            .then((data) => {
                let source = data.qualities.auto[0].url
                parseVideoData(source)
                    .then((qualities) => {
                        resolve(qualities as EpisodeVideoData[])
                    })
                    .catch((error) => {
                        reject(error)
                    })
            })
            .catch((error) => {
                reject(error)
            })
    })
}

export async function getVideoData(mediaID: string | null): Promise<any> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', `https://www.dailymotion.com/player/metadata/video/${mediaID}`, true)
        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText))
            } else {
                reject(xhr.statusText)
            }
        }
        xhr.onerror = function () {
            reject(xhr.statusText)
        }
        xhr.send()
    })
}
export async function parseVideoData(url: string | URL): Promise<EpisodeVideoData[]> {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then((response) => response.text())
            .then((videoData) => {
                const lines = videoData.split('\n')
                const data: EpisodeVideoData[] = []
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim()
                    if (line.startsWith('#EXT-X-STREAM-INF:')) {
                        // Prefer NAME if present, otherwise use RESOLUTION height as quality
                        let quality: number | null = null
                        const nameMatch = line.match(/(?:^|,)NAME="?(\d+)"?(?:,|$)/i)
                        if (nameMatch) {
                            quality = Number(nameMatch[1])
                        } else {
                            const resMatch = line.match(/RESOLUTION=\s*\d+\s*x\s*(\d+)/i)
                            if (resMatch) {
                                quality = Number(resMatch[1])
                            }
                        }
                        const nextUrl = lines[i + 1]?.trim()
                        if (quality && nextUrl && !nextUrl.startsWith('#')) {
                            data.push({ quality, url: nextUrl })
                        }
                    }
                    else if (line.startsWith('#EXTINF:')) {
                        data.push({ quality: 1080, url: url.toString()})
                        break;
                    }
                }
                data.sort((a, b) => b.quality - a.quality)
                resolve(data)
            })
            .catch((error) => {
                Logger.error('Error while parsing video data: ' + error, true)
                reject(error)
            })
    })
}
