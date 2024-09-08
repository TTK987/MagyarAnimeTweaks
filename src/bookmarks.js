import { bookmarks } from "./API";

window.addEventListener('DOMContentLoaded', async () => {
    loadBookmarks();
    document.getElementById('container').onclick = function (event) {
        const [action, id] = event.target.id.split('-');
        if (action === 'bookmark') {
            bookmarks.openBookmark(id);
        } else if (action === 'delete') {
            bookmarks.deleteBookmark(id).then(() => {
                loadBookmarks();
            }).catch(error => {
                console.error('Error:', error);
                document.getElementById('container').innerHTML = 'Hiba történt a könyvjelző törlése során.';
            });
        }
    };
    let timeout;
    document.getElementById('search').oninput = function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            document.getElementById('container').innerHTML = bookmarksToHTML(searchBookmarks());
        }, 500);
    };
    document.getElementById('search').onkeydown = function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('container').innerHTML = bookmarksToHTML(searchBookmarks());
        }
    };
});

function bookmarksToHTML(bookmarks) {
    let html = '';
    for (const bookmark of bookmarks) {
        html += `
        <div class="card" style="width: 18rem;">
            <img src="https://animehungary.hu/images_v2/boritokepek/small/${bookmark.datasheetId}.webp" class="card-img-top" alt="${bookmark.title}">
            <div class="card-body">
                <h5 class="card-title">${bookmark.title}</h5>
                <p class="card-text">${bookmark.description}</p>
                <button class="btn btn-primary" id="bookmark-${bookmark.id}">Megnyitás</button>
                <button class="btn btn-danger" id="delete-${bookmark.id}">Törlés</button>
            </div>
        </div>
        `;
    }
    if (html === '') {html = `<p style="text-align: center; color: red;font-size: 1.5em; font-weight: bold;margin-top: 20px;width: 100%;height: 100%;">Nincs találat.</p>`;}
    return html;
}

function loadBookmarks() {
    bookmarks.loadBookmarks().then(bookmarks => {
        console.log(bookmarks);
        document.getElementById('container').innerHTML = bookmarksToHTML(bookmarks);
    }).catch(error => {
        console.error('Error:', error);
        document.getElementById('container').innerHTML = 'Hiba történt a könyvjelzők betöltése során.';
    });
}

function searchBookmarks() {
    const search = document.getElementById('search').value;
    return bookmarks.getBookmarks().filter(bookmark => bookmark.title.toLowerCase().replace(/ /g, '').includes(search.toLowerCase().replace(/ /g, '')) || bookmark.description.toLowerCase().replace(/ /g, '').includes(search.toLowerCase().replace(/ /g, '')));
}