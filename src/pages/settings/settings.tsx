import { KeyboardRecordingProvider } from '../../components/keyboard-recording-context'
import { FaBackward, FaBookmark, FaForward, FaHistory, FaPlay } from 'react-icons/fa'
import { TabsList, TabsTrigger, TabsContent, Tabs } from '../../components/ui/tabs'
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NavigationSettingsTab from '../../components/navigation-settings-tab'
import AniSkipSettingCard from '../../components/aniskip-setting-card'
import { Compass, Palette, Settings, Sliders } from 'lucide-react'
import AdvancedSettings from "../../components/advanced-settings"
import PlyrSettingsTab from '../../components/plyr-settings-tab'
import { BsSkipEndFill, BsSkipStartFill } from 'react-icons/bs'
import { MdOutlineTimer, MdPlaylistPlay } from 'react-icons/md'
import { SettingsMenu } from '../../components/settings-menu'
import ResumeSettingCard from '../../components/resume-item'
import type { Settings as SettingsType } from '../../global'
import SettingCard from '../../components/setting-item'
import { createRoot } from 'react-dom/client'
import Footer from '../../components/footer'
import Navbar from '../../components/navbar'
import { useState, useEffect } from 'react'
import Logger from '../../Logger'
import Toast from '../../Toast'
import MAT from '../../MAT'
import React from 'react'

const queryClient = new QueryClient()

function SettingsSite() {
    const [currentSetting, setCurrentSetting] = useState<SettingsType>(MAT.getDefaultSettings())
    const [savedSetting, setSavedSetting] = useState<SettingsType>(MAT.getDefaultSettings())
    const [css, setCSS] = useState<string>('')
    const [activeTab, setActiveTab] = useState('general')

    function onSave() {
        const cleanedSettings = { ...currentSetting }
        if (cleanedSettings.plyr?.shortcuts) {
            const shortcuts = cleanedSettings.plyr.shortcuts
            cleanedSettings.plyr = {
                ...cleanedSettings.plyr,
                shortcuts: {
                    playPause:  shortcuts.playPause ?.filter((s) => s.key !== '') || [],
                    muteUnmute: shortcuts.muteUnmute?.filter((s) => s.key !== '') || [],
                    volumeUp:   shortcuts.volumeUp  ?.filter((s) => s.key !== '') || [],
                    volumeDown: shortcuts.volumeDown?.filter((s) => s.key !== '') || [],
                    fullscreen: shortcuts.fullscreen?.filter((s) => s.key !== '') || [],
                },
            }
        }
        setCurrentSetting(cleanedSettings)
        setSavedSetting(cleanedSettings)
        MAT.settings = cleanedSettings
        Promise.all([MAT.saveSettings(), MAT.savePlyrCSS(css === '' ? MAT.getDefaultPlyrCSS() : css)])
            .then((data) => {
                if (data.includes(false)) {
                    if (!data[1]) {
                        Toast.error('Hiba történt a Plyr CSS mentése során')
                    } else {
                        Toast.error('Hiba történt a beállítások mentése során')
                    }
                }
                Toast.success('A beállítások mentésre kerültek')
            })
            .catch((error) => {
                Logger.error('Hiba a beállítások mentése során:', error)
                Toast.error('Hiba történt a beállítások mentése során')
            })
    }

    function onReset() {
        setCurrentSetting({ ...savedSetting })
        Toast.success('A beállítások visszaállításra kerültek')
    }

    function onDefault() {
        const defaultSettings = MAT.getDefaultSettings()
        setCurrentSetting({ ...defaultSettings })
        Toast.success('A beállítások alaphelyzetbe álltak')
    }

    function onHelp() {
        window.open('https://github.com/TTK987/MagyarAnimeTweaks/blob/main/SETTINGS.md', '_blank')
        Toast.success('A beállítások súgó megnyitva')
    }

    function onSettingsChange(id: string, updatedSetting: { [key: string]: any }) {
        setCurrentSetting((prevSettings: SettingsType) => {
            let newSettings: SettingsType = { ...prevSettings }
            if (id.includes('.')) {
                const keys = id.split('.')
                const lastKey = keys.pop()!
                let target: any = newSettings
                for (const key of keys) {
                    if (!(key in target)) {
                        target[key] = {}
                    }
                    target = target[key]
                }
                target[lastKey] = updatedSetting
            } else if (id === '') {
                newSettings = updatedSetting as SettingsType
            } else {
                // @ts-ignore
                newSettings[id] = updatedSetting
            }
            console.log('Setting changed', id, updatedSetting)
            return newSettings
        })
    }

    const { data: loadedSettings } = useQuery({
        queryKey: ['settings'],
        queryFn: () => MAT.loadSettings(),
        staleTime: Infinity,
    })

    useEffect(() => {
        if (loadedSettings) {
            setCurrentSetting({ ...loadedSettings })
            setSavedSetting({ ...loadedSettings })
        }
    }, [loadedSettings])

    const tabItems = [
        { value: 'general', label: 'Általános', icon: <Settings className="h-4 w-4" /> },
        { value: 'navigation', label: 'Navigáció', icon: <Compass className="h-4 w-4" /> },
        { value: 'player', label: 'Lejátszó', icon: <Palette className="h-4 w-4" /> },
        { value: 'advanced', label: 'Haladó', icon: <Sliders className="h-4 w-4" /> },
    ]

    return (
        <KeyboardRecordingProvider>
            <div className="flex flex-col min-h-screen">
                <Navbar version={MAT.version} eap={MAT.eap} />
                <main className="grow container mx-auto px-4 py-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                        {/* Horizontal Tab Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3 mt-3">
                            <div className="w-full overflow-x-auto">
                                <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-[#0a0e17] border border-[#205daa]/20 p-1 gap-1">
                                    {tabItems.map((tab) => (
                                        <TabsTrigger
                                            key={tab.value}
                                            value={tab.value}
                                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-[#205daa] data-[state=active]:text-white data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-[#205daa]/20"
                                        >
                                            {tab.icon}
                                            <span className="ml-2">{tab.label}</span>
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>
                            <div className="shrink-0">
                                <SettingsMenu onSave={onSave} onReset={onReset} onDefault={onDefault} onHelp={onHelp} />
                            </div>
                        </div>

                        {/* General Settings Tab */}
                        <TabsContent value="general" className="mt-0">
                            {/* Basic Settings - Flex layout with centered last item for even count */}
                            <div className="flex flex-wrap justify-center gap-4 items-stretch">
                                <div className="w-full lg:w-[calc(50%-0.5rem)] flex">
                                    <SettingCard
                                        id="backwardSkip"
                                        title="Vissza ugrás"
                                        icon={<FaBackward className="h-5 w-5 text-[#3f9fff]" />}
                                        setting={currentSetting.backwardSkip}
                                        onSettingChange={onSettingsChange}
                                        description="Billentyűparancs a videóban való vissza ugrásra"
                                        className="h-full"
                                    />
                                </div>
                                <div className="w-full lg:w-[calc(50%-0.5rem)] flex">
                                    <SettingCard
                                        id="forwardSkip"
                                        title="Előre ugrás"
                                        icon={<FaForward className="h-5 w-5 text-[#3f9fff]" />}
                                        setting={currentSetting.forwardSkip}
                                        onSettingChange={onSettingsChange}
                                        description="Billentyűparancs a videóban való előre ugrásra"
                                        className="h-full"
                                    />
                                </div>
                                <div className="w-full lg:w-[calc(50%-0.5rem)] flex">
                                    <SettingCard
                                        id="previousEpisode"
                                        title="Előző epizód"
                                        icon={<BsSkipStartFill className="h-7 w-7 text-[#3f9fff]" />}
                                        setting={currentSetting.previousEpisode}
                                        onSettingChange={onSettingsChange}
                                        description="Billentyűparancs az előző epizódra ugrásra"
                                        className="h-full"
                                    />
                                </div>
                                <div className="w-full lg:w-[calc(50%-0.5rem)] flex">
                                    <SettingCard
                                        id="nextEpisode"
                                        title="Következő epizód"
                                        icon={<BsSkipEndFill className="h-7 w-7 text-[#3f9fff]" />}
                                        setting={currentSetting.nextEpisode}
                                        onSettingChange={onSettingsChange}
                                        description="Billentyűparancs a következő epizódra ugrásra"
                                        className="h-full"
                                    />
                                </div>
                                <div className="w-full lg:w-[calc(50%-0.5rem)] flex">
                                    <SettingCard
                                        id="autoNextEpisode"
                                        title="Automatikus következő epizód"
                                        icon={<MdPlaylistPlay className="h-7 w-7 text-[#3f9fff]" />}
                                        setting={currentSetting.autoNextEpisode}
                                        onSettingChange={onSettingsChange}
                                        description="Automatikusan X másodperccel az epizód vége előtt ugrik a következő epizódra (0 = a videó vége)"
                                        className="h-full"
                                    />
                                </div>
                                <div className="w-full lg:w-[calc(50%-0.5rem)] flex">
                                    <SettingCard
                                        id="autoplay"
                                        title="Automatikus lejátszás"
                                        icon={<FaPlay className="h-5 w-5 text-[#3f9fff]" />}
                                        setting={currentSetting.autoplay}
                                        onSettingChange={onSettingsChange}
                                        description="Megpróbálja automatikusan lejátszani a videót, ha lehetséges"
                                        className="h-full"
                                    />
                                </div>
                                <div className="w-full lg:w-[calc(50%-0.5rem)] flex">
                                    <SettingCard
                                        id="skip"
                                        title="Alapértelmezett ugrás idő"
                                        icon={<MdOutlineTimer className="h-7 w-7 text-[#3f9fff]" />}
                                        setting={currentSetting.skip}
                                        onSettingChange={onSettingsChange}
                                        description="Az alapértelmezett ugrás idő (másodpercben) a bal és jobb nyilakkal"
                                        className="h-full"
                                    />
                                </div>
                                <div className="w-full lg:w-[calc(50%-0.5rem)] flex">
                                    <AniSkipSettingCard
                                        setting={currentSetting.plyr.plugins.aniSkip}
                                        onSettingChange={onSettingsChange}
                                        className="h-full"
                                    />
                                </div>
                                <div className="w-full lg:w-[calc(50%-0.5rem)] flex">
                                    <SettingCard
                                        id="bookmarks"
                                        title="Könyvjelzők"
                                        icon={<FaBookmark className="h-5 w-5 text-[#3f9fff]" />}
                                        setting={currentSetting.bookmarks}
                                        onSettingChange={onSettingsChange}
                                        description="A könyvjelző funkció engedélyezése"
                                        className="h-full"
                                    />
                                </div>
                                <div className="w-full lg:w-[calc(50%-0.5rem)] flex">
                                    <ResumeSettingCard
                                        id="history"
                                        title="Előzmények"
                                        icon={<FaHistory className="h-5 w-5 text-[#3f9fff]" />}
                                        setting={currentSetting.history}
                                        onSettingChange={onSettingsChange}
                                        description="A megkezdett animék folytatásának beállításai"
                                        className="h-full"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Navigation Tab */}
                        <TabsContent value="navigation" className="mt-0">
                            <NavigationSettingsTab settings={currentSetting} onSettingsChange={onSettingsChange} />
                        </TabsContent>

                        {/* Player Tab - Color picker, preview and shortcuts in sub-tabs */}
                        <TabsContent value="player" className="mt-0">
                            <PlyrSettingsTab
                                onSettingsChange={onSettingsChange}
                                onCSSChange={setCSS}
                                settings={currentSetting}
                            />
                        </TabsContent>

                        {/* Advanced Tab - Now with Import/Export */}
                        <TabsContent value="advanced" className="mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                                <AdvancedSettings
                                    settings={currentSetting}
                                    onSettingChange={onSettingsChange}
                                    onSettingsImport={(settings) => {
                                        setCurrentSetting(settings)
                                        Toast.success('Beállítások importálva')
                                    }}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </main>
                <Footer version={MAT.version} eap={MAT.eap} />
            </div>
        </KeyboardRecordingProvider>
    )
}

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <SettingsSite/>
        </QueryClientProvider>
    </React.StrictMode>,
)

declare global {
    interface Window {
        Toast: typeof Toast
        MAT: typeof MAT
        Logger: typeof Logger
    }
}

window.Toast = Toast
window.MAT = MAT
window.Logger = Logger
