import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Switch } from './ui/switch'
import { KeyboardShortcut } from './keyboard-shortcut'

interface SettingCardProps {
    id: string
    setting: {
        enabled?: boolean
        time?: number
        keyBind?: {
            ctrlKey: boolean
            altKey: boolean
            shiftKey: boolean
            metaKey: boolean
            key: string
        }
    }
    icon: React.ReactNode
    title: string
    description: string
    onSettingChange: (id: string, updatedSetting: { [key: string]: any }) => void
    className?: string
}

export default function SettingCard({id, setting, icon, title, description, onSettingChange, className,}: SettingCardProps) {
    const handleToggleChange = (checked: boolean) => {
        const updatedSetting = { ...setting, enabled: checked }
        onSettingChange(id, updatedSetting)
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const updatedSetting = {
            ...setting,
            time: Math.max(0, Math.min(300, Number(e.target.value))),
        }
        onSettingChange(id, updatedSetting)
    }

    const handleKeyBindChange = (newKeyBind: {
        ctrlKey: boolean
        altKey: boolean
        shiftKey: boolean
        metaKey: boolean
        key: string
    }) => {
        const updatedSetting = { ...setting, keyBind: newKeyBind }
        onSettingChange(id, updatedSetting)
    }

    const hasToggle = setting && typeof setting.enabled === 'boolean'
    const hasTimeInput = setting && typeof setting.time === 'number'
    const hasKeyBind = setting && typeof setting.keyBind === 'object' && setting.keyBind !== null

    return (
        <Card className={`bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md p-1 hover:shadow-lg transition-shadow duration-300 ease-in-out w-full ${className || ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {icon}
                        <CardTitle className="text-white text-lg font-medium">{title}</CardTitle>
                    </div>
                    {hasToggle && (
                        <Switch
                            id={`${id}-toggle`}
                            checked={setting.enabled}
                            onCheckedChange={handleToggleChange}
                        />
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {hasTimeInput && (
                        <div>
                            <p className="text-sm font-medium mb-1.5 text-white">
                                Időtartam (másodpercben)
                            </p>
                            <input
                                id={`${id}-time`}
                                type="number"
                                value={setting.time}
                                onChange={handleTimeChange}
                                min={0}
                                max={300}
                                step={1}
                                className=" appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none w-full bg-[#182031] gap-2 p-2 border border-[#205daa]/30 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#3f9fff]"
                            />
                        </div>
                    )}

                    {hasKeyBind && (
                        <div>
                            <p className="text-sm font-medium mb-1.5 text-white">
                                Billentyűkombináció
                            </p>
                            <KeyboardShortcut
                                value={setting.keyBind}
                                onChange={handleKeyBindChange}
                            />
                        </div>
                    )}
                    {description && <p className="text-xs text-white/70">{description}</p>}
                </div>
            </CardContent>
        </Card>
    )
}
