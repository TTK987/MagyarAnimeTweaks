import type { ServerResponse, EpisodeVideoData } from '@/global'

export function decidePlayerType(
    data: ServerResponse,
): 'HLS' | 'HTML5' | 'indavideo' | 'videa' | 'dailymotion' | 'mega' | 'Unknown' {
    if (data.hls) return 'HLS'
    if (data.output) {
        if (data.output.includes('<iframe')) {
            const iframeSources = ['indavideo.hu', 'videa.hu', 'dailymotion.com', 'mega.nz']
            for (const source of iframeSources) {
                if (data.output.includes(source)) {
                    if (source === 'indavideo.hu') return 'indavideo'
                    if (source === 'videa.hu') return 'videa'
                    if (source === 'dailymotion.com') return 'dailymotion'
                    if (source === 'mega.nz') return 'mega'
                }
            }
        } else if (data.output.includes('<video')) {
            return 'HTML5'
        }
    }
    return 'Unknown'
}

export function genVideoHTML(videoData: EpisodeVideoData[]): string {
    return `
<video id="player" tabindex="0" controls autoplay playsinline>
    ${videoData
        .map(
            (video) =>
                `<source src="${video.url}" type="video/mp4; codecs=avc1.42E01E, mp4a.40.2" size="${video.quality}"/>`,
        )
        .join('')}
</video>`
}
