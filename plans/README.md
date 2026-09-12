# Rörelseplaner — aimstudios.se

Planer framtagna av skillen `improve-animations` efter en granskning av hela
kodbasens rörelse, verifierad i Chrome via Playwright mot den publicerade sajten.
**Samtliga sex planer är genomförda och driftsatta 2026-09-06.**

Alla planer är stämplade med commit `a2052b5`.

## Planer

| # | Titel | Fynd i granskningen | Allvar | Filer | Status |
|---|---|---|---|---|---|
| [001](001-ta-bort-preloadern.md) | Ta bort preloadern och skrivmaskinen, ge rubriken en kort intoning | 1 | HÖG | `index.html`, `styles.css`, `scripts.js` | **DONE** `10ce157` |
| [002](002-tjanstekortens-intoning.md) | Återställ intoningen på tjänstekorten | 2 | HÖG | `styles.css` | **DONE** `7083811` |
| [003](003-skickat-laget.md) | Ge formulärets skickat-läge en övergång | 3 | MELLAN-HÖG | `styles.css`, `scripts.js` | **DONE** `a85a927` |
| [004](004-tryckrespons.md) | Ge knapparna tryckrespons | 4 | MELLAN | `styles.css` | **DONE** `aac9bcc` |
| [005](005-hover-pa-pekskarm.md) | Stäng av hover-rörelse på pekskärm | 5 | MELLAN | `styles.css` | **DONE** `e6b54c9` |
| [006](006-dod-rorelsekod.md) | Städa bort död rörelsekod | 7 | MELLAN | `styles.css`, `scripts.js` | **DONE** `fd28b4c` |

Fynd 6 och 8–12 ur granskningen (24 oändliga animationer, `transition: all`,
det globala reduced-motion-blocket, saknad stagger, skrollindikatorns `width`,
FAQ:ns `max-height`) har medvetet **inga** planer. De är antingen lägre hävstång
eller — som FAQ:n — mekaniskt korrekta redan i dag.

## Rekommenderad ordning

```
001  →  002  →  006  →  003  →  004  →  005      (alla genomforda 2026-09-06)
```

**Skälet till ordningen:** 001 och 002 är de två med störst effekt och minst risk
— första intrycket respektive alla tjänstekort på hela sajten. 003 är avgränsad
till ett enda formulär. 004 och 005 lägger bara till block sist i `styles.css`
och stör därför ingenting. 006 tar bort ~55 rader och ligger sist just därför.

Varje plan kan köras och driftsättas för sig. Ingen plan förutsätter att en annan
har körts först.

## Beroenden och fallgropar

- **Radnummer driftar.** Varje plan citerar rader ur commit `a2052b5`. Så fort en
  plan har tagit bort eller lagt till rader stämmer inte nästa plans radnummer.
  **Leta alltid upp koden på innehåll, inte på radnummer**, och stanna om den
  inte ser ut som citatet i planen.
- **005 och 006 rör samma selektorer.** Plan 005 utesluter med flit `.svc-wide`
  ur sitt pekskärmsblock, eftersom 006 raderar hela `.svc-wide`. Körs 006 först
  finns selektorn redan inte — då stämmer 005 ändå. Körs 005 först: kontrollera
  efter 006 att inga `.svc-wide`-selektorer blivit kvar i pekskärmsblocket.
- **001 och 006 rör båda `scripts.js`.** 001 tar bort rad 3–9 (preloadern), vilket
  flyttar `.svc-wide`-IIFE:n i 006 från rad 667–702 till 660–695. Sök på
  kommentarraden `/* ---------- svc-wide: magnetisk 3D-tilt` i stället.
- **Cachebrytaren.** Varje plan avslutas med en `?v`-bumpning. Körs flera planer i
  ett svep: **bumpa en gång, sist.** Värdet måste vara identiskt på `styles.css`,
  `scripts.js` och `unlock.js` på alla åtta sidor plus `404.html`. Vid skrivande
  stund `?v=116`.
- **Formuläret får aldrig skickas i test.** Både `#bookForm` och `#orderForm`
  postar till en riktig inkorg via Formspree. Plan 003 innehåller ett mätskript
  som utlöser skickat-läget utan nätverksanrop — använd det.
- **Två planer innehåller ett beslut, inte bara ett utförande.** 001 gör
  skrivmaskinen snabbare (3 604 ms → ~1 120 ms) och 006 raderar en
  bakgrundszoom som skulle kunna återanvändas på tjänstekorten. Båda är
  markerade i respektive plan. Stäm av dem innan de körs.

## Mätregel: PSI före och efter — lokala siffror räcker inte

**Bakgrund, 2026-09-06 till 2026-09-07.** Tva andringar ur samma pass visade sig
kosta poang och revs bada. Den forsta: en vy-gatning av oändliga loopar (`IntersectionObserver`
som satte `animation-play-state: paused` utanför vyn) rekommenderades på en lokal
fps-mätning: 50,9 fps med looparna igång mot 60,0 fps med dem pausade, p95
33,3 → 16,8 ms. En parad omätning i samma session kunde inte reproducera
skillnaden — siffran var brus från en osättad sida. Ändringen byggdes ändå.

Resultatet mot PSI:

```
              före        efter       delta
mobil          97          84         -13
desktop        99          62         -37
TBT mobil       2 ms      464 ms
TBT desktop     0 ms      677 ms
FCP/LCP/CLS  oförändrade
```

Isolerat efteråt med Lighthouse desktop, två körningar rygg mot rygg:

```
med gatingen:   score 56 | TBT 754 ms | Style & Layout 2028 ms
utan gatingen:  score 97 | TBT 125 ms | Style & Layout  639 ms
```

Observatörens egen JS-tid var bara **3,6 ms** över 10 callbacks och 31 klassbyten
under laddningen. Kostnaden låg alltså inte i koden utan i vad ett byte av
`animation-play-state` på ett element med pågående animation utlöser nedströms i
renderingskedjan. Exakt vilken mekanism är **inte** utrett.

### Bisektionens utfall — vad som revs och vad som blev kvar

Bisekterat med PSI som instrument, en commit i taget, Fredrik korde matningen.

```
?v=116   utgangslage        mobil 97  desktop 99   TBT   2 /   0 ms
?v=121   alla fem andringar mobil 84  desktop 62   TBT 464 / 677 ms
?v=122   C1 riven           mobil 95  desktop 94   TBT 118 / 168 ms
?v=123   B2 ocksa riven     mobil 97  desktop 99   TBT  30 /  88 ms
```

**Rivna — bada testade, bada utan uppmätt vinst:**

| | Vad | Kostnad |
|---|---|---|
| **C1** | `IntersectionObserver` som satte `animation-play-state: paused` utanför vyn | ~629 ms TBT |
| **B2** | `requestAnimationFrame`-countup på kalkylatorns summa | ~80 ms TBT |

**Kvar och verifierat oskyldiga** — golvet återställdes exakt med dessa på plats,
så de behövde aldrig testas var för sig:

- **B1** prisväljaren: siffran tonas ut och in, sparraden fälls med `opacity` + `max-height`
- **B3** chattpanelens `transform-origin: bottom right`
- **C4** borttagen död kod (`casesPin`/`casesTrack`)

**Lärdomen:** `requestAnimationFrame`-loopar och toggling av
`animation-play-state` kostar mer på den här sajten än de ger. **Föreslå dem
inte igen utan uppmätt vinst från PSI.** Rena CSS-övergångar på `opacity` och
`transform`, som B1 och B3, är däremot gratis — de kör bara vid interaktion och
syns inte i TBT.


### Rivet i F18, bekräftat i F19: `glowLinePulse`

`.footer-glow-line` — en 1 px indigogradient vid överkanten av `.footer-content`
som pulsade mellan `opacity` 0,3 och 0,75 var tredje sekund, oändligt — revs i
F18 när terminaltexten ovanför footern togs bort. Utan terminaltexten hamnade
den 1 px under footerns egen överkant och gav en dubbel linje. Överkanten är
sedan dess en statisk dämpad indigolinje, `rgba(99,102,241,.30)`.

```
?v=126   före F18    mobil 97  desktop  99
?v=127   efter F18   mobil 97  desktop 100   TBT 16 / 9 ms   CLS 0 / 0
```

**Desktop gick 99 → 100 i samma pass som pulsen försvann.** Passet innehöll
fler ändringar, så poängen kan inte tillskrivas enbart den — men den gick åt
rätt håll, och det räcker. Frågan om att bygga tillbaka linjen ställdes i F19
och **avslogs, alternativ 1 av tre**:

- Vi bygger inte tillbaka delar av det som gav den enda gratispoängen på länge.
- En uttonande gradient på en 1 px-linje är en detalj ingen besökare lägger
  märke till. Komplexitet i CSS:en utan synlig vinst.
- Den nya footern är avskalad med flit. Pulsen och gradienten hörde till den
  gamla footern med terminaltext och tre klumpar i bottenraden. Den finns inte
  längre.

**Utred inte det här igen.** `.footer-glow-line` och `@keyframes glowLinePulse`
finns inte kvar i `styles.css` — verifierat med grep, noll träffar. Footerns
överkant rörs inte.

### Regler som följer av detta

1. **PSI mäts före och efter varje pass som rör rörelse eller skript.** Fredrik
   kör den, Code väntar in svaret innan nästa steg. Lokala mätningar duger till
   att hitta buggar, inte till att godkänna prestanda.
2. **Lokala fps-siffror förutspår inte PSI.** rAF-sampling på en inläst, stillastående
   sida ser inte recalc-stormar under laddning, och det är i det fönstret TBT mäts.
3. **Kontrollera maskinens last innan en lokal Lighthouse-körning tolkas.** Under
   det här passet låg CPU:n på i snitt 63 % med all Chrome dödad, och samma
   konfiguration gav score mellan 47 och 97 mellan körningar. Interfoliera
   konfigurationerna (A,B,A,B) så att drift inte hamnar på en av dem.
4. **En ändring utan uppmätt vinst byggs inte.** Omätningen visade noll vinst
   redan innan bygget. Det var skäl nog att låta bli.

## Speed Index är bimodalt på den här sajten — uppmätt 2026-09-12

**Detta är viktigare än enskilda pass.** Flera beslut i loggen ovan vilar på
enstaka PSI-körningar. Den grunden håller inte för SI.

Uppgift 4 — `@font-face` flyttat till `assets/fonts/fonts.css` — mätte
**SI 4182 ms** mot föregående commits **1051 ms**. Fyra gånger långsammare, och
praktiskt taget identiskt med de **4154 ms** sajten låg på före typsnittspasset.
En interfolierad A/B mot ett worktree av föregående commit visade motsatsen:

```
              SI      FCP    typsnitt applicerade
v129        6587     6596    6148 ms
v130        5101     4932    5876 ms
v129        6182     6084    6355 ms
v130        5089     4948    5868 ms
snitt   v129 6385    v130 5095    delta -1290 ms
```

Ändringen friskrevs. Därefter kördes PSI fyra gånger på `?v=130` med **identisk
kod och ingenting ändrat emellan**:

```
mobil      99 · 97 · 97
desktop   100 · 99 · 100 · 100
SI mobil, de tva korningar dar den noterades:   1051 ms   och   4182 ms
```

**Det är beviset.** Samma commit, samma sida, fyra gånger. Prestandapoängen
svänger två steg på mobil och ett på desktop, och Speed Index skiljer fyra
gånger mellan två körningar av exakt samma kod. **Både 1051 och 4182 ms är
sanna värden.** Hade vi mätt en gång före och en gång efter vilken ändring som
helst, hade vi kunnat få vilken slutsats vi ville.

### Orsaken: 23 oändliga animationer löper genom hela mätfönstret

Speed Index mäter visuell stabilisering. En sida som aldrig slutar röra sig
stabiliseras aldrig, och värdet beror då på vad mätfönstret råkar fånga.

Startsidan har 23 löpande oändliga animationer, varav **10 inom vyporten
412x823 vid scrollläge 0** — alltså inom det Lighthouse filmar. Fyra av dem
utlöser ommålning, inte bara komposition:

```
logoGradient   span.logo-text      y=16    background-position   malar om
pulse          span.pulse          y=331   box-shadow            malar om
promoPulse     #promoSticker       y=692   box-shadow            malar om
orbPulse       div.ai-orb-core     y=737   transform, box-shadow malar om
promoBreathe   div.promo-vp        y=691   transform             komposit
particleFloat  div.ai-orb-particles y=701  transform, opacity    komposit  (2 st)
ringSpin       div.ai-orb-ring     y=704   transform             komposit  (3 st)
```

Cyklerna är 2000-12000 ms, alltså längre än mätfönstret. Ingen hinner tillbaka
till utgångsläget. Samma kärna finns på alla åtta riktiga sidor; `/webbdesign/`
har flest med 29 löpande. `404.html` och `integritetspolicy.html` har noll.

**Detta är inte nytt och inte infört av något enskilt pass.** Animationerna har
funnits där hela tiden. Det som är nytt är att vi vet om dem.

### Regler för hur PSI ska läsas

1. **En enskild PSI-körning är inte bevis.** Kör tre, använd medianen.
2. **Ett delta under cirka 3000 ms i SI är brus** tills motsatsen visats med
   interfolierad A/B. Det var spannet mellan de två lägena här.
3. **FCP, LCP, TBT och CLS är stabila och går att lita på enskilt.** SI gör det
   inte — och eftersom SI väger in i prestandapoängen är **poängen själv lika
   opålitlig**. I passet ovan rörde sig FCP 222 ms och LCP 133 ms medan SI
   påstods ha rört sig 3131 ms.
4. **Metoden som faktiskt avgör** är interfolierad A/B mot ett git-worktree av
   föregående commit, inte PSI före och efter.

### Riggen — parametrar att återanvända

Så att nästa mätning går att jämföra med den här:

```
git worktree add --detach <tmp>/v<N-1> HEAD~1     # foregaende commit
lokal statisk server for bada trad, korrekta cache-headers
  (no-store ger falska dubbletthamtningar av woff2 nar en familj
   har flera @font-face mot samma URL - det kontaminerade forsta matningen)

vyport          412 x 823
deviceScaleFactor  1,75
isMobile        true
CPU             4x strypning   (Emulation.setCPUThrottlingRate)
natverk         1,6 Mbit/s ned, 750 kbit/s upp, 150 ms RTT
ordning         A,B,A,B - aldrig A,A,B,B
```

SI beräknas ur `Page.startScreencast` med histogramlikhet mot sista bildrutan.
Skripten ligger inte i repot; de byggs om vid behov ur den här beskrivningen.

### Vad detta betyder för äldre beslut

Två beslut i loggen ovan vilar delvis på enstaka SI- eller poängmätningar och
bör inte åberopas som bevisade:

- **Kodregnet gjordes opt-in** delvis på prestandaargument.
- **`glowLinePulse` revs** och beslutet bekräftades med "desktop 99 -> 100".

Båda kan mycket väl ha varit rätt av andra skäl — kodregnet ritar på canvas
varje bildruta, och den dubbla footerlinjen var ett verkligt grafiskt fel. Men
**poängdeltat i sig bevisade ingenting.** Riv inte upp besluten; åberopa bara
inte siffrorna.

### Spåret är stängt: de fyra ommålande animationerna lämnas som de är

Beslut 2026-09-12, F20. **Utred inte det här igen.**

De fyra animationer som löper inom vyporten och utlöser ommålning är kartlagda
och **medvetet lämnade orörda**:

```
logoGradient   span.logo-text        y=16    background-position   107x32 px    ~3 400 px2   8 sidor
pulse          span.pulse            y=331   box-shadow             23x23 px       529 px2   8 sidor
promoPulse     #promoSticker         y=692   box-shadow           162x162 px   ~26 000 px2   bara /
orbPulse       div.ai-orb-core       y=737   transform,box-shadow 176x176 px   ~31 000 px2   8 sidor
```

**Skälet:** en konvertering till `transform`/`opacity` minskar ommålningen men
inte pixelförändringen. Speed Index mäter det senare — den skiljer inte på en
pixel som ändrats av en ommålning och en som flyttats av kompositorn. TBT ligger
dessutom redan på 0 ms på både mobil och desktop, så det finns inget uppmätt
CPU-problem att lösa. **Vinsten går inte att mäta, alltså byggs ändringen inte**
— samma regel som i punkt 4 ovan.

För fullständighetens skull, så att analysen inte behöver göras om: `promoPulse`
och `pulse` hade gått att bygga om rakt av — `.promo-sticker::after` bär redan
pulsen ensam och `.pulse::after` är fri. `orbPulse` hade gått med en
fidelitetsrisk, eftersom en skalad glöd även skalar sin suddighet medan en
animerad `blur` inte gör det. `logoGradient` hade **inte** gått utan att bygga om
headerns markup — `background-clip: text` målar gradienten inuti glyferna, och
en `transform` flyttar glyferna med sig. Genomgående hake: `box-shadow`-spridning
är absoluta pixlar medan `scale` är relativt, så klistermärket hade krävt två
skalvärden för sina två breakpoints.

**Den enda ändring som faktiskt skulle flytta SI** är att låta animationerna
upphöra efter ett ändligt antal iterationer, eller att inte starta dem i första
vyn — framför allt orben, som är fast i vyporten på alla åtta sidor. Det är en
**designändring, inte en optimering, och den är avvisad.**

### `/webbdesign/` skiljer sig inte i art

29 löpande mot startsidans 23. Hela skillnaden är 16 `particleFloatUp` — ren
`transform`/`opacity` och **noll av dem i första vyn**. I vyporten har
`/webbdesign/` nio mot startsidans tio, och de ommålande är fyra på båda.
Rättas kärnan rättas den överallt; sidan behöver ingen egen åtgärd.

## Kända avvikelser — mätta, bedömda och medvetet lämnade

Punkter som en kontrastgranskning kommer att flagga igen. De är undersökta och
avfärdade med avsikt — rapportera dem inte som nya fynd.

### Siffran i den aktiva process-orben

`.orb-core` i `.station-orb` på `/webbdesign/`: vit siffra (22px/800) på
`.orb-liquid`, gradienten `#4F46E5 → #818cf8`.

```
mot #4f46e5   6.29:1   ✓
mot #818cf8   2.98:1   ← 0,02 under kravet 3.0 för stor text
```

**Lämnad med avsikt, beslut 2026-09-06.** 2,98 mot 3,0 är inom mätbrus och
skillnaden går inte att se. Värdena är dessutom hårdkodade och temaoberoende —
identiska i mörkt och ljust läge — så det är inget tema-fel. De två möjliga
åtgärderna, att mörka gradientens ljusa ände eller lägga en skugga bakom siffran,
skulle båda ändra en medveten designdetalj utan synlig vinst.

Om den dyker upp i en framtida granskning: notera att den är känd och gå vidare.

## Kontrastsvepets blinda fläckar — rättade 2026-09-08/09

Svepet missade **åtta** verkliga fel i AI-chattpanelen och rapporterade **två**
fel som inte fanns. Fem orsaker hittades där. En sjätte (opacitet) och en sjunde
(gradientbakgrunder) kom till 2026-09-12. Alla sju är kända och rättade. Bygg vidare på det
här, skriv inte ett nytt svep från noll.

### 1. Enteckens-element hoppades över

Filtret var `textContent.trim().length > 1`. Det tog bort stängknappens `×`
(uppmätt 2,61:1), `✓`/`✕` i `.problem-icon` (3,22–4,34:1) och `▲` i
`.chart-card` (4,13:1). **Regel: `length > 0`.** Ett tecken är text.

### 2. Pseudo-element lästes inte

`::placeholder` saknades helt. Elva fält föll tillbaka på webbläsarens
standardfärg `#757575` och gav 3,98–4,14:1 i mörkt tema, osett i månader.
**Regel: läs `getComputedStyle(el, '::placeholder')` för `input`/`textarea`.**
Begränsa till fälttyper som faktiskt kan ha platshållare — `input[type=range]`
har ingen, och då returnerar anropet elementets egen färg, vilket gav ett
falskt fel på 1,56:1.

### 3. `background-clip: text` dubbelräknades

En förfader med `background-clip: text` målar sin gradient **bara inuti
glyferna**, aldrig bakom dem. Svepet läste den ändå som bakgrund och
rapporterade `.process-neon` på 1,03:1. Rätt värde är 5,84:1.

```js
// i bakgrundssokningen: hoppa over en sadan forfader helt
if ((cs.webkitBackgroundClip || cs.backgroundClip) === 'text') { n = n.parentElement; continue; }
```

Samma sak från andra hållet: ett element vars egen `-webkit-text-fill-color`
är `transparent` målas av förfaderns bakgrundsklipp och ska hoppas över som
textelement.

### 4. Foton under en genomskinlig tvätt — DOM:en kan inte svara

Det här är den viktigaste. Ligger text på en halvgenomskinlig platta ovanpå ett
foto är DOM-bakgrunden **meningslös** — den säger vad tvätten komponeras mot i
CSS, inte vad ögat ser. `.ba-after .ba-label` rapporterades som 3,33:1. Verkligt
värde mot fotots ljusaste pixlar: **2,75:1**. `.ba-before .ba-label` flaggades
inte alls och låg på **2,26:1**.

**Regel: gå uppåt i trädet; hittas en `background-image: url(...)` ska
elementet flaggas för pixelmätning i stället för att läsas ur DOM:en.**

```js
let p = el, overFoto = false;
while (p && p.nodeType === 1) {
  const bi = getComputedStyle(p).backgroundImage;
  if (bi && bi !== 'none' && /url\(/.test(bi)) { overFoto = true; break; }
  p = p.parentElement;
}
// overFoto === true  ->  DOM-siffran ar en gissning. Pixelmat.
```

**Så pixelmäts det** — via canvas, inte skärmdump. Bilderna är samma origin, så
de kan ritas och läsas direkt. Det är exakt, tål att fliken laddas om och
kräver inga filer på disk:

```js
// cover + center: mappa etikettens ruta till bildens koordinater
const skala = Math.max(rL.width / img.naturalWidth, rL.height / img.naturalHeight);
const offX = (rL.width  - img.naturalWidth  * skala) / 2;
const offY = (rL.height - img.naturalHeight * skala) / 2;
ctx.drawImage(img, ((rE.left - rL.left) - offX) / skala, ((rE.top - rL.top) - offY) / skala,
                   rE.width / skala, rE.height / skala, 0, 0, cv.width, cv.height);
// komponera sedan tvatten over VARJE pixel och ta lagsta kontrasten
```

**Det avgörande fallet är fotots ljusaste pixlar**, inte medelvärdet. En bricka
kan mäta 7,19:1 mot medel och 4,06:1 mot de ljusaste — och det är de ljusaste
som avgör om texten går att läsa.

### 5. `color(srgb ...)` lästes som 0–255

`color-mix()` ger beräknade värden i formen `color(srgb 0.96 0.96 0.98 / 0.92)`
med flyttal i intervallet 0–1. Parsern läste dem som 0–255 och gjorde den ljusa
menyn till `#010101`. **Regel: `color(...)` → multiplicera med 255.** Tre
användningar i `styles.css`: solid nav, mobilöverlägget, `.logo-item:hover`.

### 6. `opacity` mättes aldrig — den deklarerade färgen är inte den man ser

Upptäckt 2026-09-12 när kodregnsknappen skulle läggas bredvid temaknappen i
headern. `.theme-toggle` deklarerar `color: var(--text)` och `opacity: .5`.
Svepet läste `color` ur `getComputedStyle` och fick vit på mörkt — **19,2:1**.
Det är inte vad som målas. `opacity` skapar en kompositeringsgrupp: elementet
ritas mot transparent och läggs sedan över det som finns **bakom** gruppen.
Den effektiva ikonfärgen är `rgb(133,133,135)`, inte vit, och kontrasten är
**5,34:1** i mörkt och **3,61:1** i ljust tema.

Båda klarar kravet 3:1 för grafiska objekt, så temaknappen lämnades orörd. Men
felmarginalen i mätningen var 13,8 respektive 14,3 steg. Samma konstruktion med
en svagare grundfärg, eller `opacity: .35`, hade fallit igenom osedd — precis
som `.ba-before` gjorde i punkt 4.

**Regel: multiplicera ihop `opacity` hela vägen upp i trädet, och komponera både
förgrund och yta mot det som ligger bakom det översta genomskinliga elementet.**
Elementets egen bakgrund ska dessutom multipliceras med samma faktor — en
`rgba(255,255,255,.03)`-yta i en grupp med `opacity: .5` har effektiv alfa
`.015`, inte `.03`.

```js
// Ackumulerad opacitet + det oversta element som ar genomskinligt
function opkedja(el){
  let o = 1, n = el, topp = el;
  while (n && n.nodeType === 1) {
    const v = parseFloat(getComputedStyle(n).opacity);
    if (!isNaN(v) && v < 1) { o *= v; topp = n; }
    n = n.parentElement;
  }
  return { o, topp };
}
const over = (f, b) => [0,1,2].map(i => f[i]*f[3] + b[i]*(1-f[3])).concat([1]);

const { o, topp } = opkedja(el);
const bakomGruppen = bakgrundBakom(topp);              // se punkt 3 och 4
const egen  = parse(getComputedStyle(el).backgroundColor) || [0,0,0,0];
const yta   = over([egen[0], egen[1], egen[2], (egen[3]||0) * o], bakomGruppen);
const fg    = parse(getComputedStyle(el).color);
const fgEff = over([fg[0], fg[1], fg[2], (fg[3] ?? 1) * o], yta);
kontrast(fgEff, yta);          // <- det har ar siffran som galler
```

**Följden för nya komponenter:** sätt hellre färgen på `color` vid full
opacitet än på `opacity`. Kodregnsknappen `.matrix-toggle` gör det —
`color: var(--muted-dim)`, `opacity: 1` — och landar på **5,50:1** mörkt och
**4,63:1** ljust. Den ser likadan ut som temaknappen bredvid, men dess siffra
går att läsa direkt ur DOM:en utan den här korrigeringen.

### 7. Gradientbakgrunder lästes som genomskinliga

Samma pass, samma svep. `.nav-cta` har `background: linear-gradient(...)` och
`background-color: rgba(0,0,0,0)`. Svepet gick förbi elementet, hittade sidans
ljusa botten och rapporterade vit text på `#F6F6FB` — **1,08:1**. Ett fel som
inte finns: verkligt värde är **6,29:1** mot gradientens ljusaste stopp.

**Regel: en `background-image` med `gradient(` är ett ogenomskinligt lager.
Plocka ut färgstoppen och låt det sämsta stoppet avgöra.**

```js
function stopp(bi){
  if (!bi || bi === 'none' || !/gradient\(/.test(bi)) return null;
  const m = bi.match(/(?:rgba?\([^)]*\)|color\(srgb[^)]*\)|#[0-9a-f]{3,8})/gi);
  return m ? m.map(parse).filter(c => c && c[3] > 0) : null;
}
// i bakgrundssokningen, FORE avlasningen av backgroundColor:
const st = stopp(cs.backgroundImage);
if (st && st.length) return { stopp: st };   // mat mot varje stopp, ta lagsta
```

### Vad svepet fortfarande inte klarar

- **Hovertillstånd** mäts inte. `:hover`-regler som byter färg är osedda.
- **Fokusringar** mäts inte.
- **Text över video eller `<img>`** — samma problem som punkt 4, men canvas-
  mappningen ovan är skriven för `background-image` med `cover`. Andra
  `background-size` kräver egen mappning.
- **Dolda ytor** måste öppnas manuellt före svepet: `#orderModal.open`,
  `#fabPanel.open`, `.form-error.show`, `.reveal.in`. Missas det granskas
  de aldrig — beställningsmodalen var osedd i hela etapp 1.

## Så mäts resultatet

Varje plan har ett eget mätskript under **Verification** som ska köras **både
före och efter** i Playwright mot den publicerade sajten. Redovisa uppmätta
värden, inte påståenden.

Genomgående kontroller som gäller alla planer:

```bash
# ?v synkat over alla nio filer
grep -o 'v=[0-9]*' index.html 404.html */index.html | sort | uniq -c

# alla nio sitemap-URL:er svarar 200 och ingen har fatt noindex
```

Och i webbläsaren: noll fel och noll varningar i konsolen, kontrollerat i **båda
teman**, på minst bredderna 390, 768 och 1440 px.

**Kom ihåg flikens tillstånd.** Ligger fliken i bakgrunden är `visibilityState`
`"hidden"` — då mäter sidor noll tecken, fördröjda bilder byts aldrig in och
CSS-övergångar står frusna på `currentTime: 0`. Kontrollera
`document.visibilityState` innan tomhet eller fel rapporteras.

**`visible` räcker inte alltid.** Under passet 2026-09-06 rapporterade fliken
`visibilityState: "visible"` och `hasFocus: true` samtidigt som webbläsaren
producerade 2–8 bildrutor per 300 ms. En pågående övergång fastnar då på sitt
**startvärde**, vilket ger färgmätningar som ser ut som riktiga fel. Kontrollera
att bildrutor faktiskt produceras innan du litar på ett värde:

```js
const t1 = document.timeline.currentTime;
const n = await new Promise(res => { let k=0; const s=performance.now();
  (function f(){ k++; performance.now()-s < 300 ? requestAnimationFrame(f) : res(k); })(); });
// t2 - t1 nära noll, eller n under ~10: renderingen är strypt
```

Vid strypt rendering: injicera `*{transition:none!important}` före temabytet och
mät det settlade värdet, eller scrubba `animation.currentTime` manuellt.
