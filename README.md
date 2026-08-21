# CleanLivingHQ

Affiliate site for evaporative cooling towels, built on Astro. Mobile-first,
statically generated, no client framework.

**Status: pre-launch.** Every page sends `noindex` and robots.txt disallows
everything until `LAUNCHED` is flipped in `src/lib/site.js`.

## Quick start

```bash
npm install
npm run dev          # http://localhost:4321
```

## Verifying

Never ship without these. If a build's output is suppressed, the check is
worthless — run them and read the numbers.

```bash
npm run verify       # build + link check + SEO check

# Browser checks need a served build:
npm run build
(cd dist && python3 -m http.server 4322 &)
node scripts/check-browser.mjs http://127.0.0.1:4322

node scripts/contrast.mjs        # WCAG ratios for every palette token
python3 scripts/make-assets.py   # regenerate favicons, og:image, placeholders
```

Last measured: 28 pages, 28/28 sitemap URLs dated, 907 internal links, 0
broken, 0 SEO problems, all browser checks passing.

## Where things are

| Path | What |
|---|---|
| `src/lib/site.js` | **Start here.** Brand, legal, merchant, and the three switches that gate everything. |
| `src/lib/products.js` | The catalogue. All pricing is placeholder. |
| `src/layouts/BaseLayout.astro` | The whole `<head>`: meta, canonical, robots, Open Graph, JSON-LD. |
| `src/content/blog/` | Guides. Frontmatter must declare a `pillar`. |
| `src/pages/tools/` | The interactive tools. |
| `scripts/` | Asset generation and the four verification scripts. |

## Documentation

- **`CLAUDE.md`** — engineering rules. Read before changing anything; each rule
  states what it costs to get wrong.
- **`CONTENT-PLAN.md`** — SEO strategy, guide backlog, social and ads plan.
- **`PROJECT-BRIEF.md`** — the brief, every decision made, and what is still
  placeholder.

## Deploying

Vercel, pointed at this repository root. No Root Directory setting, no build
command overrides — `vercel.json` carries the config.

**Do not nest this project inside another repository.** `CLAUDE.md` explains
why (Astro's bundler walks up the filesystem parsing every `tsconfig.json` it
finds, which breaks the build in ways that cannot be worked around from
inside).
