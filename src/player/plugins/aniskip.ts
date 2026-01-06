import Logger from '@/Logger'
import { formatTime } from '@lib/time-utils'
import AniSkip, { SkipInterval } from '@api/AniSkip'
import BasePlayer from '@/player/BasePlayer'

export class AniSkipPlugin {
    private ctx: BasePlayer
    private isEnabled: boolean = true
    private aniSkip?: AniSkip
    private aniSkipSegments: { op?: SkipInterval; ed?: SkipInterval } = {}
    private aniSkipCycleShown: { op?: boolean; ed?: boolean } = {}
    private aniSkipTimers: { op?: number; ed?: number } = {}

    constructor(ctx: BasePlayer) {
        this.ctx = ctx
    }

    disable() {
        this.isEnabled = false
    }

    async init(videoElement: HTMLVideoElement) {
        if (!this.isEnabled) return
        if (!this.ctx.settings.eap) return
        if (!this.ctx.malId || this.ctx.malId <= 0) {
            Logger.error('AniSkip disabled (missing malId).')
            return
        }

        Logger.log(`AniSkip: initializing (malId=${this.ctx.malId}, ep=${this.ctx.epNum})`)
        this.injectAniSkipCss()

        const duration = videoElement.duration || this.ctx.plyr?.duration || 0

        if (!this.aniSkip) this.aniSkip = new AniSkip()

        let resp: any
        try {
            resp = await this.aniSkip.getMalSkipTimes(this.ctx.malId, this.ctx.epNum, {
                types: ['op', 'ed'],
                episodeLength: duration,
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
            Logger.warn('AniSkip: OP/ED segments array empty after processing.')
            return
        }

        Logger.log(`AniSkip: ${resp.results.length} segment(s) returned.`)

        // Ensure internal state objects exist
        this.aniSkipSegments = this.aniSkipSegments || { op: undefined, ed: undefined }
        this.aniSkipCycleShown = this.aniSkipCycleShown || { op: false, ed: false }
        this.aniSkipTimers = this.aniSkipTimers || { op: undefined, ed: undefined }

        type SegmentType = 'op' | 'ed'
        type Interval = { startTime: number; endTime: number }

        resp.results.forEach((r: any) => {
            const type = r?.skipType as SegmentType
            if (type !== 'op' && type !== 'ed') {
                Logger.log(`AniSkip: ignoring non OP/ED segment type=${r?.skipType}`)
                return
            }
            const interval: Interval | undefined = r?.interval
            if (!interval) {
                Logger.warn('AniSkip: invalid interval data; skipping.')
                return
            }

            this.aniSkipSegments[type] = interval
            this.aniSkipCycleShown[type] = false

            Logger.log(
                `AniSkip: registered ${type.toUpperCase()} segment start=${interval.startTime.toFixed(
                    2,
                )} (${formatTime(interval.startTime)}) end=${interval.endTime.toFixed(
                    2,
                )} (${formatTime(interval.endTime)})`,
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
            const human = type === 'op' ? 'OP átugrása' : 'ED átugrása'
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
                Logger.log(
                    `AniSkip: user clicked ${type.toUpperCase()} skip -> jumping to ${interval.endTime.toFixed(
                        2,
                    )}`,
                )
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
    }

    private showAniSkipButton(type: 'op' | 'ed') {
        const btn = document.querySelector(
            `.mat-aniskip-button[data-segment="${type}"]`,
        ) as HTMLElement | null
        if (!btn) {
            Logger.warn(`AniSkip: show requested but button not found for ${type}`)
            return
        }
        btn.style.display = 'flex'
        btn.style.opacity = '1'
        Logger.log(`AniSkip: displaying ${type.toUpperCase()} skip button (will auto-hide).`)
        if (this.aniSkipTimers[type]) window.clearTimeout(this.aniSkipTimers[type] as number)
        this.aniSkipTimers[type] = window.setTimeout(() => this.hideAniSkipButton(type), 5000)
    }

    private hideAniSkipButton(type: 'op' | 'ed') {
        const btn = document.querySelector(
            `.mat-aniskip-button[data-segment="${type}"]`,
        ) as HTMLElement | null
        if (!btn) return
        if (btn.style.display !== 'none') {
            Logger.log(`AniSkip: hiding ${type.toUpperCase()} skip button.`)
        }
        btn.style.opacity = '0'
        btn.style.display = 'none'
    }

    private handleAniSkipTime() {
        if (!this.ctx.plyr) return
        const t = this.ctx.plyr.currentTime
        ;(['op', 'ed'] as const).forEach((seg) => {
            const interval = this.aniSkipSegments[seg]
            if (!interval) return
            if (t < interval.startTime - 1.0) {
                if (this.aniSkipCycleShown[seg]) {
                    Logger.log(
                        `AniSkip: reset display cycle for ${seg.toUpperCase()} (current=${t.toFixed(
                            2,
                        )} start=${interval.startTime.toFixed(2)})`,
                    )
                }
                this.aniSkipCycleShown[seg] = false
            }
            if (
                !this.aniSkipCycleShown[seg] &&
                t >= interval.startTime &&
                t <= interval.startTime + 0.8
            ) {
                Logger.log(
                    `AniSkip: trigger show window for ${seg.toUpperCase()} at ${t.toFixed(
                        2,
                    )} (segment start=${interval.startTime.toFixed(2)})`,
                )
                this.aniSkipCycleShown[seg] = true
                this.showAniSkipButton(seg)
            }
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
        #MATweaks-aniskip-overlay { position:absolute; right:1rem; bottom:4.2rem; display:flex; flex-direction:column; gap:6px; z-index:1000; align-items:flex-end; pointer-events:none; }
        #MATweaks-aniskip-overlay .mat-aniskip-button { pointer-events:auto; border-radius:8px; cursor:pointer; border:none; padding:6px 12px 6px 10px; font-size:12px; line-height:1.2; display:none; align-items:center; gap:6px; color:#fff; background:rgba(0,0,0,.55); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); font-weight:500; letter-spacing:.25px; box-shadow:0 4px 12px -2px rgba(0,0,0,.4); transition:background .25s, transform .25s, opacity .35s; }
        #MATweaks-aniskip-overlay .mat-aniskip-button:hover { background:rgba(0,0,0,.7); }
        #MATweaks-aniskip-overlay .mat-aniskip-button:active { transform:scale(.96); }
        #MATweaks-aniskip-overlay .mat-aniskip-button svg { width:16px; height:16px; }
        @media (max-width: 700px) {
          #MATweaks-aniskip-overlay { bottom:4.8rem; }
          #MATweaks-aniskip-overlay .mat-aniskip-button { font-size:11px; padding:5px 10px; }
        }
    `
        document.head.appendChild(style)
        Logger.log('AniSkip: CSS injected.')
    }
}

