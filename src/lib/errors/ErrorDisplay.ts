import {
    MATErrorContext,
    generateFullErrorCode,
    generateErrorReport,
    getErrorDetails,
} from './MATError'
import Toast from '../../Toast'
import { checkIcon, copyIcon, discordIcon, githubIcon, refreshIcon, alertIcon, chevronIcon, externalIcon, xIcon } from '../icons'
export interface ErrorDisplayOptions {
    isEAP?: boolean
    episodeId?: number
    server?: string
    videoTitle?: string
    episodeNumber?: number
    isVideoRemoved?: boolean
    reportUrl?: string
}

const STYLES = `
#VideoPlayer {min-height: 700px !important;}

.mat-err {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #0a0e17;
    padding: 20px;
}

.mat-err * { box-sizing: border-box; margin: 0; padding: 0; }

.mat-err-top {
    width: 100%;
    max-width: 600px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 14px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(30, 64, 175, 0.04) 100%);
    border: 1px solid rgba(59, 130, 246, 0.15);
    border-radius: 12px;
}

.mat-err-top.error {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(59, 130, 246, 0.04) 100%);
    border-color: rgba(239, 68, 68, 0.2);
}

.mat-err-icon {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(59, 130, 246, 0.12);
    border-radius: 10px;
    color: #60a5fa;
}

.mat-err-top.error .mat-err-icon {
    background: rgba(239, 68, 68, 0.12);
    color: #f87171;
}

.mat-err-main {
    flex: 1;
    min-width: 0;
}

.mat-err-title {
    font-size: 16px;
    font-weight: 600;
    color: #f1f5f9;
    margin-bottom: 6px;
    letter-spacing: 0.07em;
}

.mat-err-msg {
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.5;
    margin-bottom: 4px;
}

.mat-err-hint {
    font-size: 12px;
    color: #64748b;
}

.mat-err-actions {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.mat-err-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 16px;
    min-width: 115px;
    min-height: 30px;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mat-err-btn-primary {
    background-color: #0a0e17;
    color: #f8f9fa;
    border: 1px solid rgba(32, 93, 170, 0.3);
}

.mat-err-btn-primary:hover {
    background-color: #1a1f2e;
    border-color: rgba(32, 93, 170, 0.5);
}

.mat-err-btn-secondary {
    background-color: #0a0e17;
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
}

.mat-err-btn-secondary:hover {
    background-color: #1a1f2e;
    border-color: rgba(239, 68, 68, 0.5);
}

.mat-err-bottom {
    width: 100%;
    max-width: 600px;
    margin-top: 16px;
    padding: 12px 16px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(32, 93, 170, 0.2);
    border-radius: 8px;
}

.mat-err-code-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
}

.mat-err-code {
    display: flex;
    align-items: center;
    gap: 8px;
}

.mat-err-code-label {
    font-size: 11px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.mat-err-code-value {
    font-size: 11px;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    color: #f1f5f9;
    background: #0a0e17;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid rgba(32, 93, 170, 0.3);
}

.mat-err-code-copy {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6px 12px;
    min-height: 28px;
    font-size: 11px;
    font-weight: 600;
    font-family: inherit;
    background-color: #0a0e17;
    color: #f8f9fa;
    border: 1px solid rgba(32, 93, 170, 0.3);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mat-err-code-copy:hover {
    background-color: #1a1f2e;
    border-color: rgba(32, 93, 170, 0.5);
}

.mat-err-code-copy.copied {
    color: #22c55e;
    border-color: rgba(34, 197, 94, 0.4);
}

.mat-err-report {
    display: flex;
    flex-direction: row;
    /* gap: 8px; */
    padding-top: 8px;
    border-top: 1px solid rgba(32, 93, 170, 0.15);
    align-items: center;
    justify-content: space-between;
}

.mat-err-report-label {
    font-size: 11px;
    color: #94a3b8;
}

.mat-err-links {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.mat-err-links a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    text-decoration: none;
    background-color: #0a0e17;
    border: 1px solid rgba(32, 93, 170, 0.3);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mat-err-links a.discord {
    color: #7289da;
    border-color: rgba(114, 137, 218, 0.3);
}

.mat-err-links a.discord:hover {
    background-color: #1a1f2e;
    border-color: rgba(114, 137, 218, 0.5);
}

.mat-err-links a.github {
    color: #f8f9fa;
}

.mat-err-links a.github:hover {
    background-color: #1a1f2e;
    border-color: rgba(32, 93, 170, 0.5);
}

.mat-err-details {
    width: 100%;
    max-width: 600px;
    margin-top: 12px;
}

.mat-err-details-toggle {
    background: none;
    border: none;
    color: #64748b;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    padding: 6px 0;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: color 0.15s;
}

.mat-err-details-toggle:hover { color: #94a3b8; }

.mat-err-details-toggle svg {
    transition: transform 0.2s;
}

.mat-err-details-toggle.open svg {
    transform: rotate(180deg);
}

.mat-err-details-content {
    display: none;
    margin-top: 8px;
    background: #050810;
    border: 1px solid rgba(32, 93, 170, 0.2);
    border-radius: 8px;
    overflow: hidden;
    border-top-right-radius: 5px;
}

.mat-err-details-content.open { display: block; }

.mat-err-details-content pre {
    font-size: 11px;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    color: #7b8797;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 150px;
    overflow-y: auto;
    line-height: 1.6;
    padding: 14px;
    margin: 0;
    text-align: left;
    background: #0a0e17;
    border: 0px;
}

.mat-err-details-actions {
    display: flex;
    justify-content: flex-end;
    padding: 10px 14px;
    background: rgba(15, 23, 42, 0.5);
    border-top: 1px solid rgba(32, 93, 170, 0.15);
}

.mat-err-details-copy {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6px 12px;
    min-height: 28px;
    font-size: 11px;
    font-weight: 600;
    font-family: inherit;
    background-color: #0a0e17;
    color: #f8f9fa;
    border: 1px solid rgba(32, 93, 170, 0.3);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mat-err-details-copy:hover {
    background-color: #1a1f2e;
    border-color: rgba(32, 93, 170, 0.5);
}

.mat-err-details-copy.copied {
    color: #22c55e;
    border-color: rgba(34, 197, 94, 0.4);
}

@media (max-width: 500px) {
    .mat-err-top {
        flex-direction: column;
        align-items: stretch;
    }

    .mat-err-actions {
        flex-direction: row;
        margin-top: 12px;
    }

    .mat-err-btn {
        flex: 1;
    }

    .mat-err-code-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .mat-err-links {
        width: 100%;
    }

    .mat-err-links a {
        flex: 1;
    }
}
`

function escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch {
        Toast.error('Nem sikerült a vágólapra másolni', '', { duration: 2000 })
        return false
    }
}

function generateHTML(errorKey: string, context: MATErrorContext, options: ErrorDisplayOptions): string {
    const details = getErrorDetails(errorKey)
    const fullCode = generateFullErrorCode(errorKey, context)
    const isRemoved = options.isVideoRemoved || errorKey === 'V008'
    const topClass = isRemoved ? '' : 'error'
    const title = isRemoved ? 'Videó nem elérhető' : 'Hiba történt'
    const icon = isRemoved ? xIcon : alertIcon

    const suggestion = details.suggestions.length > 0
        ? details.suggestions[0] + '.'
        : 'Próbáld újratölteni az oldalt.'

    const reportBtn = isRemoved && options.reportUrl ? `
        <button class="mat-err-btn mat-err-btn-secondary" data-report="${escapeHtml(options.reportUrl)}">
            ${externalIcon} Jelentés
        </button>
    ` : ''

    return `
        <style>${STYLES}</style>
        <div class="mat-err">
            <div class="mat-err-top ${topClass}">
                <div class="mat-err-icon">${icon}</div>
                <div class="mat-err-main">
                    <h2 class="mat-err-title">${title}</h2>
                    <p class="mat-err-msg">${escapeHtml(details.message)}</p>
                    <p class="mat-err-hint">${escapeHtml(suggestion)}</p>
                </div>
                <div class="mat-err-actions">
                    ${details.canAutoReload ? `<button class="mat-err-btn mat-err-btn-primary" data-reload>${refreshIcon} Újratöltés</button>` : ''}
                    ${reportBtn}
                </div>
            </div>

            <div class="mat-err-bottom">
                <div class="mat-err-code-row">
                    <div class="mat-err-code">
                        <span class="mat-err-code-label">Hibakód:</span>
                        <span class="mat-err-code-value">${escapeHtml(fullCode)}</span>
                    </div>
                    <button class="mat-err-code-copy" data-copy-code>
                        ${copyIcon} Másolás
                    </button>
                </div>
                <div class="mat-err-report">
                    <span class="mat-err-report-label">Ha a hiba továbbra is fennáll, kérlek jelezd itt:</span>
                    <div class="mat-err-links">
                        <a href="https://discord.com/invite/dJX4tVGZhY" target="_blank" class="discord">${discordIcon} Discord</a>
                        <a href="https://github.com/TTK987/MagyarAnimeTweaks/issues" target="_blank" class="github">${githubIcon} GitHub</a>
                    </div>
                </div>
            </div>
             <div class="mat-err-details">
                <button class="mat-err-details-toggle" data-toggle>
                    Több részlet ${chevronIcon}
                </button>
                <div class="mat-err-details-content" data-content>
                    <pre>${escapeHtml(generateErrorReport(errorKey, context))}</pre>
                    <div class="mat-err-details-actions">
                        <button class="mat-err-details-copy" data-copy-report>
                            ${copyIcon} Másolás
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
}

function setupListeners(container: HTMLElement, errorKey: string, context: MATErrorContext): void {
    const fullCode = generateFullErrorCode(errorKey, context)
    const fullReport = generateErrorReport(errorKey, context)

    container.querySelector('[data-reload]')?.addEventListener('click', () => window.location.reload())

    container.querySelector('[data-report]')?.addEventListener('click', (e) => {
        const url = (e.currentTarget as HTMLElement).getAttribute('data-report')
        if (url) window.open(url, '_blank')
    })

    const copyCodeBtn = container.querySelector('[data-copy-code]')
    copyCodeBtn?.addEventListener('click', async () => {
        if (await copyToClipboard(fullCode)) {
            copyCodeBtn.classList.add('copied')
            copyCodeBtn.innerHTML = `${checkIcon} Másolva!`
            setTimeout(() => {
                copyCodeBtn.classList.remove('copied')
                copyCodeBtn.innerHTML = `${copyIcon} Másolás`
            }, 2000)
        }
    })

    const toggle = container.querySelector('[data-toggle]')
    toggle?.addEventListener('click', () => {
        toggle.classList.toggle('open')
        container.querySelector('[data-content]')?.classList.toggle('open')
    })

    const copyReportBtn = container.querySelector('[data-copy-report]')
    copyReportBtn?.addEventListener('click', async () => {
        if (await copyToClipboard(fullReport)) {
            copyReportBtn.classList.add('copied')
            copyReportBtn.innerHTML = `${checkIcon} Másolva!`
            setTimeout(() => {
                copyReportBtn.classList.remove('copied')
                copyReportBtn.innerHTML = `${copyIcon} Másolás`
            }, 2000)
        }
    })
}

export function renderErrorDisplay(errorKey: string, context: MATErrorContext, options: ErrorDisplayOptions = {}): HTMLElement {
    const container = document.createElement('div')
    container.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'
    container.innerHTML = generateHTML(errorKey, context, options)
    setupListeners(container, errorKey, context)
    return container
}

export function showMATError(errorKey: string, context: MATErrorContext = {}, options: ErrorDisplayOptions = {}): void {
    const target = document.querySelector('#VideoPlayer') || document.querySelector('.gen-video-holder')
    if (!target) {
        Toast.error('Hiba', 'Nem található a hiba megjelenítéséhez szükséges konténer.', { duration: 5000 })
        return
    }
    target.innerHTML = ''
    ;(target as HTMLElement).style.position = 'relative'
    target.appendChild(renderErrorDisplay(errorKey, context, options))
}
