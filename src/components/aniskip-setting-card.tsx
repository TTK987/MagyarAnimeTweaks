import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Switch } from './ui/switch'
import { KeyboardShortcut } from './keyboard-shortcut'
import { Check } from 'lucide-react'
import AniSkipIcon from './icons/aniskip-icon'
import type { Settings, keyBind } from '../global'
import type { SkipType } from '../api/AniSkip'

interface AniSkipSettingCardProps {
    setting: Settings['plyr']['plugins']['aniSkip']
    onSettingChange: (id: string, updatedSetting: { [key: string]: any }) => void
    className?: string
}

function StyledCheckbox({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={`flex items-center justify-center h-4 w-4 shrink-0 rounded border transition-colors duration-200
                ${disabled ? 'opacity-30 cursor-not-allowed border-[#205daa]/20 bg-[#0a0e17]/40' : 'cursor-pointer'}
                ${checked && !disabled ? 'bg-[#205daa] border-[#3f9fff] text-white' : ''}
                ${!checked && !disabled ? 'border-[#205daa]/50 bg-[#0a0e17] hover:border-[#3f9fff]/70' : ''}
            `}
        >
            {checked && <Check className="h-3 w-3" strokeWidth={3} />}
        </button>
    )
}

export default function AniSkipSettingCard({ setting, onSettingChange, className }: AniSkipSettingCardProps) {
    const handleToggleChange = (checked: boolean) => {
        const updatedSetting = { ...setting, enabled: checked }
        onSettingChange('plyr.plugins.aniSkip', updatedSetting)
    }

    const handleKeyBindChange = (newKeyBind: keyBind) => {
        const updatedSetting = { ...setting, keyBind: newKeyBind }
        onSettingChange('plyr.plugins.aniSkip', updatedSetting)
    }

    const handleSkipTypeChange = (type: SkipType, checked: boolean) => {
        const skips = setting.skips || []
        const autoSkip = setting.autoSkip || []
        const updatedSkips = checked ? [...skips, type] : skips.filter((s) => s !== type)
        // If disabling skip, also disable auto-skip for this type
        const updatedAutoSkip = checked ? autoSkip : autoSkip.filter((s) => s !== type)
        const updatedSetting = { ...setting, skips: updatedSkips, autoSkip: updatedAutoSkip }
        onSettingChange('plyr.plugins.aniSkip', updatedSetting)
    }

    const handleAutoSkipTypeChange = (type: SkipType, checked: boolean) => {
        const skips = setting.autoSkip || []
        const updatedSkips = checked ? [...skips, type] : skips.filter((s) => s !== type)
        const updatedSetting = { ...setting, autoSkip: updatedSkips }
        onSettingChange('plyr.plugins.aniSkip', updatedSetting)
    }

    const allowedSkipTypes: { type: SkipType; label: string }[] = [
        { type: 'op', label: 'Opening' },
        { type: 'ed', label: 'Ending' },
    ]

    return (
        <Card className={`bg-[#0a0e17] border-[#205daa]/20 rounded-lg shadow-md p-1 hover:shadow-lg transition-shadow duration-300 ease-in-out w-full ${className || ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AniSkipIcon className="h-5 w-7 text-[#3f9fff]" />
                        <CardTitle className="text-white text-lg font-medium">AniSkip</CardTitle>
                    </div>
                    <Switch checked={setting.enabled} onCheckedChange={handleToggleChange} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-xs text-white/70">
                        Az <a href="https://github.com/aniskip/aniskip-api" target="_blank" rel="noreferrer" className="underline hover:text-[#3f9fff]">AniSkip API</a> segítségével automatikusan átugorhatod az anime részek opening és ending részeit.
                    </p>

                    <div>
                        <p className="text-sm font-medium mb-1.5 text-white">Ugrás billentyű</p>
                        <KeyboardShortcut value={setting.keyBind} onChange={handleKeyBindChange} />
                        <p className="text-xs text-white/50 mt-1">
                            Használd ezt a billentyűkombinációt az aktuális opening vagy ending rész átugrásához.
                        </p>
                    </div>

                    <div className="rounded-lg bg-[#182031]/50 border border-[#205daa]/20 overflow-hidden">
                        {/* Header row */}
                        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-3 py-1.5 border-b border-[#205daa]/20">
                            <span className="text-xs font-medium text-white/50">Típus</span>
                            <span className="text-xs font-medium text-white/50 w-16 text-center">Ugrás</span>
                            <span className="text-xs font-medium text-white/50 w-16 text-center">Auto</span>
                        </div>
                        {/* Data rows */}
                        {allowedSkipTypes.map(({ type, label }, i) => {
                            const isSkipEnabled = setting.skips?.includes(type) || false
                            return (
                                <div
                                    key={type}
                                    className={`grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-3 py-2 ${i < allowedSkipTypes.length - 1 ? 'border-b border-[#205daa]/10' : ''}`}
                                >
                                    <span className="text-sm text-white">{label}</span>
                                    <div className="w-16 flex justify-center">
                                        <StyledCheckbox
                                            checked={isSkipEnabled}
                                            onChange={(checked) => handleSkipTypeChange(type, checked)}
                                        />
                                    </div>
                                    <div className="w-16 flex justify-center">
                                        <StyledCheckbox
                                            checked={setting.autoSkip?.includes(type) || false}
                                            disabled={!isSkipEnabled}
                                            onChange={(checked) => handleAutoSkipTypeChange(type, checked)}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
