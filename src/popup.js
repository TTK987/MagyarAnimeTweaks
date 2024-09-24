import {popup, bookmarks, MAT, ResumePlayBack} from "./API";

window.onload = function () {
    document.getElementById('bookmarks').onclick = function () {
        chrome.tabs.create({ url: chrome.runtime.getURL('bookmarks.html'), active: true });
    };
    document.getElementById('resume').onclick = function () {
        chrome.tabs.create({ url: chrome.runtime.getURL('resume.html'), active: true });
    }
    document.getElementById('settings').onclick = function () {
        chrome.tabs.create({ url: chrome.runtime.getURL('options.html'), active: true });
    }
    ResumePlayBack.loadResumeData().then((data) => {
        let lastWatched = ResumePlayBack.getLastUpdated();
        if (lastWatched.anime && lastWatched.episode) {
            document.getElementById('last-episode').innerHTML = `
                <div class="MAT-card">
                    <img src="https://animehungary.hu/images_v2/boritokepek/small/${lastWatched.anime.datasheetId}.webp"
                    class="MAT-card-img-top" alt="${lastWatched.anime.title}">
                    <div class="MAT-card-body">
                        <h5 class="MAT-card-title">${lastWatched.anime.title}</h5>
                        <a href="${lastWatched.episode.url}" class="btn-open">${lastWatched.episode.epnum}. rész folytatása</a>
                    </div>
                </div>
            `;
        } else {
            document.getElementById('last-episode').innerHTML = `
            <p style="text-align: center; color: red;font-size: 1.5em; font-weight: bold;margin-top: 20px;width: 100%;height: 100%;">Nincs találat.</p>
            `;
        }
    }).catch((error) => {
        console.error(error);
    });
}
