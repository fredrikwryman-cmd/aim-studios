# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# aimstudios.se

Handkodad statisk sajt. GitHub Pages. Ingen byggkedja, inget ramverk.
Ägare: Fredrik, AiM Studios. Detta är byråns egen sajt — den är skyltfönstret.

## Avrapportering

Avsluta ALLTID varje uppdrag med:

✅✅✅
<rapport>
✅✅✅

Rapporten ska innehålla vad som gjordes, vad som mättes, och vilka filer
som ändrades. Redovisa uppmätta värden, inte påståenden.

## Grundregler

- Rör aldrig robots.txt, sitemapens URL-lista eller meta robots utan
  uttrycklig instruktion. Sajten ska förbli fullt indexerbar.
- 404.html behåller sin noindex. Den ligger inte i webbkartan.
- Höj cachebrytaren ?v=N på ALLA sidor när styles.css eller scripts.js
  ändras. Missas det får återvändande besökare gammal CSS med ny markering.
- sitemap.xml genereras med `python tools/gen-sitemap.py`. Handredigera aldrig.
- Skicka aldrig ett formulär i test. Båda formulären postar till en riktig
  inkorg via Formspree.
- Påskägget och `unlock.js` togs bort ur sajten i steg 1 (2026-10-05) och
  ligger i `arkiv/`. Arkivet publiceras inte och laddas inte av någon sida.
  Radera inget i `arkiv/`.

## Kommandon

Det finns ingen package.json, inget byggsteg och inga tester. Allt nedan
körs mot filerna som de ligger.

```sh
# Cachebrytaren: höj v=N på den delade fil som ändrats, i ALLA HTML-filer som
# refererar den (styles.css och fonts.css: tolv filer, scripts.js: tio).
# om-oss.html är en redirect-stubb utan tillgångar och ska inte ha någon.
grep -rl "v=<N>" --include=*.html .        # hitta dem
grep -rn "v=<N>" --include=*.html .        # verifiera att inga blev kvar

# Sitemap. Lägg till nya sidor i PAGES i skriptet, aldrig i XML:en.
python tools/gen-sitemap.py                # skriv
python tools/gen-sitemap.py --check        # kontrollera utan att skriva

# Lokal server för test (sajten använder absoluta sökvägar, file:// duger inte)
python -m http.server 8731 --bind 127.0.0.1

# Verifiera live efter push. GitHub Pages tar 1-3 minuter.
curl -sS "https://aimstudios.se/?cb=$RANDOM" | grep -o "styles.css?v=[0-9]*"
```

## Struktur

Tio riktiga sidor, alla som `<mapp>/index.html` utom startsidan:
`/`, `/webbdesign/`, `/webbesiktning/`, `/seo/`, `/ai-losningar/`,
`/branding/`, `/skotsel/`, `/case/`, `/konsult/`, `/om-oss/`. Plus `integritetspolicy.html`,
`404.html` (noindex, ej i sitemap) och två redirect-stubbar: `om-oss.html`
(till `/om-oss/`) och `webboptimering/index.html` (till `/webbesiktning/`,
sedan 2026-10-05). GitHub Pages kan inte skicka äkta 301 per sökväg; stubbarna
använder meta refresh 0 s, `location.replace`, canonical mot målet och noindex.

Två delade filer laddas av varje sida med header: `styles.css` (~100 kB) och
`scripts.js` (~41 kB). `integritetspolicy.html` och `404.html` laddar bara
`styles.css`. Det finns ingen komponentuppdelning — HTML upprepas
per sida. Ändrar du navigering, sidfot eller huvud måste du ändra i alla.

`_config.yml` utesluter `CLAUDE.md`, `tools/`, `README.md`, `plans/`, `docs/`
och `arkiv/` ur
den publicerade sajten. Jekyll bygger sajten, det finns ingen `.nojekyll`.

### scripts.js

Ett tjugotal fristående IIFE-moduler i en fil, var och en inledd med en
`/* ---------- Namn ---------- */`-rubrik. Varje modul börjar med att leta
sitt element och `return`:ar tyst om det saknas — därför kan samma fil laddas
på alla sidor. Lägg nya moduler i samma form.

Genomgående mönster som återkommer och som du ska följa:

- **`prefers-reduced-motion` först.** Modulen returnerar innan den skapar
  canvas-kontext, lyssnare eller observers. Åtta förekomster i `scripts.js`,
  tio i `styles.css` (räknat 2026-10-05).
- **`IntersectionObserver` för att stoppa arbete utanför vyn.** Läs alltid
  `es[es.length-1]`, aldrig `es[0]` — köas flera poster ihop är den första
  den äldsta, och tillståndet fastnar. Det felet har funnits i två moduler
  och rättats i båda.
- **Loopar ska sova.** En rAF-loop som tickar över en yta där inget händer
  är ett fel, inte en detalj. (Heronätet och shadern som var förebilderna
  ligger i `arkiv/startsida-2026-10-05/moduler.js`.)
- **Dekorativa lager över innehåll måste ha `pointer-events: none`** och
  lyssna på en förälder i stället, annars äter de markering och klick.

Tema styrs av `data-theme="light"` på `<html>`, sparat i `localStorage`
under `aim-theme`. CSS:en definierar tokens på `:root` och skriver bara över
dem under `:root[data-theme="light"]` — 26 sådana block. Heron är mörk i
båda teman.

### Var saker ligger

Rörelse- och mätbesluten ligger i `plans/README.md`. Läs den innan du ändrar
något som rör animation eller prestanda — den innehåller mätningar som revs
och varför.

## Mät, gissa inte

- Kontrast mäts i webbläsaren mot den faktiskt målade bakgrunden, i BÅDA teman.
  Kompositera hela förälderkedjan: halvgenomskinliga bakgrunder (`var(--glass)`),
  gradienter som `background-image` och text med `color: transparent` plus
  `background-clip: text` ger alla falska utslag om de läses rakt av.
- Att en sida finns är inte samma sak som att den har innehåll. Öppna den.
- Ligger fliken i bakgrunden är visibilityState "hidden". Då mäter sidor noll
  tecken, fördröjda bilder byts aldrig in och CSS-transitioner står frusna.
  Kontrollera flikens tillstånd innan tomhet eller fel rapporteras.

### Webbläsarverktyg som faktiskt fungerar här

Chrome-tillägget tappar anslutningen och dess flik rapporterar ofta
`visibilityState: "hidden"`, vilket stoppar rAF och gör mätningar värdelösa.
**Mät i stället i riktig headless Chrome via puppeteer-core**, som redan finns
på maskinen:

```
puppeteer-core  C:\Users\fredr\node_modules\puppeteer-core
chrome.exe      C:\Users\fredr\AppData\Local\Google\Chrome\Application\chrome.exe
ffmpeg 7.1      via python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"
lighthouse      npx lighthouse (13.4.1, i npx-cachen)
```

**Mät aldrig i en iframe.** rAF-callbacks fyrar aldrig där och
IntersectionObserver fyrar noll gånger — layoutmått och skärmbilder är giltiga,
beteende är det inte.

Installera ingen enkodare eller webbläsare som inte redan finns. Saknas ett
verktyg: säg till, gör det inte själv.

### Prestandamätning

PSI ligger ofta nere. Lokal Lighthouse med PSI:s egna parametrar:

```sh
export CHROME_PATH="C:\Users\fredr\AppData\Local\Google\Chrome\Application\chrome.exe"
npx lighthouse <url> \
  --only-categories=performance,accessibility,best-practices,seo \
  --throttling-method=simulate \
  --output=json --output-path=<fil> \
  --chrome-flags="--headless=new" --quiet
# desktop: samma, plus --preset=desktop
```

Notera alltid i rapporten att det är lokal Lighthouse och inte PSI — siffrorna
ligger 20-40 poäng under PSI:s och får inte blandas ihop med värdena i
`plans/README.md`.

**Gates mäts som interfolierad A/B mot `main`, inte mot
`docs/baseline-2026-10-05.md`.** Baslinjen är mätt mot produktion och går inte
att jämföra med lokala körningar på en gren.

**Tre körningar per läge, före och efter. En enskild körning är inte bevis.**
Speed Index är bimodalt på den här sajten och har svängt fyra gånger mellan
körningar av identisk kod — orsaken är 23 oändliga animationer som aldrig
låter sidan stabiliseras, dokumenterat i `plans/README.md`.

Spretar siffrorna: kör **interfolierad A/B**. `git worktree` på föregående
commit, två lokala portar, växelvis FÖRE och EFTER så maskinens dagsform
träffar båda sidor lika. `benchmarkIndex` i rapporten visar hur belastad
maskinen var och har svängt 159-1886 inom samma pass. Sekventiella mätningar
före och efter har flera gånger pekat åt motsatt håll mot den interfolierade.

Det som ändå går att slå fast deterministiskt — antal begäranden, sidvikt,
CLS, vilka filer som hämtas — väger tyngre än poängen. Redovisa det.

## Design

Sajten ska andas. Emil Kowalskis skills är installerade globalt.
Använd `animate` vid ny rörelse, `find-animation-opportunities` för att hitta
ställen som saknar den, och `improve-animations` för att granska helheten.

## Känt och medvetet lämnat

- `404.html` saknar `<link rel="icon">` och ger därför `GET /favicon.ico → 404`
  i konsolen. Enda sidan utan. Förbefintligt, inte åtgärdat.
- `scripts.js` ger en lång uppgift på cirka 1 s (Lighthouse mobil, simulerad
  4x CPU) kort efter FCP, uppmätt på `/webbdesign/` 2026-10-05: 963–1 079 ms
  både på `main` (e3e4f8a) och på steg 1-grenen. Den dominerar TBT. När FCP
  kommer tidigare hamnar mer av den i TBT-fönstret, så TBT kan stiga fast
  sidan gör mindre arbete – så gick steg 1 (TBT upp, all huvudtrådstid ned).
  Fanns live före steg 1. Åtgärdas i ett eget pass: ta reda på vilka moduler
  som bygger upp uppgiften och dela upp den.
- BS-05 bryts på `/webboptimering` utan avslutande snedstreck: GitHub Pages
  svarar 301 till `/webboptimering/`, som är en redirect-stubb (meta refresh
  0 s + `location.replace`) till `/webbesiktning/`. Det blir en kedja, och
  stubben svarar 200, inte 301. Orsak: GitHub Pages kan inte skicka egna
  statuskoder per sökväg. Åtgärd: Cloudflare-proxy framför domänen med en
  Redirect Rule (301 från båda varianterna direkt till `/webbesiktning/`).
  **Medvetet beslut 2026-10-05, inte ett förbiseende:** DNS-ändringen görs inte
  i samma pass, och sidan hade lågt upparbetat värde.
- Konsolen ska annars vara 0 fel / 0 varningar på samtliga tolv sidor.
