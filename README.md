# MagyarAnimeTweaks
A magyaranime.eu oldalhoz készült kiegészítő, amelynek segítségével könnyebben lehet nézni az oldalon található animéket.
Ez a kiegészítő animenéző(k)től animenézőknek készült, hogy könnyebbé tegye az animék nézését.
Ebben a kiegészítőben található funkciók közé tartozik a plyr.io videólejátszó használata, az indavideo-ról linkelt animék letöltésének lehetősége, gyorsgombok a videólejátszóhoz, gyorsgombok az animék közötti navigáláshoz és hibák fixálása.
A kiegészítőt a [MagyarAnime](https://magyaranime.eu/) oldalhoz készítettem.

## Előnézet

![Az oldal előnézete a kiegészítővel.](/img/Preview.png "Előnézet")

## EZ A KIEGÉSZÍTŐ MÉG BÉTA VERZIÓBAN VAN, EZÉRT LEHETNEK BENNE BUGOK!
## Jelenlegi Verzió: 0.1.3

## Funkciók
- plyr.io (képen látható) videólejátszó használata, ezzel reklámok nélkül nézheted az animéket.
- Az indavideo-ról linkelt animék letöltésének lehetősége.
- Gyorsgombok a videólejátszóhoz. (Csak a plyr.io videólejátszóhoz.)
    - 'Ctrl + Jobbra nyíl' - 85 másodperccel előre.
    - 'Ctrl + Balra nyíl' - 85 másodperccel hátra.
- Gyorsgombok az animék közötti navigáláshoz.
    - 'Alt + Jobbra nyíl' - Következő rész.
    - 'Alt + Balra nyíl' - Előző rész.
- A Következő / Előző rész gomb és az összes rész gomb linkjének fixálása. (Ez akkor hasznos, ha 1080p-ben (Mega.nz-ről) nézed az animét, mert alapból a 720p-s linkre mutat.)
- Mindent be lehet állítani a kiegészítő beállításaiban. (A beállításokat a profilodra kattintva éred el, ami egy előugró ablakban jelenik meg.)


## Telepítés
### Telepítés a böngészőboltból (nem elérhető)
1. Telepítsd a kiégészítőt az [Opera](https://addons.opera.com/) vagy a [Chrome](https://chromewebstore.google.com/category/extensions) böngésződbe.
2. Látogass el a [magyaranime.eu](https://magyaranime.eu/) oldalra.
3. És kész is, most már használhatod a kiegészítőt.


### Telepítés a forráskódból
1. Töltsd le a kiegészítő forráskódját.
2. Tömörítsd ki a fájlokat.
3. Látogass el a [chrome://extensions](chrome://extensions) vagy az [opera://extensions](opera://extensions) oldalra.
4. Kapcsold be a fejlesztői módot.
5. Kattints a `Load unpacked` vagy a `Kicsomagolt bővítmények betöltése` gombra.
6. Válaszd ki a kiegészítő mappáját.
7. És kész is, most már használhatod a kiegészítőt.


## Beállítások
![A beállítások menü](/img/Settings.png "Beállítások")
A beállításokat a profilodra kattintva éred el, ami egy előugró ablakban jelenik meg. Itt tudod beállítani a kiegészítőt.
Részletes leírás a beállításokról:
- **Előre / Hátra ugrás**:
    - **Engedélyezve** - Ha be van kapcsolva, akkor a videólejátszóban lehetőséged van előre és hátra ugrani a videóban. (Persze az alap +/- 5 sec mellett.)
    - **Ugrás időtartama** - Itt tudod beállítani, hogy mennyi legyen az előre és hátra ugrás időtartama. (Másodpercben)
    - **Gomb** - Itt tudod beállítani, hogy milyen gombot kell lenyomnod, hogy előre vagy hátra ugorj a videóban.
- **Következő / Előző epizód**:
    - **Engedélyezve** - Ha be van kapcsolva, akkor a videólejátszóban lehetőséged van a következő és az előző epizódra ugrani.
    - **Gomb** - Itt tudod beállítani, hogy milyen gombot kell lenyomnod, hogy a következő vagy az előző epizódra ugorj.
- **Javítások**:
    - **Engedélyezve** - Ha be van kapcsolva, akkor a fixálja a hibákat az oldalon.
    - **Leírás**: A részek linkjeinek fixálása. (Ez akkor hasznos, ha 1080p-ben (Mega.nz-ről) nézed az animét, mert alapból a 720p-s linkre mutat.)
- **Fejlesztői beállítások**:
    - **Engedélyezve** - Ha be van kapcsolva, akkor a fejlesztői beállítások szerint fog működni a kiegészítő.
    - **Alapértelmezett lejátszó** - Itt tudod beállítani, hogy melyik videólejátszót szeretnéd használni. (Indavideo / plyr.io / alap HTML5 lejátszó)
    - **Console log** - Ha be van kapcsolva, akkor a kiegészítő minden műveletéről logolást kapsz a konzolon.
    - **Egyéb (nem listázott)** - Ha engedélyezve vannak a fejlesztői beállítások, akkor a devtools-t is visszahozza a kiegészítő. (Ez amiatt van, hogy ha valami hibát találsz, akkor tudj jelenteni nekem.)

## Mi várható a következő verzióban?
- Automatikus ugrás a következő részre, ha az előző véget ért. (Vagy X idővel az előző rész vége előtt.)
- Ha a nincs következő rész, akkor az anime adatlapjára ugrás.
- Egyenlőre csak ezek a funkciók vannak tervben, de ha van valami ötleted, akkor nyugodtan írj nekem Discordon.

## Mik lesznek a kiegészítőben a jövőben?
- Mega.nz alap lejátszója helyett a plyr.io lejátszó használata.


## Hibajelentés
- Ha hibát találsz a kiegészítőben, akkor azt a [GitHub](https://github.com/TTK987/MagyarAnimeTweaks/issues/) oldalon tudod jelenteni.
- Opcionálisan nekem is küldhetsz üzenetet Discordon: *ttk987*  [Discord](https://discord.com/users/537718439586955285)


## Nyilatkozat
- A kiegészítő NEM áll kapcsolatban sem a magyaranime.eu oldallal, sem az indavideo.hu oldallal.
- A programot az MIT licensz védi.
- A kiégészítő csak a magyaranime.eu oldalon használható.
- A fejlesztők nem vállalnak felelősséget a kiegészítő használatából eredő károkért.
- A kiegészítő a Magyar Anime oldalon található "Az oldalon található tartalom szabadon felhasználható" feltételeknek megfelelően készült.
- A kiegészítő a Magyar Anime oldal DMCA szabályainak megfelelően készült. [MA DMCA](https://magyaranime.eu/web/dmca/)
- A kiegészítő fejlesztője (/fejlesztői) fenntartják a jogot, hogy bármikor módosítsák a kiegészítőt.
- A Magyar Anime fejlesztőjének (/fejlesztőinek) kérése esetén a kiegészítőt eltávolítom a GitHubról és minden más platformról.
- A kiegészítő csak magyar nyelven érhető el.
- A kiegészítő használatával elfogadod a fentebb felsoroltakat.

## Disclaimer
- The extension is NOT related to the magyaranime.eu website or the indavideo.hu website.
- The program is protected by the MIT licence.
- The extension can only be used on the magyaranime.eu website.
- The developers are not responsible for any damages caused by the use of the extension.
- The extension was created in accordance with the "The content on the site is freely available" terms of the Magyar Anime website.
- The extension was created in accordance with the DMCA rules of the Magyar Anime website. [MA DMCA](https://magyaranime.eu/web/dmca/)
- The developers (/s) reserve the right to modify the extension at any time.
- If the developer (/s) of Magyar Anime requests it, I will remove the extension from GitHub and any other platform.
- The extension is only available in Hungarian.
- By using the extension you accept the above.

## Fejlesztők
- [ttk987](https://discord.com/users/537718439586955285)  - Tulajdonos, fejlesztő
- *Ha szeretnél hozzájárulni a kiegészítő fejlesztéséhez, akkor nyugodtan írj nekem Discordon.*


## Támogatás
- [Ko-fi](https://ko-fi.com/ttk987) - Ko-fi (Hatalmas segítség, hogy motivált maradjak.)
- GitHub csillag: ez is nagyon sokat segít, ha adsz egy csillagot a projektnek. :)

## Köszönet
- [MagyarAnime](https://magyaranime.eu/) - A munkájukért és az oldalért.
- A **összes** Fansub csoportnak - A **munkájukért** és az **igényes feliratokért** és **fordításokért**.


# További jó animézést!
