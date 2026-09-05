# Rörelseplaner — aimstudios.se

Planer framtagna av skillen `improve-animations` efter en granskning av hela
kodbasens rörelse, verifierad i Chrome via Playwright mot den publicerade sajten.
**001, 002 och 006 är genomförda och driftsatta 2026-09-06. 003, 004 och 005 väntar på nästa pass.**

Alla planer är stämplade med commit `a2052b5`.

## Planer

| # | Titel | Fynd i granskningen | Allvar | Filer | Status |
|---|---|---|---|---|---|
| [001](001-ta-bort-preloadern.md) | Ta bort preloadern och skrivmaskinen, ge rubriken en kort intoning | 1 | HÖG | `index.html`, `styles.css`, `scripts.js` | **DONE** `10ce157` |
| [002](002-tjanstekortens-intoning.md) | Återställ intoningen på tjänstekorten | 2 | HÖG | `styles.css` | **DONE** `7083811` |
| [003](003-skickat-laget.md) | Ge formulärets skickat-läge en övergång | 3 | MELLAN-HÖG | `styles.css`, `scripts.js` | TODO |
| [004](004-tryckrespons.md) | Ge knapparna tryckrespons | 4 | MELLAN | `styles.css` | TODO |
| [005](005-hover-pa-pekskarm.md) | Stäng av hover-rörelse på pekskärm | 5 | MELLAN | `styles.css` | TODO |
| [006](006-dod-rorelsekod.md) | Städa bort död rörelsekod | 7 | MELLAN | `styles.css`, `scripts.js` | **DONE** `fd28b4c` |

Fynd 6 och 8–12 ur granskningen (24 oändliga animationer, `transition: all`,
det globala reduced-motion-blocket, saknad stagger, skrollindikatorns `width`,
FAQ:ns `max-height`) har medvetet **inga** planer. De är antingen lägre hävstång
eller — som FAQ:n — mekaniskt korrekta redan i dag.

## Rekommenderad ordning

```
001  →  002  →  006      (genomforda 2026-09-06)
003  →  004  →  005      (nasta pass)
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
  stund `?v=104` (101 -> 102 -> 103 -> 104 under passet 2026-09-06).
- **Formuläret får aldrig skickas i test.** Både `#bookForm` och `#orderForm`
  postar till en riktig inkorg via Formspree. Plan 003 innehåller ett mätskript
  som utlöser skickat-läget utan nätverksanrop — använd det.
- **Två planer innehåller ett beslut, inte bara ett utförande.** 001 gör
  skrivmaskinen snabbare (3 604 ms → ~1 120 ms) och 006 raderar en
  bakgrundszoom som skulle kunna återanvändas på tjänstekorten. Båda är
  markerade i respektive plan. Stäm av dem innan de körs.

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
