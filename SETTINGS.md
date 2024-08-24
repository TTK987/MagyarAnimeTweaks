# Részletes magyarázat a beállításokhoz
![Beállítások](./img/settingspage.png)
## Általános beállítások

### Előre ugrás
- **Engeedélyezve**: Ki/be kapcsolja az előre ugrást.
- **Ugrás hossza**: Az előre ugrás hossza másodpercben.
- **Billentyűkombináció**: A billentyűkombináció, amivel az előre ugrás aktiválható.

### Hátra ugrás
- **Engeedélyezve**: Ki/be kapcsolja a hátra ugrást.
- **Ugrás hossza**: A hátra ugrás hossza másodpercben.
- **Billentyűkombináció**: A billentyűkombináció, amivel a hátra ugrás aktiválható.

### Következő rész
- **Engeedélyezve**: Ki/be kapcsolja a következő részre ugrást.
- **Billentyűkombináció**: A billentyűkombináció, amivel a következő részre ugrás aktiválható.
> Ha az utolsó résznél vagy, akkor az anime adatlapjára ugrik.

### Előző rész
- **Engeedélyezve**: Ki/be kapcsolja az előző részre ugrást.
- **Billentyűkombináció**: A billentyűkombináció, amivel az előző részre ugrás aktiválható.
> Ha az első résznél vagy, akkor az anime adatlapjára ugrik.

### Automatikus következő rész
- **Engeedélyezve**: Ki/be kapcsolja az automatikus következő részre ugrást.
- **Idő**: Az idő másodpercben, amikor az automatikus következő részre ugrás aktiválódik. (0 = A rész vége után)
> Ha az érték negatív, akkor úgy értelmezi, mintha 0 lenne.

### Automatikus lejátszás
- **Engeedélyezve**: Ki/be kapcsolja az automatikus lejátszást.

## Haladó beállítások

### Fejlesztői beállítások
- **Engeedélyezve**: Ki/be kapcsolja a fejlesztői beállításokat.
- **Console log**
    - **Engeedélyezve**: Ki/be kapcsolja a konzol logolást.
- **Alapértelmezett lejátszó**
    - **< legördülő lista >**: A lejátszó, amit alapértelmezetten használ a kiegészítő. (Ezek: `plyr`, `Alapértelmezett`)
> - `Alapértelmezett`: Nem cseréli le a lejátszót. (Pl: indavideonál marad az indavideo lejátszó)
> - `plyr`: Plyr lejátszóra cseréli le a lejátszót. (Ez egy lejátszó, amit a kiegészítő használ)

### Letöltési név
- **Fájlnév sablon**: A fájlnév sablonja, amit a letöltésnél használ.
    - A használható változók:
        - `%title%`: Az anime címe.
        - `%episode%`: A rész sorszáma.
        - `%0episode%`: A rész sorszáma 0-val kiegészítve. (Pl: 01)
        - `%MAT%`: "MATweaks" szöveg. (Ez a kiegészítő neve, ha nem tudtad volna :D)
        - `%quality%`: A videó minősége. (Pl: 1080p)
        - `%fansub%`: A csapat neve, aki feliratozta az animét.
        - `%source%`: Az oldal neve, ahonnan az anime linkje származik.
    
### Plyr
- **Engeedélyezve**: Ki/be kapcsolja az egyedi kinézetet a plyr lejátszónál.
- **SVG szín**: Az ikonok színe a plyr lejátszónál. (képen pirossal jelölve)


![SVG szín](./img/svgcolor.png)


- **Háttérszín**: Az ikonok háttérszíne amikor rávisszük az egeret. (képen pirossal jelölve)


![Háttérszín](./img/bgcolor.png)


- **Főszín**: A hang és a progress bar színe. (képen pirossal jelölve)


![Főszín](./img/maincolor.png)


- **Szín**: Az ikonok színe, amikor rávisszük az egeret. (képen pirossal jelölve)


![Szín](./img/color.png)
      




