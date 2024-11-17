import { MAT } from "./API";
if (document.querySelector('input[name="matweaks"][type="hidden"]')) {
   document.querySelector('input[name="matweaks"][type="hidden"]').value = MAT.getVersion();
}
if (document.querySelector('.col-xl-6 center')) {

    const html = document.createElement('div');
    html.setAttribute('style', `color: red;font-size: 18px;margin-top: 20px;text-align: center;font-weight: bold;background-color: #05070b;border-color: #ffffff;padding: .75rem 1.25rem;border: 1px solid var(--primary-color);border-radius: .25rem;margin-bottom: 20px;`);
    html.innerHTML = `
        <span>Ha a rész lejátszása közben a piros, MATWeaks-es hibaüzenetet látod, kérlek jelentsd a hibát a fejlesztőnek és ne a MagyarAnime-nek!</span><br>
        <span>Ezt itt tudod megtenni: <a href='https://discord.gg/dJX4tVGZhY' target='_blank'>Discordon</a> vagy a <a href='https://github.com/TTK987/MagyarAnimeTweaks/issues' target='_blank'>GitHubon</a></span>
        `;
    document.querySelector('.col-xl-6 center').after(html);
}
