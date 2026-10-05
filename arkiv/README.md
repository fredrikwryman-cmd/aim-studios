# Arkiv

Kod och filer som tagits ur sajten men inte raderats. `arkiv/` är utesluten i
`_config.yml` och publiceras inte. Ingen sida laddar något härifrån.

## startsida-2026-10-05 (steg 1, ompositionering av startsidan)

Flyttat från commit e3e4f8a.

| Fil | Vad |
|---|---|
| `index.html` | Hela den gamla startsidan, flyttad med `git mv`. |
| `moduler.js` | Moduler ur `scripts.js` som inte längre har något element att arbeta på: påskägget (neonläget), promo-stickern, beställningsmodalen med 20 % rabatt, branschväxlaren, WebGL-shadern och hero-rutnätet, misprint-rubriken, 3D-tilten, count-up, FAQ, problemsektionen, marquee-pausen. |
| `moduler.css` | Regler ur `styles.css` vars selektorer inte längre matchar något i sajtens HTML eller `scripts.js`, plus keyframes som bara de använde. Utvalt med skript, inte för hand. |
| `fonts-instrument-serif.css`, `instrumentserif-*.woff2` | Typsnittet som bara misprint-rubriken använde. |
| `assets/tjanst-*.jpg/.webp` | Bakgrundsbilderna till de gamla tjänsterutorna på startsidan. |
| `../unlock.js` | Grindlogiken bakom påskägget. |

Påskägget låste upp beställningsformuläret med 20 % rabatt. Det formuläret
finns bara i `index.html` här och är inte längre åtkomligt på sajten.

## webboptimering-2026-10-05 (optimeringslinjen pensionerad)

Flyttat från commit 46ed7f4. Ersatt av `/webbesiktning/`.

| Fil | Vad |
|---|---|
| `index.html` | Hela `/webboptimering/` med Genomlysning, Uppfräschning, Omtag och Omtag Pro och alla priser, flyttad med `git mv`. På dess plats ligger en redirect-stubb till `/webbesiktning/`. |
| `moduler.css` | Prislistan med punktledare (`.pricelist`, `.pl-*`) och sidans bakgrundsregel, som bara den sidan använde. |
