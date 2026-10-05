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

## ai-losningar-2026-10-05 (simulerat AI-demo borttaget)

Flyttat från commit fedb500. Sidan skrevs om med ny text, och det simulerade
demot togs bort: svaren valdes med reguljära uttryck och ingen modell
anropades, vilket motsade sidans eget argument.

| Fil | Vad |
|---|---|
| `index.html` | Hela den gamla `/ai-losningar/` med demot, flyttad med `git mv`. |
| `demo.js` | De tre raderna ur `scripts.js` som kopplade demots element (`#demoBody`, `#demoChips`, `#demoInput`, `#demoSend`) till svarsmotorn. `botReply()`, `chatEngine()` och `wireChatInput()` ligger kvar - den flytande chatten på övriga sidor använder dem. |
| `demo.css` | Demots stilar: `.ai-sec`, `.chat-demo`, `.ai-terminal*`, `.ai-grid-lines`, `.ai-scan-line`, `.ai-badge-demo`, keyframes `scanMove`, och demots selektorer ur regler som delades med chattpanelen. |

## chatt-2026-10-05 (den flytande AI-chatten borttagen från hela sajten)

Flyttat från commit e152207. Chatten svarade med den gamla paketaffären
(9 995 kr, 10 dagar) och motsade den nya positioneringen. Den ska byggas om.

| Fil | Vad |
|---|---|
| `chatt.html` | Orben, panelen och snabbvalen, ordagrant. Blocket var identiskt på alla sju sidor som hade det. |
| `chatt.js` | Svarsmotorn (`botReply`, `chatEngine`, `wireChatInput`) och orb/panel-logiken ur `scripts.js`. `FOKUSERBARA` och `fokusfalla()` stod mitt i blocket och ligger kvar i `scripts.js` som egen modul - paketmodalen och mobilmenyn använder dem. Kopiera tillbaka dem om chatten byggs om härifrån. |
| `chatt.css` | Orbens, panelens och terminalens stilar, keyframes `orbPulse`, `ringSpin`, `particleFloat`, `orbPulseHover`, `blink`, `pulse` och `msgIn`. |

## kodregn-2026-10-05 (kodregnsreglaget borttaget ur sidhuvudet)

Flyttat från commit 3e682b3. Reglaget satt i `.nav-right` på tio sidor,
bredvid temaväxlaren, som är kvar.

| Fil | Vad |
|---|---|
| `kodregn.html` | Knappen `#matrixBtn` ur sidhuvudet och canvasen `#matrixRain` ur sidfoten, ordagrant. Blocken var identiska på alla tio sidor. |
| `kodregn.js` | Modulen "Kodregn" ur `scripts.js`. Ingen annan modul anropade den eller läste `aim-matrix`. |
| `kodregn.css` | `.matrix-toggle` och `.matrix-rain` ur `styles.css`. Två selektorer satt i delade listor (reducerad rörelse och tryckåterkoppling) och står här som egna regler. |

Integritetspolicyns punkt om `aim-matrix` i `localStorage` togs bort samtidigt.
Besökare som slagit på regnet har nyckeln kvar i sin webbläsare. Ingen kod läser den längre.

## webbdesign-2026-10-06 (paketaffären borttagen, /webbdesign/ blev Projektleverans)

Flyttat från commit bc11238. Adressen `/webbdesign/` är kvar med ny sida och
ny text. Menypunkten heter nu Projektleverans på alla sidor.

| Fil | Vad |
|---|---|
| `index.html` | Hela den gamla `/webbdesign/` med kalkylatorn, paketkorten Starter, Business och Premium, paketmodalen, före/efter-reglaget, process-pipelinen och löftet om tio dagar, flyttad med `git mv`. |
| `moduler.js` | Fyra moduler ur `scripts.js` som bara hade element på den sidan: Before/After, Pricing calculator, Paket-modal (med paketdatan `PKG`, `ADDONS` och knappen "Boka det här paketet") och Process pipeline. `FOKUSERBARA` och `fokusfalla()` ligger kvar i `scripts.js`; mobilmenyn är nu enda anroparen. |
| `moduler.css` | Regler ur `styles.css` vars selektorer bara träffade de fyra komponenterna, plus keyframes `pkgSweep`, `orbRingPulse` och `particleFloatUp`. Utvalt med skript. `.price-card`, `.price-grid` och `.pop` ligger kvar: `/skotsel/` använder dem. |
