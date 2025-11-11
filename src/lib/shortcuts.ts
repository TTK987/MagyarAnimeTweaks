import type { keyBind } from '../global'

// Check if a keyboard event matches a configured key binding
export function checkShortcut(event: KeyboardEvent, shortcut: keyBind): boolean {
    return (
        event.ctrlKey === shortcut.ctrlKey &&
        event.altKey === shortcut.altKey &&
        event.shiftKey === shortcut.shiftKey &&
        event.key === shortcut.key
    )
}
