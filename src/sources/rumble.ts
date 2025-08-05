/**
 * This is useless, since MagyarAnime is using their own player for this source
 * But just in case, I will leave this here
 */

import MAT from '../MAT'
import { EpisodeVideoData } from '../global'

// TEST URL: https://magyaranime.eu/resz/58476/

window.addEventListener('message', async function (event) {
    if (event.data) {
        if (event.data.type === MAT.__ACTIONS__.GET_SOURCE_URL) {
            window.parent.postMessage(
                { type: MAT.__ACTIONS__.SOURCE_URL, data: getQualityData(document.body.innerHTML) },
                '*',
            )
        }
    }
})

/**
 * Function to get the quality data
 * @param html The HTML content of the page
 * @returns {Array} The quality data array
 * @since v0.1.7
 */
function getQualityData(html: string): {} {
    const regexp = /"(\d{3,4})":{"url":"([^"]+)"/g
    let data: EpisodeVideoData[] = []
    html.matchAll(regexp).forEach((match: RegExpMatchArray) => {
        data.push({ quality: Number(match[1]), url: match[2] })
    })
    return data.sort((a, b) => a.quality - b.quality).filter((item) => item.quality !== 180)
}

document.addEventListener('DOMContentLoaded', function () {
    window.parent.postMessage({ type: MAT.__ACTIONS__.IFRAME.FRAME_LOADED }, '*')
})
