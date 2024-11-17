import {footer, header} from "../commons";
import {bookmarks, popup} from "../../API";
let bookmarksData = [];
function init() {
    document.body.innerHTML = `
        ${header('bookmark')}
        <main>
            <div class="container">
                <div class="search-container">
                    <label for="search"><span class="indicator"><i class='fas fa-search'></i></span><input type="text" id="search" placeholder="Keresés..."></label>
                </div>
                <div id="container" class="bookmark-container">
                    ${renderBookmarks()}
                </div>
            </div>
        </main>
        ${footer()}
    `;
}
function renderBookmarks(search = '') {
    const bookmarksData = bookmarks.getBookmarks().filter(bookmark => bookmark.title.toLowerCase().includes(search.toLowerCase()));
    let html = '';
    for (const bookmark of bookmarksData) {
        html += `<div class="bookmark-card">
                    <div class="bookmark-image">
                        <img src="https://animehungary.hu/images_v2/boritokepek/small/${bookmark.datasheetId}.webp" alt="${bookmark.title}">
                    </div>
                    <div class="bookmark-card-header">
                        <h3>${bookmark.title}</h3>
                    </div>
                    <div class="bookmark-card-body">
                        <p>${bookmark.description}</p>
                    </div>
                    <div class="bookmark-card-footer">
                        <button id="delete-${bookmark.id}" class="button"><i class="fas fa-trash"></i></button>
                        <button id="bookmark-${bookmark.id}" class="button"><i class="fas fa-play"></i></button>
                    </div>
                </div>`;
    }
    if (html === '') {
        // The "extra" <p> tag is needed to center the text vertically in the grid.
        html = `<p></p><p style="text-align: center; color: red;font-size: 1.5em; font-weight: bold;margin-top: 20px;width: 100%;height: 100%;">Nincs találat.</p>`;
    }
    return html;
}
function search() {
    let timeout;
    function updateIndicator(isLoading) {
        document.querySelector('.indicator i').className = isLoading ? 'fas fa-spinner spin' : 'fas fa-search';
    }
    document.getElementById('search').oninput = function () {
        updateIndicator(true);
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            document.getElementById('container').innerHTML = renderBookmarks(document.getElementById('search').value);
            addListeners();
            updateIndicator(false);
        }, 500);
    };
    document.getElementById('search').onkeydown = function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('container').innerHTML = renderBookmarks(document.getElementById('search').value);
            addListeners();
        }
    };
}
function addListeners() {
    document.querySelectorAll('.button').forEach(button => {
        button.onclick = function () {
            const [action, id] = button.id.split('-');
            if (action === 'bookmark') {
                bookmarks.openBookmark(parseInt(id));
            } else if (action === 'delete') {
                bookmarks.deleteBookmark(parseInt(id)).then(() => {
                    popup.showSuccessPopup('Könyvjelző törölve.');
                    bookmarksData = bookmarks.getBookmarks();
                    button.parentElement.parentElement.remove();
                    addListeners();
                }).catch(error => {
                    logger.error(`Hiba történt a könyvjelző törlése során. ${error}`);
                    popup.showErrorPopup('Hiba történt a könyvjelző törlése során.');
                });
            }
        };
    });
}
document.addEventListener('DOMContentLoaded', function () {
    bookmarks.loadBookmarks().then((data) => {
        bookmarksData = data;
        init();
        search();
        addListeners();
    });
});