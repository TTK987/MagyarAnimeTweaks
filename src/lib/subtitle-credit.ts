import type { ServerResponse } from '../global'
import { matFetch } from './fetch-utils'

export function createSubtitleCredit(data: Pick<ServerResponse, 'csapat_name' | 'csapat_type' | 'videoid' | 'button_aid' | 'button_ep'>): HTMLDivElement | undefined {
    const source = document.createElement('template')
    source.innerHTML = data.csapat_name || ''

    const sourceLink = source.content.querySelector('a')
    const fansub = (sourceLink?.textContent || source.content.textContent || '')
        .replace(/^A videóban szereplő felirat (?:a|az)\s+/iu, '')
        .replace(/\s+munkája[.!]?[\s\S]*$/iu, '')
        .trim()

    if (!fansub) return

    const kind = data.csapat_type === 'ai' ? 'ai' : data.csapat_type === 'normal' ? 'normal' : 'unknown'
    const label = kind === 'ai' ? 'Gépi fordítás' : kind === 'normal' ? 'Emberi fordítás' : 'Felirat'
    const icon = kind === 'ai'
        ? '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 1v5m6-5v5M9 18v5m6-5v5M1 9h5m-5 6h5m12-6h5m-5 6h5"/><rect x="10" y="10" width="4" height="4" rx=".5"/>'
        : '<path d="m16 3 5 5M4 20l4-1 13-13a2.12 2.12 0 0 0-3-3L5 16l-1 4Z"/><path d="M12 20h8"/>'

    const credit = document.createElement('div')
    credit.className = `mat-subtitle-credit mat-subtitle-credit--${kind}`
    credit.setAttribute('role', 'note')
    credit.setAttribute('aria-label', 'Feliratinformáció')
    credit.innerHTML = `
        <span class="mat-subtitle-credit-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
        </span>
        <div class="mat-subtitle-credit-content">
            <span class="mat-subtitle-credit-label">${label}</span>
            <span class="mat-subtitle-credit-byline">Felirat: </span>
        </div>
        <div class="mat-subtitle-thx">
             <button type="button" class="mat-subtitle-thx-button" aria-label="Köszönöm a fordítást!" title="Köszönet">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                     <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>
                 </svg>
                 <span>Köszönöm a fordítást!</span>
             </button>
        </div>
        <button type="button" class="mat-subtitle-credit-close" aria-label="Feliratinformáció bezárása" title="Bezárás">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18"/>
            </svg>
        </button>
    `
    credit.querySelector('.mat-subtitle-thx-button')?.addEventListener('click', () => {
        matFetch('https://magyaranime.eu/data/data_thanx.php', {
            method: 'POST',
            withCredentials: true,
            formData: {
                vid: data.videoid,
                aid: data.button_aid,
                aep: data.button_ep
            }
        }).then((result) => {
            const thxButton = credit.querySelector('.mat-subtitle-thx-button')
            if (thxButton) {
                thxButton.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>
                    </svg>
                    <span>Sikeresen megköszönted a fordítást!</span>
                `
                thxButton.setAttribute('disabled', 'true')
            }
        })
    })

    let fansubURL: URL | undefined
    const href = sourceLink?.getAttribute('href')
    if (href) {
        try {
            const url = new URL(href, window.location.href)
            if (url.protocol === 'https:' || url.protocol === 'http:') fansubURL = url
        } catch {
            // Ignore URL parsing errors
        }
    }

    const name = document.createElement(fansubURL ? 'a' : 'span')
    name.textContent = fansub
    if (fansubURL) {
        name.setAttribute('href', fansubURL.href)
        name.setAttribute('target', '_blank')
        name.setAttribute('rel', 'noopener noreferrer')
    }
    credit.querySelector('.mat-subtitle-credit-byline')!.appendChild(name)

    return credit
}
