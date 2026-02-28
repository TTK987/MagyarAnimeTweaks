import {Palette, Code, RotateCcw, AlertTriangle, Keyboard} from "lucide-react"
import {TabsList, TabsTrigger, TabsContent, Tabs} from "./ui/tabs"
import PlayerShortcutsTab from "./player-shortcuts-tab"
import PlyrColorPicker from "./plyr-color-picker"
import {useState, useEffect} from "react"
import {useQuery} from "@tanstack/react-query"
import PlayerPreview from "./player-preview"
import {Card, CardContent, CardHeader, CardTitle} from "./ui/card"
import {Switch} from "./ui/switch"
import {Button} from "./ui/button"
import type {Settings} from "../global"
import MAT from "../MAT"
import Toast from "../Toast"

interface PlyrSettingsTabProps {
    settings: Settings
    onSettingsChange: (id: string, updatedSetting: { [key: string]: any }) => void
    onCSSChange: (css: string) => void
}

export default function PlyrSettingsTab({settings, onSettingsChange, onCSSChange}: PlyrSettingsTabProps) {
    const [plyrCSS, setPlyrCSS] = useState(MAT.getDefaultPlyrCSS())
    const [isAdvancedMode, setIsAdvancedMode] = useState(false)
    const [activeSubTab, setActiveSubTab] = useState('design')

    const {data: loadedCSS} = useQuery({
        queryKey: ['plyrCSS'],
        queryFn: () => MAT.loadPlyrCSS(),
        staleTime: Infinity,
    })

    useEffect(() => {
        if (loadedCSS) {
            setPlyrCSS(loadedCSS)
        }
    }, [loadedCSS])

    const handleCSSChange = (css: string) => {
        setPlyrCSS(css)
        onCSSChange(css)
    }

    const handleColorPickerChange = (colors: { [key: string]: string }) => {
        const updatedCSS = plyrCSS.replace(/(--plyr-[^:]+:\s*)([^;]+);/g, (match, prefix, oldValue) => {
            const key = prefix.match(/--plyr-([^:]+):/)?.[1]
            if (!key) return match
            const camelCase = key.replace(/-([a-z])/g, (g: string[]) => g[1].toUpperCase())
            if (colors[camelCase]) {
                return `${prefix}${colors[camelCase]};`
            }
            return match
        })
        handleCSSChange(updatedCSS)
    }

    const resetToDefault = () => {
        const defaultCSS = MAT.getDefaultPlyrCSS()
        handleCSSChange(defaultCSS)
        Toast.success("Plyr CSS visszaállítva az alapértelmezett értékekre")
    }

    const parseColorsFromCSS = (css: string) => {
        const colors: { [key: string]: string } = {}
        const matches = css.match(/--plyr-([^:]+):\s*([^;]+);/g)
        if (matches) {
            matches.forEach((match) => {
                const [, property, value] = match.match(/--plyr-([^:]+):\s*([^;]+);/) || []
                if (property && value) {
                    const camelCase = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
                    colors[camelCase] = value.trim()
                }
            })
        }

        return colors
    }

    const handleMainToggleChange = (checked: boolean) => {
        const updatedSetting = {...settings.plyr, design: checked}
        onSettingsChange("plyr", updatedSetting)
    }

    const getCharacterCountColor = (length: number) => {
        if (length > 10000) return "text-red-400"
        if (length > 8000) return "text-yellow-400"
        return "text-[#fff]/70"
    }

    const getCharacterCountIcon = (length: number) => {
        if (length > 8000) {
            return <AlertTriangle className="h-3 w-3" />
        }
        return null
    }

    const subTabItems = [
        { value: 'design', label: 'Megjelenés', icon: <Palette className="h-4 w-4" /> },
        { value: 'shortcuts', label: 'Billentyűk', icon: <Keyboard className="h-4 w-4" /> },
    ]

    return (
        <div className="col-span-full">
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
                {/* Sub-tabs for player settings */}
                <div className="mb-3">
                    <TabsList className="inline-flex items-center justify-start rounded-lg bg-[#0a0e17] border border-[#205daa]/20 gap-1 h-11 px-1">
                        {subTabItems.map((tab) => (
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

                {/* Design Tab Content */}
                <TabsContent value="design" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Main Settings Panel */}
                        <Card
                            className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Palette className="h-5 w-5 text-[#3f9fff]"/>
                                        <CardTitle className="text-white text-lg font-medium">Lejátszó testreszabás</CardTitle>
                                    </div>
                                    <Switch checked={settings.plyr.design} onCheckedChange={handleMainToggleChange}/>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {/* Mode Toggle */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-white mb-1">Szerkesztési mód</p>
                                            <p className="text-xs text-white/70">
                                                {isAdvancedMode
                                                    ? "Közvetlen CSS szerkesztés teljes kontrollal"
                                                    : "Egyszerű színválasztó használata"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-xs ${!isAdvancedMode ? "text-white" : "text-white/50"}`}>Egyszerű</span>
                                            <Switch checked={isAdvancedMode} onCheckedChange={setIsAdvancedMode}/>
                                            <span
                                                className={`text-xs ${isAdvancedMode ? "text-white" : "text-white/50"}`}>Haladó</span>
                                        </div>
                                    </div>

                                    {/* Simple Mode - Color Picker */}
                                    {!isAdvancedMode && (
                                        <div>
                                            <PlyrColorPicker colors={parseColorsFromCSS(plyrCSS)}
                                                             onColorsChange={handleColorPickerChange}/>
                                        </div>
                                    )}

                                    {/* Advanced Mode - CSS Editor */}
                                    {isAdvancedMode && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Code className="h-4 w-4 text-[#3f9fff]"/>
                                                    <p className="text-sm font-medium text-white">CSS szerkesztő</p>
                                                </div>
                                                <Button size="sm"
                                                        onClick={resetToDefault}
                                                        className="bg-[#205daa]/20 hover:bg-[#205daa]/30 text-white">
                                                    <RotateCcw className="h-3 w-3 mr-1"/>
                                                    Visszaállítás
                                                </Button>
                                            </div>
                                            <textarea
                                                value={plyrCSS}
                                                onChange={(e) => handleCSSChange(e.target.value)}
                                                className="w-full h-96 bg-[#182031] border border-[#205daa]/30 rounded-md px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#205daa]/50 resize-none"
                                                placeholder="CSS kód..."
                                                spellCheck={false}
                                            />
                                            {/* Character count indicator */}
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-white/70">Módosítsd a CSS-t a lejátszó megjelenésének
                                                    testreszabásához</p>
                                                <div className={`flex items-center gap-1 text-xs ${getCharacterCountColor(plyrCSS.length)}`}>
                                                    {getCharacterCountIcon(plyrCSS.length)}
                                                    <span>
                                                        {plyrCSS.length.toLocaleString()} / 10,000 karakter
                                                    </span>
                                                </div>
                                            </div>
                                            {plyrCSS.length > 10000 && (
                                                <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3">
                                                    <div className="flex items-center gap-2 text-red-400 text-sm">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        <span className="font-medium">Figyelem!</span>
                                                    </div>
                                                    <p className="text-red-300 text-xs mt-1">
                                                        A CSS túllépi a 10,000 karakteres korlátot. A beállítások mentése sikertelen lesz.
                                                    </p>
                                                </div>
                                            )}
                                            {plyrCSS.length > 8000 && plyrCSS.length <= 10000 && (
                                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3">
                                                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        <span className="font-medium">Figyelem!</span>
                                                    </div>
                                                    <p className="text-yellow-300 text-xs mt-1">
                                                        Közeledsz a 10,000 karakteres korláthoz.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-white/70 mt-4">Testreszabhatod a videólejátszó megjelenését és színeit</p>
                            </CardContent>
                        </Card>

                        {/* Preview Panel */}
                        <PlayerPreview settings={settings} customCSS={plyrCSS}/>
                    </div>
                </TabsContent>

                {/* Shortcuts Tab Content */}
                <TabsContent value="shortcuts" className="mt-0">
                    <PlayerShortcutsTab
                        settings={settings}
                        onSettingsChange={onSettingsChange}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
