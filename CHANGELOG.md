# Verziók
## 0.1.0 (Nem publikus)
- Első verzió
- A kiegészítő működik a magyaranime.eu oldalon.
 
## 0.1.1 (Nem publikus)
- Hiba javítások
- Megbízhatóbb link keresés a videókhoz

## 0.1.2 (Nem publikus)
- Hiba javítások
    - Nem cserélte le a videólejátszót, ha a videó csak 360p-ben volt elérhető.

## 0.1.3
 - **Első nyilvános verzió**
 - A devtools visszahozása, ha be van kapcsolva a fejlesztői beállítások.
 > (Valamiért a MA úgy döntött, hogy alkalmaz egy disable-devtools nevezetű scriptet, ami letiltja a devtools-t. <3)
 - Hiba javítások

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
- Hiba javítások
- Nem lényeges újítások
    - (background.js és indavideo.js kommentezése)
    - (A kódok átszervezése)
# Verziók
## 0.1.0 (Nem publikus)
- Első verzió
- A kiegészítő működik a magyaranime.eu oldalon.
 
## 0.1.1 (Nem publikus)
- Hiba javítások
- Megbízhatóbb link keresés a videókhoz

## 0.1.2 (Nem publikus)
- Hiba javítások
    - Nem cserélte le a videólejátszót, ha a videó csak 360p-ben volt elérhető.

## 0.1.3
 - **Első nyilvános verzió**
 - Egy kezdetleges logo hozzáadása
 - A devtools visszahozása, ha be van kapcsolva a fejlesztői beállítások.
 > (Valamiért a MA úgy döntött, hogy alkalmaz egy disable-devtools nevezetű scriptet, ami letiltja a devtools-t. <3)
 - Hiba javítások

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
- Hiba javítások
- Nem lényeges újítások
    - (background.js és indavideo.js kommentezése)
    - (A kódok átszervezése)


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

## 0.1.5.1
- Hiba javítások
  - Mega.nz mute gomb hiba javítása.
  - Letöltés hiba javítása firefoxon. (Jelentette: emburcke )
  - Invalid manifest hiba javítása.

## 0.1.5.2
- Hiba javítások
  - Letöltés hiba javítása firefoxon. (Jelentette: emburcke ) (Még mindig nem működött)


## 0.1.5.3
- *Firefox jogok kérése telepítés után.*
> Az megoldás `emburcke` ötlete volt. Köszönöm neki.


## 0.1.6
- **MyAnimeList Keresés**
  - Ha MyAnimeList-en nézel egy animét, akkor van lehetőséged a kiegészítő segítségével megkeresni az adott animét a magyaranime.eu oldalon.
- **Új beállítások**
  - **Automatikus jobb minőség** (Alapértelmezett: Kikapcsolva)
    - **Engedélyezve**: Az oldal automatikusan átirányít a legjobb minőségű videóra.
- Hiba javítások
  - Memória szivárgás javítása letöltésnél.


