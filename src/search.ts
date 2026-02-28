import Logger from './Logger'
import onLoad from './lib/load'
import Fuse from 'fuse.js'
import { fetchJSON } from './lib/fetch-utils'
import { Settings } from './global'
import MAT from './MAT'
import { checkShortcut, createKeyBind } from './lib/shortcuts'

type animeData = Array<{
    id: string
    myanimelist: string
    name: string
    name_jap: string
    name_other: string
    name_syn: string
}>
let animes: animeData = []
let fuse: Fuse<animeData[number]> | null = null
let isOpen: boolean = false

let settings: Settings

MAT.loadSettings().then((s) => {
    settings=s
    onLoad(init)
})

function renderResults(results: animeData) {
    const output = results
        .map((val) => {
            const displayName = val.name.length > 55 ? val.name.substring(0, 55) + '...' : val.name
            return `<a href="leiras/${val.id}/" data-bs-toggle="tooltip" data-bs-placement="top" title="${val.name}">
            <span class="d-inline-block"><span>${displayName}</span></a><hr>`
        })
        .join('')
    const searchBox = document.getElementById('search_box')
    if (searchBox) searchBox.innerHTML = output
}
function searchAnime(query: string) {
    const q = query.trim().toLowerCase()
    const searchBox = document.getElementById('search_box')
    if (!q) {
        if (searchBox) searchBox.innerHTML = ''
        return
    }

    const isIdSearch = q.startsWith('#')
    const idTerm = isIdSearch ? q.replace(/^#\s*/, '') : ''
    const isMALSearch = q.includes('myanimelist')

    if (isIdSearch && idTerm) {
        const exactIdMatch = animes.find((val) => val.id === idTerm)
        if (exactIdMatch) {
            renderResults([exactIdMatch])
            return
        }
    }

    if (isMALSearch) {
        const malID = query.match(/myanimelist\.net\/anime\/(\d+)/)?.[1]
        const exactMalMatch = animes.find((val) => {
            const malLower = val.myanimelist.toLowerCase()
            if (malLower === q) return true
            return !!(malID && malLower.includes(malID));
        })
        if (exactMalMatch) {
            renderResults([exactMalMatch])
            return
        }
    }

    if (!fuse && animes.length > 0) {
        fuse = new Fuse(animes, {
            keys: [
                { name: 'name', weight: 0.5 },
                { name: 'name_syn', weight: 0.2 },
                { name: 'name_jap', weight: 0.2 },
                { name: 'name_other', weight: 0.1 },
            ],
            threshold: 0.4,
            ignoreLocation: true,
            minMatchCharLength: 2,
        })
    }

    if (!fuse) {
        return
    }

    type Scored = { item: animeData[number]; score: number }
    const scoredResults: Scored[] = []

    const fuseResults = fuse.search(q, { limit: 50 })

    for (const res of fuseResults) {
        let score = 0
        const baseScore = 1 - (res.score ?? 1)
        score += baseScore * 100

        const val = res.item

        scoredResults.push({ item: val, score })
    }

    scoredResults.sort((a, b) => b.score - a.score)

    const results: animeData = scoredResults.slice(0, 10).map((s) => s.item)
    renderResults(results)
}
function setupSearch() {
    const searchField = document.querySelector<HTMLInputElement>('.search-field')
    if (!searchField) return

    let debounceTimer: number | undefined

    searchField.addEventListener('input', (evt) => {
        if (evt.target !== document.querySelector('.search-field')) return
        if (debounceTimer !== undefined) {
            window.clearTimeout(debounceTimer)
        }

        const searchBox = document.getElementById('search_box')
        if (searchBox) {
            if (searchField.value.trim().length !== 0) {
                searchBox.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Keresés folyamatban...'
            }
        }

        debounceTimer = window.setTimeout(() => {
            searchAnime(searchField.value)
        }, 300)
    })
}

function init() {
    document.querySelector('#gen-seacrh-btn')?.addEventListener('click', () => {
        if (animes.length === 0) {
            fetchJSON<Record<string, animeData[number]>>('data/search/data_search.php')
                .then((data) => {
                    isOpen = true
                    animes = Object.values(data)
                })
                .catch((error) => {
                    Logger.error('Error fetching search data:' + error, true)
                })
        }
    })

    document.addEventListener('keydown', (event) => {
        const searchField = document.querySelector<HTMLInputElement>('.search-field')
        if (!searchField) return
        if (document.activeElement === searchField || document.activeElement?.closest('#search_box')) {
            const results = Array.from(document.querySelectorAll<HTMLAnchorElement>('#search_box a'))
            let focusedIndex = results.findIndex((a) => a.classList.contains('search-result-focused'))
            // Close search box
            if (checkShortcut(event, settings.nav.searchBox.close)) {
                searchField.value = ''
                const searchBox = document.getElementById('search_box')
                const searchButton = document.getElementById('gen-seacrh-btn')
                if (isOpen && searchBox && searchButton) {
                    searchField.value = ''
                    searchBox.innerHTML = ''
                    searchField.blur()
                    searchButton.dispatchEvent(new Event('click'))
                    isOpen = false
                }
            } else if (event.key === 'ArrowDown') {
                if (results.length > 0) {
                    let nextIndex = focusedIndex === -1 ? 0 : (focusedIndex + 1) % results.length
                    results.forEach((a) => a.classList.remove('search-result-focused'))
                    results[nextIndex].classList.add('search-result-focused')
                }
            } else if (event.key === 'ArrowUp') {
                if (results.length > 0) {
                    let prevIndex
                    if (focusedIndex === -1) {
                        prevIndex = results.length - 1
                    } else if (focusedIndex === 0) {
                        prevIndex = results.length - 1
                    } else {
                        prevIndex = focusedIndex - 1
                    }
                    results.forEach((a) => a.classList.remove('search-result-focused'))
                    results[prevIndex].classList.add('search-result-focused')
                }
            } else if (checkShortcut(event,createKeyBind(false,false,false,false,'Enter'))) {
                if (focusedIndex !== -1 && results[focusedIndex]) {
                    window.location.href = results[focusedIndex].href
                }
            } else if (checkShortcut(event,settings.nav.searchBox.openSearch)) {
                (document.querySelector('.search-submit') as HTMLButtonElement)?.click()
            } else return
            event.preventDefault()
            event.stopImmediatePropagation()
        } else {
            if (checkShortcut(event, settings.nav.searchBox.open) && !['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement).tagName)) {
                event.preventDefault()
                event.stopImmediatePropagation()
                ;(document.querySelector('#gen-seacrh-btn') as HTMLButtonElement)?.dispatchEvent(new Event('click'))
                isOpen = true
            }
        }
    })

    setupSearch()
}
