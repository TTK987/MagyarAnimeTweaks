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
