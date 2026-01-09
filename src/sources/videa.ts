import { ACTIONS } from '../lib/actions'
import Logger from "../Logger";
import { EpisodeVideoData } from '../global'
import { parseExpiryFromUrl } from '../lib/expiry'

window.addEventListener('message', async function (event) {
    if (event.data?.type === ACTIONS.GET_SOURCE_URL) {
        const extractor = new VideaExtractor();
        let qualityData: EpisodeVideoData[] = await extractor.extract(window.location.href);
        if (!qualityData || qualityData.length === 0) {
            Logger.warn('Quality data not found, trying to get it from the player', true);
            qualityData = await getQualityData();
            window.parent.postMessage({type: ACTIONS.SOURCE_URL, data: makeQualityDataUrlNormal(qualityData)}, '*');
        } else {
            window.parent.postMessage({type: ACTIONS.SOURCE_URL, data: makeQualityDataUrlNormal(qualityData)}, '*');
        }
    }
});

/**
 * Function to make the quality data url normal
 */
function makeQualityDataUrlNormal(qualityData: EpisodeVideoData[]) {
    let data: EpisodeVideoData[] = [];
    qualityData.forEach((item) => {
        if (item.url && item.quality) {
            data.push({
                url: item.url.startsWith('//') ? `https:${item.url}` : item.url,
                quality: item.quality,
                expires: parseExpiryFromUrl(item.url) || undefined,
            })
        }
    })
    return data
}

/**
 * Function to get the quality data
 * @returns {Promise<Array>} The array of quality data
 * @async
 * @function getQualityData
 * @since v0.1.7
 */
async function getQualityData(): Promise<EpisodeVideoData[]> {
    return new Promise((resolve) => {
        document.addEventListener('MATweaksSourceUrl', () => {
            let qualityData = JSON.parse((document.querySelector('matweaks.matweaks-data') as HTMLElement).getAttribute('data-video-data') || '[]') as EpisodeVideoData[];
            resolve(qualityData);
        });
        document.dispatchEvent(new Event('MATweaksGetSourceUrl'));
        setInterval(() => {
            resolve([]);
        }, 5000);
    });
}

class VideaExtractor {
    private _STATIC_SECRET: string;
    private isNoEmbedErrorHandled: boolean = false;
    constructor() {
        this._STATIC_SECRET = 'xHb0ZvME5q8CBcoQi6AngerDu3FGO9fkUlwPmLVY_RTzj2hJIS4NasXWKy1td7p';
    }

    rc4(cipherText: string, key: string): string {
        let res = '';
        const keyLen = key.length;
        let S = Array.from({ length: 256 }, (_, i) => i);

        let j = 0;
        for (let i = 0; i < 256; i++) {
            j = (j + S[i] + key.charCodeAt(i % keyLen)) % 256;
            [S[i], S[j]] = [S[j], S[i]];
        }

        let i = 0;
        j = 0;
        for (let m = 0; m < cipherText.length; m++) {
            i = (i + 1) % 256;
            j = (j + S[i]) % 256;
            [S[i], S[j]] = [S[j], S[i]];
            const k = S[(S[i] + S[j]) % 256];
            const char = cipherText.charCodeAt(m);
            res += String.fromCharCode(k ^ char);
        }

        return res;
    }

    _download_webpage(url: string | URL | Request): Promise<string> {
        return fetch(url).then((response) => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        });
    }

    _download_webpage_handle(
        url: string,
        query: string | string[][] | Record<string, string> | URLSearchParams | undefined,
    ): Promise<[string, Response]> {
        const queryString = new URLSearchParams(query as Record<string, string>).toString();
        return fetch(`${url}?${queryString}`).then((response) => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text().then((text) => [text, response]);
        });
    }

    _search_regex(pattern: RegExp, string: string, name: string): string {
        const match = string.match(pattern);
        if (!match) {
            throw new Error(`Could not find ${name}`);
        }
        return match[1];
    }

    _random_string(length: number): string {
        return Array.from(
            { length: length },
            () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 52)],
        ).join('')
    }

    async _noEmbedError(xml: Document): Promise<Document> {
        if (this.isNoEmbedErrorHandled) {
            throw new Error('Noembed error handling loop detected');
        }
        this.isNoEmbedErrorHandled = true;
        const errorElement = xml.querySelector('error') as HTMLElement
        let url = errorElement?.textContent || ''
        if (url.startsWith('http')) {
            const urlObj = new URL(url)
            url = urlObj.pathname + urlObj.search
            window.history.replaceState({}, '', url)
        }
        if (!url) {
            throw new Error('No URL found in noembed error')
        }

        const noembedHtml = await this._download_webpage(url)
        let playerURL = this._search_regex(
            /<iframe.*?src="(\/player\?[^"]+)"/,
            noembedHtml,
            'player url from noembed',
        )
        playerURL = new URL(playerURL, window.location.href).href

        const playerHtml = await this._download_webpage(playerURL)
        const nonce = this._search_regex(/_xt\s*=\s*"([^"]+)"/, playerHtml, 'nonce from noembed')
        const l = nonce.slice(0, 32)
        const s = nonce.slice(32)
        let result = ''
        for (let i = 0; i < 32; i++) {
            result += s[i - (this._STATIC_SECRET.indexOf(l[i]) - 31)]
        }

        const query = Object.fromEntries(new URLSearchParams(playerURL.split('?')[1])) as Record<string, string>
        const random_seed = this._random_string(8)
        query['_s'] = random_seed
        query['_t'] = result.slice(0, 16)

        const [b64_info, handle] = await this._download_webpage_handle(
            'https://videa.hu/player/xml',
            query,
        )

        if (b64_info.startsWith('<?xml')) {
            return await this._parse_xml(b64_info)
        }

        const xVideaXs = handle.headers.get('x-videa-xs') ?? ''
        const key = result.slice(16) + random_seed + xVideaXs
        return await this._parse_xml(this.rc4(atob(b64_info), key))
    }

    async _parse_xml(xmlString: string): Promise<Document> {
        let xml = new window.DOMParser().parseFromString(xmlString, 'application/xml')
        if (xml.querySelector('error')) {
            if (xml.querySelector('error')?.getAttribute('panelstyle')) {
                return await this._noEmbedError(xml)
            }
            const err = (xml.querySelector('error') as HTMLElement).textContent ?? 'Unknown XML error'
            throw new Error(err)
        } else {
            return xml
        }
    }

    /**
     * Extracts the video source from the given url
     * @param {String} url - The url to extract
     * @returns {Promise<EpisodeVideoData[]>} The array of quality data
     */
    async extract(url: string): Promise<EpisodeVideoData[]> {
        try {
            const video_page = await this._download_webpage(url);
            let player_url: string;
            if (url.includes('videa.hu/player')) {
                player_url = url;
            } else {
                player_url = this._search_regex(
                    /<iframe.*?src="(\/player\?[^"]+)"/,
                    video_page,
                    'player url',
                );
                player_url = new URL(player_url, url).href;
            }
            const player_page = await this._download_webpage(player_url);
            const nonce = this._search_regex(/_xt\s*=\s*"([^"]+)"/, player_page, 'nonce');
            const l = nonce.slice(0, 32);
            const s = nonce.slice(32);
            let result = '';
            for (let i = 0; i < 32; i++) {
                result += s[i - (this._STATIC_SECRET.indexOf(l[i]) - 31)];
            }
            const query = Object.fromEntries(new URLSearchParams(player_url.split('?')[1]));
            const random_seed = this._random_string(8);
            query['_s'] = random_seed;
            query['_t'] = result.slice(0, 16);
            const [b64_info, handle] = await this._download_webpage_handle(
                'https://videa.hu/player/xml',
                query,
            );
            let info: Document;
            if (b64_info?.startsWith('<?xml')) {
                info = await this._parse_xml(b64_info);
            } else {
                const xVideaXs = handle.headers.get('x-videa-xs') ?? '';
                const key = result.slice(16) + random_seed + xVideaXs;
                info = await this._parse_xml(this.rc4(atob(b64_info), key));
            }
            const video = info.querySelector('video');
            if (!video) throw new Error('Video not found');
            const formats: EpisodeVideoData[] = [];
            info.querySelectorAll('video_sources > video_source').forEach((source) => {
                const source_url = source.textContent;
                const source_name = source.getAttribute('name');
                const source_exp = source.getAttribute('exp');
                if (!source_url || !source_name) return;

                const hash_value = info.querySelector(
                    `hash_values > hash_value_${source_name}`,
                )?.textContent;
                let final_url = source_url;
                if (hash_value && source_exp) {
                    final_url = `${source_url}?md5=${hash_value}&expires=${source_exp}`;
                }

                const heightAttr = source.getAttribute('height');
                if (!heightAttr) return;
                const quality = parseInt(heightAttr, 10);

                formats.push({
                    url: final_url,
                    quality: quality,
                });
            });
            return formats
                .filter((item) => !isNaN(item.quality))
                .sort((a, b) => b.quality - a.quality);
        } catch (error) {
            if (error instanceof Error) {
                Logger.error(`Error while extracting video source: ${error.message}`);
            } else {
                Logger.error('Error while extracting video source: Unknown error');
            }
            return [];
        }
    }
}
window.parent.postMessage({type: ACTIONS.IFRAME.FRAME_LOADED}, '*');

Logger.log('[videa.js] Script loaded');
