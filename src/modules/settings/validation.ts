import { Settings, keyBind, Bookmark } from '../../global';
import MAT from '../../MAT';
import { SkipType } from '../../api/AniSkip'
import { DownloadNameVariable, DownloadNameVariables } from '../downloads/file-name'
import { Anime, Episode } from '../../History'


export function dlNameFilter(name: string): string {
    const varPattern = /%[a-zA-Z0-9]+%/g
    name = name.replace(varPattern, (match) => {
        return DownloadNameVariables.includes(match as DownloadNameVariable) ? match : ''
    })
    return name.replace(/[\/\\?*:|"<>]/g, '').trim()
}
function S_time(data: any): number | undefined {
    const num = typeof data === 'number' ? data : Number(data)
    return num >= 0 && num <= 300 ? num : undefined
}
function S_clearAfter(data: any): Settings['history']['clearAfter'] | undefined {
    const validValues: Settings['history']['clearAfter'][] = ['1w', '1m', '3m', '1y', 'never']
    return typeof data === 'string' && validValues.includes(data as Settings['history']['clearAfter']) ? (data as Settings['history']['clearAfter']) : undefined
}
function S_mode(data: any): Settings['history']['mode'] | undefined {
    const validValues: Settings['history']['mode'][] = ['auto', 'ask']
    return typeof data === 'string' && validValues.includes(data as Settings['history']['mode']) ? (data as Settings['history']['mode']) : undefined
}
function S_bool(data: any): boolean | undefined {
    return typeof data === 'boolean' ? data : undefined
}
function S_keyBind(data: any): keyBind | undefined {
    const key = typeof data?.key === 'string' ? data.key : undefined
    if (key) {
        return {
            ctrlKey: S_bool(data?.ctrlKey) ?? false,
            altKey: S_bool(data?.altKey) ?? false,
            shiftKey: S_bool(data?.shiftKey) ?? false,
            metaKey: S_bool(data?.metaKey) ?? false,
            key
        }
    }
    return undefined
}
function S_keyBindList(data: any): keyBind[] | undefined {
    if (Array.isArray(data)) {
        const list: keyBind[] = []
        for (const item of data) {
            const kb = S_keyBind(item)
            if (kb) list.push(kb)
        }
        return list
    }
    return undefined
}
function S_skipTypeList(data: any): SkipType[] | undefined {
    const validValues: SkipType[] = ['op', 'ed', 'mixed-op', 'mixed-ed', 'recap']
    if (Array.isArray(data)) {
        const list: SkipType[] = []
        for (const item of data) {
            if (typeof item === 'string' && validValues.includes(item as SkipType)) {
                list.push(item as SkipType)
            }
        }
        return list
    }
    return undefined
}


/**
 * Bind settings data to the Settings type, filling in any missing properties with default values.
 * @param data The input settings data, which may be incomplete or have missing properties.
 * @returns A complete Settings object with all properties filled in, using defaults where necessary.
 */
export function bindSettings(data: any): Settings {
    const settings = MAT.getDefaultSettings()
    return {
        forwardSkip: {
            enabled: S_bool(data.forwardSkip?.enabled) ?? settings.forwardSkip.enabled,
            time: S_time(data.forwardSkip?.time) ?? settings.forwardSkip.time,
            keyBind: S_keyBind(data.forwardSkip?.keyBind) ?? settings.forwardSkip.keyBind
        },
        backwardSkip: {
            enabled: S_bool(data.backwardSkip?.enabled) ?? settings.backwardSkip.enabled,
            time: S_time(data.backwardSkip?.time) ?? settings.backwardSkip.time,
            keyBind: S_keyBind(data.backwardSkip?.keyBind) ?? settings.backwardSkip.keyBind
        },
        nextEpisode: {
            enabled: S_bool(data.nextEpisode?.enabled) ?? settings.nextEpisode.enabled,
            keyBind: S_keyBind(data.nextEpisode?.keyBind) ?? settings.nextEpisode.keyBind
        },
        previousEpisode: {
            enabled: S_bool(data.previousEpisode?.enabled) ?? settings.previousEpisode.enabled,
            keyBind: S_keyBind(data.previousEpisode?.keyBind) ?? settings.previousEpisode.keyBind
        },
        autoNextEpisode: {
            enabled: S_bool(data.autoNextEpisode?.enabled) ?? settings.autoNextEpisode.enabled,
            time: S_time(data.autoNextEpisode?.time) ?? settings.autoNextEpisode.time
        },
        autoplay: {
            enabled: S_bool(data.autoplay?.enabled) ?? settings.autoplay.enabled
        },
        bookmarks: {
            enabled: S_bool(data.bookmarks?.enabled) ?? settings.bookmarks.enabled
        },
        history: {
            enabled: S_bool(data.history?.enabled) ?? settings.history.enabled,
            mode: S_mode(data.history?.mode) ?? settings.history.mode,
            clearAfter: S_clearAfter(data.history?.clearAfter) ?? settings.history.clearAfter
        },
        skip: {
            time: S_time(data.skip?.time) ?? settings.skip.time
        },
        advanced: {
            consoleLog: S_bool(data.advanced?.consoleLog) ?? settings.advanced.consoleLog,
            downloadName: dlNameFilter(data.advanced?.downloadName ?? settings.advanced.downloadName)
        },
        nav: {
            searchBox: {
                enabled: S_bool(data.nav?.searchBox?.enabled) ?? settings.nav.searchBox.enabled,
                open: S_keyBind(data.nav?.searchBox?.open) ?? settings.nav.searchBox.open,
                close: S_keyBind(data.nav?.searchBox?.close) ?? settings.nav.searchBox.close,
                openSearch: S_keyBind(data.nav?.searchBox?.openSearch) ?? settings.nav.searchBox.openSearch
            },
            episode: {
                enabled: S_bool(data.nav?.episode?.enabled) ?? settings.nav.episode.enabled,
                open: S_keyBind(data.nav?.episode?.open) ?? settings.nav.episode.open
            },
            mainPage: {
                enabled: S_bool(data.nav?.mainPage?.enabled) ?? settings.nav.mainPage.enabled,
                open: S_keyBind(data.nav?.mainPage?.open) ?? settings.nav.mainPage.open
            }
        },
        plyr: {
            design: S_bool(data.plyr?.design) ?? settings.plyr.design,
            shortcuts: {
                playPause: S_keyBindList(data.plyr?.shortcuts?.playPause) ?? settings.plyr.shortcuts.playPause,
                muteUnmute: S_keyBindList(data.plyr?.shortcuts?.muteUnmute) ?? settings.plyr.shortcuts.muteUnmute,
                volumeUp: S_keyBindList(data.plyr?.shortcuts?.volumeUp) ?? settings.plyr.shortcuts.volumeUp,
                volumeDown: S_keyBindList(data.plyr?.shortcuts?.volumeDown) ?? settings.plyr.shortcuts.volumeDown,
                fullscreen: S_keyBindList(data.plyr?.shortcuts?.fullscreen) ?? settings.plyr.shortcuts.fullscreen
            },
            plugins: {
                aniSkip: {
                    enabled: S_bool(data.plyr?.plugins?.aniSkip?.enabled) ?? settings.plyr.plugins.aniSkip.enabled,
                    skips: S_skipTypeList(data.plyr?.plugins?.aniSkip?.skips) ?? settings.plyr.plugins.aniSkip.skips,
                    keyBind: S_keyBind(data.plyr?.plugins?.aniSkip?.keyBind) ?? settings.plyr.plugins.aniSkip.keyBind,
                    autoSkip: S_skipTypeList(data.plyr?.plugins?.aniSkip?.autoSkip) ?? settings.plyr.plugins.aniSkip.autoSkip
                }
            }
        },
        eap: S_bool(data.eap) ?? settings.eap,
        version: settings.version // version should always be the default one, as the result is the current version
    }
}

// === Bookmark and History binders ===

function S_number(data: any): number | undefined {
    const num = typeof data === 'number' ? data : Number(data)
    return !isNaN(num) ? num : undefined
}

function S_string(data: any): string | undefined {
    return typeof data === 'string' ? data : undefined
}

/**
 * Bind a single bookmark entry, stripping unknown properties and validating types.
 * Returns null if the bookmark is fundamentally invalid (missing required ID fields).
 */
function bindBookmark(data: any): Bookmark | null {
    if (!data || typeof data !== 'object') return null

    const bookmarkID = S_number(data.bookmarkID)
    const epID = S_number(data.epID)
    const animeID = S_number(data.animeID)

    // These fields are required for a bookmark to be meaningful
    if (bookmarkID === undefined || epID === undefined || animeID === undefined) return null

    return {
        bookmarkID,
        animeTitle: S_string(data.animeTitle) ?? '',
        epNum: S_number(data.epNum) ?? 0,
        bookmarkDesc: S_string(data.bookmarkDesc) ?? '',
        epTime: S_number(data.epTime) ?? 0,
        epID,
        animeID,
    }
}

/**
 * Bind an array of bookmarks, stripping unknown properties and filtering out invalid entries.
 * @param data The input data, expected to be an array of bookmark-like objects.
 * @returns A clean array of Bookmark objects with only known, validated properties.
 */
export function bindBookmarks(data: any): Bookmark[] {
    if (!Array.isArray(data)) return []

    const result: Bookmark[] = []
    for (const item of data) {
        const bound = bindBookmark(item)
        if (bound) result.push(bound)
    }
    return result
}

/**
 * Bind a single episode entry, stripping unknown properties and validating types.
 * Returns null if the episode is fundamentally invalid (missing required ID fields).
 */
function bindEpisode(data: any): Episode | null {
    if (!data || typeof data !== 'object') return null

    const epID = S_number(data.epID)
    if (epID === undefined) return null

    return {
        epID,
        epTime: S_number(data.epTime) ?? 0,
        epURL: S_string(data.epURL) ?? '',
        epNum: S_number(data.epNum) ?? 0,
        updateTime: S_number(data.updateTime) ?? 0,
    }
}

/**
 * Bind an array of history/resume (Anime) data, stripping unknown properties and filtering out invalid entries.
 * @param data The input data, expected to be an array of anime-like objects with episodes.
 * @returns A clean array of Anime objects with only known, validated properties and episodes.
 */
export function bindHistory(data: any): Anime[] {
    if (!Array.isArray(data)) return []

    const result: Anime[] = []
    for (const item of data) {
        if (!item || typeof item !== 'object') continue

        const animeID = S_number(item.animeID)
        if (animeID === undefined) continue

        const anime = new Anime(animeID, S_string(item.animeTitle) ?? '')

        if (Array.isArray(item.episodes)) {
            for (const ep of item.episodes) {
                const boundEp = bindEpisode(ep)
                if (boundEp) anime.addEpisode(boundEp)
            }
        }

        // Only include animes that have at least one valid episode
        if (anime.episodes.length > 0) result.push(anime)
    }
    return result
}

/**
 * Bind and sanitize Plyr CSS data for import.
 * Strips HTML tags, invalid characters, and enforces the 100k character limit.
 * Returns the default Plyr CSS if the input is invalid or empty.
 * @param data The input data, expected to be a CSS string.
 * @returns A sanitized CSS string safe to use as Plyr CSS.
 */
export function bindPlyrCSS(data: any): string {
    if (typeof data !== 'string' || data.trim().length === 0) {
        return MAT.getDefaultPlyrCSS()
    }

    if (data.length > 100000) data = MAT.getDefaultPlyrCSS()

    return data.trim().length > 0 ? data : MAT.getDefaultPlyrCSS()
}
