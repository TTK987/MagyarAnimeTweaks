import type { keyBind } from '../global'

// Check if a keyboard event matches a configured key binding
export function checkShortcut(event: KeyboardEvent, shortcut: keyBind | keyBind[]): boolean {
    if (Array.isArray(shortcut)) {
        for (const sc of shortcut) {
            if (checkShortcut(event, sc)) return true
        }
        return false
    }
    return (
        event.ctrlKey === shortcut.ctrlKey &&
        event.altKey === shortcut.altKey &&
        event.shiftKey === shortcut.shiftKey &&
        event.metaKey === shortcut.metaKey &&
        event.key.toLowerCase() === shortcut.key.toLowerCase()
    )
}
export function createKeyBind(ctrlKey: boolean, altKey: boolean, shiftKey: boolean, metaKey: boolean, key: string): keyBind {
    return { ctrlKey, altKey, shiftKey, metaKey, key }
}
