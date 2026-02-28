import { useState, useRef, useEffect, useId } from 'react'
import { useKeyboardRecording } from './keyboard-recording-context'
import { FaKeyboard } from 'react-icons/fa'
import React from 'react'

interface KeyboardShortcutProps {
    value:
        | {
              ctrlKey: boolean
              altKey: boolean
              shiftKey: boolean
              metaKey?: boolean
              key: string
          }
        | undefined
    onChange: (shortcut: {
        ctrlKey: boolean
        altKey: boolean
        shiftKey: boolean
        metaKey: boolean
        key: string
    }) => void
    autoFocus?: boolean
}

export function KeyboardShortcut({ value, onChange, autoFocus = false }: KeyboardShortcutProps) {
    const inputRef = useRef<HTMLDivElement>(null)
    const uniqueId = useId()
    const { startRecording, stopRecording, isRecording } = useKeyboardRecording()
    const recording = isRecording(uniqueId)
    const [shortcut, setShortcut] = useState(value)

    // Format key for display
    const formatKey = (key: string) => {
        if (key === ' ') return 'Space'
        if (key === 'ArrowUp') return '↑'
        if (key === 'ArrowDown') return '↓'
        if (key === 'ArrowLeft') return '←'
        if (key === 'ArrowRight') return '→'
        if (key === 'Escape') return 'Esc'
        if (key === 'Control') return 'Ctrl'
        if (key === 'Meta') return '⌘'
        if (key === 'Alt') return 'Alt'
        if (key === 'Shift') return 'Shift'
        return key
    }

    // Handle key press
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!recording) return

        e.preventDefault()

        // Ignore modifier keys when pressed alone
        if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
            return
        }

        const newShortcut = {
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
            key: e.key,
        }

        setShortcut(newShortcut)
        onChange(newShortcut)
        stopRecording()
    }

    // Start recording
    const handleStartRecording = () => {
        startRecording(uniqueId)
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }

    // Add and remove event listeners
    useEffect(() => {
        setShortcut(value)
    }, [value])

    // Auto-start recording when autoFocus is true
    useEffect(() => {
        if (autoFocus) {
            handleStartRecording()
        }
    }, [])

    useEffect(() => {
        if (recording) {
            window.addEventListener('keydown', handleKeyDown)
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [recording])

    return (
        <div className="relative">
            <div
                ref={inputRef}
                onClick={handleStartRecording}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${
                    recording
                        ? 'bg-[#3f9fff]/20 border border-[#3f9fff] text-white'
                        : 'bg-[#182031] border border-[#205daa]/30 text-white'
                } focus:outline-none focus:ring-2 focus:ring-[#3f9fff]`}
                tabIndex={0}
            >
                {recording ? (
                    <div className="flex items-center justify-center w-full py-1 text-center">
                        <FaKeyboard className="mr-2 h-4 w-4 text-[#3f9fff]" />
                        <span className="text-[#3f9fff]">Nyomj le egy billentyűkombinációt...</span>
                    </div>
                ) : shortcut ? (
                    <div className="flex items-center gap-1">
                        {shortcut.ctrlKey && (
                            <span className="bg-[#205daa]/30 px-2 py-1 rounded text-sm">
                                {formatKey('Ctrl')}
                            </span>
                        )}
                        {shortcut.altKey && (
                            <span className="bg-[#205daa]/30 px-2 py-1 rounded text-sm">
                                {formatKey('Alt')}
                            </span>
                        )}
                        {shortcut.shiftKey && (
                            <span className="bg-[#205daa]/30 px-2 py-1 rounded text-sm">
                                {formatKey('Shift')}
                            </span>
                        )}
                        {(shortcut.ctrlKey || shortcut.altKey || shortcut.shiftKey) &&
                            shortcut.key && <span className="text-white">+</span>}
                        {shortcut.key && (
                            <span className="bg-[#205daa]/30 px-2 py-1 rounded text-sm">
                                {formatKey(shortcut.key)}
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-full py-1 text-center">
                        <FaKeyboard className="mr-2 h-4 w-4 text-[#3f9fff]" />
                        <span className="text-[#3f9fff]">
                            Kattints ide a billentyűkombináció megadásához...
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
