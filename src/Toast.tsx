import { createElement, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { Bell, X, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react'

interface Options {
    icon?: ReactNode
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
    duration?: number // in milliseconds, 0 means no auto-dismiss
    id?: string // optional ID to update existing toast
}

/**
 * Toast - A simple, customizable toast notification system
 *
 * Features:
 * - Slide in/out animations
 * - Multiple positions support
 * - Predefined methods (success, error, warning, info)
 * - Customizable icons
 * - Auto-dismiss functionality
 * - Dark theme styling
 * - No external CSS dependencies
 *
 * Usage:
 * ```typescript
 * Toast.success("Success!", "Operation completed successfully")
 * Toast.error("Error!", "Something went wrong")
 * Toast.warning("Warning!", "Please check your input")
 * Toast.info("Info", "Here's some information")
 * ```
 */
class Toast {
    private static instance: Toast
    private toasts: Map<string, { id: string; element: HTMLElement }>
    private timers: Map<string, NodeJS.Timeout>
    private containers: Map<string, HTMLElement>
    private positions: string[]
    private stylesInjected: boolean = false
    private isFullscreen: boolean

    private constructor() {
        this.toasts = new Map()
        this.timers = new Map()
        this.containers = new Map()
        this.positions = [
            'top-right',
            'top-left',
            'bottom-right',
            'bottom-left',
            'top-center',
            'bottom-center',
        ]
        this.isFullscreen = false

        // Create containers for each position when the class is instantiated
        if (typeof window !== 'undefined') {
            this.injectStyles()
            this.createContainers()

            if (document.fullscreenElement) {
                this.fullscreenIn()
            }

            document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this))
        }
    }

    /**
     * Get the singleton instance of Toast
     */
    public static getInstance(): Toast {
        if (!Toast.instance) {
            Toast.instance = new Toast()
        }
        return Toast.instance
    }

    /**
     * Inject CSS styles for animations and base styles
     */
    private injectStyles(): void {
        if (this.stylesInjected) return
        const styleSheet = document.createElement('style')
        styleSheet.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }

            @keyframes slideInLeft {
                from {
                    transform: translateX(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutLeft {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(-100%);
                    opacity: 0;
                }
            }

            @keyframes slideInTop {
                from {
                    transform: translateY(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutTop {
                from {
                    transform: translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateY(-100%);
                    opacity: 0;
                }
            }

            @keyframes slideInBottom {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutBottom {
                from {
                    transform: translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateY(100%);
                    opacity: 0;
                }
            }

            .toast-slide-in-right {
                animation: slideInRight 0.3s ease-out forwards;
            }

            .toast-slide-out-right {
                animation: slideOutRight 0.3s ease-in forwards;
            }

            .toast-slide-in-left {
                animation: slideInLeft 0.3s ease-out forwards;
            }

            .toast-slide-out-left {
                animation: slideOutLeft 0.3s ease-in forwards;
            }

            .toast-slide-in-top {
                animation: slideInTop 0.3s ease-out forwards;
            }

            .toast-slide-out-top {
                animation: slideOutTop 0.3s ease-in forwards;
            }

            .toast-slide-in-bottom {
                animation: slideInBottom 0.3s ease-out forwards;
            }

            .toast-slide-out-bottom {
                animation: slideOutBottom 0.3s ease-in forwards;
            }
        `
        document.head.appendChild(styleSheet)
        this.stylesInjected = true
    }

    /**
     * Create container elements for each position
     */
    private createContainers(): void {
        this.positions.forEach((position) => {
            const container = document.createElement('div')
            Object.assign(container.style, this.getPositionStyles(position))
            document.body.appendChild(container)
            this.containers.set(position, container)
        })
    }

    /**
     * Get CSS styles for positioning the toast container
     */
    private getPositionStyles(position: string): CSSStyleDeclaration {
        const baseStyles = {
            position: 'fixed',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxWidth: '448px',
            zIndex: '10000',
            pointerEvents: 'none',
        } as any

        switch (position) {
            case 'top-right':
                return { ...baseStyles, top: '16px', right: '16px' }
            case 'top-left':
                return { ...baseStyles, top: '16px', left: '16px' }
            case 'bottom-right':
                return { ...baseStyles, bottom: '16px', right: '16px' }
            case 'bottom-left':
                return { ...baseStyles, bottom: '16px', left: '16px' }
            case 'top-center':
                return { ...baseStyles, top: '16px', left: '50%', transform: 'translateX(-50%)' }
            case 'bottom-center':
                return { ...baseStyles, bottom: '16px', left: '50%', transform: 'translateX(-50%)' }
            default:
                return { ...baseStyles, bottom: '16px', right: '16px' }
        }
    }

    /**
     * Get animation class based on position and state (in/out)
     */
    private getAnimationClass(position: string, state: 'in' | 'out'): string {
        if (state === 'in') {
            switch (position) {
                case 'top-right':
                case 'bottom-right':
                    return 'toast-slide-in-right'
                case 'top-left':
                case 'bottom-left':
                    return 'toast-slide-in-left'
                case 'top-center':
                    return 'toast-slide-in-top'
                case 'bottom-center':
                    return 'toast-slide-in-bottom'
                default:
                    return 'toast-slide-in-right'
            }
        } else {
            switch (position) {
                case 'top-right':
                case 'bottom-right':
                    return 'toast-slide-out-right'
                case 'top-left':
                case 'bottom-left':
                    return 'toast-slide-out-left'
                case 'top-center':
                    return 'toast-slide-out-top'
                case 'bottom-center':
                    return 'toast-slide-out-bottom'
                default:
                    return 'toast-slide-out-right'
            }
        }
    }

    /**
     * Get styles based on toast type
     */
    private getToastStyles(type: string): CSSStyleDeclaration {
        const baseStyles = {
            borderRadius: '8px',
            padding: '10px',
            minWidth: '320px',
            maxWidth: '448px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #374151',
            lineHeight: '1',
        } as any

        switch (type) {
            case 'success':
                return {
                    ...baseStyles,
                    backgroundColor: '#1a1f29',
                    borderLeft: '4px solid #10b981',
                }
            case 'info':
                return {
                    ...baseStyles,
                    backgroundColor: '#1a1f29',
                    borderLeft: '4px solid #3b82f6',
                }
            case 'warning':
                return {
                    ...baseStyles,
                    backgroundColor: '#1a1f29',
                    borderLeft: '4px solid #f59e0b',
                }
            case 'error':
                return {
                    ...baseStyles,
                    backgroundColor: '#1a1f29',
                    borderLeft: '4px solid #ef4444',
                }
            default:
                return {
                    ...baseStyles,
                    backgroundColor: '#1a1f29',
                }
        }
    }

    /**
     * Get default icon based on toast type
     */
    public getDefaultIcon(type: string): ReactNode {
        switch (type) {
            case 'success':
                return createElement(CheckCircle, {
                    style: { width: '20px', height: '20px', color: '#10b981' },
                })
            case 'info':
                return createElement(Info, {
                    style: { width: '20px', height: '20px', color: '#3b82f6' },
                })
            case 'warning':
                return createElement(AlertTriangle, {
                    style: { width: '20px', height: '20px', color: '#f59e0b' },
                })
            case 'error':
                return createElement(XCircle, {
                    style: { width: '20px', height: '20px', color: '#ef4444' },
                })
            default:
                return createElement(Bell, {
                    style: { width: '20px', height: '20px', color: '#9ca3af' },
                })
        }
    }

    /**
     * Create the React element for a toast
     */
    private createToastElement(
        id: string,
        type: string,
        title: string,
        description: string | undefined,
        iconToRender: ReactNode,
    ): any {
        return createElement(
            'div',
            {
                style: {
                    ...this.getToastStyles(type),
                    padding: description ? '16px' : '12px',
                    minWidth: description ? '320px' : '280px',
                },
                role: 'alert',
            },
            [
                // Icon
                iconToRender &&
                    createElement(
                        'div',
                        {
                            key: 'icon',
                            style: {
                                flexShrink: 0,
                                marginTop: description ? '2px' : '0px',
                            },
                        },
                        iconToRender,
                    ),

                // Content
                createElement(
                    'div',
                    {
                        key: 'content',
                        style: {
                            flex: 1,
                            minWidth: 0,
                            textAlign: 'left',
                        },
                    },
                    [
                        createElement(
                            'h3',
                            {
                                key: 'title',
                                style: {
                                    fontWeight: '600',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    margin: 0,
                                    lineHeight: description ? '1.4' : '1.2',
                                },
                            },
                            title,
                        ),
                        description &&
                            createElement(
                                'p',
                                {
                                    key: 'desc',
                                    style: {
                                        fontSize: '14px',
                                        color: '#d1d5db',
                                        marginTop: '4px',
                                        lineHeight: '1.5',
                                        margin: '4px 0 0 0',
                                    },
                                },
                                description,
                            ),
                    ],
                ),

                // Close button
                createElement(
                    'button',
                    {
                        key: 'close',
                        style: {
                            flexShrink: 0,
                            color: '#9ca3af',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s ease',
                        },
                        'aria-label': 'Close notification',
                        onClick: () => this.remove(id),
                        onMouseEnter: (e: { target: HTMLElement }) => {
                            ;(e.target as HTMLElement).style.color = '#ffffff'
                        },
                        onMouseLeave: (e: { target: HTMLElement }) => {
                            ;(e.target as HTMLElement).style.color = '#9ca3af'
                        },
                    },
                    createElement(X, { style: { width: '16px', height: '16px' } }),
                ),
            ],
        )
    }

    /**
     * Update an existing toast's content
     */
    private updateToast(
        id: string,
        type: string,
        title: string,
        description: string | undefined,
        icon: ReactNode | undefined,
        position: string,
        duration: number,
    ): void {
        const existingToast = this.toasts.get(id)
        if (!existingToast) return

        const { element } = existingToast

        // Clear existing timer
        const existingTimer = this.timers.get(id)
        if (existingTimer) {
            clearTimeout(existingTimer)
            this.timers.delete(id)
        }

        // Update the element's position class if needed
        element.className = this.getAnimationClass(position, 'in')

        // Create React root in the existing wrapper
        const root = createRoot(element)

        // Use provided icon or default icon based on type
        const iconToRender = icon !== undefined ? icon : this.getDefaultIcon(type)

        // Re-render the toast component with new content
        root.render(this.createToastElement(id, type, title, description, iconToRender))

        // Set new auto-dismiss timer
        if (duration > 0) {
            const timer = setTimeout(() => {
                this.remove(id)
            }, duration)
            this.timers.set(id, timer)
        }
    }

    /**
     * Create and render a toast component
     */
    private renderToast(
        id: string,
        type: string,
        title: string,
        description: string | undefined,
        icon: ReactNode | undefined,
        position: string,
    ): void {
        // Create wrapper element for the toast
        const toastWrapper = document.createElement('div')
        toastWrapper.className = this.getAnimationClass(position, 'in')
        toastWrapper.style.pointerEvents = 'auto'

        // Create React root in the wrapper
        const root = createRoot(toastWrapper)

        // Use provided icon or default icon based on type
        const iconToRender = icon !== undefined ? icon : this.getDefaultIcon(type)

        // Render the toast component
        root.render(this.createToastElement(id, type, title, description, iconToRender))

        // Add the toast to the appropriate container
        const container = this.containers.get(position)
        if (container) {
            container.appendChild(toastWrapper)
            this.toasts.set(id, { id, element: toastWrapper })
        }
    }

    /**
     * Show a toast notification
     */
    public static show(
        type: 'success' | 'info' | 'warning' | 'error' | 'default' = 'default',
        title: string,
        description?: string,
        options: Options = {},
    ): string {
        const instance = Toast.getInstance()
        const id = options.id || Math.random().toString(36).substring(2, 9)
        const defaultPosition = instance.isFullscreen ? 'top-center' : 'bottom-right'
        const position = options.position || defaultPosition
        const duration = options.duration || 2000
        const icon = options.icon || instance.getDefaultIcon(type)

        // Check if a toast with the given ID already exists
        if (options.id) {
            const existingToast = instance.toasts.get(options.id)
            if (existingToast) {
                // Update the existing toast's content and reset timer
                instance.updateToast(options.id, type, title, description, icon, position, duration)
                return options.id
            }
        }

        // Render the toast
        instance.renderToast(id, type, title, description, icon, position)

        // Set auto-dismiss timer
        if (duration > 0) {
            if (duration === Infinity) return id // Don't set a timer for infinite duration
            const timer = setTimeout(() => {
                instance.remove(id)
            }, duration)
            instance.timers.set(id, timer)
        }

        return id
    }

    /**
     * Remove a toast notification with animation
     */
    public remove(id: string): void {
        const toast = this.toasts.get(id)
        if (!toast) return

        // Clear timer if it exists
        const timer = this.timers.get(id)
        if (timer) {
            clearTimeout(timer)
            this.timers.delete(id)
        }

        const { element } = toast
        const position = this.getToastPosition(element)

        // Add exit animation class
        element.className = this.getAnimationClass(position, 'out')

        // Remove after animation completes
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element)
            }
            this.toasts.delete(id)
        }, 300) // Match animation duration
    }

    /**
     * Determine the position of a toast element
     */
    private getToastPosition(element: HTMLElement): string {
        for (const [position, container] of this.containers.entries()) {
            if (container.contains(element)) {
                return position
            }
        }
        return 'bottom-right' // Default position
    }

    /**
     * Remove all toast notifications
     */
    public static clearAll(): void {
        const instance = Toast.getInstance()
        // Clear all timers
        instance.timers.forEach((timer) => {
            clearTimeout(timer)
        })
        instance.timers.clear()

        instance.toasts.forEach((toast) => {
            instance.remove(toast.id)
        })
    }

    /**
     * Handle fullscreen change events
     */
    private handleFullscreenChange(): void {
        const fullscreenElement = document.fullscreenElement
        if (fullscreenElement) this.fullscreenIn()
        else this.fullscreenOut()
    }

    private fullscreenIn(): void {
        this.isFullscreen = true
        this.positions.forEach((position) => {
            const container = this.containers.get(position)
            if (container && container.parentNode) {
                container.parentNode.removeChild(container)
                const fullscreenElement = document.fullscreenElement
                if (fullscreenElement) {
                    let newPosition = position
                    if (position === 'bottom-right') newPosition = 'top-right'
                    else if (position === 'bottom-left') newPosition = 'top-left'
                    else if (position === 'bottom-center') newPosition = 'top-center'

                    const newContainer = document.createElement('div')
                    newContainer.className = `toast-container ${newPosition}`
                    Object.assign(newContainer.style, this.getPositionStyles(newPosition))
                    fullscreenElement.appendChild(newContainer)
                    this.containers.set(position, newContainer)
                    this.toasts.forEach((toast) => {
                        if (this.getToastPosition(toast.element) === position) {
                            newContainer.appendChild(toast.element)
                            toast.element.className = this.getAnimationClass(newPosition, 'in')
                        }
                    })
                }
            }
        })
    }

    private fullscreenOut(): void {
        this.isFullscreen = false
        this.positions.forEach((position) => {
            const container = this.containers.get(position)
            if (container) {
                Object.assign(container.style, this.getPositionStyles(position))
                document.body.appendChild(container)
                this.containers.set(position, container)
                this.toasts.forEach((toast) => {
                    if (this.getToastPosition(toast.element) === position) {
                        container.appendChild(toast.element)
                        toast.element.className = this.getAnimationClass(position, 'in')
                    }
                })
            }
        })
    }

    // Convenience methods for common toast types
    public static success(title: string, description?: string, options: Options = {}): string {
        return Toast.show('success', title, description, options)
    }

    public static info(title: string, description?: string, options: Options = {}): string {
        return Toast.show('info', title, description, options)
    }

    public static warning(title: string, description?: string, options: Options = {}): string {
        return Toast.show('warning', title, description, options)
    }

    public static error(title: string, description?: string, options: Options = {}): string {
        return Toast.show('error', title, description, options)
    }
}

export default Toast
export type { Options }
