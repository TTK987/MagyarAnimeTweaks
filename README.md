# MagyarAnimeTweaks
A magyaranime.eu oldalhoz készült kiegészítő, amelynek segítségével könnyebben lehet nézni az oldalon található animéket.
Ez a kiegészítő animenéző(k)től animenézőknek készült, hogy könnyebbé tegye az animék nézését.
Ebben a kiegészítőben található funkciók közé tartozik a plyr.io videólejátszó használata, az indavideo-ról linkelt animék letöltésének lehetősége, gyorsgombok a videólejátszóhoz, gyorsgombok az animék közötti navigáláshoz és hibák fixálása.
A kiegészítőt a [MagyarAnime](https://magyaranime.eu/) oldalhoz készítettem.

## Előnézet

![Az oldal előnézete a kiegészítővel.](/img/Preview.png "Előnézet")

## Jelenlegi Verzió: 0.1.4
**Elérhető az új verzió!**

## Funkciók
- plyr.io (képen látható) videólejátszó használata, ezzel reklámok nélkül nézheted az animéket.
- Az indavideo-ról linkelt **animék letöltésének** lehetősége.
- Gyorsgombok a videólejátszóhoz. (Csak a plyr.io videólejátszóhoz.)
  - 'Ctrl + Jobbra nyíl' - 85 másodperccel előre.
  - 'Ctrl + Balra nyíl' - 85 másodperccel hátra.
- Gyorsgombok az animék közötti navigáláshoz.
  - 'Alt + Jobbra nyíl' - Következő rész.
  - 'Alt + Balra nyíl' - Előző rész.
- Automatikus ugrás a következő részre, ha az előző véget ért. (Vagy X idővel az előző rész vége előtt.)
- A Következő / Előző rész gomb és az összes rész gomb linkjének fixálása. (Ez akkor hasznos, ha 1080p-ben (Mega.nz-ről) nézed az animét, mert alapból a 720p-s linkre mutat.)
- Mindent be lehet állítani a kiegészítő beállításaiban. (A beállításokat a profilodra kattintva éred el, ami egy előugró ablakban jelenik meg.)


## Telepítés
### Telepítés a böngészőboltból
1. Telepítsd a kiégészítőt a [Chrome](https://chromewebstore.google.com/detail/magyaranimetweaks/kpaljcmdlnbnebockdplokocfgegiaia) böngésződbe. ([INNEN](https://chromewebstore.google.com/detail/magyaranimetweaks/kpaljcmdlnbnebockdplokocfgegiaia))
2. Látogass el a [magyaranime.eu](https://magyaranime.eu/) oldalra.
3. És kész is, most már használhatod a kiegészítőt.


### Telepítés a forráskódból
1. Töltsd le a kiegészítő forráskódját.
2. Tömörítsd ki a fájlokat.
3. Látogass el a [chrome://extensions](chrome://extensions) vagy az [opera://extensions](opera://extensions) oldalra.
4. Kapcsold be a fejlesztői módot.
5. Kattints a `Load unpacked` vagy a `Kicsomagolt elemek betöltése` gombra.
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
- **Automatikus következő epizód**:
  - **Engedélyezve** - Ha be van kapcsolva, akkor automatikusan átugrik a következő részre, ha az előző véget ért. (Vagy X idővel az előző rész vége előtt.)
  - **Ugrás időtartama** - Itt tudod beállítani, hogy mennyi legyen az időtartam, amikor átugrik a következő részre. (Másodpercben) (Negatív érték esetén az érték 0 lesz (azaz közvetlenül a rész vége után ugrunk a következő részre))
- **Fejlesztői beállítások**:
  - **Engedélyezve** - Ha be van kapcsolva, akkor a fejlesztői beállítások szerint fog működni a kiegészítő.
  - **Alapértelmezett lejátszó** - Itt tudod beállítani, hogy melyik videólejátszót szeretnéd használni. (Alap (nincs csere) / plyr.io (híredetés mentes)  / HTML5 (sima video elem))
  - **Console log** - Ha be van kapcsolva, akkor a kiegészítő minden műveletéről logolást kapsz a konzolon.

## Adatvédelem
- A kiegészítő NEM gyűjt semmilyen adatot a felhasználókról.
- A kiegészítő NEM küld semmilyen adatot se a fejlesztőnek, se senkinek.


## Gyakran Ismételt Kérdések
- Milyen böngészőkön használható a kiegészítő?
  - A kiegészítőt Chrome és Opera böngészőkben teszteltem, de más Chromium alapú böngészőkben is működhet.
    - Ezek a böngészők: Brave, Vivaldi, Microsoft Edge, stb.



- Tudom használni a kiegészítőt telefonon?
  - Igen! A kiegészítőt telefonon is használhatod, de nem fognak működni például a gyorsgombok (mert nincs billentyűzet) és a beállítások is furcsán fognak kinézni.
  - A kiegészítőt csak Androidon teszteltem a Kiwi böngészőben. ([Kiwi Browser](https://play.google.com/store/apps/details?id=com.kiwibrowser.browser))
  - Elvileg az összes Chromium alapú böngészőben működnie kellene telefonon is. (ami engedélyezi a kiegészítők telepítését) (Pl.: Yandex Browser, stb.)


- Miért készítettem ezt a kiegészítőt?
  - Mert szeretem az animéket és az oldal használhatóságát szerettem volna növelni. (Habár az oldal már így is nagyon jó.)
  

- Mi várható a következő verzióban?
  - Mega.nz alap lejátszója helyett a plyr.io lejátszó használata.
  

- Mik lesznek a kiegészítőben a jövőben?
  - Még nincs konkrét terv, de ha van ötleted, akkor nyugodtan írd meg nekem Discordon. :)

- Miért nem az animék fordításával segítek?
  - Mert ha kitalálok valami új dolgot (pl jelentkezek fordítónak / lektornak / formázónak), akkor abba nagyon bele tudok merülni, de viszont gyorsan kiégek. (Ez ennél a kiegészítőnél is megtörtént még a fejlesztés elején. :D) (Érdekel a fordítás / lektorálás / formázás, de szerintem sokkal jobb jelentkezők vannak, mint én.(De majd egyszer talán... ))
  - De viszont ha te értesz a fordításhoz / lektoráláshoz vagy formázáshoz, akkor például az [AkioFansub](https://akiofansub.hu/felvetel/) oldalon tudsz jelentkezni fordítónak / lektornak vagy formázónak. (Ez csak egy példa, de rengeteg fansub csoport van, akiknek szükségük van emberekre.)
  

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
- A kiegészítőnek NEM célja a magyaranime.eu oldal szervereinek terhelése (!) vagy a magyaranime.eu oldal szervereinek károsítása (!).
- A kiegészítő NEM használható a magyaranime.eu oldal szervereinek terhelésére (!) vagy a magyaranime.eu oldal szervereinek károsítására (!), ellenkező esetben a kiegészítő használata tilos és a fejlesztők nem vállalnak felelősséget a kiegészítő használatából eredő károkért (pl.: IP tiltás, stb.).
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
- The extension is NOT intended to overload the servers of the magyaranime.eu website (!) or to damage the servers of the magyaranime.eu website (!).
- The extension CANNOT be used to overload the servers of the magyaranime.eu website (!) or to damage the servers of the magyaranime.eu website (!), otherwise the use of the extension is prohibited and the developers are not responsible for any damages caused by the use of the extension (e.g.: IP ban, etc.).
- The extension is only available in Hungarian.
- By using the extension you accept the above.

## Fejlesztők
- [ttk987](https://discord.com/users/537718439586955285)  - Tulajdonos, fejlesztő
- *Ha szeretnél hozzájárulni a kiegészítő fejlesztéséhez, akkor nyugodtan írj nekem Discordon.*


## Támogatás
- [Ko-fi](https://ko-fi.com/ttk987) - Ko-fi (Hatalmas segítség, hogy motivált maradjak.) **(Ha van "felesleges" pénzed, akkor inkább támogasd a Magyar Anime-t.) ([ITT](https://magyaranime.eu/web/tamogatas/))**
- GitHub csillag: ez is nagyon sokat segít, ha adsz egy csillagot a projektnek. :)

## Köszönet
- **[MagyarAnime](https://magyaranime.eu/) - A munkájukért és az oldalért.**
- A **összes** Fansub csoportnak - A **munkájukért** és az **igényes feliratokért** és **fordításokért**.


# További jó animézést!
