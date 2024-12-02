import { header, footer } from "../commons";
import {Popup, Logger, Resume} from "../../API";
let resumeData = [];
function init() {
    document.body.innerHTML = `
        ${header('resume')}
        <main>
            <div class="container">
                <div class="search-container">
                    <label for="search"><span class="indicator"><i class='fas fa-search'></i></span><input type="text" id="search" placeholder="Keresés..."></label>
                </div>
                <div id="container" class="resume-container">
                    ${renderResume()}
                </div>
            </div>
        </main>
        ${footer()}
    `;
}
function renderResumeEpisodes(episodes) {
    let html = '';
    for (const episode of episodes) {
        html += `<div class="episode">
                    <div class="episode-title">
                        ${episode.epnum}. rész - ${Math.floor(episode.time / 60).toString().padStart(2, '0')}:${Math.floor(episode.time % 60).toString().padStart(2, '0')}
                    </div>
                    <div class="episode-footer">
                        <button id="delete-${episode.id}" class="button"><i class="fas fa-trash"></i></button>
                        <button id="resume-${episode.id}" class="button"><i class="fas fa-play"></i></button>
                    </div>
                </div>`;
    }
    return html;
}
function renderResume(search = '') {
    const resumeData = Resume.search(search);
    let html = '';
    for (const resume of resumeData) {
        html += `<div class="resume-card">
                    <div class="image">
                        ${ resume.datasheetId !== -1 ? `<img src="https://animehungary.hu/images_v2/boritokepek/small/${resume.datasheetId}.webp" alt="${resume.title}">` : '<div class="no-image"><i class="fas fa-image"></i></div>'}
                    </div>
                    <div class="resume-card-header">
                        <h3>${resume.title}</h3>
                    </div>
                    <div class="resume-card-body">
                        Legutóbbi epizód: ${resume.getLastEpisode().epnum}. rész
                    </div>
                    <div class="resume-card-footer">
                        ${renderResumeEpisodes(resume.episodes)}
                    </div>
                </div>`;
    }
    console.log(resumeData);
    if (html === '') {
        html = `<p></p><p style="text-align: center; color: red;font-size: 1.5em; font-weight: bold;margin-top: 20px;width: 100%;height: 100%;">Nincs találat.</p>`;
    }
    return html;
}
function search() {
    let timeout;
    function updateIndicator(isLoading) {
        document.querySelector('.indicator').innerHTML = isLoading ? '<i class="fas fa-spinner spin"></i>' : '<i class="fas fa-search"></i>';
    }
    document.getElementById('search').oninput = function () {
        updateIndicator(true);
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            document.getElementById('container').innerHTML = renderResume(document.getElementById('search').value);
            addListeners();
            updateIndicator(false);
        }, 500);
    };
    document.getElementById('search').onkeydown = function (event) {
        if (event.key === 'Enter') {
            clearTimeout(timeout);
            document.getElementById('container').innerHTML = renderResume(document.getElementById('search').value);
            addListeners();
            updateIndicator(false);
        }
    };
}
function addListeners() {
    document.querySelectorAll('.button').forEach(button => {
        button.onclick = function () {
            const [action, id] = button.id.split('-');
            if (action === 'delete') {
                Resume.removeData(parseInt(id)).then((result) => {
                    if (result) {
                        Popup.showSuccessPopup('Epizód törölve.');
                        const episodeDiv = button.parentElement.parentElement;
                        const resumeCard = episodeDiv.parentElement.parentElement;
                        episodeDiv.remove();
                        if (resumeCard.querySelectorAll('.episode').length === 0) {
                            resumeCard.remove();
                        }
                        if (document.querySelectorAll('.resume-card').length === 0) {
                            document.getElementById('container').innerHTML = `<p style="text-align: center; color: red;font-size: 1.5em; font-weight: bold;margin-top: 20px;width: 100%;height: 100%;">Nincs találat.</p>`;
                        }

                    } else {
                        Popup.showErrorPopup('Hiba történt az epizód törlése során.');
                    }
                }).catch((error) => {
                    Logger.error(`Error deleting episode: ${error}`);
                    Popup.showErrorPopup('Hiba történt az epizód törlése során.');
                });
            } else if (action === 'resume') {
                Popup.showSuccessPopup('Epizód megnyitása...');
                Resume.openEpisode(parseInt(id));
            }
        };
    });
}
window.addEventListener('DOMContentLoaded', () => {
    Resume.loadData().then((data) => {
        resumeData = data;
        init();
        search();
        addListeners();
    }).catch((error) => {
        Logger.error(`Error loading resume data: ${error}`);
    });
});

