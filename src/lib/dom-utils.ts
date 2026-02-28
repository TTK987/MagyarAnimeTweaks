/**
 * DOM utility functions for creating and styling elements
 * @since v0.1.10
 */

type StyleProperties = Partial<CSSStyleDeclaration>

interface ElementOptions<T extends keyof HTMLElementTagNameMap> {
    id?: string
    className?: string
    innerHTML?: string
    innerText?: string
    styles?: StyleProperties
    attributes?: Record<string, string>
    children?: (HTMLElement | string)[]
    parent?: HTMLElement
}

/**
 * Creates an HTML element with the specified options
 * @template T - The tag name of the element
 * @param {T} tag - The tag name of the element to create
 * @param {ElementOptions<T>} options - The options for creating the element
 * @returns {HTMLElementTagNameMap[T]} The created element
 * @example
 * const div = createElement('div', {
 *     id: 'myDiv',
 *     className: 'container',
 *     styles: { display: 'flex', alignItems: 'center' },
 *     attributes: { 'data-value': '123' },
 *     children: ['Hello, World!']
 * })
 */
export function createElement<T extends keyof HTMLElementTagNameMap>(tag: T, options: ElementOptions<T> = {}): HTMLElementTagNameMap[T] {
    const element = document.createElement(tag)

    if (options.id) {
        element.id = options.id
    }

    if (options.className) {
        element.className = options.className
    }

    if (options.innerHTML !== undefined) {
        element.innerHTML = options.innerHTML
    } else if (options.innerText !== undefined) {
        element.innerText = options.innerText
    }

    if (options.styles) {
        applyStyles(element, options.styles)
    }

    if (options.attributes) {
        for (const [key, value] of Object.entries(options.attributes)) {
            element.setAttribute(key, value)
        }
    }

    if (options.children) {
        for (const child of options.children) {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child))
            } else {
                element.appendChild(child)
            }
        }
    }

    if (options.parent) {
        options.parent.appendChild(element)
    }

    return element
}

/**
 * Applies styles to an element
 * @param {HTMLElement} element - The element to apply styles to
 * @param {StyleProperties} styles - The styles to apply
 * @example
 * applyStyles(myDiv, { display: 'flex', alignItems: 'center', gap: '10px' })
 */
export function applyStyles(element: HTMLElement, styles: StyleProperties): void {
    for (const [property, value] of Object.entries(styles)) {
        if (value !== undefined && value !== null) {
            (element.style as any)[property] = value
        }
    }
}

/**
 * Adds CSS to the document head
 * @param {string} css - The CSS to add (will be minified)
 * @param {string} [id] - Optional ID for the style element
 * @returns {HTMLStyleElement} The created style element
 * @example
 * addCSS('.my-class { color: red; }', 'my-styles')
 */
export function addCSS(css: string, id?: string): HTMLStyleElement {
    const style = document.createElement('style')
    style.textContent = css
        .replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '') // Remove comments
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    if (id) {
        style.id = id
    }

    document.head.appendChild(style)
    return style
}

/**
 * Creates an iframe element with common settings
 * @param {string} src - The source URL of the iframe
 * @param {ElementOptions<'iframe'>} options - Additional options for the iframe
 * @returns {HTMLIFrameElement} The created iframe element
 * @example
 * const iframe = createIframe('https://example.com', {
 *     id: 'myIframe',
 *     styles: { width: '100%', height: '100%' }
 * })
 */
export function createIframe(
    src: string,
    options: ElementOptions<'iframe'> = {}
): HTMLIFrameElement {
    const defaultAttributes = {
        allow: 'autoplay; encrypted-media; fullscreen',
        allowfullscreen: 'true',
        scrolling: 'no',
        referrerpolicy: 'no-referrer',
        title: 'video-player',
        type: 'text/html',
    }

    return createElement('iframe', {
        ...options,
        attributes: {
            ...defaultAttributes,
            ...options.attributes,
            src,
        },
        styles: {
            border: 'none',
            ...options.styles,
        },
    })
}

/**
 * Creates a hidden iframe (useful for data extraction)
 * @param {string} src - The source URL of the iframe
 * @param {string} [id] - Optional ID for the iframe
 * @returns {HTMLIFrameElement} The created hidden iframe element
 */
export function createHiddenIframe(src: string, id?: string): HTMLIFrameElement {
    return createIframe(src, {
        id,
        styles: {
            width: '0px',
            height: '0px',
            display: 'none',
        },
    })
}

/**
 * Creates a full-size iframe for video players
 * @param {string} src - The source URL of the iframe
 * @param {string} [id] - Optional ID for the iframe
 * @returns {HTMLIFrameElement} The created full-size iframe element
 */
export function createPlayerIframe(src: string, id?: string): HTMLIFrameElement {
    return createIframe(src, {
        id,
        styles: {
            width: '100%',
            height: '100%',
        },
    })
}

