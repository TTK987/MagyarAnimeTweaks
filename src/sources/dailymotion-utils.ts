import { EpisodeVideoData } from '../global'
import Logger from '../Logger'

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
                    } else if (line.startsWith('#EXTINF:')) {
                        data.push({ quality: 1080, url: url.toString() })
                        break
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

