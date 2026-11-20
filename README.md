# Type Lab

The repository, package and deployment keep the name `kern` (kern.sammii.dev).

A lab for designing and testing type systems with Google Fonts: browse every family by its real axes, pair a heading, body and mono face, build a fluid scale, see it in real interface previews, and export it as CSS, Tailwind v4, W3C design tokens or a font `<link>`.

```bash
nvm use           # Node 24
npm ci
npm run dev        # http://localhost:3000
npm test           # icon regressions and unit tests (Vitest)
npm run lint      # source icon gate and ESLint
npm run typecheck # strict TypeScript
npm run test:e2e   # Playwright smoke tests (uses your installed Chrome)
```

## Pages

| Route | What it does |
| --- | --- |
| `/` Browse | Search about 1,840 Latin families; filter by category, variable and has-opsz. Picking one loads it in full with axis sliders generated from its metadata. |
| `/pairing` | Heading, body and mono roles. Suggestions weigh category contrast, a curated list and measured x-heights, and explain themselves. Article, dashboard, pricing and form previews in the chosen system. Measured metrics and size-matched fallbacks. |
| `/type-scale` | Utopia-style fluid scale: a base and ratio for each viewport, per-step leading, tracking and opsz. |
| `/playground` | Tune each role's axes; glyphs move on a spring. Compare against any other family with linked axes. |
| `/specimen` | Specimen sheet for each role. |
| `/export` | CSS variables and step classes, Tailwind v4 `@theme`, DTCG tokens JSON, Google Fonts `<link>`. |

The whole system (families, axis values, scale, heading step) is in the query string, and nav links carry it between pages, so any URL reproduces the state exactly.

## How it works

**Catalogue.** `app/api/fonts` proxies `https://fonts.google.com/metadata/fonts` (no key, no CORS, about 2.7MB, `no-store`), slims it to about 300KB (`lib/catalogue/slim.ts`) and caches the slim copy in memory and at the CDN. If the endpoint fails it tries the official Developer API, using `GOOGLE_FONTS_API_KEY` from the server environment, then the bundled `data/fonts-snapshot.json`. Set `KERN_FONTS_SOURCE=snapshot` to skip the network (the e2e tests do). Refresh the snapshot with `npx tsx scripts/build-snapshot.ts`.

**Loading.** Fonts load on demand through the css2 API with their axis ranges (`lib/css2.ts`, `lib/font-loader.ts`). Thumbnails fetch a `text=` subset and register it under an alias with the FontFace API, so a static subset never shadows the variable face.

**Metrics.** `lib/metrics.ts` measures x-height, cap height, ascent, descent and letter-frequency-weighted average width with canvas, at the size each role is used. Fallbacks follow the next/font and Capsize approach: `size-adjust` from average width, then ascent and descent overrides divided by it.

**Scale.** `lib/scale.ts`: each step is `base × ratio^n` at both viewports, interpolated with `clamp()`. Leading is size plus half the base (body 1.5, display towards 1.1); tracking tightens 0.02em per doubling. Numbers stay unrounded until output.

**Motion.** `hooks/use-spring-variations.ts` integrates a damped spring per axis on `requestAnimationFrame` and writes `font-variation-settings` straight to the element. With `prefers-reduced-motion` the glyphs jump.

## Local verification

See [the 20 November quality receipt](docs/quality/type-lab-20261120.md) for the tested build, dependency changes, browser checks and their limits.
