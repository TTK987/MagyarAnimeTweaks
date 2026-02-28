/**
 * Fetch utility functions for making HTTP requests
 * @since v0.1.10
 */

import MAT from '../MAT'

/**
 * Common headers used in all requests to MagyarAnime
 */
export const DEFAULT_HEADERS = {
    'MagyarAnimeTweaks': `v${MAT.version}`,
    'X-Requested-With': 'XMLHttpRequest',
} as const

/**
 * Headers for JSON requests
 */
export const JSON_HEADERS = {
    ...DEFAULT_HEADERS,
    'Accept': 'application/json',
} as const

/**
 * Headers for form POST requests
 */
export const FORM_HEADERS = {
    ...DEFAULT_HEADERS,
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Accept': 'application/json, text/javascript; q=0.01',
} as const

export interface FetchOptions extends Omit<RequestInit, 'body'> {
    /** Request timeout in milliseconds */
    timeout?: number
    /** Form data to send (will be URL encoded) */
    formData?: Record<string, string | number | boolean>
    /** JSON body to send */
    jsonBody?: unknown
    /** Whether to include credentials (cookies) */
    withCredentials?: boolean
    /** Base headers to use (defaults to DEFAULT_HEADERS) */
    baseHeaders?: Record<string, string>
}


/**
 * Creates a fetch request with common headers and options
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns The fetch response
 */
export async function matFetch(
    url: string | URL,
    options: FetchOptions = {}
): Promise<Response> {
    const {
        timeout,
        formData,
        jsonBody,
        withCredentials = false,
        baseHeaders = DEFAULT_HEADERS,
        headers: customHeaders,
        ...fetchOptions
    } = options

    // Build headers
    const headers: Record<string, string> = {
        ...baseHeaders,
        ...(customHeaders as Record<string, string>),
    }

    // Handle body
    let body: string | undefined
    if (formData) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8'
        body = new URLSearchParams(
            Object.entries(formData).reduce((acc, [key, value]) => {
                acc[key] = String(value)
                return acc
            }, {} as Record<string, string>)
        ).toString()
    } else if (jsonBody !== undefined) {
        headers['Content-Type'] = 'application/json'
        body = JSON.stringify(jsonBody)
    }

    // Handle credentials
    const credentials: RequestCredentials | undefined = withCredentials ? 'include' : undefined

    // Handle timeout with AbortController
    const controller = timeout ? new AbortController() : undefined
    const timeoutId = timeout
        ? setTimeout(() => controller!.abort(), timeout)
        : undefined

    try {
        return await fetch(url, {
            ...fetchOptions,
            headers,
            body,
            credentials,
            signal: controller?.signal,
        })
    } finally {
        if (timeoutId) clearTimeout(timeoutId)
    }
}

/**
 * Fetch and parse JSON response
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns The parsed JSON data
 */
export async function fetchJSON<T = unknown>(
    url: string | URL,
    options: FetchOptions = {}
): Promise<T> {
    const response = await matFetch(url, {
        ...options,
        baseHeaders: options.baseHeaders ?? JSON_HEADERS,
    })

    if (!response.ok) {
        throw new FetchError(
            `Request failed: ${response.status} ${response.statusText}`,
            response
        )
    }

    return response.json() as Promise<T>
}

/**
 * Fetch and return text response
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns The response text
 */
export async function fetchText(
    url: string | URL,
    options: FetchOptions = {}
): Promise<string> {
    const response = await matFetch(url, options)

    if (!response.ok) {
        throw new FetchError(
            `Request failed: ${response.status} ${response.statusText}`,
            response
        )
    }

    return response.text()
}

/**
 * POST form data and return response (without parsing)
 * @param url - The URL to post to
 * @param formData - The form data to send
 * @param options - Additional fetch options
 * @returns The response
 */
export async function postForm(
    url: string | URL,
    formData: Record<string, string | number | boolean>,
    options: FetchOptions = {}
): Promise<Response> {
    return matFetch(url, {
        method: 'POST',
        formData,
        baseHeaders: FORM_HEADERS,
        ...options,
    })
}


/**
 * Custom error class for fetch errors
 */
export class FetchError extends Error {
    response: Response
    status: number

    constructor(message: string, response: Response) {
        super(message)
        this.name = 'FetchError'
        this.response = response
        this.status = response.status
    }

    /**
     * Get the response body as text
     */
    async getBody(): Promise<string> {
        try {
            return await this.response.text()
        } catch {
            return ''
        }
    }
}
