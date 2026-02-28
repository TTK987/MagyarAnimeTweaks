import Logger from '../../Logger'
import { formatTime } from '../../lib/time-utils'
import AniSkip, { SkipInterval, SkipTimesResponse, SkipType } from '../../api/AniSkip'
import BasePlayer from '../BasePlayer'
import { checkShortcut } from '../../lib/shortcuts'

export class AniSkipPlugin {
    private ctx: BasePlayer
    private isEnabled: boolean = true
    private aniSkip?: AniSkip
    private aniSkipSegments: Record<SkipType, SkipInterval | undefined>
    private aniSkipButtonVisible: Record<SkipType, boolean>
    private aniSkipButtonHideTimers: Record<SkipType, number | undefined>
    private aniSkipLastShownTime: Record<SkipType, number | undefined>
    private videoDuration: number = 0
    private lastSkipTime: number = 0
    private skipCooldown: number = 1500 // 1.5 seconds cooldown
    private buttonDisplayDuration: number = 3000 // 3 seconds display time

    constructor(ctx: BasePlayer) {
        this.ctx = ctx
        this.aniSkipSegments = {} as Record<SkipType, SkipInterval | undefined>
        this.aniSkipButtonVisible = {} as Record<SkipType, boolean>
        this.aniSkipButtonHideTimers = {} as Record<SkipType, number | undefined>
        this.aniSkipLastShownTime = {} as Record<SkipType, number | undefined>
    }

    private get settings() {
        return this.ctx.settings.plyr.plugins.aniSkip
    }

    disable() {
        this.isEnabled = false
    }

    async init(videoElement: HTMLVideoElement) {
        if (!this.isEnabled) return
        if (!this.settings.enabled) return
        if (!this.ctx.malId || this.ctx.malId <= 0) {
            Logger.error('AniSkip disabled (missing malId).')
            return
        }

        Logger.log(`AniSkip: initializing (malId=${this.ctx.malId}, ep=${this.ctx.epNum})`)
        this.injectAniSkipCss()

        // Wait for video duration to be available
        this.videoDuration = videoElement.duration || this.ctx.plyr?.duration || 0
        if (!this.videoDuration || this.videoDuration <= 0 || !isFinite(this.videoDuration)) {
            Logger.log('AniSkip: waiting for video duration...')
            await new Promise<void>((resolve) => {
                const onDurationChange = () => {
                    this.videoDuration = videoElement.duration || this.ctx.plyr?.duration || 0
                    if (this.videoDuration && this.videoDuration > 0 && isFinite(this.videoDuration)) {
                        Logger.log(`AniSkip: video duration available: ${this.videoDuration.toFixed(2)}s`)
                        videoElement.removeEventListener('durationchange', onDurationChange)
                        resolve()
                    }
                }
                videoElement.addEventListener('durationchange', onDurationChange)
                onDurationChange()
            })
        }

        if (!this.aniSkip) this.aniSkip = new AniSkip()

        let resp: SkipTimesResponse

        try {
            resp = await this.aniSkip.getMalSkipTimes(this.ctx.malId, this.ctx.epNum, {
                types: this.settings.skips,
                episodeLength: this.videoDuration,
            })
        } catch (err: any) {
            if (err?.message?.includes('404')) {
                Logger.warn('AniSkip: no skip segments found (404).')
                return
            }
            Logger.error('AniSkip: failed to fetch skip times. Error: ' + err)
            return
        }

        if (!resp || !resp.results || resp.results.length === 0) {
            Logger.warn('AniSkip: no skip segments found after processing.')
            return
        }

        Logger.log(`AniSkip: ${resp.results.length} segment(s) returned.`)

        try {
            document.addEventListener('keydown', (ev) => {
                if (!checkShortcut(ev, this.settings.keyBind)) return
                if (!this.ctx.plyr) return
                // Check cooldown
                const now = Date.now()
                if (now - this.lastSkipTime < this.skipCooldown) {
                    Logger.log('AniSkip: skip on cooldown, ignoring keybind.')
                    return
                }
                const currentTime = this.ctx.plyr.currentTime
                // Find a segment we are currently inside
                for (const segKey of Object.keys(this.aniSkipSegments)) {
                    const seg = segKey as SkipType
                    const interval = this.aniSkipSegments[seg]
                    if (!interval) continue
                    if (currentTime >= interval.startTime && currentTime < interval.endTime) {
                        Logger.log(`AniSkip: keybind skip ${seg.toUpperCase()} -> jumping to ${interval.endTime.toFixed(2)}`)
                        this.lastSkipTime = now
                        this.ctx.plyr.currentTime = interval.endTime
                        const labelMap: Record<string, string> = { op: 'OP átugrása', ed: 'ED átugrása' }
                        const human = labelMap[seg.toLowerCase()] || `${seg.toUpperCase()} átugrása`
                        this.ctx.Toast('info', human, '', { duration: 600 })
                        return
                    }
                }
                Logger.log('AniSkip: keybind pressed but not inside any segment.')
            })
            Logger.log('AniSkip: registered keyBind listener.')
        } catch (e) {
            Logger.warn('AniSkip: failed to register keyBind listener: ' + e)
        }

        type Interval = { startTime: number; endTime: number }

        resp.results.forEach((r: any) => {
            const rawType = r?.skipType
            if (!rawType) {
                Logger.log(`AniSkip: ignoring segment with missing skipType`)
                return
            }
            const type: SkipType = String(rawType) as SkipType

            const interval: Interval | undefined = r?.interval
            if (!interval) {
                Logger.warn('AniSkip: invalid interval data; skipping.')
                return
            }

            // store by arbitrary skip type
            this.aniSkipSegments[type] = interval
            this.aniSkipButtonVisible[type] = false

            Logger.log(
                `AniSkip: registered ${type.toUpperCase()} segment start=${interval.startTime.toFixed(2)} (${formatTime(interval.startTime)}) end=${interval.endTime.toFixed(2)} (${formatTime(interval.endTime)})`,
            )

            if (document.querySelector(`.mat-aniskip-button[data-segment="${type}"]`)) {
                Logger.log(`AniSkip: button for ${type} already exists; skipping create.`)
                return
            }

            const overlay = this.ensureAniSkipOverlay()
            if (!overlay) {
                Logger.error('AniSkip: overlay container missing, cannot create button.')
                return
            }

            const btn = document.createElement('button')
            const labelMap: Record<string, string> = { op: 'OP átugrása', ed: 'ED átugrása' }
            const human = labelMap[type.toLowerCase()] || `${type.toUpperCase()} átugrása`
            btn.className = 'mat-aniskip-button'
            btn.setAttribute('data-segment', type)
            btn.innerHTML = `
            <svg viewBox="0 0 384 512" aria-hidden="true" focusable="false" fill="currentColor">
              <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/>
            </svg>
            <span>${human}</span>
        `

            btn.addEventListener('click', (e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!this.ctx.plyr) return
                // Check cooldown
                const now = Date.now()
                if (now - this.lastSkipTime < this.skipCooldown) {
                    Logger.log('AniSkip: skip on cooldown, ignoring click.')
                    return
                }
                Logger.log(`AniSkip: user clicked ${type.toUpperCase()} skip -> jumping to ${interval.endTime.toFixed(2)}`,)
                this.lastSkipTime = now
                this.ctx.plyr.currentTime = interval.endTime
                this.hideAniSkipButton(type)
                this.ctx.Toast('info', human, '', { duration: 600 })
            })

            overlay.appendChild(btn)
            Logger.log(`AniSkip: button created for ${type.toUpperCase()}`)
        })

        const boundKey = 'data-aniskip-timeupdate-bound'
        if (!videoElement.hasAttribute(boundKey)) {
            videoElement.addEventListener('timeupdate', () => this.handleAniSkipTime())
            videoElement.setAttribute(boundKey, '1')
            Logger.log('AniSkip: timeupdate listener attached.')
        }

        // Inject timeline markers after segments are registered
        this.injectTimelineMarkers()
    }

    private showAniSkipButton(type: SkipType) {
        if (this.aniSkipButtonVisible[type]) return // already visible
        const btn = document.querySelector(`.mat-aniskip-button[data-segment="${type}"]`) as HTMLElement | null
        if (!btn) {
            Logger.warn(`AniSkip: show requested but button not found for ${type}`)
            return
        }
        btn.style.display = 'flex'
        btn.style.opacity = '1'
        this.aniSkipButtonVisible[type] = true
        Logger.log(`AniSkip: displaying ${type.toUpperCase()} skip button.`)

        // Clear any existing hide timer
        if (this.aniSkipButtonHideTimers[type]) {
            clearTimeout(this.aniSkipButtonHideTimers[type])
        }

        // Set auto-hide timer for 3 seconds
        this.aniSkipButtonHideTimers[type] = window.setTimeout(() => {
            this.hideAniSkipButton(type)
            Logger.log(`AniSkip: auto-hiding ${type.toUpperCase()} skip button after ${this.buttonDisplayDuration / 1000}s.`)
        }, this.buttonDisplayDuration)
    }

    private hideAniSkipButton(type: SkipType) {
        if (!this.aniSkipButtonVisible[type]) return // already hidden
        const btn = document.querySelector(`.mat-aniskip-button[data-segment="${type}"]`) as HTMLElement | null
        if (!btn) return
        btn.style.opacity = '0'
        btn.style.display = 'none'
        this.aniSkipButtonVisible[type] = false

        // Clear any pending hide timer
        if (this.aniSkipButtonHideTimers[type]) {
            clearTimeout(this.aniSkipButtonHideTimers[type])
            this.aniSkipButtonHideTimers[type] = undefined
        }

        Logger.log(`AniSkip: hiding ${type.toUpperCase()} skip button.`)
    }

    private handleAniSkipTime() {
        if (!this.ctx.plyr) return
        const t = this.ctx.plyr.currentTime
        Object.keys(this.aniSkipSegments).forEach((segKey) => {
            const seg = segKey as SkipType
            const interval = this.aniSkipSegments[seg]
            if (!interval) return

            const isInsideSegment = t >= interval.startTime && t < interval.endTime

            if (isInsideSegment) {
                if (this.settings.autoSkip.includes(seg)) {
                    Logger.log(`AniSkip: auto-skipping ${seg.toUpperCase()} at ${t.toFixed(2)}s -> jumping to ${interval.endTime.toFixed(2)}s.`,)
                    this.ctx.seekTo(interval.endTime)
                    const labelMap: Record<string, string> = { op: 'OP átugrása', ed: 'ED átugrása' }
                    const human = labelMap[seg.toLowerCase()] || `${seg.toUpperCase()} átugrása`
                    this.ctx.Toast('info', human, '', { duration: 600 })
                    return
                }
                if (this.aniSkipLastShownTime[seg] === undefined) {
                    this.aniSkipLastShownTime[seg] = t
                    this.showAniSkipButton(seg)
                }
            } else {
                this.aniSkipLastShownTime[seg] = undefined
                if (this.aniSkipButtonVisible[seg]) {
                    this.hideAniSkipButton(seg)
                }
            }
        })
    }

    private injectTimelineMarkers() {
        if (this.videoDuration <= 0) {
            Logger.warn('AniSkip: cannot inject timeline markers (no duration).')
            return
        }

        // Plyr structure: .plyr__progress > input[type=range] + .plyr__progress__buffer + .plyr__progress__played
        const progressRoot = document.querySelector('.plyr__progress') as HTMLElement | null
        if (!progressRoot) {
            Logger.warn('AniSkip: cannot find .plyr__progress for timeline markers.')
            return
        }

        // Ensure parent can hold absolutely positioned overlay
        const parentStyle = getComputedStyle(progressRoot)
        if (parentStyle.position === 'static') {
            progressRoot.style.position = 'relative'
        }

        // Create or get marker track container (sibling overlay that doesn't interfere with input)
        let markerTrack = progressRoot.querySelector('.mat-aniskip-marker-track') as HTMLElement | null
        if (!markerTrack) {
            markerTrack = document.createElement('div')
            markerTrack.className = 'mat-aniskip-marker-track mat-aniskip-gradient-track'
            progressRoot.appendChild(markerTrack)
            Logger.log('AniSkip: marker track container created.')
        }

        // Clear existing markers
        markerTrack.innerHTML = ''

        Object.keys(this.aniSkipSegments).forEach((segKey) => {
            const seg = segKey as SkipType
            const interval = this.aniSkipSegments[seg]
            if (!interval) return

            const startPct = (interval.startTime / this.videoDuration) * 100
            const widthPct = ((interval.endTime - interval.startTime) / this.videoDuration) * 100

            const marker = document.createElement('div')
            marker.className = 'mat-aniskip-marker'
            marker.setAttribute('data-segment', seg)

            const colorMap: Record<string, string> = {
                op: 'var(--mat-aniskip-op, #ffc832)',
                ed: 'var(--mat-aniskip-ed, #b464ff)',
            }
            const bgColor = colorMap[seg.toLowerCase()] || 'var(--mat-aniskip-other, #64c8ff)'

            marker.style.left = `${Math.max(0, Math.min(100, startPct))}%`
            marker.style.width = `${Math.max(0, Math.min(100 - startPct, widthPct))}%`
            marker.style.setProperty('--marker-color', bgColor)

            const labelMap: Record<string, string> = { op: 'OP', ed: 'ED' }
            marker.title = labelMap[seg.toLowerCase()] || seg.toUpperCase()

            markerTrack.appendChild(marker)
            Logger.log(
                `AniSkip: timeline marker for ${seg.toUpperCase()} injected at ${startPct.toFixed(
                    1,
                )}% width ${widthPct.toFixed(1)}%.`,
            )
        })
    }

    private ensureAniSkipOverlay(): HTMLElement | null {
        const plyrContainer = document.querySelector('.plyr') as HTMLElement
        if (!plyrContainer) {
            Logger.warn('AniSkip: cannot find .plyr container for overlay creation.')
            return null
        }
        let overlay = document.getElementById('MATweaks-aniskip-overlay') as HTMLElement | null
        if (!overlay) {
            overlay = document.createElement('div')
            overlay.id = 'MATweaks-aniskip-overlay'
            plyrContainer.appendChild(overlay)
            Logger.log('AniSkip: overlay container created.')
        }
        return overlay
    }

    private injectAniSkipCss() {
        if (document.getElementById('MATweaks-aniskip-style')) {
            Logger.log('AniSkip: CSS already injected.')
            return
        }
        const style = document.createElement('style')
        style.id = 'MATweaks-aniskip-style'
        style.textContent = `
        /* AniSkip custom properties */
        :root {
          --mat-aniskip-op: #ffc832;
          --mat-aniskip-ed: #b464ff;
          --mat-aniskip-other: #64c8ff;
        }

        #MATweaks-aniskip-overlay { position:absolute; right:1rem; bottom:4.2rem; display:flex; flex-direction:column; gap:6px; z-index:1000; align-items:flex-end; pointer-events:none; }
        #MATweaks-aniskip-overlay .mat-aniskip-button { pointer-events:auto; border-radius:8px; cursor:pointer; border:none; padding:6px 12px 6px 10px; font-size:12px; line-height:1.2; display:none; align-items:center; gap:6px; color:#fff; background:rgba(0,0,0,.55); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); font-weight:500; letter-spacing:.25px; box-shadow:0 4px 12px -2px rgba(0,0,0,.4); transition:background .25s, transform .25s, opacity .35s; }
        #MATweaks-aniskip-overlay .mat-aniskip-button:hover { background:rgba(0,0,0,.7); }
        #MATweaks-aniskip-overlay .mat-aniskip-button:active { transform:scale(.96); }
        #MATweaks-aniskip-overlay .mat-aniskip-button svg { width:16px; height:16px; }
        @media (max-width: 700px) {
          #MATweaks-aniskip-overlay { bottom:4.8rem; }
          #MATweaks-aniskip-overlay .mat-aniskip-button { font-size:11px; padding:5px 10px; }
        }

        .mat-aniskip-marker-track {
          position: absolute;
          top: 10px;
          left: 0;
          right: 0;
          height: 5px;
          transform: translateY(-50%);
          pointer-events: none;
          z-index: 1;
        }

        .mat-aniskip-marker {
          position: absolute;
          height: 95%;
          top: 0;
          background: var(--marker-color);
          opacity: 0.6;
          transition: opacity 0.2s ease;
        }

        .plyr__progress:hover .mat-aniskip-marker {
          opacity: 0.8;
        }
    `
        document.head.appendChild(style)
        Logger.log('AniSkip: CSS injected.')
    }
}
