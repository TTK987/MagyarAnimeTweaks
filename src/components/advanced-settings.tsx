import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Switch } from './ui/switch'
import type { Settings } from '../global'
import {
    FaCheckCircle,
    FaFileAlt,
    FaFlask,
} from 'react-icons/fa'
import React from 'react'
import { FaTerminal } from 'react-icons/fa6'
import ImportExportSettings from './import-export-settings'

interface props {
    settings: Settings
    onSettingChange: (id: string, updatedSetting: { [key: string]: any }) => void
    onSettingsImport?: (settings: Settings) => void
}

export default function AdvancedSettings({ settings, onSettingChange, onSettingsImport }: props) {
    return (
        <>
            {/* Left Column - Console Logging and Player Type */}
            <div className="space-y-6">
                {/* Console Logging Setting */}

                <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md p-1 hover:shadow-lg transition-shadow duration-300 ease-in-out w-full">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <FaTerminal className="h-5 w-5 text-[#3f9fff]" />
                                <CardTitle className="text-white text-lg font-medium">
                                    Konzol naplózás
                                </CardTitle>
                            </div>
                            <Switch
                                id="consoleLog"
                                checked={settings.advanced.consoleLog}
                                onCheckedChange={(checked) => {
                                    const updatedSetting = {
                                        ...settings.advanced,
                                        consoleLog: checked,
                                    }
                                    onSettingChange('advanced', updatedSetting)
                                }}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-xs text-white/70">
                                Ez a beállítás engedélyezi, hogy az üzenetek megjelenjenek a
                                konzolon, ezek hasznosak lehetnek hibakereséshez.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Early Access Program setting */}
                <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md p-1 hover:shadow-lg transition-shadow duration-300 ease-in-out w-full">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FaFlask className="h-5 w-5 text-[#f1c40f]" />
                                <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
                                    Early Access Program (EAP)
                                </CardTitle>
                            </div>
                            <Switch
                                id="earlyAccess"
                                checked={settings.eap}
                                onCheckedChange={(checked) => {
                                    const updatedSetting = {
                                        ...settings,
                                        eap: checked,
                                    }
                                    onSettingChange('', updatedSetting)
                                }}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-xs text-white/70">
                                Ez a beállítás lehetővé teszi, hogy hozzáférj a kísérleti
                                funkciókhoz, amelyek még fejlesztés alatt állnak. Ezek a funkciók
                                instabilak / kiforratlanok lehetnek, és olykor hibákat is
                                okozhatnak.
                            </p>
                            <div className="p-3 rounded-md bg-[#1a1f2e] border border-[#205daa]/30">
                                <div className="text-xs font-medium text-white mb-2">
                                    Engedélyezett funkciók{' '}
                                    {settings.eap ? '(aktív)' : '(inaktív)'}:
                                </div>
                                <ul className="space-y-2">
                                    {[].map((feature) => (
                                        <li
                                            key={feature}
                                            className={`flex items-start gap-2 text-xs ${
                                                settings.eap ? 'text-green-300' : 'text-gray-500'
                                            }`}
                                        >
                                            <FaCheckCircle
                                                className={`mt-0.5 h-3 w-3 ${settings.eap ? 'text-green-400' : 'text-gray-600'}`}
                                            />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <ImportExportSettings
                    settings={settings}
                    onSettingsImport={onSettingsImport}
                />
            </div>

            {/* Right Column - Download Name Template */}
            <div>
                <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md p-1 hover:shadow-lg transition-shadow duration-300 ease-in-out w-full h-full">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-4">
                            <FaFileAlt className="h-5 w-5 text-[#3f9fff]" />
                            <CardTitle className="text-white text-lg font-medium">
                                Letöltés fájlnév sablon
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="h-full">
                        <div className="space-y-4 h-full flex flex-col">
                            <div className="text-sm text-gray-400">
                                Testreszabhatod a letöltött fájlok nevét az alábbi változók
                                használatával
                            </div>

                            <input
                                type="text"
                                value={settings.advanced.downloadName}
                                onChange={(e) => {
                                    const updatedSetting = {
                                        ...settings.advanced,
                                        downloadName: e.target.value,
                                    }
                                    onSettingChange('advanced', updatedSetting)
                                }}
                                className="w-full px-3 py-2 bg-[#1a1f2e] border border-[#205daa]/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#205daa] focus:border-transparent"
                                placeholder="%title% - %episode%.rész (%MAT%)"
                            />

                            {/* Variables Help */}
                            <div className="flex-1 p-3 bg-[#1a1f2e] border border-[#205daa]/20 rounded-md">
                                <div className="text-sm font-medium text-white mb-3">
                                    Elérhető változók:
                                </div>
                                <div className="space-y-2 text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <code className="bg-[#0a0e17] px-2 py-1 rounded text-xs">
                                            %title%
                                        </code>
                                        <span>Anime címe</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-[#0a0e17] px-2 py-1 rounded text-xs">
                                            %episode%
                                        </code>
                                        <span>Epizód száma</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-[#0a0e17] px-2 py-1 rounded text-xs">
                                            %0episode%
                                        </code>
                                        <span>Epizód száma nullával (pl. 01, 02)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-[#0a0e17] px-2 py-1 rounded text-xs">
                                            %MAT%
                                        </code>
                                        <span>"MATweaks" szöveg</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-[#0a0e17] px-2 py-1 rounded text-xs">
                                            %source%
                                        </code>
                                        <span>Video forrás neve (pl. Indavideo)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-[#0a0e17] px-2 py-1 rounded text-xs">
                                            %quality%
                                        </code>
                                        <span>Videó minősége (pl. 720p)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-[#0a0e17] px-2 py-1 rounded text-xs">
                                            %group%
                                        </code>
                                        <span>
                                            Fansub csoport neve (ha több van, akkor vesszővel
                                            elválasztva, ha nincs, akkor "Ismeretlen")
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
