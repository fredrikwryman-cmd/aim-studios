# 005 — Stäng av hover-rörelse på pekskärm

- **Status**: DONE - genomford 2026-09-06 i commit `e6b54c9`, `?v=107`.
  Uppmatt: 12 av 15 rorelse-hover-selektorer nollstallda under
  @media (hover: none), (pointer: coarse). EJ reproducerat pa riktig telefon.
- **Commit**: a2052b5
- **Severity**: MEDIUM
- **Category**: 6. Tillgänglighet
- **Estimated scope**: 1 fil (`styles.css`), ett nytt block på ~14 rader. Plus synkad `?v`-bumpning.

## Problem

Uppmätt genom att gå igenom stilmallens regler i webbläsaren:

```
:hover-regler i styles.css:                       47
varav med rorelse (transform/translate/scale/rotate): 17
varav grindade av @media (hover: hover):            0
```

Ingen enda hover-regel är grindad. På en pekskärm finns ingen hovring — men
webbläsaren skickar ett syntetiskt `:hover` vid tryck, och det **sitter kvar**
tills något annat trycks. Effekten: besökaren tappar på ett tjänstekort, kortet
lyfter 4 px och blir kvar upplyft. Sedan ligger ett kort i sektionen och ser
markerat ut utan att vara det.

`AUDIT.md`, kategori 6, är uttrycklig: *"touch fires false hovers on tap"* —
rörelse på hover ska ligga bakom `@media (hover: hover) and (pointer: fine)`.

De berörda reglerna (rad, nuvarande innehåll i utdrag):

```css
  259   .btn:hover .btn-arrow { transform: translateX(4px); }
  294   .theme-toggle:hover { … transform: rotate(18deg); … }
  299   .nav-cta:hover { transform: translateY(-2px) scale(1.03); … }
  301   .nav-cta:hover .btn-arrow { transform: translateX(4px); }
  434   .logo-item:hover { … transform: translateY(-3px) … }
  601   .price-card:hover { transform: translateY(-6px); }
  630   .pkg-close:hover { … transform: rotate(90deg); }
  991   .foot-col a:hover { … transform: translateX(4px); }
  996   .social-icon:hover { … transform: translateY(-2px) scale(1.05); … }
 1033   .svc-card:hover { transform: translateY(-4px); … }
 1121   a.case-card:hover { … transform: translateY(-4px); }
```

**Anmärkning:** jag har inte kunnat reproducera det fastnade hover-läget i en
desktop-webbläsare — den rapporterar alltid `hover: hover`, oavsett fönsterbredd.
Fyndet är verifierat på kodnivå (noll grindning över 17 rörelseregler) och följer
en väldokumenterad webbläsarmekanik, men den slutliga bekräftelsen måste ske på
en riktig telefon. Det står som ett eget steg under Verifiering.

## Target

Ett enda block sist i `styles.css` som nollställer rörelsen när pekaren är grov.

```css
/* target — laggs sist i styles.css */
  /* ---------- Pekskarm: ingen hover-rorelse ---------- */
  /* :hover triggas av tryck pa pekskarm och sitter kvar tills nagot annat trycks,
     sa ett kort blir liggande upplyft utan att vara valt. Fargen och skuggan far
     vara kvar - de laser som ett svar pa trycket. Bara forflyttningen tas bort. */
  @media (hover: none), (pointer: coarse) {
    .btn:hover .btn-arrow,
    .nav-cta:hover .btn-arrow,
    .theme-toggle:hover,
    .nav-cta:hover,
    .logo-item:hover,
    .price-card:hover,
    .pkg-close:hover,
    .foot-col a:hover,
    .social-icon:hover,
    .svc-card:hover,
    a.case-card:hover { transform: none; }
    .problem-card:hover:not(.flipped) .problem-inner { transform: none; }
  }
```

**Varför inversen i stället för `@media (hover: hover)` runt varje regel:**
`AUDIT.md` visar grindningen som ett villkor runt själva hover-regeln. Det skulle
här kräva att tolv befintliga regler styckas upp — rörelsen ur, resten kvar —
i en handskriven stilmall på 1 249 rader. Ett enda inverterat block ger samma
utfall, är en rad att ångra, och rör inte en enda befintlig regel. Avvikelsen är
medveten.

**Tre hover-regler med rörelse lämnas kvar med flit:**

- `.marquee-3d:hover` (rad 425) — dess bastransform plattas redan till samma
  värde av `@media (max-width: 768px)` på rad 442. Hover och bas är alltså
  identiska på mobil; en override vore verkningslös och skulle riskera att
  platta 3D-lutningen på surfplattor.
- `.ai-orb-container:hover .ai-orb-label` (rad 901) — transformen för etiketten
  *till* sitt läge (`translateY(4px)` → `0`), den lyfter ingenting. Selektorn
  innehåller dessutom `:focus-visible` och ska inte röras.
- `.svc-wide:hover` (rad 484, 486, 497) — död kod, inget element använder
  `.svc-wide`. Den städas bort i plan 006. Ta **inte** med den här.

### Rättelse mot en tidigare version av den här planen

Jag skrev först att `.problem-card.flipped` aldrig sätts av någon JS och att
kortens baksida därför bara går att nå via hover. Det stämmer inte.
`scripts.js:574-576` flippar korten automatiskt på grova pekare när de skrollas
in i vyn, med 700 ms plus 180 ms per kort:

```js
/* scripts.js:574-576 — nuvarande */
  if(cards.length && 'IntersectionObserver' in window && matchMedia('(pointer:coarse)').matches){
    const fIo=new IntersectionObserver(es=>{es.forEach(e=>{ if(e.isIntersecting){ const i=[...cards].indexOf(e.target); setTimeout(()=>e.target.classList.add('flipped'), 700+i*180); fIo.unobserve(e.target); } });},{threshold:0.3});
```

Pekskärmsanvändare får alltså redan baksidan. Att nollställa hover-flippen där är
därför inte bara ofarligt — det är **rätt**, eftersom ett tapp annars flippar
kortet i otakt med autoflippen. Regeln skrivs med `:not(.flipped)` så att den
automatiska flippen inte råkar nollställas.

## Repo-konventioner att följa

- Kommentarer i `styles.css` skrivs på svenska.
- Sektionsrubriker följer `/* ---------- Namn ---------- */`, se `styles.css:1017`.
- Mediefrågor skrivs utan mellanrum runt kolon: `(max-width: 768px)`-stilen som
  används genomgående i filen.
- Sajten grindar redan grova pekare i JS på sex ställen med
  `matchMedia('(pointer:coarse)')` — se `scripts.js:709` som exemplar. Det här
  blocket är CSS-motsvarigheten till samma beslut.

## Steps

1. Lägg in blocket ur Target sist i `styles.css`, efter det avslutande
   `@media (max-width: 560px)`-blocket på rad 1249.

2. Rör ingen befintlig regel. Blocket ska bara lägga till, aldrig ändra.

3. Bumpa cachebrytaren: läs av nuvarande `?v` med
   `grep -o 'styles.css?v=[0-9]*' index.html | head -1`, höj med 1, sätt samma
   värde på `styles.css`, `scripts.js` och `unlock.js` i alla 9 filer.

## Boundaries

- Endast `styles.css`. Ingen JS, ingen HTML-struktur.
- Ta **inte** med `.marquee-3d`, `.ai-orb-container` eller `.svc-wide` — se
  skälen under Target. `.problem-card` ingår däremot, med `:not(.flipped)`.
- Nollställ **bara** `transform`. Färg, kantfärg och skugga ska vara kvar på
  hover även på pekskärm; de ger tryckåterkoppling och gör ingen skada när de
  sitter kvar en stund.
- Lägg **inte** till `@media (hover: hover)` runt de befintliga reglerna i det
  här passet — det är en större omskrivning och en annan risk.
- Om plan 006 (död rörelsekod) körs efter den här: kontrollera att inga
  `.svc-wide`-selektorer har smugit sig in i blocket.
- Om raderna inte ser ut som citaten: **stanna och rapportera.**

## Verification

**Mekaniskt**

```bash
grep -n 'hover: none' styles.css                  # forvantat: 1 rad
grep -c 'transform: none;' styles.css             # ska ha okat med exakt 2
grep -n 'svc-wide\|marquee-3d' styles.css | grep 'hover: none'   # forvantat: tomt
```

**Mät i webbläsaren** — kör i Playwright:

```js
() => {
  let totalt=0, grindade=0;
  for(const ss of document.styleSheets){ let rs; try{rs=ss.cssRules}catch(e){continue}
    const ga=(regler, iTouchMedia)=>{ for(const r of regler){
      if(r.cssRules) ga(r.cssRules, iTouchMedia || /hover:\s*none|pointer:\s*coarse/.test(r.conditionText||''));
      else if(r.selectorText && r.selectorText.includes(':hover') && /transform|translate|scale\(|rotate/.test(r.style.cssText)){
        totalt++; if(iTouchMedia) grindade++; } } };
    ga(rs,false); }
  return { hoverReglerMedRorelse: totalt, varavNollstalldaPaPekskarm: grindade };
}
```

Förväntat efter ändringen: `varavNollstalldaPaPekskarm: 12`.

**Bekräfta på en riktig telefon** — det här steget kan inte hoppas över, och
det kan inte göras i en desktop-webbläsare:

1. Öppna `https://aimstudios.se` på en telefon.
2. Tappa på ett tjänstekort i tjänstesektionen (utan att följa länken — tappa på
   kortets bakgrund).
3. Skrolla vidare och titta tillbaka. **Kortet ska inte ligga kvar upplyft.**
   Kantfärg och skugga får gärna dröja sig kvar en kort stund — det är avsikten.
4. Gör samma sak på ett priskort och på ett case-kort.
5. Be om en skärmdump om något ser fel ut. Webbläsaren på skrivbordet ljuger om
   den här klassen av beteende.

**Känslokoll på desktop** — inget får ha förändrats:

- Hovra ett tjänstekort med mus: det ska fortfarande lyfta 4 px på ~300 ms.
- Hovra nav-CTA:n: den ska fortfarande lyfta och skalas 1,03.
- Hovra en pil i en knapp: pilen ska fortfarande glida 4 px åt höger.
- Öppna paketmodalen och hovra stängkryssen: den ska fortfarande rotera 90 grader.
- Ändra `hover`-emulering i DevTools (Rendering → *Emulate CSS media feature
  hover: none*) och kontrollera att rörelsen då är borta men färgerna kvar.

**Klart när**: mätskriptet ger 12 nollställda regler, DevTools-emuleringen visar
rörelsen borttagen, alla hover-effekter fungerar oförändrat med mus, och det
fastnade lyftet är bekräftat borta på en riktig telefon.
