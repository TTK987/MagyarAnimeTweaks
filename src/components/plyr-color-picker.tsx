import { Palette} from "lucide-react"
import ControlledColorInput from "./controlled-color-input";

interface PlyrColorPickerProps {
    colors: { [key: string]: string }
    onColorsChange: (colors: { [key: string]: string }) => void
}

const colorOptions = [
    { key: "colorMain", label: "Fő szín" },
    { key: "videoBackground", label: "Videó háttere"},
    { key: "badgeBackground", label: "Jelvény háttere"},
    { key: "badgeTextColor", label: "Jelvény szöveg színe"},
    { key: "videoControlColor", label: "Vezérlő színe"},
    { key: "videoControlColorHover", label: "Vezérlő hover"},
    { key: "menuBackground", label: "Menü háttér"},
    { key: "menuColor", label: "Menü színe"},
    { key: "menuArrowColor", label: "Menü nyílainak színe"},
    { key: "menuBorderColor", label: "Menü kerete"},
    { key: "menuBorderShadowColor", label: "Menü árnyéka"},
    { key: "menuBackBorderColor", label: "Menü vissza gomb kerete"},
    { key: "progressLoadingBackground", label: "Betöltés háttere"},
    { key: "videoProgressBufferedBackground", label: "Buffer háttere"},
    { key: "rangeThumbBackground", label: "Csúszka gomb"},
    { key: "rangeFillBackground", label: "Csúszka kitöltés háttere"},
    { key: "videoRangeThumbActiveShadowColor", label: "Csúszka aktív árnyéka"},
    { key: "tooltipBackground", label: "Tooltip háttere"},
    { key: "tooltipColor", label: "Tooltip színe"},
];

export default function PlyrColorPicker({ colors, onColorsChange }: PlyrColorPickerProps) {
    const handleColorChange = (key: string, value: string) => {
        const newColors = { ...colors, [key]: value }
        onColorsChange(newColors)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-[#3f9fff]" />
                <p className="text-sm font-medium text-white">Színbeállítások</p>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {colorOptions.map((option) => (
                    colors[option.key] !== undefined && (
                            <ControlledColorInput
                                id={option.key}
                                label={option.label}
                                value={colors[option.key]}
                                onChange={(value) => handleColorChange(option.key, value)}
                            />
                    )
                ))}
            </div>
        </div>
    )
}
