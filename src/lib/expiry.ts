import { UnixTimestamp } from '../global'

/*
Videa: Unix timestamp in seconds
Indavideo: none - current time + 6 hours approx.
MagyarAnime: Unix timestamp in seconds
 */


function isUnixTimestamp(value: number): value is UnixTimestamp {
    if (!Number.isFinite(value) || !Number.isInteger(value)) return false
    return (value > 0 && value < 4102444800) && (value.toString().length === 10)
}

function parseExpiryFromUrl(url: string): UnixTimestamp | null {
    try {
        const parsed = new URL(url, window.location.href)
        const candidates = ['expires', 'expire', 'exp']

        let raw: string | null = null
        for (const key of candidates) {
            const value = parsed.searchParams.get(key)
            if (value !== null) {
                raw = value
                break
            }
        }

        if (!raw) return null

        const num = Number(raw)
        if (!isUnixTimestamp(num)) return null

        return num as UnixTimestamp
    } catch {
        return null
    }
}

function isExpired(expiry: number, now: number = Math.floor(Date.now() / 1000)): boolean {
    if (!expiry || !isUnixTimestamp(expiry)) return false
    return expiry <= now
}

export { parseExpiryFromUrl, isExpired, isUnixTimestamp }
