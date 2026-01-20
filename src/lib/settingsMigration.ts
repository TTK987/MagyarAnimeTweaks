import Logger from "../Logger";
import MAT from "../MAT";
import Bookmarks from "../Bookmark";
import Resume, { Anime } from "../Resume";
import { Bookmark, keyBind, SettingsV0110, SettingsV017, SettingsV018, SettingsV019 } from "../global";

function keyBindGen(ctrlKey: boolean, altKey: boolean, shiftKey: boolean, key: string): keyBind {
    return { ctrlKey, altKey, shiftKey, key };
}

const DEFAULT_PLYR_SHORTCUTS = {
    playPause: keyBindGen(false, false, false, "Space"),
    muteUnmute: keyBindGen(false, false, false, "KeyM"),
    volumeUp: keyBindGen(false, false, false, "ArrowUp"),
    volumeDown: keyBindGen(false, false, false, "ArrowDown"),
    fullscreen: keyBindGen(false, false, false, "KeyF"),
};

function migrateStorageToLocal(): void {
    chrome.storage.sync.get("bookmarks", (result) => {
        if (!chrome.runtime.lastError && result.bookmarks) {
            Logger.log(`[settingsMigration]: Migrating bookmarks from sync to local storage`, true);
            Bookmarks.bookmarks = result.bookmarks as Bookmark[];
            Bookmarks.saveBookmarks();
        }
    });
    chrome.storage.sync.get("resume", (result) => {
        if (!chrome.runtime.lastError && result.resume) {
            Logger.log(`[settingsMigration]: Migrating resume data from sync to local storage`, true);
            Resume.animes = result.resume as Anime[];
            Resume.saveData();
        }
    });
}

function migrateSettings_0_1_9(pr: SettingsV019): SettingsV0110 {
    Logger.log(`[settingsMigration]: Migrating settings from version 0.1.9.x to version ${MAT.version}`, true);
    try {
        chrome.storage.local.set({});
        return {
            forwardSkip: pr.forwardSkip,
            backwardSkip: pr.backwardSkip,
            nextEpisode: pr.nextEpisode,
            previousEpisode: pr.previousEpisode,
            autoNextEpisode: pr.autoNextEpisode,
            autoplay: pr.autoplay,
            bookmarks: pr.bookmarks,
            resume: pr.resume,
            advanced: pr.advanced,
            plyr: {
                design: pr.plyr.design.enabled ?? false,
                shortcuts: DEFAULT_PLYR_SHORTCUTS
            },
            skip: pr.skip,
            eap: pr.eap,
            version: MAT.version
        };
    } catch (error) {
        Logger.error(`[settingsMigration]: Failed to migrate settings from version 0.1.9.x to version ${MAT.version}`, true);
        return MAT.getDefaultSettings();
    }
}

function migrateSettings_0_1_8(pr: SettingsV018): SettingsV0110 {
    Logger.log(`[settingsMigration]: Migrating settings from version 0.1.8 to version ${MAT.version}`, true);
    try {
        chrome.storage.local.set({});
        migrateStorageToLocal();

        return {
            forwardSkip: {
                enabled: pr.forwardSkip.enabled ?? false,
                time: pr.forwardSkip.time ?? 85,
                keyBind: {
                    ctrlKey: pr.forwardSkip.keyBind.ctrlKey ?? true,
                    altKey: pr.forwardSkip.keyBind.altKey ?? false,
                    shiftKey: pr.forwardSkip.keyBind.shiftKey ?? false,
                    key: pr.forwardSkip.keyBind.key ?? "ArrowRight",
                }
            },
            backwardSkip: {
                enabled: pr.backwardSkip.enabled ?? false,
                time: pr.backwardSkip.time ?? 85,
                keyBind: {
                    ctrlKey: pr.backwardSkip.keyBind.ctrlKey ?? true,
                    altKey: pr.backwardSkip.keyBind.altKey ?? false,
                    shiftKey: pr.backwardSkip.keyBind.shiftKey ?? false,
                    key: "ArrowLeft",
                }
            },
            nextEpisode: {
                enabled: pr.nextEpisode.enabled ?? false,
                keyBind: {
                    ctrlKey: pr.nextEpisode.keyBind.ctrlKey ?? false,
                    altKey: pr.nextEpisode.keyBind.altKey ?? true,
                    shiftKey: pr.nextEpisode.keyBind.shiftKey ?? false,
                    key: pr.nextEpisode.keyBind.key ?? "ArrowRight",
                }
            },
            previousEpisode: {
                enabled: pr.previousEpisode.enabled ?? false,
                keyBind: {
                    ctrlKey: pr.previousEpisode.keyBind.ctrlKey ?? false,
                    altKey: pr.previousEpisode.keyBind.altKey ?? true,
                    shiftKey: pr.previousEpisode.keyBind.shiftKey ?? false,
                    key: pr.previousEpisode.keyBind.key ?? "ArrowLeft",
                }
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
            resume: {
                enabled: pr.resume.enabled ?? true,
                mode: pr.resume.mode ?? "ask",
                clearAfter: "1m",
            },
            advanced: {
                consoleLog: pr.advanced.settings.ConsoleLog.enabled ?? false,
                player: pr.advanced.settings.DefaultPlayer.player === "default" ? "default" : "plyr",
                downloadName: pr.advanced.downloadName ?? "%title% - %episode%.rész (%MAT%)",
            },
            plyr: {
                design: pr.advanced.plyr.design.enabled ?? false,
                shortcuts: DEFAULT_PLYR_SHORTCUTS
            },
            skip: { time: 5 },
            eap: pr.private.eap ?? false,
            version: MAT.version
        };
    } catch (error) {
        Logger.error(`[settingsMigration]: Failed to migrate settings from version 0.1.8 to version ${MAT.version}`, true);
        return MAT.getDefaultSettings();
    }
}

function migrateSettings_0_1_7(pr: SettingsV017): SettingsV0110 {
    Logger.log(`[settingsMigration]: Migrating settings from version 0.1.7.x to version ${MAT.version}`, true);
    try {
        chrome.storage.local.set({});
        return {
            forwardSkip: {
                enabled: pr.forwardSkip.enabled ?? false,
                time: pr.forwardSkip.time ?? 85,
                keyBind: {
                    ctrlKey: pr.forwardSkip.ctrlKey ?? true,
                    altKey: pr.forwardSkip.altKey ?? false,
                    shiftKey: pr.forwardSkip.shiftKey ?? false,
                    key: pr.forwardSkip.key ?? "ArrowRight",
                }
            },
            backwardSkip: {
                enabled: pr.backwardSkip.enabled ?? false,
                time: pr.backwardSkip.time ?? 85,
                keyBind: {
                    ctrlKey: pr.backwardSkip.ctrlKey ?? true,
                    altKey: pr.backwardSkip.altKey ?? false,
                    shiftKey: pr.backwardSkip.shiftKey ?? false,
                    key: pr.backwardSkip.key ?? "ArrowLeft",
                }
            },
            nextEpisode: {
                enabled: pr.nextEpisode.enabled ?? false,
                keyBind: {
                    ctrlKey: pr.nextEpisode.ctrlKey ?? false,
                    altKey: pr.nextEpisode.altKey ?? true,
                    shiftKey: pr.nextEpisode.shiftKey ?? false,
                    key: pr.nextEpisode.key ?? "ArrowRight",
                }
            },
            previousEpisode: {
                enabled: pr.previousEpisode.enabled ?? false,
                keyBind: {
                    ctrlKey: pr.previousEpisode.ctrlKey ?? false,
                    altKey: pr.previousEpisode.altKey ?? true,
                    shiftKey: pr.previousEpisode.shiftKey ?? false,
                    key: pr.previousEpisode.key ?? "ArrowLeft",
                }
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
            resume: {
                enabled: true,
                mode: "ask",
                clearAfter: "1m",
            },
            advanced: {
                consoleLog: pr.advanced.settings.ConsoleLog.enabled ?? false,
                player: pr.advanced.settings.DefaultPlayer.player === "default" ? "default" : "plyr",
                downloadName: pr.advanced.downloadName ?? "%title% - %episode%.rész (%MAT%)",
            },
            plyr: {
                design: pr.advanced.plyr.design.enabled ?? false,
                shortcuts: DEFAULT_PLYR_SHORTCUTS,
            },
            skip: { time: 5 },
            eap: pr.eap ?? false,
            version: MAT.version
        };
    } catch (error) {
        Logger.error(`[settingsMigration]: Failed to migrate settings from version 0.1.7.x to version ${MAT.version}`, true);
        return MAT.getDefaultSettings();
    }
}

const MIGRATION_MAP = new Map<RegExp, (pr: SettingsV017 | SettingsV018 | SettingsV019) => SettingsV0110>([
    [/0\.1\.9\.[0-9]/, migrateSettings_0_1_9 as (pr: SettingsV017 | SettingsV018 | SettingsV019) => SettingsV0110],
    [/0\.1\.8\.[0-9]/, migrateSettings_0_1_8 as (pr: SettingsV017 | SettingsV018 | SettingsV019) => SettingsV0110],
    [/0\.1\.7\.[0-9]/, migrateSettings_0_1_7 as (pr: SettingsV017 | SettingsV018 | SettingsV019) => SettingsV0110],
]);

function getMigrationFunction(version: string) {
    for (const [pattern, migrateFn] of MIGRATION_MAP) {
        if (pattern.test(version)) return migrateFn;
    }
    return null;
}

export function migrateSettings(previousVersion: string, currentVersion: string): void {
    if (previousVersion === currentVersion) return;

    const migrateFn = getMigrationFunction(previousVersion);
    if (migrateFn) {
        chrome.storage.local.get("settings", (result) => {
            if (chrome.runtime.lastError || !result.settings) {
                MAT.loadSettings().then(() => {
                    MAT.saveSettings();
                });
            } else {
                MAT.settings = migrateFn(result.settings as SettingsV017 & SettingsV018 & SettingsV019);
                MAT.saveSettings();
            }
        });
    } else {
        Logger.error(`[settingsMigration]: Failed to migrate settings from version ${previousVersion} to version ${currentVersion}`, true);
        MAT.settings = MAT.getDefaultSettings();
        MAT.saveSettings();
    }
}
