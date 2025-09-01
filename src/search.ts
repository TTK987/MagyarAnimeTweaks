import Logger from './Logger'

type animeData = Array<{
    id: string
    myanimelist: string
    name: string
    name_jap: string
    name_other: string
    name_syn: string
}>
let animes: animeData = [];
let isInitialized: boolean = false
window.addEventListener('load', () => init())
window.addEventListener('readystatechange', (event: Event) => {if (document.readyState === 'complete') init()})
if (document.readyState === 'complete') init()


function renderResults(results: animeData) {
    const output = results.map(val => {
        const displayName = val.name.length > 55 ? val.name.substring(0, 55) + "..." : val.name;
        return `<a href="leiras/${val.id}/" data-bs-toggle="tooltip" data-bs-placement="top" title="${val.name}">
            <span class="d-inline-block"><span>${displayName}</span></a><hr>`;
    }).join('');
    const searchBox = document.getElementById('search_box');
    if (searchBox) searchBox.innerHTML = output;
}
function searchAnime(query: string) {
    const q = query.trim().toLowerCase();
    const searchBox = document.getElementById('search_box');
    if (!q) {
        if (searchBox) searchBox.innerHTML = '';
        return;
    }

    const isIdSearch = q.startsWith('#');
    const idTerm = isIdSearch ? q.replace(/^#\s*/, '') : '';
    const isMALSearch = q.includes('myanimelist');

    type Scored = { item: animeData[number]; score: number };
    const heap: Scored[] = [];

    function scoreField(fieldValue: string, weight: number): number {
        const f = fieldValue.toLowerCase();
        if (f === q) return weight + 50;
        if (f.startsWith(q)) return weight + 20;
        if (f.includes(q)) return weight;
        return 0;
    }

    function pushToHeap(scoredItem: Scored) {
        if (heap.length < 10) {
            heap.push(scoredItem);
            heap.sort((a, b) => a.score - b.score);
        } else if (scoredItem.score > heap[0].score) {
            heap[0] = scoredItem;
            heap.sort((a, b) => a.score - b.score);
        }
    }

    for (const val of animes) {
        let score = 0;
        score += scoreField(val.name, 60);
        score += scoreField(val.name_syn, 45);
        score += scoreField(val.name_other, 35);
        score += scoreField(val.name_jap, 40);

        if (isMALSearch) {
            const malLower = val.myanimelist.toLowerCase();
            let malID = query.match(/myanimelist\.net\/anime\/(\d+)/)?.[1]
            if (malLower === q) score += 80;
            else if (malID && malLower.includes(malID)) score += 50
        }

        if (isIdSearch && idTerm) {
            if (val.id === idTerm) score += 120;
            else if (val.id.startsWith(idTerm)) score += 90;
            else if (val.id.includes(idTerm)) score += 60;
        }

        if (score > 0) pushToHeap({ item: val, score });
    }

    const results: animeData = heap.sort((a, b) => b.score - a.score).map(s => s.item);
    renderResults(results);
}
function setupSearch() {
    const searchField = document.querySelector<HTMLInputElement>('.search-field');
    if (!searchField) return;

    let debounceTimer: number | undefined;

    searchField.addEventListener('input', (evt) => {
        if (evt.target !== document.querySelector('.search-field')) return
        if (debounceTimer !== undefined) {
            window.clearTimeout(debounceTimer);
        }

        const searchBox = document.getElementById('search_box');
        if (searchBox) {
            if (searchField.value.trim().length !== 0 ) {
                searchBox.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Keresés folyamatban...';
            }
        }

        debounceTimer = window.setTimeout(() => {
            searchAnime(searchField.value);
        }, 300);
    });
}

function init() {
    if (isInitialized) return;
    isInitialized = true;
    document.querySelector('#gen-seacrh-btn')?.addEventListener('click', () => {
        if (animes.length === 0) {
            fetch('data/search/data_search.php', {
                headers: {
                    'x-requested-with': 'XMLHttpRequest',
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
        const searchField = document.querySelector<HTMLInputElement>('.search-field');
        if (!searchField) return;
        if (document.activeElement === searchField || document.activeElement?.closest('#search_box')) {
            const results = Array.from(document.querySelectorAll<HTMLAnchorElement>('#search_box a'));
            let focusedIndex = results.findIndex(a => a.classList.contains('search-result-focused'));
            if (event.key === 'Escape') {
                searchField.value = '';
                const searchBox = document.getElementById('search_box');
                if (searchBox) searchBox.innerHTML = '';
                searchField.blur();
                const searchButton = document.getElementById('gen-seacrh-btn');
                if (searchButton) searchButton.dispatchEvent(new Event('click'));
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (results.length > 0) {
                    let nextIndex = focusedIndex === -1 ? 0 : (focusedIndex + 1) % results.length;
                    results.forEach(a => a.classList.remove('search-result-focused'));
                    results[nextIndex].classList.add('search-result-focused');
                }
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (results.length > 0) {
                    let prevIndex;
                    if (focusedIndex === -1) {
                        prevIndex = results.length - 1;
                    } else if (focusedIndex === 0) {
                        prevIndex = results.length - 1;
                    } else {
                        prevIndex = focusedIndex - 1;
                    }
                    results.forEach(a => a.classList.remove('search-result-focused'));
                    results[prevIndex].classList.add('search-result-focused');
                }
            } else if (event.key === 'Enter') {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (focusedIndex !== -1 && results[focusedIndex]) {
                    window.location.href = results[focusedIndex].href;
                }
            }
        }
        else {
            if (event.key === '/' && !["INPUT", "TEXTAREA"].includes((document.activeElement as HTMLElement).tagName)) {
                event.preventDefault();
                event.stopImmediatePropagation();
                (document.querySelector('#gen-seacrh-btn') as  HTMLButtonElement)?.dispatchEvent(new Event('click'));
            }
        }
    });

    setupSearch()

}







