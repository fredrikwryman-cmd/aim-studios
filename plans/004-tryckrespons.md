# 004 — Ge knapparna tryckrespons

- **Status**: DONE - genomford 2026-09-06 i commit `aac9bcc`, `?v=106`.
  Uppmatt: 0 -> 2 :active-regler (9 selektorer), `scale` i fem transition-listor.
  Magnetisk CTA 261,51 -> 253,67 px (kvot 0,9700), temaknapp 40 -> 38 px (0,9500).
- **Commit**: a2052b5
- **Severity**: MEDIUM
- **Category**: 3. Fysikalitet & origo
- **Estimated scope**: 1 fil (`styles.css`). 5 ändrade rader + 1 nytt block på ~8 rader. Plus synkad `?v`-bumpning.

## Problem

Uppmätt i webbläsaren genom att gå igenom hela stilmallen regel för regel:

```
:hover-regler i styles.css:    47
:active-regler i styles.css:    0
klickbara element pa startsidan: 11 .btn + 1 .nav-cta + 37 <button> + 40 <a href>
```

Det finns alltså **ingen tryckrespons alls** på sajten. En knapp som inte svarar
när den trycks ned känns död — och på en sajt vars hela syfte är att få någon att
klicka "Boka gratis strategi-möte" är det den ena interaktion som måste kännas rätt.

`AUDIT.md`, kategori 3: *"pressable elements with no press feedback"* är ett fynd.
Måltillstånd enligt samma dokument: `transform: scale(0.97)` på `:active` med
`transition: transform 160ms ease-out`, hållet subtilt i intervallet 0,95–0,98.

**Komplikationen** som gör att den rekommendationen inte kan kopieras rakt av:

```css
/* styles.css:244 — nuvarande */
  body.has-cursor .magnetic { transition: box-shadow .25s var(--ease), background .2s var(--ease), border-color .2s var(--ease), color .2s var(--ease) !important; will-change: transform; }
```

```js
/* scripts.js:55 — nuvarande. Skriver inline transform pa det magnetiska elementet VARJE bildruta. */
      magEl.style.transform=`translate3d(${cx.toFixed(2)}px,${cy.toFixed(2)}px,0)`;
```

På desktop med den egna markören aktiv (`body.has-cursor`) har fem element klassen
`.magnetic` — bland dem sajtens primära CTA:er, inklusive formulärets skicka-knapp
(`index.html:553`: `class="btn btn-primary form-submit magnetic"`). På dem
skriver rAF-loopen inline `transform` sextio gånger i sekunden. En
`:active { transform: scale(.97) }` skulle skrivas över direkt och aldrig synas,
och `transition`-listan på rad 244 är dessutom `!important` och innehåller inte
`transform`.

## Target

Använd den fristående CSS-egenskapen **`scale`** i stället för `transform`.
Den är en egen egenskap, komponeras ihop med `transform` av webbläsaren, och
kolliderar därför inte med det som musloopen skriver inline.

```css
/* target — nytt block, laggs sist i styles.css, fore ev. avslutande media-block */
  /* ---------- Tryckrespons ---------- */
  /* Egenskapen `scale` anvands medvetet i stallet for transform: den magnetiska
     musloopen (scripts.js:55) skriver inline transform pa .magnetic varje bildruta
     och skulle ata upp en transform-baserad nedskalning. `scale` ar en egen
     egenskap och komponeras ihop med den inline-satta transformen. */
  .btn:active,
  .nav-cta:active,
  .care-opt:active,
  .switch-tab:active,
  .form-submit:active { scale: 0.97; }

  .theme-toggle:active,
  .social-icon:active,
  .terminal-send:active,
  .pkg-close:active { scale: 0.95; }
```

Och `scale` måste få en övergång på de element vars `transition` är en uttrycklig
lista (de som redan har `transition: all` täcker `scale` automatiskt):

```css
/* target — fyra befintliga rader far ", scale .16s var(--ease)" tillagt sist i sin transition */
  styles.css:244   body.has-cursor .magnetic { transition: …, color .2s var(--ease), scale .16s var(--ease) !important; will-change: transform; }
  styles.css:248   .btn { … transition: transform .2s var(--ease), box-shadow .25s var(--ease), background .2s, scale .16s var(--ease); … }
  styles.css:293   .theme-toggle { … transition: opacity .25s var(--ease), border-color .2s, transform .35s var(--ease), scale .16s var(--ease); }
  styles.css:298   .nav-cta { … transition: transform .25s var(--ease), box-shadow .25s var(--ease), background .3s var(--ease), scale .16s var(--ease); }
  styles.css:1231  .care-opt { … transition: color .25s var(--ease), background .25s var(--ease), scale .16s var(--ease); }
```

`160 ms` är hämtat rakt ur `AUDIT.md`s duration-tabell för tryckrespons
(100–160 ms). `0,97` respektive `0,95` ligger inom det tillåtna 0,95–0,98.
De mindre, kvadratiska ikonknapparna (40 × 40 px) får det lägre värdet eftersom
samma procentuella nedskalning syns mindre på en liten yta.

`.switch-tab` (`styles.css:512`) och `.social-icon` (`styles.css:996`) har redan
`transition: all` och behöver ingen ändring av sin transition-rad.

## Repo-konventioner att följa

- Easing-token: **`var(--ease)` = `cubic-bezier(0.22, 1, 0.36, 1)`** (`styles.css:21`).
  Det är en stark ease-out — rätt kurva för tryckrespons enligt `AUDIT.md`.
- Kommentarer i `styles.css` skrivs på svenska.
- Sektionsrubriker i CSS:en följer mönstret `/* ---------- Namn ---------- */`
  — se `styles.css:1017` som exemplar.
- Reducerad rörelse: det globala blocket på `styles.css:816-819` sätter
  `transition-duration: 0.01ms !important`. Tryckresponsen blir då momentan
  i stället för borta, vilket är rätt: feedback ska finnas kvar, bara utan
  rörelsetid. **Lägg inte till någon egen reduced-motion-regel för detta.**

## Steps

1. Lägg in det nya `:active`-blocket sist i `styles.css`, med sektionskommentaren.

2. Lägg till `, scale .16s var(--ease)` sist i `transition`-listan på de fem
   raderna 244, 248, 293, 298 och 1231. På rad 244 ska tillägget hamna **före**
   `!important`, alltså: `…, color .2s var(--ease), scale .16s var(--ease) !important;`.

3. Ändra ingenting annat på de fem raderna — inga andra värden, ingen omordning.

4. Bumpa cachebrytaren: läs av nuvarande `?v` med
   `grep -o 'styles.css?v=[0-9]*' index.html | head -1`, höj med 1, sätt samma
   värde på `styles.css`, `scripts.js` och `unlock.js` i alla 9 filer.

## Boundaries

- Endast `styles.css` ändras. **Ingen JS.** Rör inte musloopen i `scripts.js:40-60`.
- Lägg **inte** till `:active` på `.faq-q`, `.svc-card`, `.price-card`,
  `a.case-card` eller andra ytor. Ett helt kort som krymper när man trycker på det
  ser ut som ett fel, inte som feedback. Tryckrespons hör till knappar och CTA:er.
- Använd **inte** `transform: scale()` för det här. Hela poängen är att undvika
  krocken med den inline-satta transformen.
- Ta **inte** bort `!important` på rad 244 — den finns för att musloopen ska äga
  transformen och behövs.
- Lägg **inte** till `-webkit-tap-highlight-color` i det här passet; det ändrar
  mobilens standardutseende och är en separat bedömning.
- Om raderna inte ser ut som citaten: **stanna och rapportera.**

## Verification

**Mekaniskt**

```bash
grep -c ':active' styles.css                      # forvantat: 9 (var 0)
grep -c 'scale .16s var(--ease)' styles.css       # forvantat: 5
grep -n 'has-cursor .magnetic' styles.css         # kontrollera att !important star kvar sist
```

**Mät i webbläsaren** — kör i Playwright på den publicerade sidan:

```js
async () => {
  const knapp=document.querySelector('.hero-cta .btn');
  const s=getComputedStyle(knapp);
  const ut={ transition:s.transition, scaleVila:s.scale, arMagnetic:knapp.classList.contains('magnetic'),
             bodyHasCursor:document.body.classList.contains('has-cursor') };
  /* las av vad :active faktiskt ger, utan att klicka */
  let regel=null;
  for(const ss of document.styleSheets){ let rs; try{rs=ss.cssRules}catch(e){continue}
    for(const r of rs){ if(r.selectorText && r.selectorText.includes('.btn:active')) regel=r.style.cssText; } }
  ut.aktivRegel=regel;
  return ut;
}
```

Förväntat: `transition` innehåller `scale 0.16s`, `aktivRegel` är `scale: 0.97;`.

**Känslokoll** — på riktigt, med mus och med finger:

- Tryck och håll ned "Boka gratis strategi-möte" i hjälten. Knappen ska sjunka
  ihop en aning **direkt**, och studsa tillbaka när du släpper. Nedtryckningen
  och återgången ska kännas lika snabba — vid 160 ms är de det.
- **Gör samma sak på en magnetisk knapp medan du rör musen över den.** Det är
  hela poängen med `scale`: knappen ska både följa markören magnetiskt och sjunka
  vid tryck, samtidigt. Ser du ingen nedsjunkning har `scale` skrivits över — då
  är fixen fel gjord.
- Tryck på temaväxlaren uppe till höger. Den ska sjunka och samtidigt rotera
  18 grader vid hover — de två får inte slåss.
- Tryck på "Kvartal" i prisväljaren under Löpande skötsel. Knappen ska svara,
  och priserna ska fortfarande byta.
- På telefon: tryck och dra bort fingret utan att släppa. Knappen ska återgå när
  fingret lämnar ytan.
- Sätt Animations-panelen på 10 % och tryck: nedskalningen ska vara jämn, inte
  studsa förbi och tillbaka.
- Slå på `prefers-reduced-motion`: knappen ska fortfarande visa att den är
  nedtryckt, bara utan övergångstid. Försvinner responsen helt är det fel.
- Kontrollera i båda teman.

**Klart när**: `grep` ger 9 `:active`-regler och 5 `scale .16s`, den magnetiska
CTA:n visar nedtryckning även under pågående magnetdragning, och inget hover-
eller magnetbeteende har förändrats.
