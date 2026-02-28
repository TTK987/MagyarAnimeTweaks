import Logger from '../../../Logger'
import MAT from '../../../MAT'
import { SettingsV0110, SettingsV017, SettingsV018, SettingsV019 } from '../../../global'
import { migrateSettings_0_1_7, migrateSettings_0_1_8, migrateSettings_0_1_9 } from './migratefns'
import { bindSettings } from '../validation'


const MIGRATION_MAP = new Map<RegExp, (pr: SettingsV017 | SettingsV018 | SettingsV019) => SettingsV0110>([
    [/0\.1\.9\.\d/, migrateSettings_0_1_9 as (pr: SettingsV017 | SettingsV018 | SettingsV019) => SettingsV0110],
    [/0\.1\.8\.\d/, migrateSettings_0_1_8 as (pr: SettingsV017 | SettingsV018 | SettingsV019) => SettingsV0110],
    [/0\.1\.7\.\d/, migrateSettings_0_1_7 as (pr: SettingsV017 | SettingsV018 | SettingsV019) => SettingsV0110],
])

function getMigrationFunction(version: string) {
    for (const [pattern, migrateFn] of MIGRATION_MAP) {
        if (pattern.test(version)) return migrateFn
    }
    return null
}

export function migrateSettings(): void {
    MAT.loadSettings()
        .then((settings) => {
            const previousVersion = settings.version
            const currentVersion = MAT.version
            performMigration(
                previousVersion,
                currentVersion,
                settings as unknown as SettingsV017 | SettingsV018 | SettingsV019 | null,
            )
        })
        .catch((err) => Logger.error(`[settingsMigration]: Error loading settings for migration: ${err}`, true))
}

export function performMigration(
    previousVersion: string,
    currentVersion: string,
    previousSettings: SettingsV017 | SettingsV018 | SettingsV019 | null,
): void {
    Logger.log(`[settingsMigration]: migrateSettings called from ${previousVersion} to ${currentVersion}`, true)

    if (previousVersion === currentVersion) {
        Logger.log(`[settingsMigration]: Settings version matches current version; validating settings...`, true)
        if (previousSettings) {
            MAT.settings = bindSettings(previousSettings)
            MAT.saveSettings()
                .then((s) => {
                    if (s) Logger.log(`[settingsMigration]: Settings are up to date and valid`, true)
                    else Logger.error(`[settingsMigration]: Settings validation failed; unable to save settings`, true)
                })
                .catch((err) => Logger.error(`[settingsMigration]: Error saving settings during validation: ${err}`, true))
        }
        return
    }

    const migrateFn = getMigrationFunction(previousVersion)
    if (migrateFn) {
        if (previousSettings === null) {
            Logger.error(
                `[settingsMigration]: Previous settings are null; cannot migrate from version ${previousVersion}`,
                true,
            )
            fallbackToDefaults().then((s) => {
                if (s)
                    Logger.log(
                        `[settingsMigration]: Successfully reset settings to defaults after failed migration from version ${previousVersion}`,
                        true,
                    )
                else
                    Logger.error(
                        `[settingsMigration]: Failed to reset settings to defaults after failed migration from version ${previousVersion}`,
                        true,
                    )
            })
        } else {
            MAT.settings = migrateFn(previousSettings)
            MAT.saveSettings()
                .catch((err) => {
                    Logger.error(`[settingsMigration]: Failed to save migrated settings: ${err}`, true)
                })
                .then((s) => {
                    if (s) {
                        Logger.log(
                            `[settingsMigration]: Successfully migrated settings from version ${previousVersion} to version ${currentVersion}`,
                            true,
                        )
                        MAT.updateDynamicRules()
                    } else
                        Logger.error(
                            `[settingsMigration]: Failed to migrate settings from version ${previousVersion} to version ${currentVersion}`,
                            true,
                        )
                })
        }
    } else {
        Logger.error(
            `[settingsMigration]: No migration function available for version ${previousVersion}; resetting to defaults`,
            true,
        )
        fallbackToDefaults().then((s) => {
            if (s)
                Logger.log(
                    `[settingsMigration]: Successfully reset settings to defaults after failed migration from version ${previousVersion}`,
                    true,
                )
            else
                Logger.error(
                    `[settingsMigration]: Failed to reset settings to defaults after failed migration from version ${previousVersion}`,
                    true,
                )
        })
    }
}

function fallbackToDefaults(): Promise<boolean> {
    MAT.settings = MAT.getDefaultSettings()
    return new Promise<boolean>((resolve) => {
        MAT.saveSettings()
            .then((s) => {
                Logger.log(`[settingsMigration]: Saved default settings after migration failure`, true)
                resolve(s)
            })
            .catch((err) => {
                Logger.error(`[settingsMigration]: Failed to save default settings: ${err}`, true)
                resolve(false)
            })
    })
}

