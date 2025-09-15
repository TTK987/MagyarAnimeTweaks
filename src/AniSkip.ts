export type SkipType = 'op' | 'ed' | 'mixed' | 'recap' | 'preview'

export interface SkipInterval {
    startTime: number // seconds (float)
    endTime: number // seconds (float)
}

export interface SkipTime {
    skipType: SkipType
    interval: SkipInterval
    episodeLength: number
    skipId: string // UUID
}

export interface SkipTimesResponse {
    found: boolean
    statusCode: number
    message: string
    results: SkipTime[]
}

export interface AniSkipOptions {
    baseUrl?: string
    fetchImpl?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    timeoutMs?: number
}

export interface MalSkipQuery {
    episodeLength?: number
    types?: SkipType[]
}

export default class AniSkip {
    private readonly baseUrl: string
    private readonly timeoutMs?: number

    constructor(opts: AniSkipOptions = {}) {
        this.baseUrl = (opts.baseUrl ?? 'https://api.aniskip.com').replace(/\/+$/, '')
        this.timeoutMs = opts.timeoutMs
    }

    async getMalSkipTimes(
        malId: number,
        episode: number,
        q: MalSkipQuery = {},
    ): Promise<SkipTimesResponse> {
        if (!Number.isInteger(malId) || malId <= 0) throw new Error('malId must be a positive integer')
        if (!Number.isInteger(episode) || episode <= 0) throw new Error('episode must be a positive integer')

        const url = new URL(`${this.baseUrl}/v2/skip-times/${encodeURIComponent(String(malId))}/${encodeURIComponent(String(episode))}`)
        if (q.types?.length) {for (const t of q.types) {url.searchParams.append('types', t)}}
        if (q.episodeLength != null) url.searchParams.set('episodeLength', String(q.episodeLength))
        else url.searchParams.set('episodeLength', '0')

        const controller = this.timeoutMs ? new AbortController() : undefined
        const timeout = this.timeoutMs
            ? setTimeout(() => controller!.abort(), this.timeoutMs)
            : undefined

        try {
            const resp = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
                signal: controller?.signal,
            })

            if (!resp.ok) {
                const body = await resp.text().catch(() => '')
                throw new Error(
                    `AniSkip MAL request failed ${resp.status}: ${body || resp.statusText}`,
                )
            }
            return resp.json() as Promise<SkipTimesResponse>
        } finally {
            if (timeout) clearTimeout(timeout)
        }
    }
}

