# 002 — Återställ intoningen på tjänstekorten

- **Status**: DONE — genomford 2026-09-06 i commit `7083811`, `?v=103`.
  Uppmatt: tjanstekortets full opacitet 0 ms -> 567 ms (jamforelserubrik 566 ms),
  hover-lyftet oforandrat 0,3 s.
- **Commit**: a2052b5
- **Severity**: HIGH
- **Category**: 7. Kohesion & tokens (regelkrock som ger visuell bugg)
- **Estimated scope**: 1 fil (`styles.css`), 2 tillagda regler. Plus synkad `?v`-bumpning.

## Problem

`.reveal` ger alla insvepande element en 800 ms intoning. `.svc-card` deklarerar
sin egen `transition` för hover — och eftersom den regeln står **senare i filen**
med **samma specificitet** vinner den. Resultatet: `opacity` försvinner helt ur
övergången på alla element som är både `.svc-card` och `.reveal`.

```css
/* styles.css:754-755 — nuvarande */
  .reveal { opacity: 0; transform: translateY(26px); transition: opacity .8s var(--ease), transform .8s var(--ease); }
  .reveal.in { opacity: 1; transform: none; }
```

```css
/* styles.css:1032-1033 — nuvarande, vinner over .reveal */
  .svc-card { background: var(--bg-card); border: 1px solid var(--line); border-radius: var(--radius); padding: 30px; transition: transform .3s var(--ease), border-color .3s, box-shadow .3s; }
  .svc-card:hover { transform: translateY(-4px); border-color: var(--line-strong); box-shadow: 0 20px 50px -24px rgba(79,70,229,0.4); }
```

Uppmätt i Chrome, samma nollställning körd på två element på startsidan:

```
Tjanstekort (.svc-card.svc-tile):   opacitet 0 fore  ->  1 vid frame 0   (hart hopp)
Rubrik      (.section-head.reveal): opacitet 0.91    ->  1 over ~32 ms   (tonar)
```

Uppmätt `transitionProperty` på ett tjänstekort: `transform, border-color, box-shadow`
— ingen `opacity`. Och `transitionDuration: 0.3s` i stället för `0.8s`.

Korten glider alltså in 26 px men **tänds i ett enda bildrutehopp**, och gör det
på 300 ms i stället för 800 ms. Alla andra 27 `.reveal`-element på startsidan
tonar mjukt. Korten poppar. Det är den enda platsen på sajten där rörelsen bryter
mönstret, och det är de fem tjänstekorten — sidans viktigaste innehåll näst efter
hjälten.

**Omfattning: 23 element på sajten** har klasskombinationen `.svc-card` + `.reveal`:

```
index.html                   6
om-oss/index.html            5
webboptimering/index.html    3
seo/index.html               3
webbdesign/index.html        2
ai-losningar/index.html      2
branding/index.html          2
case/index.html              0
```

Kontrollerat: inga andra element på sajten tappar sin opacity-övergång. Av 33
`.reveal` på startsidan är exakt de 6 `.svc-card` drabbade.

## Target

Korten ska tona in på 800 ms som allt annat, **och behålla sitt 300 ms hover-lyft.**

Det går inte att lösa genom att lägga `opacity` i `.svc-card`s `transition`: då
skulle antingen intoningen bli 300 ms (fel jämfört med övriga) eller hover-lyftet
bli 800 ms (trögt och fel). Båda tillstånden animerar `transform` på samma element
och kan inte dela en enda `transition`-deklaration.

Lösningen är att köra intoningen som **keyframes** i stället för transition.
Keyframes ligger över transitions i kaskaden under sin speltid och lämnar
`transition`-deklarationen orörd för hover.

```css
/* target — laggs in DIREKT EFTER .svc-card:hover (styles.css:1033) */
  /* .svc-card definieras efter .reveal och skrev tidigare over dess opacity-overgang,
     sa korten poppade in i stallet for att tona. Intoningen kors som keyframes:
     transitionen ovan far da vara kvar orord for hover-lyftet pa 300 ms. */
  .svc-card.reveal.in { animation: revealIn .8s var(--ease); }
  @keyframes revealIn { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
```

Värdena `.8s`, `translateY(26px)` och `var(--ease)` är kopierade rakt av från
`.reveal` på rad 754 så att korten blir **exakt** som resten. Uppfinn inga nya.

Ingen `animation-fill-mode` ska sättas. `.reveal.in` (rad 755) håller redan
sluttillståndet `opacity: 1; transform: none;`, och `forwards`/`both` skulle låsa
fast `transform` och blockera hover-lyftet efteråt.

## Repo-konventioner att följa

- Easing-token: **`var(--ease)` = `cubic-bezier(0.22, 1, 0.36, 1)`** (`styles.css:21`).
  Sajten har medvetet en enda kurva. Inför ingen ny.
- Keyframes namnges i lowerCamelCase och deklareras intill de regler som använder
  dem — se `@keyframes navDropIn` på `styles.css:271` som exemplar.
- Kommentarer i `styles.css` skrivs på svenska.
- Reducerad rörelse hanteras redan globalt på `styles.css:816-819`
  (`animation-duration: 0.001ms !important` + `.reveal { opacity: 1; transform: none; }`).
  Den nya animationen fångas automatiskt av det blocket — **lägg inte till någon
  egen reduced-motion-regel.**

## Steps

1. Öppna `styles.css` och lokalisera `.svc-card:hover` (rad 1033 vid commit `a2052b5`).

2. Lägg in de tre raderna ur Target direkt efter den regeln — kommentaren,
   `.svc-card.reveal.in`-regeln och `@keyframes revealIn`.

3. Rör **inte** `.reveal` (754), `.reveal.in` (755), `.svc-card` (1032) eller
   `.svc-card:hover` (1033). Ingen av dem ska ändras.

4. Bumpa cachebrytaren: läs av nuvarande värde med
   `grep -o 'styles.css?v=[0-9]*' index.html | head -1`, höj med 1, sätt samma
   `?v` på `styles.css`, `scripts.js` och `unlock.js` i alla 9 filer
   (8 sidor + `404.html`).

## Boundaries

- Endast `styles.css` + `?v`-strängarna ändras. Ingen HTML-struktur, ingen JS.
- Lägg **inte** till `opacity` i `.svc-card`s `transition` — det är just den
  lösningen som skapar den nya buggen (se Target).
- Lägg **inte** till stagger i den här planen. Det är ett separat fynd.
- Ändra **inte** hover-värdena (`translateY(-4px)`, `.3s`).
- Om raderna inte ser ut som citaten ovan: **stanna och rapportera.**

## Verification

**Mekaniskt**

```bash
grep -n 'svc-card.reveal.in\|@keyframes revealIn' styles.css   # forvantat: 2 rader
grep -n '^  \.reveal {' styles.css                             # forvantat: oforandrad rad 754
```

**Mät i webbläsaren** — kör i Playwright på den publicerade sidan, före och efter:

```js
// jamfor ett tjanstekort med ett vanligt reveal-element
async () => {
  const kort = document.querySelector('.svc-card.svc-tile');
  const rubrik = document.querySelector('.section-head.reveal');
  const mat = async (el) => {
    el.classList.remove('in');
    void el.offsetHeight;
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const t0=performance.now(); const s=[];
    el.classList.add('in');
    await new Promise(res=>{ (function f(){ const ms=Math.round(performance.now()-t0);
      s.push([ms, +getComputedStyle(el).opacity]); if(ms<1000) requestAnimationFrame(f); else res(); })(); });
    const full = s.find(x=>x[1]>0.99);
    return { klass: el.className.split(' ').slice(0,2).join(' '),
             fullOpacitetVidMs: full ? full[0] : '>1000',
             transitionProperty: getComputedStyle(el).transitionProperty };
  };
  return { tjanstekort: await mat(kort), rubrik: await mat(rubrik) };
}
```

Före ändringen ger tjänstekortet `fullOpacitetVidMs: 0`. Efter ska det ligga
i intervallet **700–850 ms**, alltså i nivå med rubriken. Redovisa båda
siffrorna.

**Känslokoll**

- Ladda om startsidan och skrolla lugnt ner till tjänstesektionen. Korten ska
  tona upp samtidigt som de glider — inget ska tändas i ett hopp.
- Skrolla vidare till en `.section-head` och jämför direkt efteråt: rörelsen ska
  kännas som samma sajt, inte som två olika.
- **Hover-lyftet får inte ha blivit trögt.** Hovra ett tjänstekort och räkna: det
  ska lyfta 4 px på ~300 ms, snabbt och stramt. Om det känns segt har `transition`
  skrivits över någonstans — då är fixen fel gjord.
- Hovra ett kort **medan** det fortfarande tonar in. Kortet ska inte hoppa eller
  studsa; animationen får vinna under sina 800 ms och hover tar över efteråt.
- Sätt DevTools Animations-panel på 10 % hastighet och titta på ett kort igen:
  opacitet och förflyttning ska gå i takt, inte i två steg.
- Slå på `prefers-reduced-motion` i Rendering-panelen och ladda om: korten ska
  synas direkt, utan rörelse.
- Kontrollera i båda teman och på minst tre av sidorna med `.svc-card`
  (`/`, `/om-oss/`, `/seo/`).

**Klart när**: mätskriptet ger 700–850 ms för tjänstekortet, hover-lyftet mäter
fortfarande ~300 ms, och de två grep-kontrollerna stämmer.
