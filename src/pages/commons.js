import {MAT} from "../API";

function header(page) {
    return `<header>
    <div class="container">
        <a style="display: flex; text-decoration: none;" href="https://matweaks.hu" target="_blank">
                <span style="font-weight: bold; font-size: 1.5rem; color: #ffffff;">Magyar</span>
                <span style="font-weight: bold; font-size: 1.5rem; color: #3B82F6;">Anime</span>
                <span style="font-weight: bold; font-size: 1.5rem; color: #ffffff;">Tweaks</span>
                ${MAT.isEAP() ? '<span style="font-weight: bold; font-size: 1.5rem; color: red;margin-left: 10px;">EAP</span>' : ''}
        </a>
        <nav id="navbar" class="navbar">
            <a class="nav-link ${page === 'options' ? 'active' : ''}" href="/pages/settings/index.html"><i class="fas fa-cog"></i> Beállítások</a>
            <a class="nav-link ${page === 'bookmark' ? 'active' : ''}" href="/pages/bookmark/index.html"><i class="fas fa-bookmark"></i> Könyvjelzők</a>
            <a class="nav-link ${page === 'resume' ? 'active' : ''}" href="/pages/resume/index.html"><i class="fas fa-history"></i> Előzmények</a>
        </nav>
    </div>
</header>`;
}

function footer() {
    return `
<footer>
    <div class="container">
        <div class="links">
            <a href="https://github.com/TTK987/MagyarAnimeTweaks"> <i class="fab fa-github"></i> MagyarAnimeTweaks GitHub</a>
        </div>
        <div class="footer-bottom">
            <p> &copy; MATweaks 2024 | by TTK987 | Verzió: v${MAT.getVersion()} ${MAT.isEAP() ? '<span style="color: red">EAP<br>Jelenleg egy korai hozzáférésű verziót használsz.</span>' : ''}</p>
        </div>
        <div class="links">
            <a href="https://discord.gg/dJX4tVGZhY"> <i class="fab fa-discord"></i> MagyarAnimeTweaks Discord</a>
        </div>
    </div>
</footer>
<link href="${chrome.runtime.getURL('assets/fa/all.css')}" rel="stylesheet">
`;
}

export {header, footer};

