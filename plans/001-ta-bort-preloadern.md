# 001 — Ta bort preloadern och skrivmaskinen, ge rubriken en kort intoning

- **Status**: TODO
- **Commit**: a2052b5
- **Severity**: HIGH
- **Category**: 1. Syfte & frekvens
- **Estimated scope**: 3 filer (`index.html`, `styles.css`, `scripts.js`) + synkad `?v`-bumpning på 9 filer. Netto: ~55 borttagna rader, ~4 tillagda.

> **Beslutad ändring 2026-09-06:** skrivmaskinen ska **tas bort helt**, inte tajmas
> om. Rubriken ska stå färdigskriven i första bildrutan och få en kort intoning
> som följer med — inte en som fördröjer läsningen. Tidigare version av planen
> föreslog omtajmning; den är ersatt.

## Problem

Sajten är statisk och handkodad. Det finns ingenting att förladda — ingen bundle,
ingen datahämtning, inga typsnitt som väntas in. Preloadern är en ren fördröjning,
och skrivmaskinen ovanpå den gör att sidans säljbudskap inte går att läsa förrän
efter 3,6 sekunder.

Uppmätt i Chrome via Playwright, i en same-origin-iframe från navigeringens t=0,
varm cache:

```
   197 ms  preloadern målas, <html> får overflow:hidden (skroll låst)
   602 ms  skrivmaskinen skriver sitt första tecken — bakom preloadern
 1 059 ms  7 av 40 tecken skrivna, fortfarande helt dolda
 1 501 ms  13 av 40 tecken, preloadern 32 % kvar
 1 653 ms  preloadern borta — besökaren ser en halvskriven rubrik
 3 604 ms  rubriken färdig: "Hemsidor som får fler kunder att välja dig"
```

Vid kall laddning mättes `first-contentful-paint` och `largest-contentful-paint`
till **3 060 ms**, med `p.hero-sub` som LCP-element.

Nuvarande kod:

```html
<!-- index.html:70-79 — nuvarande. Finns ENDAST på index.html. -->
<div id="preloader" aria-hidden="true">
  <svg aria-hidden="true" viewBox="0 0 100 100" width="84" height="84" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="plg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366F1"/><stop offset="1" stop-color="#4F46E5"/></linearGradient></defs>
    <g stroke="url(#plg)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
      <path class="pl-p" d="M26 86 L50 16 L74 86"/>

    </g>
  </svg>
</div>
```

```js
/* scripts.js:3-9 — nuvarande */
/* ---------- Preloader ---------- */
(function(){
  const pre=document.getElementById('preloader'); if(!pre) return;
  if(reduce){ pre.remove(); return; }
  document.documentElement.style.overflow='hidden';
  setTimeout(()=>{ pre.classList.add('done'); document.documentElement.style.overflow=''; setTimeout(()=>pre.remove(),800); }, 850);
})();
```

```css
/* styles.css:787-793 — nuvarande */
  /* preloader */
  #preloader { position: fixed; inset: 0; z-index: 100000; background: var(--bg); display: grid; place-items: center; transition: transform .7s var(--ease), opacity .5s ease; }
  #preloader.done { transform: translateY(-100%); opacity: 0; pointer-events: none; }
  #preloader svg { filter: drop-shadow(0 0 26px rgba(79,70,229,.6)); }
  #preloader .pl-p { stroke-dasharray: 210; stroke-dashoffset: 210; animation: plDraw 0.5s var(--ease) forwards; }
  #preloader .pl-p:nth-child(2) { animation-delay: .2s; }
  @keyframes plDraw { to { stroke-dashoffset: 0; } }
```

Skrivmaskinen är en egen IIFE, `scripts.js:309-344`. Den bygger om rubrikens
innerHTML till ett `<span class="tc">` per tecken, sätter klassen `typed` på `h1`
och tänder tecknen ett i taget med `setTimeout`.

**Rubrikens text finns redan färdig i markup** och behöver ingen JavaScript:

```html
<!-- index.html:137 — nuvarande. Texten ar redan komplett har. -->
<h1 class="kinetic-hero"><span class="k-line">Hemsidor som får</span><span class="k-line">fler kunder att</span><span class="k-line"><span class="hl">välja dig</span></span></h1>
```

### Fällan: `kineticDrop` vaknar när skrivmaskinen tas bort

```css
/* styles.css:835-845 — nuvarande */
  .k-line { display: block; opacity: 0; transform: translateY(-60px) rotateX(-40deg); transform-origin: center bottom; animation: kineticDrop 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .k-line:nth-child(1) { animation-delay: 0.2s; }
  .k-line:nth-child(2) { animation-delay: 0.4s; }
  .k-line:nth-child(3) { animation-delay: 0.6s; }
  .kinetic-hero.typed .k-line { opacity: 1; transform: none; animation: none; filter: none; }
```

`.k-line` startar i dag på `opacity: 0` med en 0,8-sekunders överskjutande
fallanimation. Den syns aldrig, eftersom `scripts.js:331` sätter `.typed` före
första målningen och rad 839 då släcker den.

**Tas skrivmaskinen bort utan att det här städas, sätts `.typed` aldrig — och
kineticDrop går i gång på riktigt.** Rubriken skulle då falla in i tre steg med
0,2/0,4/0,6 sekunders fördröjning och en studsande kurva, vilket är raka motsatsen
till beslutet. Städningen av `.k-line` är därför **obligatorisk i den här planen**,
inte valfri.

## Vad som händer med FCP och LCP — förväntan, som ska mätas

Preloadern är en `position: fixed`-överlagring. Den ligger utanför flödet och
påverkar inte layouten, så **ingen layoutförskjutning** uppstår när den tas bort.

- **FCP**: preloaderns SVG är i dag det första som målas. När den försvinner
  utlöses FCP i stället av hjälteinnehållet. Förväntad förändring: oförändrad
  eller marginellt tidigare. **FCP är inte där vinsten ligger.**
- **LCP**: LCP-elementet är `p.hero-sub`. Det målas i dag redan under
  överlagringen, så LCP-siffran väntas inte flytta sig dramatiskt.
- **Där vinsten ligger: tid till synligt innehåll och tid till läsbar rubrik.**
  I dag 1 653 ms respektive 3 604 ms, båda uppmätta. Efter ändringen ska tid till
  synligt innehåll vara lika med FCP, och rubriken ska vara läsbar i **samma
  bildruta som sidan målas** — intoningen på 400 ms fördröjer inte läsningen,
  den följer bara med.

Mät före och efter med skripten under Verifiering och redovisa alla värden.
Gissa inte — om siffrorna inte rör sig som beskrivet, rapportera utfallet.

## Target

Ingen preloader. Ingen skrivmaskin. Ingen skrollåsning. Rubriken står
färdigskriven direkt och tonar upp med ett litet lyft.

```css
/* target — ersatter styles.css:834-835 */
  .kinetic-hero { perspective: 800px; animation: heroIn .4s var(--ease); }
  .k-line { display: block; }
  @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
```

- **`opacity: 0 → 1`** och **`translateY(10px) → 0`** — inom det beslutade
  intervallet 8–12 px.
- **`.4s`** — beslutat värde, och inom `AUDIT.md`s spann för något som träder in.
- **`var(--ease)`** = `cubic-bezier(0.22, 1, 0.36, 1)`, sajtens enda kurva. Den är
  en stark ease-out: rörelsen börjar snabbt och lägger sig mjukt, vilket är precis
  vad en intoning som inte får kännas som väntan ska göra.
- **Ingen `animation-delay`.** Ingen `animation-fill-mode` — baslägena (`opacity: 1`,
  ingen transform) är redan sluttillståndet, och `forwards`/`both` skulle låsa
  fast `transform` och blockera den musdrivna 3D-lutningen på `scripts.js:77`.

`display: block` på `.k-line` **måste** vara kvar — utan den kollapsar rubrikens
tre rader till en.

## Repo-konventioner att följa

- Easing-token: **`var(--ease)` = `cubic-bezier(0.22, 1, 0.36, 1)`** (`styles.css:21`).
  Sajten har medvetet en enda kurva. Inför ingen ny.
- Keyframes namnges i lowerCamelCase intill de regler som använder dem — se
  `@keyframes navDropIn` (`styles.css:271`) som exemplar.
- Kommentarer i `scripts.js` skrivs på svenska **utan å/ä/ö** (befintlig
  konvention, se `scripts.js:83-84`). I `styles.css` och `.html` används å/ä/ö.
- `const reduce` på `scripts.js:1` används av flera andra block längre ned.
  **Den raden ska vara kvar.**
- Reducerad rörelse hanteras redan globalt (`styles.css:816-819`,
  `animation-duration: 0.001ms !important`). `heroIn` fångas automatiskt av det
  blocket och rubriken visas då direkt utan rörelse. **Lägg inte till någon egen
  reduced-motion-regel för heroIn.**

## Steps

**Del A — preloadern**

1. `index.html`: ta bort hela `<div id="preloader">…</div>`, rad 70–79 inklusive.
   Raderna före (`.ambient-grid`) och efter (`.grain`) står kvar orörda.

2. `index.html:20`: ta bort `#preloader{display:none!important}` ur `<noscript>`,
   behåll `.reveal{opacity:1;transform:none}`. Resultat:
   ```html
   <noscript><style>.reveal{opacity:1;transform:none}</style></noscript>
   ```

3. Samma noscript-städning på de övriga 8 sidorna (`404.html`, `webbdesign/`,
   `webboptimering/`, `seo/`, `ai-losningar/`, `branding/`, `case/`,
   `om-oss/index.html`). Selektorn är redan verkningslös där — ren hygien.

4. `scripts.js`: ta bort rad 3–9 inklusive kommentarraden
   `/* ---------- Preloader ---------- */`. Rad 1 står kvar.

5. `styles.css`: ta bort rad 787–793 inklusive kommentaren `/* preloader */`.
   **Varning:** `.pl-price`, `.pl-row`, `.pl-name`, `.pl-dots` och `.pl-note`
   (runt rad 1194) tillhör prislistan på `/webboptimering/`. **Rör dem inte.**

**Del B — skrivmaskinen**

6. `scripts.js`: ta bort hela IIFE:n `/* ---------- Hero typewriter (per-tecken,
   layout alltid reserverad) ---------- */`, rad 309–344 inklusive kommentarraden
   och det avslutande `})();`. Leta upp den på kommentarraden — efter steg 4 har
   den flyttat sig sju rader uppåt.

7. `index.html:137`: ingen ändring. Markupen innehåller redan hela rubriken.

**Del C — rubrikens intoning och städning av kineticDrop**

8. `styles.css` rad 834–835: ersätt de två raderna med de tre raderna ur Target
   (`.kinetic-hero`, `.k-line`, `@keyframes heroIn`).

9. `styles.css`: ta bort rad 836, 837, 838 (`nth-child`-fördröjningarna) och
   rad 839 (`.kinetic-hero.typed .k-line`).

10. `styles.css`: ta bort rad 840, 841, 842, 843 — alla `.typed .tc`-regler.
    Klassen `.tc` skapades bara av skrivmaskinen och finns inte längre.

11. `styles.css`: ta bort rad 844, `@keyframes caretBlink`. Den används enbart av
    `.tc.cursor::after` på rad 843. **Förväxla den inte med `@keyframes blinkCursor`
    på rad 977 — den används av `.boot-cursor` i sidfoten och ska vara kvar.**

12. `styles.css`: ta bort rad 845, `@keyframes kineticDrop`.

13. `styles.css`, reduced-motion-blocket på rad 853–856: ta bort raden
    `.k-line { opacity: 1; transform: none; animation: none; filter: none; }`.
    **Behåll** `.iridescent:hover::after { animation: none; }` och klamrarna.

**Avslutning**

14. Bumpa cachebrytaren: läs av nuvarande värde med
    `grep -o 'styles.css?v=[0-9]*' index.html | head -1`, höj med 1 och sätt samma
    `?v` på `styles.css`, `scripts.js` och `unlock.js` i alla 9 filer.
    Bildernas egna `?v` rörs inte.

## Boundaries

- Rör **inte** `unlock.js` eller någon grindlogik.
- Rör **inte** `.pl-price` / `.pl-row` / `.pl-name` / `.pl-dots` / `.pl-note`.
- Rör **inte** rad 1 i `scripts.js` (`const reduce`).
- Rör **inte** `@keyframes blinkCursor` (rad 977) eller `.boot-cursor`.
- Rör **inte** den musdrivna 3D-lutningen på `scripts.js:77`.
- Ändra **inte** rubrikens ord. Texten i `index.html:137` ska vara exakt densamma.
- Lägg **inte** till någon ersättande laddningsindikator, spinner eller fade på
  `body`. Sajten ska visas direkt.
- Ge **inte** `heroIn` någon `animation-delay` eller `fill-mode`.
- Inga nya beroenden, inget byggsteg.
- Om en rad inte ser ut som citaten: **stanna och rapportera.**

## Verification

**Mekaniskt**

```bash
# 1. preloader och skrivmaskin helt borta
grep -rn 'preloader\|plDraw\|kineticDrop\|caretBlink\|Hero typewriter\|kinetic-hero.typed' \
  --include=*.html --include=*.css --include=*.js . | grep -v '.git/'
#    forvantat: noll rader

# 2. det som ska overleva
grep -c 'pl-price' webboptimering/index.html     # forvantat: 8
grep -n 'blinkCursor' styles.css                 # forvantat: 2 rader (.boot-cursor + keyframes)
grep -n '\.k-line' styles.css                    # forvantat: 1 rad: .k-line { display: block; }
grep -n 'heroIn' styles.css                      # forvantat: 2 rader
grep -c 'k-line' index.html                      # forvantat: 3

# 3. ?v synkat
grep -o 'v=[0-9]*' index.html 404.html */index.html | sort | uniq -c
```

**Mät före ändringen** (skriptet räknar `.tc`-tecken, som bara finns före):

```js
async () => {
  const f=document.createElement('iframe');
  f.style.cssText='position:fixed;left:0;top:0;width:1200px;height:800px;border:0;z-index:-1;opacity:0.01';
  const marks=[]; const t0=performance.now();
  const p=new Promise(res=>{
    const iv=setInterval(()=>{
      try{ const d=f.contentDocument; if(!d) return;
        const chars=d.querySelectorAll('.kinetic-hero .tc'); if(!chars.length) return;
        const on=d.querySelectorAll('.kinetic-hero .tc.on').length;
        const pre=d.getElementById('preloader');
        marks.push({ms:Math.round(performance.now()-t0), tecken:on+'/'+chars.length,
                    doldAv: pre ? 'preloader '+getComputedStyle(pre).opacity : '-'});
        if(on>=chars.length){clearInterval(iv);res();}
      }catch(e){}
    },100);
    setTimeout(()=>{clearInterval(iv);res();},9000);
  });
  f.src='/?matning='+Date.now(); document.body.appendChild(f);
  await p;
  let fcp=0; try{ fcp=Math.round((f.contentWindow.performance.getEntriesByType('paint')
        .find(x=>x.name==='first-contentful-paint')||{}).startTime||0); }catch(e){}
  f.remove();
  const synlig=marks.find(m=>m.doldAv==='-');
  const klar=marks.find(m=>m.tecken.split('/')[0]===m.tecken.split('/')[1]);
  return {fcp_ms:fcp, synligtInnehallVid_ms: synlig&&synlig.ms, rubrikLasbarVid_ms: klar&&klar.ms};
}
```

**Mät efter ändringen** (ingen `.tc` finns längre — mäter när rubriken har text
och full opacitet i stället):

```js
async () => {
  const f=document.createElement('iframe');
  f.style.cssText='position:fixed;left:0;top:0;width:1200px;height:800px;border:0;z-index:-1;opacity:0.01';
  const marks=[]; const t0=performance.now();
  const p=new Promise(res=>{
    const iv=setInterval(()=>{
      try{ const d=f.contentDocument; if(!d) return;
        const h1=d.querySelector('.kinetic-hero'); if(!h1) return;
        const op=+getComputedStyle(h1).opacity;
        marks.push({ms:Math.round(performance.now()-t0), tecken:h1.innerText.trim().length,
                    opacitet:+op.toFixed(2), preloader: d.getElementById('preloader')?'JA':'-'});
        if(op>0.99 && h1.innerText.trim().length>10){clearInterval(iv);res();}
      }catch(e){}
    },50);
    setTimeout(()=>{clearInterval(iv);res();},9000);
  });
  f.src='/?matning='+Date.now(); document.body.appendChild(f);
  await p;
  let fcp=0; try{ fcp=Math.round((f.contentWindow.performance.getEntriesByType('paint')
        .find(x=>x.name==='first-contentful-paint')||{}).startTime||0); }catch(e){}
  f.remove();
  const forstaText=marks.find(m=>m.tecken>10);
  const full=marks.find(m=>m.opacitet>0.99);
  return {fcp_ms:fcp, rubrikHarTextVid_ms: forstaText&&forstaText.ms,
          rubrikFullOpacitetVid_ms: full&&full.ms,
          preloaderSedd: marks.some(m=>m.preloader==='JA'), tidslinje: marks.slice(0,10)};
}
```

Mät också LCP separat med en `PerformanceObserver` på `largest-contentful-paint`
med `buffered: true`. Redovisa: **FCP, tid till synligt innehåll, tid till läsbar
rubrik och LCP** — före och efter.

**Känslokoll** — hårdladda (Ctrl+Shift+R) och kontrollera:

- Innehållet syns direkt. Ingen svart ruta, ingen blink.
- Sidan går att skrolla från första sekunden.
- **Rubriken står komplett på tre rader från första bildrutan.** Inga tecken som
  tänds ett i taget, ingen markör, ingenting som faller in uppifrån.
- Intoningen ska kännas som att rubriken *lägger sig på plats*, inte som att man
  väntar in den. Sätt Animations-panelen på 10 % och kontrollera att lyftet är
  10 px och inte mer, och att opaciteten och lyftet går i takt.
- **Kontrollera hur `välja dig` ser ut.** Skrivmaskinen satte tidigare
  `.typed .hl { color: #8b8bff }`. Utan den gäller `.hero h1 .hl` på
  `styles.css:384`: en gradient `linear-gradient(120deg, #fff 30%, #8b8bff)`
  klippt mot texten. Det är den ursprungliga designen, men det är en synlig
  skillnad. Rapportera hur det ser ut i båda teman innan det godkänns.
- För musen över hjälten: 3D-lutningen på rubriken ska fungera som förut.
- Animationer som tidigare låg gömda bakom preloadern blir nu synliga:
  navigationens `navDropIn` och hjältens `.reveal`-element. Rapportera hur de ser
  ut — ändra dem inte här.
- `prefers-reduced-motion` i Rendering-panelen: rubriken ska synas direkt utan
  rörelse.
- Kontrollera i båda teman och på 390, 768 och 1440 px bredd.

**Klart när**: grep ger noll träffar på preloader/skrivmaskin/kineticDrop/caretBlink,
prislistan har kvar sina 8 `pl-price`, `.k-line` finns i exakt en regel,
`?v` är synkat på nio filer, och siffrorna är redovisade före/efter.
