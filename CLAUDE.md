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

## Mät, gissa inte

Playwright MCP är installerad. Använd den.
- Kontrast mäts i webbläsaren mot den faktiskt målade bakgrunden, i BÅDA teman.
- Att en sida finns är inte samma sak som att den har innehåll. Öppna den.
- Ligger fliken i bakgrunden är visibilityState "hidden". Då mäter sidor noll
  tecken, fördröjda bilder byts aldrig in och CSS-transitioner står frusna.
  Kontrollera flikens tillstånd innan tomhet eller fel rapporteras.

## Design

Sajten ska andas. Emil Kowalskis skills är installerade globalt.
Använd `animate` vid ny rörelse, `find-animation-opportunities` för att hitta
ställen som saknar den, och `improve-animations` för att granska helheten.
