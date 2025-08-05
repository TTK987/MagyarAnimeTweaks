import {useEffect, useState} from "react"
import { ChromePicker, type ColorResult } from "react-color"

interface ControlledColorInputProps {
    id: string
    label: string
    value: string
    onChange: (value: string) => void
}

export default function ControlledColorInput({id, label, value, onChange}: ControlledColorInputProps) {
    const [showPicker, setShowPicker] = useState(false)
    const [textValue, setTextValue] = useState(value)

    useEffect(() => {
        let rgb = parseColorToRgb(value || "#00b3ff")
        setTextValue(`#${Math.round(rgb.r).toString(16).padStart(2, '0')}${Math.round(rgb.g).toString(16).padStart(2, '0')}${Math.round(rgb.b).toString(16).padStart(2, '0')}${Math.round((rgb.a !== undefined ? rgb.a : 1) * 255).toString(16).padStart(2, '0')}`)
    })

    const handleColorChange = (color: ColorResult) => {
        const rgba = `#${Math.round(color.rgb.r).toString(16).padStart(2, '0')}${Math.round(color.rgb.g).toString(16).padStart(2, '0')}${Math.round(color.rgb.b).toString(16).padStart(2, '0')}${Math.round((color.rgb.a !== undefined ? color.rgb.a : 1) * 255).toString(16).padStart(2, '0')}`
        setTextValue(rgba)
        onChange(rgba)
    }


    const parseColorToRgb = (colorString: string) => {
        // Handle different color formats
        if (colorString.startsWith("#")) {
            // Convert hex to rgb
            const hex = colorString.slice(1)
            const r = Number.parseInt(hex.slice(0, 2), 16)
            const g = Number.parseInt(hex.slice(2, 4), 16)
            const b = Number.parseInt(hex.slice(4, 6), 16)
            const a = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1
            return { r, g, b, a }
        } else if (colorString.startsWith("rgba")) {
            // Parse rgba
            const match = colorString.match(/rgba?$$(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?$$/)
            if (match) {
                return {
                    r: Number.parseInt(match[1]),
                    g: Number.parseInt(match[2]),
                    b: Number.parseInt(match[3]),
                    a: match[4] ? Number.parseFloat(match[4]) : 1,
                }
            }
        } else if (colorString.startsWith("rgb")) {
            // Parse rgb
            const match = colorString.match(/rgb$$(\d+),\s*(\d+),\s*(\d+)$$/)
            if (match) {
                return {
                    r: Number.parseInt(match[1]),
                    g: Number.parseInt(match[2]),
                    b: Number.parseInt(match[3]),
                    a: 1,
                }
            }
        }

        // Default fallback
        return { r: 0, g: 179, b: 255, a: 1 }
    }

    const colorPreview = parseColorToRgb(textValue)

    return (
        <div className="">
            <label htmlFor={id} className="text-sm font-medium text-white">
                {label}
            </label>
            <div className="flex items-center gap-2">
                <div className="w-12 h-8 relative">
                    <div
                        className="inset-0 rounded-md border-0 w-12 h-8 cursor-pointer overflow-hidden"
                    >
                        <button
                            type="button"
                            onClick={() => setShowPicker(!showPicker)}
                            className="w-12 h-8 rounded border border-[#205daa]/30 bg-[#182031] relative cursor-pointer overflow-hidden"
                            style={{background: `#${colorPreview.r.toString(16).padStart(2, '0')}${colorPreview.g.toString(16).padStart(2, '0')}${colorPreview.b.toString(16).padStart(2, '0')}${Math.round(colorPreview.a * 255).toString(16).padStart(2, '0')}` }}
                        ></button>
                    </div>

                    {showPicker && (
                        <div className="absolute top-10 left-0 z-50">
                            <div className="fixed inset-0" onClick={() => setShowPicker(false)} />
                            <div className="relative">
                                <ChromePicker color={parseColorToRgb(textValue)} onChange={handleColorChange} disableAlpha={false} />
                            </div>
                        </div>
                    )}
                </div>
                <input
                    type="text"
                    value={textValue}
                    onChange={(e) => {
                        const newValue = e.target.value
                        setTextValue(newValue)
                        if (/^#([0-9a-fA-F]{8}|[0-9a-fA-F]{6})$/.test(newValue)) {
                            onChange(newValue)
                        }
                    }}
                    className="bg-[#182031] border border-[#205daa]/30 rounded-md px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3f9fff] min-w-0 w-32 overflow-x-auto"
                    placeholder="#00b3ffff"
                />
            </div>
        </div>
    )
}
