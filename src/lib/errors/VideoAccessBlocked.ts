export const VIDEO_ACCESS_BLOCKED_ERROR = 'video_access_blocked'

export function isVideoAccessBlocked(data: { error?: unknown }): boolean {
    return data.error === VIDEO_ACCESS_BLOCKED_ERROR
}
