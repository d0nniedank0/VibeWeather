# 🌤️ VibeWeather

*No degrees. Only vibes.*

A weather app that never tells you the temperature. Real weather, translated into vibes — rendered as a WPA travel poster that repaints itself with the sky's current mood.

**Live site:** https://vibeweather.pages.dev

---

## How it works

Open the poster, and the conditions get translated:

- **The headline** — a composed vibe from a 45-combo condition × temperature matrix, with random variants, so two people in the same city can get different (equally true) headlines: *"The sky is playing peekaboo with the sun. It's winning."*
- **The palette** — the entire poster repaints with the real conditions: clear ochre, rain slate, fog milky, thunderstorm storm-gray, plus desert-amber heat and ice-blue cold overrides
- **The details** — sky, wind, humidity, and precipitation each get their own literary readout (*"The air has joined a union and refuses to move."*)
- **For the nerds** — the actual °C and feels-like, in fine print, because we know — we just won't say it
- **Copy Vibe** — share the report as text

## Data & privacy

Powered by [Open-Meteo](https://open-meteo.com) — free, no API key, no signup, called directly from the browser. Location only ever leaves your device to ask the weather API about itself. No servers, no tracking, no cost.

## Development

Single self-contained `index.html` — inline CSS + JS, zero build step, zero runtime dependencies (fonts aside). The vibe engine is DOM-free and unit-tested.

```bash
# engine tests (bands, boundaries, matrix coverage, palettes)
node test/engine.test.js
# UI tests (jsdom with stubbed fetch/geolocation: chips, search, errors, copy)
node test/ui.test.js
```

Stack: vanilla HTML/CSS/JS · Anton + Courier Prime · Open-Meteo · Cloudflare Pages.
