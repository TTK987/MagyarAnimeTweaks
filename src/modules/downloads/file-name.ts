import MAT from '../../MAT'
import { FansubData } from '../../global'


export type DownloadNameVariable = '%title%' | '%episode%' | '%0episode%' | '%source%' | '%quality%' | '%group%' | '%MAT%'

export const DownloadNameVariables: DownloadNameVariable[] = ['%title%', '%episode%', '%0episode%', '%source%', '%quality%', '%group%', '%MAT%']

export function renderFileName(
    template: string,
    title: string,
    episodeNumber: number,
    quality: number,
    fansub: FansubData[] | null,
    source: 'Dailymotion' | 'Indavideo' | 'Rumble' | 'Videa' | 'N/A',
): string {
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
        .replace(/[\\?%*:|"<>]/g, '-')
        .replace(/[\x00-\x1F\x7F]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/[\n\r]/g, '')
        .trim()
}

