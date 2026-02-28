import React, { createContext, useContext, useState, useCallback } from 'react'

interface KeyboardRecordingContextType {
    activeRecordingId: string | null
    startRecording: (id: string) => void
    stopRecording: () => void
    isRecording: (id: string) => boolean
}

const KeyboardRecordingContext = createContext<KeyboardRecordingContextType | null>(null)

export function KeyboardRecordingProvider({ children }: { children: React.ReactNode }) {
    const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null)

    const startRecording = useCallback((id: string) => {
        setActiveRecordingId(id)
    }, [])

    const stopRecording = useCallback(() => {
        setActiveRecordingId(null)
    }, [])

    const isRecording = useCallback((id: string) => {
        return activeRecordingId === id
    }, [activeRecordingId])

    return (
        <KeyboardRecordingContext.Provider value={{ activeRecordingId, startRecording, stopRecording, isRecording }}>
            {children}
        </KeyboardRecordingContext.Provider>
    )
}

export function useKeyboardRecording() {
    const context = useContext(KeyboardRecordingContext)
    if (!context) {
        throw new Error('useKeyboardRecording must be used within a KeyboardRecordingProvider')
    }
    return context
}
