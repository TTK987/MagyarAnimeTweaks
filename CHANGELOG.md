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
