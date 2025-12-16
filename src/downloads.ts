import {FansubData} from './global'
import {renderFileName} from './lib/utils'
import MAT from "./MAT";
import { ACTIONS } from './lib/actions'


async function downloadHLS(
    url: string,
    title: string,
    episodeNumber: number,
    quality: number,
    fansub: FansubData[] | null,
    source: "Dailymotion" | "Rumble" | "N/A",
    fileNameTemplate: string,
    onStatusUpdate: (status: {percentage: number, packets: number, totalPackets: number, size: number, totalSize: number}) => void,
    onSuccess: () => void,
    onError: (error: Error) => void
) {
    const fileName = renderFileName(fileNameTemplate, title, episodeNumber, quality, fansub, source) + '.mp4'

    onStatusUpdate(
        {
            percentage: 0,
            packets: 0,
            totalPackets: 0,
            size: 0,
            totalSize: 0
        }
    )

    const response = await fetch(url)
    if (!response.ok) {
        onError(new Error('Failed to fetch HLS playlist.'))
        return
    }

    const segmentUrls = (await response.text())
        .split('\n')
        .filter((line) => line && !line.startsWith('#'))
        .map((segment) => new URL(segment, url).toString())

    const totalPackets = segmentUrls.length
    let downloadedSegments = 0

    if (url.includes("magyaranime")) {
        const baseUrl = new URL(url);
        const token = baseUrl.searchParams.get('token');
        const expiry = baseUrl.searchParams.get('expires');
        if (!token || !expiry) {
            onError(new Error('Missing token or expiry in the URL.'))
            return
        }
        for (let i = 0; i < segmentUrls.length; i++) {
            const segmentUrl = new URL(segmentUrls[i]);
            segmentUrl.searchParams.set('token', token);
            segmentUrl.searchParams.set('expires', expiry);
            segmentUrls[i] = segmentUrl.toString();
        }
    }

    let blobParts: BlobPart[] = []
    let fileSize = 0
    for (let i = 0; i < 10; i++) {
        if (i >= segmentUrls.length) break
        const segmentResponse = await fetch(segmentUrls[i], { method: 'HEAD' })
        if (!segmentResponse.ok) {
            onError(new Error(`Failed to fetch segment size: ${segmentUrls[i]}`))
            return
        }
        const size = parseInt(
            segmentResponse.headers.get('Content-Length') || '0',
            10,
        )
        fileSize += size
    }

    onStatusUpdate(
        {
            percentage: 0,
            packets: downloadedSegments,
            totalPackets: totalPackets,
            size: Math.round(fileSize / 10 * downloadedSegments),
            totalSize: Math.round(fileSize / 10 * segmentUrls.length)
        }
    )

    for (const segmentUrl of segmentUrls) {
        const segmentResponse = await fetch(segmentUrl)
        if (!segmentResponse.ok) {
            if (segmentResponse.status === 403) {
                onError(new Error('Access to the video segment is forbidden (403). The token may have expired. Please try downloading again.'))
            } else if (segmentResponse.status === 429) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                const retryResponse = await fetch(segmentUrl);
                if (!retryResponse.ok) {
                    onError(new Error(`Failed to download segment after retry: ${segmentUrl}`));
                    return;
                }
                blobParts.push(await retryResponse.arrayBuffer());
                downloadedSegments++;
                const progress = Math.round(
                    (downloadedSegments / segmentUrls.length) * 100,
                );

                onStatusUpdate({
                    percentage: progress,
                    packets: downloadedSegments,
                    totalPackets: totalPackets,
                    size: Math.round((fileSize / 10) * downloadedSegments),
                    totalSize: Math.round(fileSize / 10) * segmentUrls.length
                });
                continue;
            }
            onError(new Error(`Failed to download segment: ${segmentUrl}`))
            return
        }
        blobParts.push(await segmentResponse.arrayBuffer())
        downloadedSegments++
        const progress = Math.round(
            (downloadedSegments / segmentUrls.length) * 100,
        )

        onStatusUpdate({
            percentage: progress,
            packets: downloadedSegments,
            totalPackets: totalPackets,
            size: Math.round((fileSize / 10) * downloadedSegments),
            totalSize: Math.round(fileSize / 10) * segmentUrls.length
        })

    }


    const blob = new Blob(blobParts, { type: 'video/mp4' })
    const urlObject = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = urlObject
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(urlObject)
    onSuccess()
}



function download(
    url: string,
    title: string,
    episodeNumber: number,
    quality: number,
    fansub: FansubData[] | null,
    source: "Indavideo" | "Videa" | "N/A",
    fileNameTemplate: string,
    onSuccess: () => void,
    onError: (error: Error) => void
) {
    let fileName = renderFileName(fileNameTemplate, title, episodeNumber, quality, fansub, source) + '.mp4'
    chrome.runtime.sendMessage({type: ACTIONS.DOWNLOAD, url: url, filename: fileName}, (response) => {
        if (response) {
            onSuccess();
        } else {
            onError(new Error('Failed to download the video. Please try again later.'));
        }
    })
}




export { downloadHLS , download };
