import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Switch } from './ui/switch'
import { KeyboardShortcut } from './keyboard-shortcut'
import { Search, List, Home } from 'lucide-react'
import type { Settings, keyBind } from '../global'
import React from 'react'

interface NavigationSettingsTabProps {
    settings: Settings
    onSettingsChange: (id: string, updatedSetting: { [key: string]: any }) => void
}

export default function NavigationSettingsTab({ settings, onSettingsChange }: NavigationSettingsTabProps) {
    const handleToggle = (path: string, checked: boolean) => {
        const keys = path.split('.')
        let current: any = { ...settings }
        let target = current

        for (let i = 0; i < keys.length - 1; i++) {
            target[keys[i]] = { ...target[keys[i]] }
            target = target[keys[i]]
        }
        target[keys[keys.length - 1]] = checked

        // Get the top-level nav object
        onSettingsChange('nav', current.nav)
    }

    const handleKeyBindChange = (path: string, newKeyBind: keyBind) => {
        const keys = path.split('.')
        let current: any = { ...settings }
        let target = current

        for (let i = 0; i < keys.length - 1; i++) {
            target[keys[i]] = { ...target[keys[i]] }
            target = target[keys[i]]
        }
        target[keys[keys.length - 1]] = newKeyBind

        onSettingsChange('nav', current.nav)
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Search Box Settings */}
            <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Search className="h-5 w-5 text-[#3f9fff]" />
                            <CardTitle className="text-white text-lg font-medium">Keresőmező</CardTitle>
                        </div>
                        <Switch
                            checked={settings.nav.searchBox.enabled}
                            onCheckedChange={(checked) => handleToggle('nav.searchBox.enabled', checked)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium mb-1.5 text-white">Kereső előhívása</p>
                            <KeyboardShortcut
                                value={settings.nav.searchBox.open}
                                onChange={(keyBind) => handleKeyBindChange('nav.searchBox.open', keyBind)}
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-1.5 text-white">Kereső bezárása</p>
                            <KeyboardShortcut
                                value={settings.nav.searchBox.close}
                                onChange={(keyBind) => handleKeyBindChange('nav.searchBox.close', keyBind)}
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-1.5 text-white">A részletes keresőoldal megnyitása</p>
                            <KeyboardShortcut
                                value={settings.nav.searchBox.openSearch}
                                onChange={(keyBind) => handleKeyBindChange('nav.searchBox.openSearch', keyBind)}
                            />
                        </div>
                        <p className="text-xs text-white/70">
                            Gyorsbillentyűk a bármelyik oldalon elérhető gyorskereső használatához. <br />
                            A telálatok között a nyilakkal lehet navigálni, a kiválasztott billetyűkombinációval pedig megnyitni a találatot.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Episode Navigation Settings */}
            <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <List className="h-5 w-5 text-[#3f9fff]" />
                            <CardTitle className="text-white text-lg font-medium">Leírás</CardTitle>
                        </div>
                        <Switch
                            checked={settings.nav.episode.enabled}
                            onCheckedChange={(checked) => handleToggle('nav.episode.enabled', checked)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium mb-1.5 text-white">Epizód megnyitása</p>
                            <KeyboardShortcut
                                value={settings.nav.episode.open}
                                onChange={(keyBind) => handleKeyBindChange('nav.episode.open', keyBind)}
                            />
                        </div>
                        <p className="text-xs text-white/70">
                            Az epizódok között nyilakkal lehet navigálni, a fenti gyorsbillentyűvel pedig megnyitni a kiválasztott epizódot. <br />
                            Ha pedig úgy nyomod meg a gombot, hogy előtte nem választottál ki egy epizódot, akkor megnyílik ahol tartottál a sorozatban. <br />
                            Ha nincs elmentett ilyen hely, akkor pedig a következő epizód kezdődik el.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Main Page Navigation Settings */}
            <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Home className="h-5 w-5 text-[#3f9fff]" />
                            <CardTitle className="text-white text-lg font-medium">Főoldal</CardTitle>
                        </div>
                        <Switch
                            checked={settings.nav.mainPage.enabled}
                            onCheckedChange={(checked) => handleToggle('nav.mainPage.enabled', checked)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium mb-1.5 text-white">Kiválasztott modul megnyitása</p>
                            <KeyboardShortcut
                                value={settings.nav.mainPage.open}
                                onChange={(keyBind) => handleKeyBindChange('nav.mainPage.open', keyBind)}
                            />
                        </div>
                        <p className="text-xs text-white/70">
                            A főoldalon megjelenő modulok között nyilakkal lehet navigálni, a fenti
                            gyorsbillentyűvel pedig megnyitni a kiválasztott modult.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
