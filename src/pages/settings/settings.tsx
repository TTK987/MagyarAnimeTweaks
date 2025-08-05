import {TabsList, TabsTrigger, TabsContent} from '../../components/ui/tabs'
import AdvancedSettings from "../../components/advanced-settings";
import PlyrSettingsTab from '../../components/plyr-settings-tab'
import {BsSkipEndFill, BsSkipStartFill} from 'react-icons/bs'
import {MdOutlineTimer, MdPlaylistPlay} from 'react-icons/md'
import {FaBackward, FaBookmark, FaForward, FaHistory, FaPlay} from 'react-icons/fa'
import {SettingsMenu} from '../../components/settings-menu'
import ResumeSettingCard from '../../components/resume-item'
import SettingCard from '../../components/setting-item'
import {Tabs} from '../../components/ui/tabs'
import {createRoot} from 'react-dom/client'
import Footer from '../../components/footer'
import Navbar from '../../components/navbar'
import type {SettingsV019} from '../../global'
import {useState, useEffect} from 'react'
import Logger from '../../Logger'
import Toast from '../../Toast'
import MAT from '../../MAT'
import React from 'react'



function SettingsSite() {
    const [currentSetting, setCurrentSetting] = useState<SettingsV019>(MAT.getDefaultSettings())
    const [savedSetting, setSavedSetting] = useState<SettingsV019>(MAT.getDefaultSettings())
    const [css, setCSS] = useState<string>('')

    function onSave() {
        setSavedSetting(currentSetting)
        MAT.settings = currentSetting
        MAT.saveSettings()
        MAT.savePlyrCSS(css === '' ? MAT.getDefaultPlyrCSS() : css)
        Toast.success('A beállítások mentésre kerültek')
    }

    function onReset() {
        setCurrentSetting({...savedSetting})
        Toast.success('A beállítások visszaállításra kerültek')
    }

    function onDefault() {
        const defaultSettings = MAT.getDefaultSettings()
        setCurrentSetting({...defaultSettings})
        Toast.success('A beállítások alaphelyzetbe álltak')
    }

    function onHelp() {
        window.open('https://github.com/TTK987/MagyarAnimeTweaks/blob/main/SETTINGS.md', '_blank')
        Toast.success('A beállítások súgó megnyitva')
    }

    function onSettingsChange(id: string, updatedSetting: { [key: string]: any }) {
        setCurrentSetting((prevSettings: SettingsV019) => {
            const newSettings: SettingsV019 = {...prevSettings}
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
            } else {
                // @ts-ignore
                newSettings[id] = updatedSetting
            }
            console.log('Setting changed', id, updatedSetting)
            return newSettings
        })
    }

    useEffect(() => {
        MAT.loadSettings().then((settings: SettingsV019) => {
            if (settings) {
                setCurrentSetting({...settings})
                setSavedSetting({...settings})
            } else {
                console.error('Failed to load settings')
                const defaultSettings = MAT.getDefaultSettings()
                setCurrentSetting({...defaultSettings})
                setSavedSetting({...defaultSettings})
            }
        })
    }, [])

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar version={MAT.getVersion()} eap={MAT.isEAP()}/>
            <main className="flex-grow container mx-auto px-4 py-6 min-h-screen">
                <Tabs defaultValue="normal" className="min-w-full">
                    <div className="flex flex-row justify-between items-center mb-6 gap-4 mt-4">
                        <div className="relative w-full overflow-x-auto h-11 flex items-center">
                            <TabsList
                                className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md p-1 hover:shadow-lg transition-shadow duration-300 ease-in-out">
                                <TabsTrigger
                                    value="normal"
                                    className="data-[state=active]:bg-[#205daa] data-[state=active]:text-white"
                                >
                                    Beállítások
                                </TabsTrigger>
                                <TabsTrigger
                                    value="bookmark"
                                    className="data-[state=active]:bg-[#205daa] data-[state=active]:text-white"
                                >
                                    Könyvjelzők & Előzmények
                                </TabsTrigger>
                                <TabsTrigger
                                    value="plyr"
                                    className="data-[state=active]:bg-[#205daa] data-[state=active]:text-white"
                                >
                                    Lejátszó
                                </TabsTrigger>
                                <TabsTrigger
                                    value="dev"
                                    className="data-[state=active]:bg-[#205daa] data-[state=active]:text-white"
                                >
                                    Fejlesztői beállítások
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="flex items-center gap-2">
                            <SettingsMenu
                                onSave={onSave}
                                onReset={onReset}
                                onDefault={onDefault}
                                onHelp={onHelp}
                            />
                        </div>
                    </div>
                    <div className="flex flex-row justify-between items-center mb-6 gap-4 mt-4">
                        <TabsContent
                            value="normal"
                            className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4"
                        >
                            <SettingCard
                                id="forwardSkip"
                                title="Előre ugrás"
                                icon={<FaForward className="h-5 w-5 text-[#3f9fff]"/>}
                                setting={currentSetting.forwardSkip}
                                onSettingChange={onSettingsChange}
                                description="Billentyűparancs a videóban való előre ugrásra"
                            />
                            <SettingCard
                                id="backwardSkip"
                                title="Vissza ugrás"
                                icon={<FaBackward className="h-5 w-5 text-[#3f9fff]"/>}
                                setting={currentSetting.backwardSkip}
                                onSettingChange={onSettingsChange}
                                description="Billentyűparancs a videóban való vissza ugrásra"
                            />
                            <SettingCard
                                id="nextEpisode"
                                title="Következő epizód"
                                icon={<BsSkipEndFill className="h-7 w-7 text-[#3f9fff]"/>}
                                setting={currentSetting.nextEpisode}
                                onSettingChange={onSettingsChange}
                                description="Billentyűparancs a következő epizódra ugrásra"
                            />
                            <SettingCard
                                id="previousEpisode"
                                title="Előző epizód"
                                icon={<BsSkipStartFill className="h-7 w-7 text-[#3f9fff]"/>}
                                setting={currentSetting.previousEpisode}
                                onSettingChange={onSettingsChange}
                                description="Billentyűparancs az előző epizódra ugrásra"
                            />
                            <SettingCard
                                id="autoNextEpisode"
                                title="Automatikus következő epizód"
                                icon={<MdPlaylistPlay className="h-7 w-7 text-[#3f9fff]"/>}
                                setting={currentSetting.autoNextEpisode}
                                onSettingChange={onSettingsChange}
                                description="Automatikusan X másodperccel az epizód vége előtt ugrik a következő epizódra (0 = a videó vége)"
                            />
                            <SettingCard
                                id="autoplay"
                                title="Automatikus lejátszás"
                                icon={<FaPlay className="h-5 w-5 text-[#3f9fff]"/>}
                                setting={currentSetting.autoplay}
                                onSettingChange={onSettingsChange}
                                description="Megpróbálja automatikusan lejátszani a videót, ha lehetséges"
                            />
                            <div className="sm:col-span-2 sm:justify-self-center w-[50%]">
                                <SettingCard
                                    id="skip"
                                    title="Ugrás"
                                    icon={<MdOutlineTimer className="h-7 w-7 text-[#3f9fff]"/>}
                                    setting={currentSetting.skip}
                                    onSettingChange={onSettingsChange}
                                    description="Az alapértelmezett ugrás idő (másodpercben) a bal és jobb nyilakkal"
                                />
                            </div>
                        </TabsContent>
                        <TabsContent
                            value="bookmark"
                            className="w-full grid grid-cols-1 sm:grid-cols-2  gap-4"
                        >
                            <SettingCard
                                id="bookmarks"
                                title="Könyvjelzők"
                                icon={<FaBookmark className="h-5 w-5 text-[#3f9fff]"/>}
                                setting={currentSetting.bookmarks}
                                onSettingChange={onSettingsChange}
                                description="A könyvjelző funkció engedélyezése"
                            />
                            <ResumeSettingCard
                                id="resume"
                                title="Előzmények"
                                icon={<FaHistory className="h-5 w-5 text-[#3f9fff]"/>}
                                setting={currentSetting.resume}
                                onSettingChange={onSettingsChange}
                                description="A megkezdett animék folytatásának beállításai"
                            />
                        </TabsContent>
                        <TabsContent
                            value="plyr"
                            className="w-full grid grid-cols-1 sm:grid-cols-2  gap-4"
                        >
                            <PlyrSettingsTab
                                onSettingsChange={onSettingsChange}
                                onCSSChange={setCSS}
                                settings={currentSetting}
                            />
                        </TabsContent>
                        <TabsContent
                            value="dev"
                            className="w-full grid grid-cols-2 gap-4 items-start"
                        >
                            <AdvancedSettings
                                settings={currentSetting}
                                onSettingChange={onSettingsChange}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </main>
            <Footer version={MAT.getVersion()} eap={MAT.isEAP()}/>
        </div>
    )
}

const root = createRoot(document.getElementById('root') as HTMLElement)
root.render(
    <React.StrictMode>
        <SettingsSite/>
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
