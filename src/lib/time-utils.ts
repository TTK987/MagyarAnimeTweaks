// Time utility functions for formatting and parsing time strings


/**
 * Formats a time duration in seconds into a string of the format "HH:MM:SS".
 * If the duration is less than an hour, it will return "MM:SS".
 * @param {number} seconds - The time duration in seconds.
 * @returns {string} - The formatted time string.
 */
function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}


/**
 * Formats a timestamp into a human-readable date string in Hungarian.
 * It returns "Ma" for today, "Tegnap" for yesterday, and relative
 * time strings for the last 7 days, weeks, or months.
 * For dates older than a year, it returns the date in "YYYY.MM.DD"
 * format.
 * @param {number} timestamp - The timestamp to format. (in milliseconds)
 * @returns {string} - The formatted date string.
 */
function formatDate(timestamp: number): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Ma"
    if (diffDays === 2) return "Tegnap"
    if (diffDays <= 7) return `${diffDays} napja`
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} hete`
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} hónapja`
    return date.toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
}



export { formatTime, formatDate }
