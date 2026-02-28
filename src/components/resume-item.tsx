import type React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Switch } from './ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface ResumeSettingCardProps {
    id: string
    setting: {
        enabled: boolean
        mode: "ask" | "auto"
        clearAfter: "1w" | "1m" | "3m" | "1y" | "never"
    }
    icon: React.ReactNode
    title: string
    description: string
    onSettingChange: (id: string, updatedSetting: { [key: string]: any }) => void
    className?: string
}

export default function ResumeSettingCard({
    id,
    setting,
    icon,
    title,
    description,
    onSettingChange,
    className,
}: ResumeSettingCardProps) {
    const handleToggleChange = (checked: boolean) => {
        const updatedSetting = { ...setting, enabled: checked }
        onSettingChange(id, updatedSetting)
    }

    const handleModeChange = (mode: string) => {
        const updatedSetting = { ...setting, mode }
        onSettingChange(id, updatedSetting)
    }

    const handleCTimeChange = (CTime: string) => {
        const updatedSetting = { ...setting, clearAfter: CTime }
        onSettingChange(id, updatedSetting)
    }

    return (
        <Card className={`bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md p-1 hover:shadow-lg transition-shadow duration-300 ease-in-out w-full ${className || ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {icon}
                        <CardTitle className="text-white text-lg font-medium">{title}</CardTitle>
                    </div>
                    <Switch
                        id={`${id}-toggle`}
                        checked={setting.enabled}
                        onCheckedChange={handleToggleChange}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium mb-1.5 text-white">Folytatás módja</p>
                        <Select value={setting.mode} onValueChange={handleModeChange}>
                            <SelectTrigger className="w-full bg-[#182031] border-[#205daa]/30 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#182031] border-[#205daa]/30">
                                <SelectItem
                                    value="ask"
                                    className="text-white hover:bg-[#205daa]/20"
                                >
                                    Kérdezzen rá
                                </SelectItem>
                                <SelectItem
                                    value="auto"
                                    className="text-white hover:bg-[#205daa]/20"
                                >
                                    Automatikus
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <p className="text-sm font-medium mb-1.5 text-white">Törlési idő</p>
                        <Select value={setting.clearAfter} onValueChange={handleCTimeChange}>
                            <SelectTrigger className="w-full bg-[#182031] border-[#205daa]/30 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#182031] border-[#205daa]/30">
                                <SelectItem value="1w" className="text-white hover:bg-[#205daa]/20">
                                    1 hét
                                </SelectItem>
                                <SelectItem value="1m" className="text-white hover:bg-[#205daa]/20">
                                    1 hónap
                                </SelectItem>
                                <SelectItem value="3m" className="text-white hover:bg-[#205daa]/20">
                                    3 hónap
                                </SelectItem>
                                <SelectItem value="1y" className="text-white hover:bg-[#205daa]/20">
                                    1 év
                                </SelectItem>
                                <SelectItem
                                    value="never"
                                    className="text-white hover:bg-[#205daa]/20"
                                >
                                    Soha
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {description && <p className="text-xs text-[#fff]/70">{description}</p>}
                </div>
            </CardContent>
        </Card>
    )
}
