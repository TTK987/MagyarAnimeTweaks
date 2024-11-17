import {MAT, Resume} from "../../API";


function init() {
    document.body.innerHTML = `
<div class="container">
    <a style="display: flex; text-decoration: none;" href="https://matweaks.hu" target="_blank" id="logo">
        <span>Magyar</span>
        <span style="color: var(--primary-color);">Anime</span>
        <span>Tweaks</span>
        ${MAT.isEAP() ? '<span style="color: red; margin-left: 5px;">EAP</span>' : ''}
    </a>
    <nav id="navbar" class="navbar">
        <a class="nav-link" href="/pages/settings/index.html" target="_blank">Beállítások <i class="fas fa-cog"></i></a>
        <a class="nav-link" href="/pages/bookmark/index.html" target="_blank" >Könyvjelzők <i class="fas fa-bookmark"></i></a>
        <a class="nav-link" href="/pages/resume/index.html" target="_blank" >Előzmények <i class="fas fa-history"></i></a>
    </nav>
</div>
<div class="container">
    <div id="content"><div class="loader"><i class="fas fa-spinner spin"></i></div></div>
</div>
<link href="${chrome.runtime.getURL('assets/fa/all.css')}" rel="stylesheet">
    `;
}

async function load_latest() {
    Resume.loadData().then(() => {
        let latest = Resume.getLastUpdated();
        let content = document.getElementById('content');
        let episode = latest.episode;
        let anime = latest.anime;
        if (episode === null) {
            content.innerHTML = `
                <div class="episode">
                    <div class="episode-title">
                        Nincs elkezdett epizód
                    </div>
                </div>
            `;
            return;
        }
        content.innerHTML = `
<div class="resume-card">
    <div class="image">
        ${anime.datasheetId !== -1 ? `<img src="https://animehungary.hu/images_v2/boritokepek/small/${anime.datasheetId}.webp" alt="${anime.title}">` : '<div class="no-image"><i class="fas fa-image"></i></div>'}
    </div>
    <div class="resume-card-header">
        <h3>${anime.title}</h3>
    </div>
    <div class="resume-card-footer">
        <div class="episode">
            <div class="episode-title">
                ${episode.epnum}. rész - ${Math.floor(episode.time / 60).toString().padStart(2, '0')}:${Math.floor(episode.time % 60).toString().padStart(2, '0')}
            </div>
            <div class="episode-footer">
                <button id="delete-${episode.id}" class="button"><i class="fas fa-trash"></i></button>
                <button id="resume-${episode.id}" class="button"><i class="fas fa-play"></i></button>
            </div>
        </div>
    </div>
</div>
        `;
    }).catch(() => {
        let content = document.getElementById('content');
        content.innerHTML = `
        <div class="error">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Hiba történt az adatok betöltése közben!</span>
        </div>
        `;
    });
}
window.addEventListener('DOMContentLoaded', async () => {
    init();
    await load_latest();
});

