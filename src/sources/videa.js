import MAT from "../MAT";
import Logger from "../Logger";

window.addEventListener('message', async function (event) {
    if (event.data?.type === MAT.__ACTIONS__.GET_SOURCE_URL) {
        const extractor = new VideaExtractor();
        let qualityData = await extractor.extract(window.location.href);
        if (!qualityData || qualityData.length === 0) {
            Logger.warn('Quality data not found, trying to get it from the player', true);
            qualityData = await getQualityData();
            window.parent.postMessage({type: MAT.__ACTIONS__.SOURCE_URL, data: makeQualityDataUrlNormal(qualityData)}, '*');
        } else {
            window.parent.postMessage({type: MAT.__ACTIONS__.SOURCE_URL, data: makeQualityDataUrlNormal(qualityData)}, '*');
        }
    }
});

/**
 * Function to make the quality data url normal
 */
function makeQualityDataUrlNormal(qualityData) {
    let data = [];
    qualityData.forEach((item) => {
        if (item.url && item.quality) {
            data.push({
                url: item.url.startsWith('//') ? `https:${item.url}` : item.url,
                quality: item.quality,
            });
        }
    });
    return data;
}

/**
 * Function to get the quality data
 * @returns {Promise<Array>} The array of quality data
 * @async
 * @function getQualityData
 * @since v0.1.7
 */
async function getQualityData() {
    return new Promise((resolve) => {
        document.addEventListener('MATweaksSourceUrl', () => {
            let qualityData = JSON.parse(document.querySelector('matweaks.matweaks-data').getAttribute('data-video-data'));
            resolve(qualityData);
        });
        document.dispatchEvent(new Event('MATweaksGetSourceUrl'));
        setInterval(() => {
            resolve([]);
        }, 5000);
    });
}


class VideaExtractor {
    constructor() {
        this._STATIC_SECRET = 'xHb0ZvME5q8CBcoQi6AngerDu3FGO9fkUlwPmLVY_RTzj2hJIS4NasXWKy1td7p';
    }

    rc4(cipherText, key) {
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

    _download_webpage(url) {
        return fetch(url).then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        });
    }

    _download_webpage_handle(url, query) {
        const queryString = new URLSearchParams(query).toString();
        return fetch(`${url}?${queryString}`).then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text().then(text => [text, response]);
        });
    }

    _search_regex(pattern, string, name) {
        const match = string.match(pattern);
        if (!match) {
            throw new Error(`Could not find ${name}`);
        }
        return match[1];
    }

    _parse_xml(xmlString) {
        let xml = new window.DOMParser().parseFromString(xmlString, 'application/xml');
        if (xml.querySelector('error')) {
            throw new Error(xml.querySelector('error').textContent);
        } else {
            return xml;
        }
    }

    /**
     * Extracts the video source from the given url
     * @param {String} url - The url to extract
     * @returns {Promise<Array>} The array of quality data
     */
    async extract(url) {
        try {
            const video_page = await this._download_webpage(url);
            let player_url;
            if (url.includes('videa.hu/player')) {
                player_url = url;
            } else {
                player_url = this._search_regex(/<iframe.*?src="(\/player\?[^"]+)"/, video_page, 'player url');
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
            const random_seed = Array.from({length: 8}, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 52)]).join('');
            query['_s'] = random_seed;
            query['_t'] = result.slice(0, 16);
            const [b64_info, handle] = await this._download_webpage_handle('https://videa.hu/player/xml', query);
            let info;
            if (b64_info.startsWith('<?xml')) {
                info = this._parse_xml(b64_info);
            } else {
                const key = result.slice(16) + random_seed + handle.headers.get('x-videa-xs');
                info = this._parse_xml(this.rc4(atob(b64_info), key));
            }
            const video = info.querySelector('video');
            if (!video) throw new Error('Video not found');
            const formats = [];
            info.querySelectorAll('video_sources > video_source').forEach(source => {
                let source_url = source.textContent;
                const source_name = source.getAttribute('name');
                const source_exp = source.getAttribute('exp');
                if (!source_url || !source_name) return;

                const hash_value = info.querySelector(`hash_values > hash_value_${source_name}`)?.textContent;
                if (hash_value && source_exp) {
                    source_url = `${source_url}?md5=${hash_value}&expires=${source_exp}`;
                }

                formats.push({
                    url: source_url,
                    quality: parseInt(source.getAttribute('height'), 10) || null,
                });
            });
            return formats.sort((a, b) => b.quality - a.quality);
        } catch (error) {
            Logger.error(`Error while extracting video source: ${error.message}`);
            return Promise.resolve([]);
        }
    }
}

window.parent.postMessage({type: MAT.__ACTIONS__.IFRAME.FRAME_LOADED}, '*');

Logger.log('[videa.js] Script loaded');
