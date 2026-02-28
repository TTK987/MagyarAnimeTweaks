import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Download, Upload, FileText, History as HistoryIcon, Bookmark, Settings, AlertTriangle, CheckCircle, Palette, } from 'lucide-react'
import type { Settings as SettingsType, Bookmark as BookmarkType } from '../global'
import type { Anime } from '../History'
import { migrateSettings_0_1_7, migrateSettings_0_1_8, migrateSettings_0_1_9 } from '../modules/settings/migrations/migratefns'
import { bindSettings, bindBookmarks, bindHistory, bindPlyrCSS } from '../modules/settings/validation'
import MAT from '../MAT'
import History from '../History'
import Bookmarks from '../Bookmark'
import Toast from '../Toast'
import React, { useState, useRef } from 'react'

interface ImportExportSettingsProps {
    settings: SettingsType
    onSettingsImport?: (settings: SettingsType) => void
}

type ExportType = 'all' | 'settings' | 'bookmarks' | 'history' | 'plyrCSS'

interface ExportData {
    type: ExportType
    version: string
    exportDate: string
    data: {
        settings?: SettingsType
        bookmarks?: BookmarkType[]
        history?: Anime[]
        plyrCSS?: string
    }
}

export default function ImportExportSettings({ settings, onSettingsImport }: ImportExportSettingsProps) {
    const [isImporting, setIsImporting] = useState(false)
    const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleExport = async (type: ExportType) => {
        try {
            const exportData: ExportData = {
                type,
                version: MAT.version,
                exportDate: new Date().toISOString(),
                data: {},
            }

            if (type === 'all' || type === 'settings') {
                exportData.data.settings = settings
            }

            if (type === 'all' || type === 'bookmarks') {
                await Bookmarks.loadBookmarks()
                exportData.data.bookmarks = Bookmarks.bookmarks
            }

            if (type === 'all' || type === 'history') {
                await History.loadData()
                exportData.data.history = History.animes
            }

            if (type === 'all' || type === 'plyrCSS') {
                exportData.data.plyrCSS = await MAT.loadPlyrCSS()
            }

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            function getFormattedTimestamp(date: Date) {
                const pad = (num: number) => num.toString().padStart(2, '0')
                return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
            }
            a.href = url
            a.download = `MAT_${type.toUpperCase()}_EXPORT_${getFormattedTimestamp(new Date())}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            Toast.success(`${getExportTypeLabel(type)} sikeresen exportálva`)
        } catch (error) {
            Toast.error('Hiba történt az exportálás során')
            console.error('Export error:', error)
        }
    }

    const getExportTypeLabel = (type: ExportType): string => {
        switch (type) {
            case 'all': return 'Összes adat'
            case 'settings': return 'Beállítások'
            case 'bookmarks': return 'Könyvjelzők'
            case 'history': return 'Előzmények'
            case 'plyrCSS': return 'Lejátszó CSS'
        }
    }

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        setImportResult(null)

        try {
            const text = await file.text()
            const importData = JSON.parse(text) as ExportData

            // Validate import data structure
            if (!importData.type || !importData.version || !importData.data) {
                setImportResult({
                    success: false,
                    message: 'Érvénytelen importálási fájl formátum',
                })
                setIsImporting(false)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
                return
            }


            // Import settings with version migration
            if (importData.data.settings) {
                let migratedSettings: SettingsType

                // Check if migration is needed based on version
                if (importData.version !== MAT.version) {
                    migratedSettings = migrateSettingsFromVersion(importData.version ?? importData.data.settings.version ?? '0.0.0', importData.data.settings)
                } else {
                    migratedSettings = bindSettings(importData.data.settings)
                }

                onSettingsImport?.(migratedSettings)
            }

            // Import bookmarks
            if (importData.data.bookmarks) {
                await Bookmarks.loadBookmarks()
                Bookmarks.bookmarks = bindBookmarks(importData.data.bookmarks)
                Bookmarks.saveBookmarks()
            }

            // Import history
            if (importData.data.history) {
                History.animes = bindHistory(importData.data.history)
                History.saveData()
            }

            // Player CSS
            if (importData.data.plyrCSS) {
                await MAT.savePlyrCSS(bindPlyrCSS(importData.data.plyrCSS))
            }

            setImportResult({
                success: true,
                message: `Sikeresen importálva: ${getExportTypeLabel(importData.type)}`,
            })
            Toast.success('Importálás sikeres!')
        } catch (error) {
            console.error('Import error:', error)
            setImportResult({
                success: false,
                message: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
            })
            Toast.error('Hiba történt az importálás során')
        } finally {
            setIsImporting(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const migrateSettingsFromVersion = (version: string, settingsData: any): SettingsType => {
        let migrated: any = settingsData

        // v0.1.9.x
        if (/0\.1\.9\.[0-9]/.test(version)) {
            migrated = migrateSettings_0_1_9(settingsData)
        }
        // v0.1.8.x
        else if (/0\.1\.8\.[0-9]/.test(version)) {
            migrated = migrateSettings_0_1_8(settingsData)
        }
        // v0.1.7.x
        else if (/0\.1\.7\.[0-9]/.test(version)) {
            migrated = migrateSettings_0_1_7(settingsData)
        }
        // Versions older than 0.1.7.x are unsupported
        else if (/0\.1\.[0-6]/.test(version)) {
            throw new Error(
                `A(z) v${version} verzió nem támogatott az importáláshoz. Legalább v0.1.7.x szükséges.`
            )
        }

        return bindSettings(migrated)
    }

    return (
        <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                    <FileText className="h-5 w-5 text-[#3f9fff]" />
                    <CardTitle className="text-white text-lg font-medium">Import / Export</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-xs text-white/70">
                        Az importálás csak az v0.1.7.x-től kezdődő verziókat támogatja.
                    </p>

                    {/* Export Section */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-white">Exportálás</p>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport('all')}
                                className="bg-[#205daa]/20 hover:bg-[#205daa]/30 border-[#205daa]/30 text-white justify-start"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Minden
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport('settings')}
                                className="bg-[#205daa]/20 hover:bg-[#205daa]/30 border-[#205daa]/30 text-white justify-start"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Beállítások
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport('bookmarks')}
                                className="bg-[#205daa]/20 hover:bg-[#205daa]/30 border-[#205daa]/30 text-white justify-start"
                            >
                                <Bookmark className="h-4 w-4 mr-2" />
                                Könyvjelzők
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport('history')}
                                className="bg-[#205daa]/20 hover:bg-[#205daa]/30 border-[#205daa]/30 text-white justify-start"
                            >
                                <HistoryIcon className="h-4 w-4 mr-2" />
                                Előzmények
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport('plyrCSS')}
                                className="bg-[#205daa]/20 hover:bg-[#205daa]/30 border-[#205daa]/30 text-white justify-start"
                            >
                                <Palette className="h-4 w-4 mr-2" />
                                Lejátszó CSS
                            </Button>
                        </div>
                    </div>

                    {/* Import Section */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-white">Importálás</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleImportClick}
                            disabled={isImporting}
                            className="w-full bg-[#205daa]/20 hover:bg-[#205daa]/30 border-[#205daa]/30 text-white"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            {isImporting ? 'Importálás...' : 'Fájl kiválasztása'}
                        </Button>
                    </div>

                    {/* Import Result */}
                    {importResult && (
                        <div
                            className={`p-3 rounded-md flex items-start gap-2 ${
                                importResult.success
                                    ? 'bg-green-500/10 border border-green-500/30'
                                    : 'bg-red-500/10 border border-red-500/30'
                            }`}
                        >
                            {importResult.success ? (
                                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                            ) : (
                                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                            )}
                            <p className={`text-xs ${importResult.success ? 'text-green-300' : 'text-red-300'}`}>
                                {importResult.message}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
