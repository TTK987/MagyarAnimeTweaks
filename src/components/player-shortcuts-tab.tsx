import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { KeyboardShortcut } from './keyboard-shortcut'
import { Button } from './ui/button'
import { Play, VolumeX, Maximize, Plus, Trash2 } from 'lucide-react'
import { FaVolumeUp, FaVolumeDown } from 'react-icons/fa'
import type { Settings, keyBind } from '../global'
import React, { useState } from 'react'

interface PlayerShortcutsTabProps {
    settings: Settings
    onSettingsChange: (id: string, updatedSetting: { [key: string]: any }) => void
}

interface ShortcutGroupProps {
    title: string
    icon: React.ReactNode
    shortcuts: keyBind[]
    onShortcutsChange: (shortcuts: keyBind[]) => void
    description: string
}

function ShortcutGroup({ title, icon, shortcuts, onShortcutsChange, description }: ShortcutGroupProps) {
    const [newlyAddedIndex, setNewlyAddedIndex] = useState<number | null>(null)

    const handleAdd = () => {
        const newKeyBind: keyBind = {
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            key: '',
        }
        setNewlyAddedIndex(shortcuts.length)
        onShortcutsChange([...shortcuts, newKeyBind])
    }

    const handleRemove = (index: number) => {
        const newShortcuts = shortcuts.filter((_, i) => i !== index)
        setNewlyAddedIndex(null)
        onShortcutsChange(newShortcuts)
    }

    const handleChange = (index: number, newKeyBind: keyBind) => {
        const newShortcuts = [...shortcuts]
        newShortcuts[index] = newKeyBind
        setNewlyAddedIndex(null)
        onShortcutsChange(newShortcuts)
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icon}
                    <p className="text-sm font-medium text-white">{title}</p>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAdd}
                    className="h-7 bg-[#205daa]/20 hover:bg-[#205daa]/30 border-[#205daa]/30 text-white"
                >
                    <Plus className="h-3 w-3 mr-1" />
                    Hozzáadás
                </Button>
            </div>
            <div className="space-y-2">
                {shortcuts.length === 0 ? (
                    <p className="text-xs text-white/50 italic">Nincs beállítva billentyűkombináció</p>
                ) : (
                    shortcuts.map((shortcut, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="grow">
                                <KeyboardShortcut
                                    value={shortcut}
                                    onChange={(newKeyBind) => handleChange(index, newKeyBind)}
                                    autoFocus={index === newlyAddedIndex}
                                />
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemove(index)}
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
            <p className="text-xs text-white/70">{description}</p>
        </div>
    )
}

export default function PlayerShortcutsTab({ settings, onSettingsChange }: PlayerShortcutsTabProps) {
    const handleShortcutsChange = (shortcutKey: string, shortcuts: keyBind[]) => {
        const updatedShortcuts = {
            ...settings.plyr.shortcuts,
            [shortcutKey]: shortcuts,
        }
        onSettingsChange('plyr.shortcuts', updatedShortcuts)
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            <Card className="bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out min-h-[420px]">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                        <Play className="h-5 w-5 text-[#3f9fff]" />
                        <CardTitle className="text-white text-lg font-medium">Lejátszó billentyűparancsok</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <ShortcutGroup
                            title="Lejátszás / Szünet"
                            icon={<Play className="h-4 w-4 text-[#3f9fff]" />}
                            shortcuts={settings.plyr.shortcuts.playPause}
                            onShortcutsChange={(shortcuts) => handleShortcutsChange('playPause', shortcuts)}
                            description="Váltás lejátszás és szünet között"
                        />

                        <div className="border-t border-[#205daa]/20 pt-4">
                            <ShortcutGroup
                                title="Némítás / Visszahangosítás"
                                icon={<VolumeX className="h-4 w-4 text-[#3f9fff]" />}
                                shortcuts={settings.plyr.shortcuts.muteUnmute}
                                onShortcutsChange={(shortcuts) => handleShortcutsChange('muteUnmute', shortcuts)}
                                description="Hang némítása vagy visszakapcsolása"
                            />
                        </div>

                        <div className="border-t border-[#205daa]/20 pt-4">
                            <ShortcutGroup
                                title="Hangerő növelése"
                                icon={<FaVolumeUp className="h-4 w-4 text-[#3f9fff]" />}
                                shortcuts={settings.plyr.shortcuts.volumeUp}
                                onShortcutsChange={(shortcuts) => handleShortcutsChange('volumeUp', shortcuts)}
                                description="Hangerő emelése"
                            />
                        </div>

                        <div className="border-t border-[#205daa]/20 pt-4">
                            <ShortcutGroup
                                title="Hangerő csökkentése"
                                icon={<FaVolumeDown className="h-4 w-4 text-[#3f9fff]" />}
                                shortcuts={settings.plyr.shortcuts.volumeDown}
                                onShortcutsChange={(shortcuts) => handleShortcutsChange('volumeDown', shortcuts)}
                                description="Hangerő csökkentése"
                            />
                        </div>

                        <div className="border-t border-[#205daa]/20 pt-4">
                            <ShortcutGroup
                                title="Teljes képernyő"
                                icon={<Maximize className="h-4 w-4 text-[#3f9fff]" />}
                                shortcuts={settings.plyr.shortcuts.fullscreen}
                                onShortcutsChange={(shortcuts) => handleShortcutsChange('fullscreen', shortcuts)}
                                description="Váltás teljes képernyős módra"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
