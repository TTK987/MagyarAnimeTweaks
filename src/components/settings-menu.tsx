import { Button } from './ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Save, RotateCcw, Settings2, HelpCircle, MoreVertical } from 'lucide-react'
import React from 'react'

interface SettingsMenuProps {
    onSave: () => void
    onReset: () => void
    onDefault: () => void
    onHelp: () => void
}

export function SettingsMenu({ onSave, onReset, onDefault, onHelp }: SettingsMenuProps) {
    return (
        <div className="flex items-center gap-2">
            <Button onClick={onSave} className="bg-[#205daa] border-[#1a4a8a] hover:bg-[#1a4a8a]">
                <Save className="mr-2 h-4 w-4" />
                Mentés
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="bg-[#232838] border-[#2c3347] hover:bg-[#2c3347]"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#232838] border-[#2c3347]">
                    <DropdownMenuItem
                        onClick={onReset}
                        className="hover:bg-[#2c3347] cursor-pointer"
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Visszaállítás
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={onDefault}
                        className="hover:bg-[#2c3347] cursor-pointer"
                    >
                        <Settings2 className="mr-2 h-4 w-4" />
                        Alapértelmezett
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={onHelp}
                        className="hover:bg-[#2c3347] cursor-pointer"
                    >
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Segítség
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
