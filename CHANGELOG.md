# Verziók


## 0.1.9.2

- **Bugfix**:
    - A kiegészítő betöltésének további javítása.
    - `/anime/inda-play-...` linkek támogatása.
    - Videa letöltési hiba javítása.
    - Szerver váltás után az event listenerek egymásra rakódása.
        - Ez azt jelenti, hogy ha a szerver váltás után a háttérben futó kód többször is meg lett hívva.
    - Az `következő rész` / `előző rész` gombok használata után nem megfelelő muködés a részek számának lekérdezésekor.
- Egyéb:
  - `következő rész` / `előző rész` gombok használata után várni kell 3 másodpercet, mielőtt újra használhatóak lesznek.
  - A szerver váltás közben egy töltési animáció jelenik meg, amíg a háttérben a kód le nem fut.
  - Frissítés után a `matweaks.hu/changelog#<verziószám>` oldalra való átirányítás átmenetileg kikapcsolva (hogy ne legyen zavaró a felhasználók számára).
  - `terser` helyett a `esbuild` használata a kód tömörítéséhez.


## 0.1.9.1

- **Bugfix**:
    -  Chrome alatt instabil betöltés (bizonyos esetekben nem tudott betöltani a bővítmény)

## 0.1.9

- **FIREFOX TÁMOGATÁS**
    - **Jelenleg ez a verzió NEM támogatja a Firefoxot.**
    - Technikai okok miatt a Firefox verzió még fejlesztés alatt áll.
- **Új kinézet**
    - Az összes UI új kinézetet kapott.
- **Új funkciók**
    - **A plyr lejátszónak teljesen személyre szabható a kinézete.**
        - Ezt a beállításokban tudod megtenni.
- **Új beállítások**
    - **Alapértelmezett ugrás hossza** (Alapértelmezett: 5 másodperc)
        - Ez az alapértelmezett ugrás hossza, amikor simán a nyilakkal előre vagy hátra ugrasz.
        - [További információk](SETTINGS.md#Ugrás)
    - **Előzmények**
        - Új beállítás, amivel be lehet állítani, hogy az előzmények mennyi ideig legyenek megőrizve.
        - [További információk](SETTINGS.md#Előzmények)
- **A felugró beállítások ablak kivételre került**
    - A beállítások mostantól csak a kiegészítő oldalán érhetőek el.
- **Bugfixek**
- **Technikai változások**
    - A kiegészítő nagy része újraírásra került.
    - A kiegészítő mostantól a `vite` build rendszert használja a kód generálásához (előzőleg `webpack` volt használva).
    - `React` és `TypeScript` használata.
- És ennyire emlékszem, olyan rég óta nem volt frissítés és annyi sok változás történt, hogy nem tudom már felidézni az összeset. :D




## 0.1.8

- **Új funkciók**
    - **Könyvjelzők**
        - A animékhez hozzáadható könyvjelző, amivel könnyen visszatérhetsz az adott részhez.
        - [További információk](SETTINGS.md#Könyvjelzők)
    - **Folytatás ahol abbahagytad**
        - Ezzel a funkcióval a kiegészítő megjegyzi, hogy hol hagytad abba az adott animét és részt.
        - [További információk](SETTINGS.md#Előzmények)
- **Új beállítások**
    - **Könyvjelzők** (Alapértelmezett: Engedélyezve)
        - [További információk](SETTINGS.md#Könyvjelzők)
    - **Folytatás ahol abbahagytad** (Alapértelmezett: Engedélyezve)
        - [További információk](SETTINGS.md#Előzmények)
- **Pop-up ablak**
    - A felugró ablak kinézete és funkcionalitása megváltozott.
    - Mostantól a ablakból is elérhetőek a könyvjelzők, az előzmények és a beállítások.
    - Illetve innen könnyen elérhető a legutóbb nézett rész is (amit egy kattintással folymatathatsz ott, ahol abbahagytad).
- **Kinézet**
    - A kiegészítő saját oldalainak kinézete megváltozott.
- Egyéb változások
    - A "HTML5" lejátszó megszűntetésre került.
        - Ha valaki használta, akkor innentől kezdve a "Plyr" lejátszó lesz használva.
    - Kód átszervezés és optimalizálás.
    - `webpack` használata a kód generálásához.
    - `terser` használata a kód tömörítéséhez.
    - `declarativeNetRequest` használata, hogy kiküszöböljük az esetleges összeütközéseket a MagyarAnime alap lejátszójával.
        - Ehhez szükséges megadni az engedélyt a kiegészítő telepítésekor / frissítésekor.

## 0.1.7.1 - 0.1.7.5

- Hibajavítások
    - A kiegészítő nem tudta megfelelően betölteni a beállításokat frissítés után.

## 0.1.7

- **Tovább bővült a támogatott források listája.**
    - Új források: `dailymotion.com`, `rumble.com`, `videa.hu`
- **Fontosabb változások**:
    - **Automatikus jobb minőség** beállítás **Eltávolítva**.
        - Ez azért történt, mert bugos volt és nem működött megfelelően, illetve nem sokan használták.
    - **Új engedélyek**:
        - `downloads` (Dalilymotion videók letöltéséhez)
- **Új beállítások oldal**
- **Új beállítások**
    - **Letöltési név** (Alapértelmezett: `%title% - %episode% - %MAT%`)
        - A letöltött fájl neve.
        - [További információk](SETTINGS.md#letöltési-név)
    - **Plyr** (Alapértelmezett: Kikapcsolva)
        - Egyedi kinézet
        - [További információk](SETTINGS.md#plyr)

## 0.1.6.2

- Hibajavítások
    - A kiegészítő nem tudta megfelelően betölteni a beállításokat.
    - Mega.nz esetén a részek közötti ugrás nem működött megfelelően.

## 0.1.6.1

- Hibajavítások
    - A gombok kattintás után focus-ban maradtak.
    - Ha nem sikerült a beállításokat betölteni, akkor nem működött a kiegészítő.
        - Jelenlegi megoldás: Ha nem sikerült a beállításokat betölteni, akkor a beállítások alapértelmezett értékei lesznek beállítva.
    - Lehet telepíteni a kiegészítőt Kiwi Browserben, telefonra.
- Egyéb változások
    - A kód rendezettebb lett és több kommentet tartalmaz a könnyebb olvashatóság érdekében.

## 0.1.6

- **MyAnimeList Keresés**
    - Ha MyAnimeList-en nézel egy animét, akkor van lehetőséged a kiegészítő segítségével megkeresni az adott animét a magyaranime.eu oldalon.
- **Új beállítások**
    - **Automatikus jobb minőség** (Alapértelmezett: Kikapcsolva)
        - **Engedélyezve**: Az oldal automatikusan átirányít a legjobb minőségű videóra.
- Hibajavítások
    - Memória szivárgás javítása letöltésnél.

## 0.1.5.3

- _Firefox jogok kérése telepítés után._
    > Az megoldás `emburcke` ötlete volt. Köszönöm neki.

## 0.1.5.2

- Hibajavítások
    - Letöltés hiba javítása firefoxon. (Jelentette: emburcke ) (Még mindig nem működött)

## 0.1.5.1

- Hibajavítások
    - Mega.nz mute gomb hiba javítása.
    - Letöltés hiba javítása firefoxon. (Jelentette: emburcke )
    - Invalid manifest hiba javítása.

## 0.1.5

- **Mega.nz alap lejátszója helyett a plyr.io lejátszó használata.**
- magyaranime.hu domain támogatás.
    > Nem tudom miért nem volt eddig benne. xd
- **Új beállítások**
    - **Automatikus indítás** (Alapértelmezett: Engedélyezve)
        - **Engedélyezve**: Az oldal betöltése után azonnal elindítja a videót.
- "Javítások" beállítások kivétele.
    > Ez azért került kivételre, mert mostantól a MA alapból a jó linkre továbbít.
- Firefox támogatás.
- Egy kezdetleges Discord szerver, ahol segítséget kérhetsz és értesülhetsz a legújabb fejlesztésekről és hiba bejelentést tehetsz. [Kattints ide](https://discord.gg/dJX4tVGZhY)

## 0.1.4

- Automatikus ugrás a következő részre, ha az előző véget ért. (Vagy X idővel az előző rész vége előtt.)
- Ha a nincs következő rész, akkor az anime adatlapjára ugrás.
- Plyr lejátszó v3.7.8-ra való frissítése.
- **Új beállítások**
    - **Automatikus következő epizód** (Alapértelmezett: Kikapcsolva)
        - **Engedélyezve**: Az oldal automatikusan átugrik a következő részre, ha az előző véget ért.
        - **Idő**: Az idő, amennyi idővel az előző rész vége előtt átugrik a következő részre. (Alapértelmezett: 50 másodperc) (Negatív vagy 0 érték esetén a rész vége után ugrik a következő részre.)
- Az oldal-t nem kell újratölteni, ha a beállításokat változtatjuk.
    > Ezzel is kevesebb lesz a szerver terhelés.
- Mivel a disable-devtool már nincs jelen az oldalon, ezért a devtools visszahozása nem szükséges.
    > Köszi a MA-nak, hogy eltávolította a disable-devtools-t. Megkönnyítette a dolgom. <3
- Logo hozzáadása a bővítményhez.
- Hibajavítások
- Nem lényeges újítások
    - (background.js és indavideo.js kommentezése)
    - (A kódok átszervezése)

## 0.1.3

- **Első nyilvános verzió**
- Egy kezdetleges logo hozzáadása
- A devtools visszahozása, ha be van kapcsolva a fejlesztői beállítások.
    > (Valamiért a MA úgy döntött, hogy alkalmaz egy disable-devtools nevezetű scriptet, ami letiltja a devtools-t. <3)
- Hibajavítások

## 0.1.2 (Nem publikus)

- Hibajavítások
    - Nem cserélte le a videólejátszót, ha a videó csak 360p-ben volt elérhető.

## 0.1.1 (Nem publikus)

- Hibajavítások
- Megbízhatóbb link keresés a videókhoz

## 0.1.0 (Nem publikus)

- Első verzió
- A kiegészítő működik a magyaranime.eu oldalon.

