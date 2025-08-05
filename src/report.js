if (document.querySelector('input[name="matweaks"][type="hidden"]')) {
    document.querySelector('input[name="matweaks"][type="hidden"]').value = chrome.runtime.getManifest().version;
}
if (document.querySelector('.col-xl-6 center')) {
    const div = document.createElement('div');
    div.setAttribute('style', `color: red;font-size: 18px;margin-top: 20px;text-align: center;font-weight: bold;background-color: #05070b;border-color: #ffffff;padding: .75rem 1.25rem;border: 1px solid var(--primary-color);border-radius: .25rem;margin-bottom: 20px;`);
    div.innerHTML =
        "<span>Ha a rész lejátszása nem indul el, többszöri próbálkozás után sem, akkor nagy esélyel ez a MATweaks hibája. Kérlek, ebben az esetben a hibát ne a MagyarAnime oldalán jelentsd, hanem a MATweaks Discordján vagy GitHubján.<br>Hiszen, így lehet a leggyorsabban megodani a problémát.<br></span>"+
        "<span>Ezt itt tudod megtenni: <a href='https://discord.gg/dJX4tVGZhY' target='_blank'>Discordon</a> vagy a <a href='https://github.com/TTK987/MagyarAnimeTweaks/issues' target='_blank'>GitHubon</a></span>";
    document.querySelector('.col-xl-6 center').after(div);
}
