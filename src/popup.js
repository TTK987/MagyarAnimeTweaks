/**
 * Handles the popup window
 */
window.onload = function () {
    const form = document.querySelector('form');
    form.onsubmit = function (event) {
        event.preventDefault();
        const search_text = document.getElementById('search_text').value;
        const tipus = document.getElementById('tipus').value;
        const sorrend = document.getElementById('sorrend').value;
        const url = `https://magyaranime.eu/web/kereso/`;
        const data = new URLSearchParams();
        data.append('search_text', search_text);
        data.append('tipus', tipus);
        data.append('sorrend', sorrend);
        fetch(url, {
            method: 'POST',
            body: data
        }).then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error('Network response was not ok.');
        }).then(text => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const search_results = doc.querySelector('body > section > div > div > div:nth-child(2) > div');
            if (search_results) {
                const results = search_results.querySelectorAll('.gen-movie-contain');
                if (results.length > 0) {
                    let html = '';
                    for (const result of results) {
                        const title = result.querySelector('.gen-movie-info h3 a').textContent;
                        const link = "https://magyaranime.eu" + result.querySelector('.gen-movie-info h3 a').href.match(/\/leiras\/\d+\//)[0];
                        const episodes = result.querySelector('.gen-movie-meta-holder li:first-child').textContent;
                        const season = result.querySelector('.gen-movie-meta-holder li:nth-child(2)').textContent;
                        const image = result.querySelector('.gen-movie-img img').src;
                        html += `
                        <div class="card" style="width: 18rem;">
                            <img src="${image}" class="card-img-top" alt="${title}">
                            <div class="card-body">
                                <h5 class="card-title">${title}</h5>
                                <p class="card-text">${episodes}</p>
                                <p class="card-text">${season}</p>
                                <a href="${link}" class="btn btn-primary" target="_blank">Leírás megtekintése</a>
                            </div>
                        </div>
                        `;

                    }
                    document.querySelector('#results').innerHTML = html;
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
}
