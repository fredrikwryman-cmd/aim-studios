# 006 — Städa bort död rörelsekod (fynd 7)

- **Status**: TODO
- **Commit**: a2052b5
- **Severity**: MEDIUM
- **Category**: 7. Kohesion & tokens
- **Estimated scope**: 2 filer (`styles.css`, `scripts.js`). ~45 borttagna rader, 3 ändrade
  (del C, ~10 rader, utförs redan av plan 001 om den körts först). Plus synkad `?v`-bumpning.

## Problem

Tre rörelsesystem i kodbasen kör aldrig. De gör ingen skada i webbläsaren, men de
gör att nästa person — eller nästa modell — läser fel om hur sajten rör sig, och
de döljer att en del av dem borde ha varit i bruk.

### 1. Hela `.svc-wide`-systemet: 0 element

```bash
$ grep -rn 'svc-wide' --include=*.html . | grep -v '.git/'
# noll traffar pa samtliga 8 sidor + 404.html
```

Ändå finns ett komplett magnetiskt 3D-tilt-system med glans- och holografilager:
~24 CSS-regler och 35 rader JavaScript som injicerar två `<div>`-lager per kort
och kör en rAF-loop på musrörelse.

```js
/* scripts.js:667-702 — nuvarande. Hela IIFE:n ar dod: querySelectorAll ger 0 traffar
   och funktionen returnerar pa rad 670. */
/* ---------- svc-wide: magnetisk 3D-tilt + holografisk sken ---------- */
(function(){
  const cards=document.querySelectorAll('.svc-wide');
  if(!cards.length) return;
  …
})();
```

Ironin: `.svc-wide:hover .svc-wide-bg { transform: scale(1.06); }` (`styles.css:484`)
är precis den bakgrundszoom som tjänstekorten på startsidan saknar i dag. Den
finns skriven, den används bara inte. **Det är ett separat beslut om den ska
återinföras på `.svc-tile` — den här planen bara städar.** Kopiera regeln till
en anteckning innan den raderas om du vill kunna återkomma till den.

### 2. `blur-in`: matchar inget element

```css
/* styles.css:385-386 — nuvarande */
  @keyframes blurIn { from { opacity: 0; filter: blur(16px); } to { opacity: 1; filter: blur(0); } }
  .hero h1.blur-in { animation: blurIn 1.1s var(--ease) both; }
```

```bash
$ grep -rn 'blur-in' --include=*.html --include=*.js . | grep -v '.git/'
# noll traffar
```

Hjälterubriken har klassen `kinetic-hero`, inte `blur-in`.

### 3. `kineticDrop`: körs, men slås av innan första bildrutan

```css
/* styles.css:835-845 — nuvarande */
  .k-line { display: block; opacity: 0; transform: translateY(-60px) rotateX(-40deg); transform-origin: center bottom; animation: kineticDrop 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .k-line:nth-child(1) { animation-delay: 0.2s; }
  .k-line:nth-child(2) { animation-delay: 0.4s; }
  .k-line:nth-child(3) { animation-delay: 0.6s; }
  .kinetic-hero.typed .k-line { opacity: 1; transform: none; animation: none; filter: none; }
  …
  @keyframes kineticDrop { 0% { … } 60% { … } 100% { … } }
```

```js
/* scripts.js:331 — satts direkt vid sidladdning, fore forsta malningen */
  h1.classList.add('typed');
```

`.typed` sätts av skrivmaskinen omedelbart, och regeln på rad 839 släcker då
`kineticDrop`. Bekräftat i webbläsaren: `getAnimations()` på `.k-line` returnerade
noll animationer vid samtliga sjutton avläsningar under laddningen.

Kurvan `cubic-bezier(0.34,1.56,0.64,1)` är dessutom den enda överskjutande kurvan
i hela stilmallen — den bryter mot sajtens enda-kurva-princip och används inte.

**Viktigt: `.k-line` som klass lever.** Skrivmaskinen bygger `<span class="k-line">`
i `scripts.js:329`, och `display: block` är det som ger rubriken tre rader.
Ta bort animationen, inte klassen.

### 4. `.tst-*`: omdömeskorten som togs bort

```bash
$ grep -rn 'tst-card\|tst-quote\|tst-grid' --include=*.html . | grep -v '.git/'
# noll traffar
```

Tio regler (`styles.css:652-661`) plus en referens i `body.neon`-regeln på rad 803.
Omdömessektionen plockades bort eftersom den innehöll exempeldata.

## Target

Ingen kod som ser ut att animera något men inte gör det. Efter städningen ska
`grep 'svc-wide'`, `grep 'blur-in'` och `grep 'kineticDrop'` alla ge noll träffar
i hela repot.

```css
/* target — .k-line, det som ska vara kvar */
  .k-line { display: block; }
```

```css
/* target — rad 803, .svc-wide och .tst-card bortplockade ur selektorlistan */
  body.neon .price-card, body.neon .case-card { box-shadow: 0 0 24px -4px rgba(34,255,167,.4); }
```

## Repo-konventioner att följa

- Kommentarer i `styles.css` skrivs på svenska; i `scripts.js` utan å/ä/ö.
- Sajten har **en enda easing-token**, `var(--ease)` = `cubic-bezier(0.22, 1, 0.36, 1)`
  (`styles.css:21`). Att `kineticDrop` införde en andra, överskjutande kurva är
  en del av skälet att den ska bort.
- `body.neon` är påskeäggsläget. Rör bara selektorlistan på rad 803, aldrig
  deklarationen inuti — den gröna glöden hör till neonläget och ska vara kvar.

## Steps

**Del A — `.svc-wide`**

1. `scripts.js`: ta bort rad **667–702** inklusive, alltså kommentarraden
   `/* ---------- svc-wide: magnetisk 3D-tilt … ---------- */`, hela `(function(){`-blocket
   och dess avslutande `})();`. Blanka rader före och efter behålls så att
   omgivande block inte klistras ihop.

2. `styles.css`: ta bort varje regel vars selektor innehåller `.svc-wide` —
   raderna **482, 483, 484, 485, 486, 487, 490, 491, 495, 497, 498, 499** samt
   hela blocket **500–506** (`@media (max-width: 768px)` som efter borttagningen
   av raderna 501–505 blir tomt).

3. `styles.css`: ta bort blocket **1017–1023** — sektionskommentaren
   `/* ---------- svc-wide: magnetisk tilt + holografi ---------- */`,
   `.svc-wide`, `.svc-glare`, `.svc-holo`, de två hover-reglerna och
   `@media (prefers-reduced-motion: reduce) { .svc-glare, .svc-holo { display: none; } }`.

4. `styles.css`: **behåll rad 488 och 489** — `.svc-icon` och `.svc-icon svg`
   används 5 gånger i markup. De ligger mitt i blocket som städas; läs dem två
   gånger innan du raderar omkringliggande rader.

5. `styles.css`: kontrollera raderna **481** (`.svc-wide-list`), **492–494**
   (`.svc-feats`, `.svc-feats li`, `.svc-feats li::before`) och **496**
   (`.svc-benefit`) var för sig innan du rör dem:
   ```bash
   for c in svc-wide-list svc-feats svc-benefit; do
     echo "$c: $(grep -rho 'class="[^"]*"' --include=*.html . | grep -c "\b$c\b")"
   done
   ```
   Ge kommandot `0` för en klass är den död och kan tas bort. Ger det något
   annat än `0` — **behåll regeln och rapportera det.**

**Del B — `blur-in`**

6. `styles.css`: ta bort rad **385** (`@keyframes blurIn`) och **386**
   (`.hero h1.blur-in`).

**Del C — `kineticDrop`**

> **Obs:** hela del C utförs redan av **plan 001**, eftersom `kineticDrop` vaknar
> till liv när skrivmaskinen tas bort och därför måste städas i samma pass.
> Körs 001 först: **hoppa över steg 7–10** och bekräfta bara med
> `grep -n 'kineticDrop\|\.k-line' styles.css` att `.k-line { display: block; }`
> är den enda kvarvarande regeln. Körs 006 utan 001: utför stegen.

7. `styles.css` rad **835**: ersätt hela regeln med `  .k-line { display: block; }`.
   `display: block` **måste** vara kvar — utan den kollapsar rubrikens tre rader
   till en.

8. `styles.css`: ta bort rad **836, 837, 838** (`nth-child`-fördröjningarna),
   rad **839** (`.kinetic-hero.typed .k-line`, nu överflödig) och `@keyframes kineticDrop`
   på rad **845**.

9. `styles.css` rad **853–856**: i reduced-motion-blocket, ta bort raden
   `.k-line { opacity: 1; transform: none; animation: none; filter: none; }`.
   **Behåll** `.iridescent:hover::after { animation: none; }` och blockets klammer.

10. Valfritt: rad **834** `.kinetic-hero { perspective: 800px; }` blir verkningslös
    utan 3D-transformer på barnen. Den kostar ingenting att låta stå. Ta bort den
    bara om du kontrollerat att inget annat i hjälten använder 3D.

**Del D — `.tst-*`** (valfri, inte rörelsekod men samma städning)

11. `styles.css`: ta bort rad **652–661** (`.tst-grid`, `.tst-card`, `.tst-quote`,
    `.tst-result`, `.tst-person`, `.tst-meta .nm`, `.tst-meta .rl` och deras
    media-rad).

12. `styles.css` rad **803**: ta bort `body.neon .svc-wide, ` och `, body.neon .tst-card`
    ur selektorlistan. Resultatet ska bli exakt raden under Target.
    **Detta steg är obligatoriskt även om du hoppar över steg 11**, eftersom
    `.svc-wide` försvinner i del A.

**Avslutning**

13. Bumpa cachebrytaren: läs av nuvarande `?v` med
    `grep -o 'styles.css?v=[0-9]*' index.html | head -1`, höj med 1, sätt samma
    värde på `styles.css`, `scripts.js` och `unlock.js` i alla 9 filer.

## Boundaries

- Ta **inte** bort `.svc-icon` eller `.svc-icon svg`.
- Ta **inte** bort klassen `.k-line` eller dess `display: block`.
- Ta **inte** bort `.svc-card`, `.svc-tile`, `.svc-more` eller något annat
  `svc-`-prefix som inte är `svc-wide`, `svc-glare` eller `svc-holo`.
- **Lägg inte tillbaka** bakgrundszoomen på `.svc-tile` i det här passet, hur
  frestande det än är. Den här planen tar bort, den lägger inte till.
- Rör inte `unlock.js` eller grindlogiken. `body.neon` är påskeägget — bara
  selektorlistan på rad 803 ändras.
- Om en klass visar sig vara i bruk trots grep-kontrollen: **stanna och rapportera.**

## Verification

**Mekaniskt**

```bash
# 1. helt borta ur repot
grep -rn 'svc-wide\|svc-glare\|svc-holo\|blur-in\|blurIn\|kineticDrop\|tst-card\|tst-quote' \
  --include=*.html --include=*.css --include=*.js . | grep -v '.git/'
#    forvantat: noll rader

# 2. det som ska overleva
grep -c 'svc-icon' styles.css        # forvantat: minst 2
grep -n '\.k-line' styles.css        # forvantat: exakt 1 rad: .k-line { display: block; }
grep -c 'svc-card' styles.css        # forvantat: oforandrat mot fore
grep -n 'body.neon .price-card' styles.css   # forvantat: 1 rad, gron glod kvar

# 3. inga tomma media-block eller obalanserade klammrar
node -e "const c=require('fs').readFileSync('styles.css','utf8');
  const o=(c.match(/{/g)||[]).length, s=(c.match(/}/g)||[]).length;
  console.log('oppna',o,'stangda',s, o===s?'BALANSERAT':'OBALANSERAT');
  console.log('tomma block:', (c.match(/{\s*}/g)||[]).length);"
```

**Mät i webbläsaren** — kör i Playwright på den publicerade sidan, före och efter:

```js
() => ({
  kLineAntal: document.querySelectorAll('.k-line').length,
  kLineDisplay: getComputedStyle(document.querySelector('.k-line')).display,
  rubrikensHojd: Math.round(document.querySelector('.kinetic-hero').getBoundingClientRect().height),
  rubrikensText: document.querySelector('.kinetic-hero').innerText.replace(/\s+/g,' ').trim(),
  svcIkoner: document.querySelectorAll('.svc-icon').length,
  animationerTotalt: document.getAnimations().length
})
```

`kLineAntal` ska vara **3**, `kLineDisplay` **block**, `rubrikensHojd` och
`rubrikensText` **oförändrade jämfört med före**. `svcIkoner` ska vara **5**.
Redovisa båda mätningarna sida vid sida.

**Känslokoll**

- Ladda om startsidan. **Rubriken ska fortfarande stå på tre rader** och skriva
  sig som förut. Blir den en enda lång rad har `display: block` försvunnit —
  återställ omedelbart.
- Tjänstekortens ikoner (de indigofärgade rutorna med symboler) ska finnas kvar
  i alla fem korten.
- Hovra ett tjänstekort: lyftet ska vara oförändrat.
- Knäck påskeägget och slå på neonläget. Priskorten och case-korten ska
  fortfarande få sin gröna glöd.
- Gå igenom alla åtta sidorna och titta efter något som tappat sin layout.
  `.svc-feats` och `.svc-benefit` togs bort utan att användas — om något ser
  ostylat ut, var det inte oanvänt. Rapportera i så fall.
- Konsolen ska vara ren: noll fel, noll varningar.
- Kontrollera i båda teman.

**Klart när**: grep-kontrollen ger noll träffar på de sju döda namnen, klamrarna
balanserar, rubriken står på tre rader med oförändrad höjd, de fem tjänsteikonerna
finns kvar och konsolen är tyst på alla åtta sidorna.
