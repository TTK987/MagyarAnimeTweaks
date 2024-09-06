window.onload = function () {
    const form = document.querySelector('form');
    form.onsubmit = function (event) {
        event.preventDefault();
        const data = new URLSearchParams();
        data.append('search_text', document.getElementById('search_text').value);
        data.append('tipus',  document.getElementById('tipus').value);
        data.append('sorrend', document.getElementById('sorrend').value);
        fetch(`https://magyaranime.eu/web/kereso/`, {
            method: 'POST',
            body: data
        }).then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error('Network response was not ok.');
        }).then(async text => {
            const search_results = (new DOMParser()).parseFromString(await text, 'text/html').querySelector('body > section > div > div > div:nth-child(2) > div');
            if (search_results) {
                const results = search_results.querySelectorAll('.gen-movie-contain');
                if (results.length > 0) {
                    let html = '';
                    for (const result of results) {
                        const title = result.querySelector('.gen-movie-info h3 a').textContent;
                        html += `
                        <div class="card" style="width: 18rem;">
                            <img src="${result.querySelector('.gen-movie-img img')?.src || ""}" class="card-img-top" alt="${title}">
                            <div class="card-body">
                                <h5 class="card-title">${title}</h5>
                                <p class="card-text">${result.querySelector('.gen-movie-meta-holder li:first-child')?.textContent || ''}</p>
                                <p class="card-text">${result.querySelector('.gen-movie-meta-holder li:nth-child(2)')?.textContent || ''}</p>
                                <a href="${`https://magyaranime.eu` + result.querySelector('.gen-movie-info h3 a').href.match(/\/leiras\/\d+\//)[0] || ''}" class="btn btn-primary" target="_blank">Leírás megtekintése</a>
                            </div>
                        </div>
                        `;
                    }
                    document.querySelector('#results').innerHTML = html.replace(/>[\r\n ]+</g, "><").replace(/(<.*?>)|\s+/g, (m, $1) => $1 ? $1 : ' ').trim();
                } else {
                    alert('Nincs találat.');
                }
            } else {
                alert('Nem sikerült a keresés.');
            }
        }).catch(error => {
            console.error('Error:', error);
            alert('Hiba történt a keresés során.');
        });
    };
    document.getElementById('bookmarks').onclick = function () {
        chrome.tabs.create({ url: chrome.runtime.getURL('bookmarks.html') });
    };
}
