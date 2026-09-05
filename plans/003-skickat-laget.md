# 003 — Ge formulärets skickat-läge en övergång

- **Status**: TODO
- **Commit**: a2052b5
- **Severity**: MEDIUM-HÖG
- **Category**: 8. Missade tillfällen + 1. Syfte & frekvens
- **Estimated scope**: 2 filer (`styles.css`, `scripts.js`). ~14 tillagda CSS-rader, ~10 ändrade JS-rader. Plus synkad `?v`-bumpning.

## Problem

Det här är sajtens viktigaste ögonblick: besökaren har just bokat ett
strategi-möte. I dag är det ett hårdklipp.

```js
/* scripts.js:384 — nuvarande. Hela overgangen till skickat-lage ar dessa tva satser. */
      form.style.display='none'; document.getElementById('formSuccess').classList.add('show'); burst();
```

```css
/* styles.css:737-742 — nuvarande */
  .form-success { display: none; text-align: center; padding: 30px 10px; }
  .form-success.show { display: block; }
  .form-success .tick { width: 56px; height: 56px; border-radius: 50%; background: rgba(99,102,241,0.15); display: grid; place-items: center; margin: 0 auto 16px; }
  .form-success .tick svg { width: 28px; height: 28px; stroke: var(--accent); }
  .form-success h3 { font-size: 20px; margin-bottom: 8px; }
  .form-success p { color: var(--muted); font-size: 15px; }
```

Uppmätt i Chrome genom att köra exakt de två satserna på rad 384 (formuläret
skickades **inte** — se Boundaries):

```
fore:    formular 488 px, .form-card 546 px, sidhojd 11 598 px
vaxling: display:none + .show   ->  0,1 ms
efter:   kvitto 210 px, .form-card 267 px, sidhojd 11 257 px
         -> kortet kollapsar 279 px i EN bildruta
         -> sidan krymper 341 px
         -> kvittots overkant flyttar sig 386 -> 148 px
opacitet: 1 direkt | transform: none | animationer pa kvittot: 0 | pa bocken: 0
```

Konfettin (`burst()`, `scripts.js:391`) finns och är rätt tänkt. Men själva
panelbytet teleporterar, och 279 pixlars kollaps i en bildruta rycker undan sidan
under besökaren i samma sekund som hen bokat. Bocken i SVG:n ritas inte — den
bara finns.

Enligt frekvensregeln i `AUDIT.md` är det här ett **sällsynt tillfälle med hög
laddning**: det tåler och förtjänar en delight-budget. Det är precis motsatsen
till en knapp som trycks hundra gånger om dagen.

## Target

Tre saker, i den ordningen: kortet krymper mjukt, kvittot tonar upp, bocken ritas.

```css
/* target — ersatter styles.css:737-738 och laggs till efter rad 742 */
  .form-success { display: none; text-align: center; padding: 30px 10px; }
  .form-success.show { display: block; animation: successIn .34s var(--ease); }
  @keyframes successIn { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: none; } }
  .form-success.show .tick { animation: tickPop .32s var(--ease) .04s backwards; }
  @keyframes tickPop { from { opacity: 0; transform: scale(.82); } to { opacity: 1; transform: none; } }
  .form-success.show .tick polyline { stroke-dasharray: 23; stroke-dashoffset: 23; animation: tickDraw .42s var(--ease) .18s forwards; }
  @keyframes tickDraw { to { stroke-dashoffset: 0; } }
```

**Varför `23`:** bockens polyline är `points="20 6 9 17 4 12"` i en `viewBox="0 0 24 24"`.
Segmenten är √(11²+11²) = 15,56 och √(5²+5²) = 7,07 användarenheter, tillsammans
22,63. `23` täcker hela strecket med marginal utan synlig eftersläpning. Räkna
inte om det, och gissa inte ett annat värde.

**Varför `scale(.82)` och inte `scale(0)`:** ingenting i verkligheten uppstår ur
ingenting. `AUDIT.md` sätter golvet vid 0,9–0,97 för vanlig UI; bocken är ett
sällsynt firande och tål att starta något lägre, men inte från noll.

```js
/* target — ersatter scripts.js:384 */
      const kort=form.closest('.form-card');
      const h0=kort.getBoundingClientRect().height;
      form.style.display='none';
      document.getElementById('formSuccess').classList.add('show');
      const h1=kort.getBoundingClientRect().height;
      if(!reduce && Math.abs(h1-h0)>8){
        kort.style.overflow='hidden';
        kort.style.height=h0+'px';
        void kort.offsetHeight;                       /* tvingar fram utgangslaget */
        kort.style.transition='height .42s var(--ease)';
        kort.style.height=h1+'px';
        setTimeout(function(){ kort.style.height=''; kort.style.transition=''; kort.style.overflow=''; }, 480);
      }
      burst();
```

`height` är en layout-egenskap och animeras normalt aldrig — men det här händer
**en gång per besök i bästa fall**, och alternativet är ett hopp på 279 px.
Det är ett medvetet undantag, inte ett förbiseende. Skriv in det som kommentar
i koden så att nästa läsare inte "rättar" det.

## Repo-konventioner att följa

- Easing-token: **`var(--ease)` = `cubic-bezier(0.22, 1, 0.36, 1)`** (`styles.css:21`).
  Den är en stark ease-out, vilket är rätt kurva för något som träder in.
  Inför ingen ny kurva.
- `--accent` är **indigo `#6366F1`**. Grönt får enligt sajtens regler bara
  förekomma i `#ai`-sektionen. Bocken ska behålla `stroke: var(--accent)`.
- Kommentarer i `scripts.js` skrivs på svenska **utan å/ä/ö**; i `styles.css`
  med.
- `const reduce` finns redan på `scripts.js:1` och är i skop i den här funktionen.
  Använd den — skapa ingen ny `matchMedia`-avfrågning.
- Exemplar att härma för keyframes-placering: `@keyframes orderIn` som används av
  `.order-card` (`styles.css:1070`-trakten) ligger intill sin regel.

## Steps

1. **`styles.css`** — byt rad 738 (`.form-success.show { display: block; }`) mot
   raden i Target och lägg in de fem följande raderna (`successIn`, `tickPop`,
   `tickDraw`) direkt efter rad 742. Rad 737 och 739–742 ska stå kvar orörda.

2. **`scripts.js`** — ersätt hela rad 384 med JS-blocket i Target. Raderna
   omkring (`if(!res.ok) throw …` före, `}catch(_){` efter) ändras inte.

3. **`scripts.js`** — lägg en kommentarrad ovanför blocket:
   `/* height animeras medvetet: kortet kollapsar 279 px och en teleport har ar varre an en layout-animation en gang per besok. */`

4. **Valfritt, men rekommenderat** — om kvittots överkant hamnar utanför vyn
   efter kollapsen, rulla dit. Lägg efter `burst();`:
   ```js
      const r=kort.getBoundingClientRect();
      if(r.top<0 || r.bottom>innerHeight) kort.scrollIntoView({block:'center', behavior: reduce ? 'auto' : 'smooth'});
   ```

5. **Cachebrytare** — läs av nuvarande `?v` med
   `grep -o 'styles.css?v=[0-9]*' index.html | head -1`, höj med 1 och sätt samma
   värde på `styles.css`, `scripts.js` och `unlock.js` i alla 9 filer.

## Boundaries

- **Skicka aldrig formuläret i test.** Båda formulären postar till en riktig
  inkorg via Formspree (`https://formspree.io/f/xzdlgnlz`). All verifiering görs
  genom att köra klassbytet manuellt i konsolen — se Verifiering.
- Rör **inte** `#orderForm` / beställningsmodalen (`scripts.js:774` och framåt).
  Den ligger bakom ett lås och har en egen livscykel. Separat uppgift.
- Rör **inte** felhanteringen i `catch`-grenen (rad 386) eller
  `.form-error`-reglerna. Felmarkeringen är ett eget, mindre fynd.
- Rör **inte** `burst()` eller `#confetti`.
- Ändra **inte** texten i kvittot.
- Ta **inte** bort `display: none` / `display: block`-växlingen till förmån för
  `hidden`-attribut eller liknande — höjdmätningen bygger på att `.show` ger
  elementet layout.
- Om raderna inte ser ut som citaten: **stanna och rapportera.**

## Verification

**Mekaniskt**

```bash
grep -n 'successIn\|tickPop\|tickDraw' styles.css      # forvantat: 6 rader
grep -n 'formspree' scripts.js                          # forvantat: oforandrat, inga nya anrop
```

**Mät i webbläsaren — utan att skicka något.** Kör i Playwright på den
publicerade sidan:

```js
async () => {
  const form=document.getElementById('bookForm');
  const ok=document.getElementById('formSuccess');
  const kort=form.closest('.form-card');
  form.scrollIntoView({block:'center'}); await new Promise(r=>setTimeout(r,300));
  const h=el=>Math.round(el.getBoundingClientRect().height);
  const h0=h(kort);
  const spar=[]; const t0=performance.now(); let kor=true;
  (function f(){ if(!kor) return; spar.push([Math.round(performance.now()-t0), h(kort), +getComputedStyle(ok).opacity]); requestAnimationFrame(f); })();
  /* exakt samma vaxling som koden gor vid lyckat svar - inget natverksanrop */
  form.style.display='none'; ok.classList.add('show');
  await new Promise(r=>setTimeout(r,900)); kor=false;
  ok.classList.remove('show'); form.style.display=''; kort.style.height=''; kort.style.transition=''; kort.style.overflow='';
  return { hojdFore:h0, frames:spar.length, urval:spar.filter((_,i)=>i%4===0),
           kvittoFullOpacitetVidMs:(spar.find(s=>s[2]>0.99)||[])[0] };
}
```

Före ändringen: höjden går 546 → 267 mellan två bildrutor och opaciteten är 1
direkt. Efter ska höjden trappa ned över ~25 bildrutor (~420 ms) och
`kvittoFullOpacitetVidMs` ligga runt **300–360 ms**. Redovisa båda.

**Känslokoll** — utlös läget manuellt i DevTools-konsolen på den riktiga sidan:

```js
const f=document.getElementById('bookForm'); const k=f.closest('.form-card'); const h0=k.getBoundingClientRect().height;
f.style.display='none'; document.getElementById('formSuccess').classList.add('show');
const h1=k.getBoundingClientRect().height; k.style.overflow='hidden'; k.style.height=h0+'px'; void k.offsetHeight;
k.style.transition='height .42s cubic-bezier(0.22,1,0.36,1)'; k.style.height=h1+'px';
```

Kontrollera:

- Kortet krymper mjukt. Inget innehåll spiller ut över kanten under kollapsen
  (det är vad `overflow:hidden` är till för — syns spill har det steget missats).
- Kvittot tonar upp **medan** kortet fortfarande krymper, inte efteråt. De två
  rörelserna ska överlappa, annars känns det som två separata händelser.
- Bocken **ritas** från vänster, den ska inte bara dyka upp. Sätt Animations-panelen
  på 10 % och följ strecket hela vägen; det ska sluta exakt vid spetsen, utan att
  fastna kort eller lämna en osynlig svans.
- Ringen bakom bocken poppar från 0,82 till 1 — den ska kännas fast, inte gummiaktig.
- Sidan ska inte hoppa så att kvittot hamnar utanför vyn.
- Slå på `prefers-reduced-motion` i Rendering-panelen och gör om provet: kvittot
  ska bytas in direkt utan höjdanimation, men fortfarande vara läsbart och
  fullständigt. Konfettin ska utebli (`burst()` returnerar redan tidigt vid reduce).
- Kontrollera i båda teman.
- Testa i mobilbredd (390 px): kollapsen är procentuellt större där.

**Klart när**: höjdövergången mäter ~420 ms över flera bildrutor, kvittot når
full opacitet på 300–360 ms, bocken ritas synligt, och inget Formspree-anrop
har gjorts under testningen.
