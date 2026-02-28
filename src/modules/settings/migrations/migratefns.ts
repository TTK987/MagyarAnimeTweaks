import MAT from '../../../MAT'
import Logger from '../../../Logger'
import { createKeyBind } from '../../../lib/shortcuts'
import { SkipType } from '../../../api/AniSkip'
import { Bookmark, SettingsV0110, SettingsV017, SettingsV018, SettingsV019 } from 'src/global'
import Bookmarks from '../../../Bookmark'
import History, { Anime } from '../../../History'

// === Helpers and constants for migration functions ===

const DEFAULT_PLYR_SHORTCUTS = {
    playPause: [createKeyBind(false, false, false, false, ' '), createKeyBind(false, false, false, false, 'k')],
    muteUnmute: [createKeyBind(false, false, false, false, 'm')],
    fullscreen: [createKeyBind(false, false, false, false, 'f')],
    volumeUp: [createKeyBind(false, false, false, false, 'ArrowUp')],
    volumeDown: [createKeyBind(false, false, false, false, 'ArrowDown')],
}

const DEFAULT_PLYR_PLUGINS = {
    aniSkip: {
        enabled: true,
        skips: ['ed', 'op'] as SkipType[],
        keyBind: createKeyBind(false, false, false, false, 's'),
        autoSkip: [] as SkipType[],
    },
}

const DEFAULT_NAV = {
    searchBox: {
        enabled: true,
        open: createKeyBind(false, false, false, false, '/'),
        close: createKeyBind(false, false, false, false, 'Escape'),
        openSearch: createKeyBind(true, false, false, false, 'Enter'),
    },
    episode: {
        enabled: true,
        open: createKeyBind(false, false, false, false, 'Enter'),
    },
    mainPage: {
        enabled: true,
        open: createKeyBind(false, false, false, false, 'Enter'),
    },
}

function migrateStorageToLocal(): void {
    chrome.storage.sync.get('bookmarks', (result) => {
        if (!chrome.runtime.lastError && result.bookmarks) {
            Logger.log(`[settingsMigration]: Migrating bookmarks from sync to local storage`, true)
            Bookmarks.bookmarks = result.bookmarks as Bookmark[]
            Bookmarks.saveBookmarks()
        }
    })
    chrome.storage.sync.get('resume', (result) => {
        if (!chrome.runtime.lastError && result.resume) {
            Logger.log(`[settingsMigration]: Migrating resume data from sync to local storage`, true)
            History.animes = result.resume as Anime[]
            History.saveData()
        }
    })
}

function addMetaKeyToKeyBinds(obj: any): any {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key]
            if (key === 'keyBind' && typeof value === 'object') {
                value.metaKey = false
            } else if (typeof value === 'object' && value !== null) {
                addMetaKeyToKeyBinds(value)
            }
        }
    }
    return obj
}

// === Migration functions ===

function migrateSettings_0_1_9(pr: SettingsV019): SettingsV0110 {
    Logger.log(`[settingsMigration]: Migrating settings from version 0.1.9.x to version ${MAT.version}`, true)
    try {
        chrome.storage.local.set({})
        return {
            forwardSkip: addMetaKeyToKeyBinds(pr.forwardSkip),
            backwardSkip: addMetaKeyToKeyBinds(pr.backwardSkip),
            nextEpisode: addMetaKeyToKeyBinds(pr.nextEpisode),
            previousEpisode: addMetaKeyToKeyBinds(pr.previousEpisode),
            autoNextEpisode: pr.autoNextEpisode,
            autoplay: pr.autoplay,
            bookmarks: pr.bookmarks,
            history: pr.resume,
            advanced: pr.advanced,
            plyr: {
                design: pr.plyr.design.enabled ?? false,
                shortcuts: DEFAULT_PLYR_SHORTCUTS,
                plugins: DEFAULT_PLYR_PLUGINS,
            },
            nav: DEFAULT_NAV,
            skip: pr.skip,
            eap: pr.eap,
            version: MAT.version,
        }
    } catch (error) {
        Logger.error(
            `[settingsMigration]: Failed to migrate settings from version 0.1.9.x to version ${MAT.version}`,
            true,
        )
        return MAT.getDefaultSettings()
    }
}

function migrateSettings_0_1_8(pr: SettingsV018): SettingsV0110 {
    Logger.log(`[settingsMigration]: Migrating settings from version 0.1.8 to version ${MAT.version}`, true)
    try {
        chrome.storage.local.set({})
        migrateStorageToLocal()

        return {
            forwardSkip: {
                enabled: pr.forwardSkip.enabled ?? false,
                time: pr.forwardSkip.time ?? 85,
                keyBind: {
                    ctrlKey: pr.forwardSkip.keyBind.ctrlKey ?? true,
                    altKey: pr.forwardSkip.keyBind.altKey ?? false,
                    shiftKey: pr.forwardSkip.keyBind.shiftKey ?? false,
                    metaKey: false,
                    key: pr.forwardSkip.keyBind.key ?? 'ArrowRight',
                },
            },
            backwardSkip: {
                enabled: pr.backwardSkip.enabled ?? false,
                time: pr.backwardSkip.time ?? 85,
                keyBind: {
                    ctrlKey: pr.backwardSkip.keyBind.ctrlKey ?? true,
                    altKey: pr.backwardSkip.keyBind.altKey ?? false,
                    shiftKey: pr.backwardSkip.keyBind.shiftKey ?? false,
                    metaKey: false,
                    key: pr.backwardSkip.keyBind.key ?? 'ArrowLeft',
                },
            },
            nextEpisode: {
                enabled: pr.nextEpisode.enabled ?? false,
                keyBind: {
                    ctrlKey: pr.nextEpisode.keyBind.ctrlKey ?? false,
                    altKey: pr.nextEpisode.keyBind.altKey ?? true,
                    shiftKey: pr.nextEpisode.keyBind.shiftKey ?? false,
                    metaKey: false,
                    key: pr.nextEpisode.keyBind.key ?? 'ArrowRight',
                },
            },
            previousEpisode: {
                enabled: pr.previousEpisode.enabled ?? false,
                keyBind: {
                    ctrlKey: pr.previousEpisode.keyBind.ctrlKey ?? false,
                    altKey: pr.previousEpisode.keyBind.altKey ?? true,
                    shiftKey: pr.previousEpisode.keyBind.shiftKey ?? false,
                    metaKey: false,
                    key: pr.previousEpisode.keyBind.key ?? 'ArrowLeft',
                },
            },
            autoNextEpisode: {
                enabled: pr.autoNextEpisode.enabled ?? false,
                time: pr.autoNextEpisode.time ?? 60,
            },
            autoplay: {
                enabled: pr.autoplay.enabled ?? false,
            },
            bookmarks: {
                enabled: pr.bookmarks.enabled ?? true,
            },
            history: {
                enabled: pr.resume.enabled ?? true,
                mode: pr.resume.mode ?? 'ask',
                clearAfter: '1m',
            },
            advanced: {
                consoleLog: pr.advanced.settings.ConsoleLog.enabled ?? false,
                downloadName: pr.advanced.downloadName ?? '%title% - %episode%.rész (%MAT%)',
            },
            plyr: {
                design: pr.advanced.plyr.design.enabled ?? false,
                shortcuts: DEFAULT_PLYR_SHORTCUTS,
                plugins: DEFAULT_PLYR_PLUGINS,
            },
            nav: DEFAULT_NAV,
            skip: { time: 5 },
            eap: pr.private.eap ?? false,
            version: MAT.version,
        }
    } catch (error) {
        Logger.error(
            `[settingsMigration]: Failed to migrate settings from version 0.1.8 to version ${MAT.version}`,
            true,
        )
        return MAT.getDefaultSettings()
    }
}

function migrateSettings_0_1_7(pr: SettingsV017): SettingsV0110 {
    Logger.log(`[settingsMigration]: Migrating settings from version 0.1.7.x to version ${MAT.version}`, true)
    try {
        chrome.storage.local.set({})
        return {
            forwardSkip: {
                enabled: pr.forwardSkip.enabled ?? false,
                time: pr.forwardSkip.time ?? 85,
                keyBind: {
                    ctrlKey: pr.forwardSkip.ctrlKey ?? true,
                    altKey: pr.forwardSkip.altKey ?? false,
                    shiftKey: pr.forwardSkip.shiftKey ?? false,
                    metaKey: false,
                    key: pr.forwardSkip.key ?? 'ArrowRight',
                },
            },
            backwardSkip: {
                enabled: pr.backwardSkip.enabled ?? false,
                time: pr.backwardSkip.time ?? 85,
                keyBind: {
                    ctrlKey: pr.backwardSkip.ctrlKey ?? true,
                    altKey: pr.backwardSkip.altKey ?? false,
                    shiftKey: pr.backwardSkip.shiftKey ?? false,
                    metaKey: false,
                    key: pr.backwardSkip.key ?? 'ArrowLeft',
                },
            },
            nextEpisode: {
                enabled: pr.nextEpisode.enabled ?? false,
                keyBind: {
                    ctrlKey: pr.nextEpisode.ctrlKey ?? false,
                    altKey: pr.nextEpisode.altKey ?? true,
                    shiftKey: pr.nextEpisode.shiftKey ?? false,
                    metaKey: false,
                    key: pr.nextEpisode.key ?? 'ArrowRight',
                },
            },
            previousEpisode: {
                enabled: pr.previousEpisode.enabled ?? false,
                keyBind: {
                    ctrlKey: pr.previousEpisode.ctrlKey ?? false,
                    altKey: pr.previousEpisode.altKey ?? true,
                    shiftKey: pr.previousEpisode.shiftKey ?? false,
                    metaKey: false,
                    key: pr.previousEpisode.key ?? 'ArrowLeft',
                },
            },
            autoNextEpisode: {
                enabled: pr.autoNextEpisode.enabled ?? false,
                time: pr.autoNextEpisode.time ?? 60,
            },
            autoplay: {
                enabled: pr.autoplay.enabled ?? false,
            },
            bookmarks: {
                enabled: true,
            },
            history: {
                enabled: true,
                mode: 'ask',
                clearAfter: '1m',
            },
            advanced: {
                consoleLog: pr.advanced.settings.ConsoleLog.enabled ?? false,
                downloadName: pr.advanced.downloadName ?? '%title% - %episode%.rész (%MAT%)',
            },
            plyr: {
                design: pr.advanced.plyr.design.enabled ?? false,
                shortcuts: DEFAULT_PLYR_SHORTCUTS,
                plugins: DEFAULT_PLYR_PLUGINS,
            },
            nav: DEFAULT_NAV,
            skip: { time: 5 },
            eap: pr.eap ?? false,
            version: MAT.version,
        }
    } catch (error) {
        Logger.error(
            `[settingsMigration]: Failed to migrate settings from version 0.1.7.x to version ${MAT.version}`,
            true,
        )
        return MAT.getDefaultSettings()
    }
}

export {
    migrateSettings_0_1_7,
    migrateSettings_0_1_8,
    migrateSettings_0_1_9,
}
