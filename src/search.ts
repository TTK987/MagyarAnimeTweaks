import Logger from './Logger'
import onLoad from './lib/load'
import Fuse from 'fuse.js'
import MAT from './MAT'

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

onLoad(init)

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

        if (isMALSearch) {
            const malLower = val.myanimelist.toLowerCase()
            const malID = query.match(/myanimelist\.net\/anime\/(\d+)/)?.[1]
            if (malLower === q) score += 80
            else if (malID && malLower.includes(malID)) score += 50
        }

        if (isIdSearch && idTerm) {
            if (val.id === idTerm) score += 120
            else if (val.id.startsWith(idTerm)) score += 90
            else if (val.id.includes(idTerm)) score += 60
        }

        scoredResults.push({ item: val, score })
    }

    if (isIdSearch && idTerm) {
        for (const val of animes) {
            if (val.id === idTerm && !scoredResults.find((r) => r.item === val)) {
                scoredResults.push({ item: val, score: 1000 })
            }
        }
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
            fetch('data/search/data_search.php', {
                headers: {
                    'x-requested-with': 'XMLHttpRequest',
                    'MagyarAnimeTweaks': 'v'+MAT.version,
                },
            })
                .then((response) => response.json())
                .then((data) => {
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
            if (event.key === 'Escape') {
                searchField.value = ''
                const searchBox = document.getElementById('search_box')
                if (searchBox) searchBox.innerHTML = ''
                searchField.blur()
                const searchButton = document.getElementById('gen-seacrh-btn')
                if (searchButton) searchButton.dispatchEvent(new Event('click'))
            } else if (event.key === 'ArrowDown') {
                event.preventDefault()
                event.stopImmediatePropagation()
                if (results.length > 0) {
                    let nextIndex = focusedIndex === -1 ? 0 : (focusedIndex + 1) % results.length
                    results.forEach((a) => a.classList.remove('search-result-focused'))
                    results[nextIndex].classList.add('search-result-focused')
                }
            } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                event.stopImmediatePropagation()
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
            } else if (event.key === 'Enter') {
                event.preventDefault()
                event.stopImmediatePropagation()
                if (focusedIndex !== -1 && results[focusedIndex]) {
                    window.location.href = results[focusedIndex].href
                }
            }
        } else {
            if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement).tagName)) {
                event.preventDefault()
                event.stopImmediatePropagation()
                ;(document.querySelector('#gen-seacrh-btn') as HTMLButtonElement)?.dispatchEvent(new Event('click'))
            }
        }
    })

    setupSearch()
}
