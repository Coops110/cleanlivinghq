# Working on CleanLivingHQ

Engineering rules for this project. Content and marketing strategy is in
`CONTENT-PLAN.md`; the brief and decision history are in `PROJECT-BRIEF.md`.

Every rule below exists because getting it wrong costs something specific,
and the cost is stated. If a rule looks fussy, read the reason before
removing it.

---

## The three switches

Everything else is detail. These are in `src/lib/site.js` and each one gates a
lot of behaviour.

| Switch | Now | Flipping it |
|---|---|---|
| `LAUNCHED` | `false` | Every page sends `noindex, nofollow` and robots.txt disallows everything. Flip on launch day only. |
| `PRICES_CONFIRMED` | `false` | Prices render as "Price on release" and Product schema omits `offers`. Flip when real merchant pricing is in. |
| `GA_ID` | `''` | Empty means no gtag, no consent banner, no cookie-settings link, **and** the privacy and cookie pages render their no-cookies wording. |

**`LAUNCHED` is the important one.** Letting Google index a half-populated
affiliate site carrying placeholder prices earns a quality assessment you then
have to dig out of, and being re-crawled and re-evaluated after a bad first
impression is far slower than waiting a month.

**`GA_ID`'s coupling is deliberate.** It makes it impossible to ship a policy
claiming the site sets no cookies while it is setting them. Do not decouple it
to "just add analytics quickly".

**`PRICES_CONFIRMED` is not cosmetic.** Google checks a marked-up price against
the price the user actually lands on. A mismatch earns a manual action against
the site's rich results. Omitting `offers` is valid schema; a wrong `offers` is
a false claim.

---

## Verify, don't assert

Most of the ways this project could go wrong are invisible in a browser and
expensive in search. Three checks exist, and all three must pass:

```
npm run build        # then:
npm run check:links  # every internal link resolves against dist/
npm run check:seo    # titles, descriptions, headings, og:image, alt, rel
npm run verify       # all three in sequence
```

Plus the browser check, which needs a served build:

```
npm run build
cd dist && python3 -m http.server 4322 &
node scripts/check-browser.mjs http://127.0.0.1:4322
```

Current state, measured: **907 internal links, zero broken. 28 pages, zero SEO
problems. Longest title 48/60, longest description 146/155. All browser checks
pass.**

If a build's output is suppressed, the check is worthless. A build piped to
`Out-Null` on the sister site failed silently and the "verification" that
followed was reported as passing when it had never run. Run the check, then
say the number.

### Static checks are not enough

Two failure modes are invisible to grep and both have bitten this family of
sites:

**A visually-hidden heading that has fallen out of the accessibility tree** is
worse than the heading skip it was added to fix, and markup alone cannot tell
you which one you have. `locator.ariaSnapshot()` prints the real tree with
levels. (`page.accessibility` was removed from Playwright and no longer
exists.)

**Interactive things look perfect in HTML and are broken in a browser.** The
sister site's consent banner was flawless in the markup and invisible in a real
browser, because the reveal ran inside `requestAnimationFrame`, which is paused
in background tabs — while focus had already been moved into it. `curl` would
never have found that. This is why `ConsentBanner.astro` does not use rAF.

### Two false positives already caught in our own checks

Worth knowing, because both look like real bugs:

**`documentElement.scrollWidth` is a trap for overflow detection.** It reports
the unclipped extent of content inside a scroll container, so a correct
`<div class="table-scroll">` holding a wide table reads as a 317px page
overflow when nothing is wrong. `check-browser.mjs` instead asks the two
questions that matter: can the user scroll the page sideways, and is anything
overflowing that is *not* inside a scroll container?

**Measuring a control's own box understates its tap target.** A 20px radio
inside a 50px `<label>` has a 50px target, because tapping the label activates
it. That is what WCAG 2.5.8 counts. The check measures `el.closest('label')`.

---

## This site stands alone

`cleanlivinghq` is its own repository, its own Vercel project and its own
dependency tree. It shares nothing with RigFloorHQ or any other site.

**Keep it that way, and specifically: do not nest it inside another Astro
project.** It was originally built in a subfolder of the RigFloorHQ repo and
could not be made to build there. Astro turns on Vite's
`resolve.tsconfigPaths`, and Rolldown's Rust resolver then walks *up* the
filesystem parsing every `tsconfig.json` it finds, to collect `paths` aliases.
The parent project's config said `extends: "astro/tsconfigs/strict"`, which
cannot be resolved from a build rooted in a subfolder, and the build died with
`Tsconfig not found astro/tsconfigs/strict` before compiling a page.

Four contained workarounds were tried — pinning `resolve.tsconfigPaths: false`,
passing `tsconfig: false` through `build.rollupOptions`, pinning `oxc.tsconfig`,
and removing every `.ts` file from the project. Each moved the error to a
different consumer and none removed it. The walk-up is unconditional. If you
ever put this project inside another repository, expect to hit it again.

A useful consequence: there is **no TypeScript source** in this project. The
three files that were `.ts` (`content.config`, `robots.txt`, `llms.txt`) are
now `.js` and need no types. Keep it that way unless there is a real reason —
it is one fewer moving part.

## The site is category-agnostic. Keep it that way.

CleanLivingHQ sells cooling towels today. It will sell other things. **The
brand is the method — checking what is behind a claim — not the product.**

This is an architectural rule, not a style preference, and it is the one most
likely to get broken by someone in a hurry:

**Never put a product category in the homepage `h1`, `<title>` or meta
description.** The homepage says what the site *does*. `SITE.description` in
`src/lib/site.js` is the site's identity and feeds the Organization schema,
`llms.txt` and the homepage — it must survive adding a range without an edit.

**`SITE.liveCategory` names the range that is purchasable today.** The homepage
reads it and renders the live range from `CATEGORIES` and `PRODUCTS`. Launching
a second range is a change in `src/lib/products.js`, not a homepage rewrite.

**One block on the homepage is range-specific**: the explainer holding
`<CoolingDiagram>` and `<StepCards>`. It is fenced in its own `<section>` with a
comment saying so, because evaporative cooling has a mechanism worth drawing.
If the live range changes, that section is what gets swapped. Everything above
and below it is generic.

**The nav, footer, sitemap, `llms.txt` and the homepage all iterate
`CATEGORIES`.** Adding a range lights up the whole site. See "Adding a product
category" below for the five steps.

Where a page genuinely is about one range — `/cooling-towels`, its guides, its
products — be as specific as you like. The rule applies to the site's shared
surfaces, not to its content.

## Mobile first, without exception

Every base rule in `global.css` targets a 360px phone; every media query is
`min-width` and adds to it. There is not one `max-width` query in the file and
there should not be. The audience arrives from TikTok and Instagram, which
means a phone, in portrait, often on a poor connection.

Body text is 17px. 16 is the floor at which iOS stops zooming form fields; 17
buys readability outdoors, which is where this audience reads.

Any table wide enough to overflow must sit inside `.table-scroll`. **The page
body must never scroll sideways; the table may.**

---

## Colour

Ratios are measured, not guessed. `node scripts/contrast.mjs` prints every one,
checks each colour in the role it is actually used in, and exits non-zero on a
failure.

```
--ink          #0b1524   18.31 : 1   body text
--slate        #46586f    7.28 : 1   secondary text
--azure        #0b6ae0    5.06 : 1   links, headings, primary button
--azure-dark   #0a52ad    7.44 : 1   link hover
--flame        #c2410c    5.18 : 1   accent TEXT
--line-strong  #6f90bd    3.28 : 1   control borders (needs 3, not 4.5)
```

**Three fill-only colours.** These are bright on purpose and are never text on
a light background:

```
--zest   #ffc400   1.60 on paper  →  11.46 with --ink on top
--cyan   #22d3ee   1.81 on paper  →  10.13 with --ink on top
--coral  #ff5a1f   3.12 on paper  →   5.87 with --ink on top
```

Each is used as a **background with `--ink` on it**, or as a bright mark on the
dark hero. If you want an orange or yellow *word* on a light background, use
`--flame`. The contrast script asserts that all three still fail as text, so
this cannot drift unnoticed.

**The main call to action is `--zest` with an `--ink` label** — 11.46 : 1, the
highest-contrast pairing on the site, and deliberately hi-vis, which suits an
audience that works in it. **Never put white on `--zest` or `--cyan`**; those
are 1.60 and 1.81.

**Two border tokens, deliberately.** WCAG 1.4.11 governs boundaries a user must
perceive to *operate* something — input borders, focus rings, toggle state.
Decorative rules between cards are exempt. `--line` is decorative and subtle;
`--line-strong` is for form controls. **Never use `--line` on an input.**

The palette in `scripts/make-assets.py` and `public/favicon.svg` must be kept
in step with `global.css` by hand. Changing one and not the others is how a
brand ends up with a favicon from two redesigns ago.

## Heading order

Exactly one `h1` per page, no skipped levels, enforced by `check:seo` and
re-verified in the real accessibility tree by `check-browser.mjs`.

**Heading level is document structure, not a size picker.** If a heading looks
too big, restyle it in `global.css`. Do not drop a level to get smaller text.

**The footer's column headings are `h2`, deliberately.** They look like small
labels and the temptation is to make them `h4`. A heading check flags a jump
*down* the tree but never a step back up, so `h2` is the only level that is
safe after arbitrary page content. An `h3` here would skip on any page whose
own content stops at `h1`. Because the footer is on every page, one wrong level
fails the entire site at once.

**Index pages need a heading for their first card grid.** A `page-hero` `h1`
followed straight by a grid of `h3` cards is an `h1` → `h3` skip. Those
sections carry `<h2 class="sr-only">`.

`.sr-only` must stay a 1px clipped box. **Do not swap it for `display:none` or
`visibility:hidden`** — both drop the element from the accessibility tree,
which turns a visually-hidden section heading into no heading at all.

---

## Metadata

**`og:image` must be a raster.** Social scrapers refuse to render an SVG
`og:image` — you get a valid-looking tag and a blank preview, which is worse
than the generic fallback. `BaseLayout` and the guide route both fall back to
the PNG unless the declared image is `.png`, `.jpg` or `.webp`. `check:seo`
enforces it.

**Check that declared assets exist.** `favicon.svg` was referenced on every
page and did not exist until `check:links` found it. On the sister site,
`og-default.png`, `favicon.ico` and `apple-touch-icon.png` were all referenced
and all missing, so every share anywhere rendered with no image.

All raster assets are generated by `python3 scripts/make-assets.py` — there is
no PIL, ImageMagick or sharp on the build box, so it writes PNGs directly with
`zlib` and `struct`. The bitmap font raises on a missing glyph rather than
rendering a blank: the first version had no `W` or `F` and shipped an og:image
reading "COOL DO N. ... CARED OR HORSES.", which looked like a kerning quirk
rather than a bug.

**FAQ structured data must match visible body content.** `BaseLayout`'s `faq`
prop and the `<FaqList>` component render from the *same array*, so they
physically cannot drift. Marking up questions that are not on the page is a
structured data violation, not a shortcut.

**Titles are length-budgeted.** `BaseLayout` appends `" | CleanLivingHQ"` — 16
characters — and Google truncates around 60. **Keep page titles to about 42.**
A title cut mid-phrase never displays the targeting it was written for.
Descriptions truncate near 155. Both are enforced.

**Do not put UTM parameters on internal links.** They belong on inbound URLs
only — a UTM on an internal link starts a new GA4 session and destroys the
attribution it was added to collect.

---

## Affiliate links

**Always use `<AffiliateLink>`.** Never hand-write an outbound `<a>`. It
guarantees three things a hand-written link does not:

1. `rel="sponsored nofollow noopener"`. `sponsored` is Google's required
   attribute for commission links; omitting it on a monetised site is a
   link-scheme problem.
2. A sub-id built from the page path, so the affiliate dashboard shows *which
   page* earned each click. Without it every conversion looks like it came from
   the homepage and you cannot tell what is working.
3. `target="_blank"` with the security `rel`.

**`<Disclosure />` goes ABOVE the first affiliate link on any page carrying
one.** Both the FTC Endorsement Guides and ASA/CAP require the disclosure at
the point of recommendation, before the link. A footer line does not satisfy
either regulator, and the ASA has ruled specifically that a link or code on its
own is not adequate labelling. `check:seo` fails a page with an affiliate link
and no visible disclosure.

---

## Publishing

**Ship a new page and its inbound links in the same commit.** Two editorial
links minimum, in body content, from genuinely related pages.

To be exact about the ordering, because it matters: the new page and the links
pointing at it go into **one build and one deploy**. There is never a moment
where a link is live and its target is not. Adding links to a page that does
not exist yet would produce 404s and is not what this says.

The failure this prevents is the opposite one — a page going live with nothing
pointing at it. On the sister site every blog post had exactly one inbound
link, the blog index, so four posts of 2,200+ words earned nothing at all.

Pillar pages generate their cluster list from frontmatter, so a new guide gains
an inbound link automatically. That is why `pillar` is required, not optional,
in `src/content.config.ts`.

### Adding a product category

The site is built to absorb a new range without a rebuild. `CATEGORIES` in
`src/lib/products.js` is a map, and nav, footer, homepage, sitemap and
`llms.txt` all iterate it. Adding one is five steps:

1. An entry in `CATEGORIES`
2. Its products in `PRODUCTS`, `status: 'coming-soon'` until they can be bought
3. The pillar key added to the enum in `src/content.config.ts`
4. One nav entry in `src/components/Nav.astro`
5. A pillar page at `src/pages/<slug>.astro`

An equine range was built this way and then removed at the operator's request —
see `PROJECT-BRIEF.md`. Removing it touched exactly those five places, which is
the check that the abstraction holds.

**Do not ship a thin category page to "reserve" a slot.** A speculative page
with nothing behind it damages a young domain more than an absent one does.
Products carry `status: 'coming-soon'`, which is a different thing: a real page
about a real product that is not purchasable yet.

Before committing, run `npm run verify`.

---

## Sitemap lastmod comes from git, and must stay that way

`scripts/git-lastmod.mjs` reads one `git log` pass and gives each URL the date
of the last commit touching **its own source file**.

**Do not replace this with file mtime.** Vercel clones the repo fresh for every
deploy, so every file carries the same checkout timestamp and every URL would
claim it changed on every build. Google learns to discount a sitemap that does
that — across the whole domain, not just the URLs that lied. No lastmod is
better than a wrong one.

Editing `BaseLayout`, `Nav`, `Footer` or `global.css` deliberately bumps
**nothing**, because no page's own source changed. A styling fix is not a
content update.

Guides resolve to `src/content/blog/<slug>.md`, not to `[slug].astro`, so
fixing one guide does not restamp all seven.

Every build prints `N/M sitemap URLs have lastmod`. If that number drops, a
route was added whose source path the candidate list does not cover — extend
`sourceCandidates`, do not paper over it with a default date.

---

## Response headers

`vercel.json` sets them.

The CSP is `object-src 'none'; base-uri 'none'; frame-ancestors 'self'` and
deliberately has **no `script-src`**. The consent and Consent Mode blocks are
inline by necessity — the `consent default` command has to reach `dataLayer`
before `gtag.js` loads — so any `script-src` without matching hashes or a nonce
would break the cookie banner and silently take consent handling with it. Add
one only with hashes, and only after testing the banner in a real browser.

**`/images/` is `max-age=3600, must-revalidate`, not `immutable`.** The
filenames are not content-hashed and every image is currently a placeholder
that *will* be replaced. Serving them `immutable` for a year would freeze the
placeholders in every visitor's cache. `/_astro/` is hashed and is `immutable`.

---

## Analytics

Never add analytics by pasting Google's snippet. It calls `gtag('config')`
immediately and would set cookies before the visitor is asked, which is what UK
PECR and EU ePrivacy actually prohibit. The block in `BaseLayout` denies every
storage type by default and only updates after consent.

---

## Hostname

Non-`www` everywhere — `astro.config.mjs` `site`, every canonical, the sitemap
and robots.txt. Do not introduce a `www` variant. A site answering on both
hostnames splits its own signals, and inspecting the `www` host in Search
Console will return "URL is unknown to Google", which is the expected answer
for a hostname the site never uses, not a finding.

---

## Launch checklist

Nothing here is optional, and `LAUNCHED` stays `false` until all of it is done.

- [ ] Buy `cleanlivinghq.com` and point the Vercel project at it
- [ ] Confirm the affiliate account is approved; set `MERCHANTS.smarttowel.tracking.ref` and `active: true`
- [ ] Verify every `verify:` comment in `src/lib/products.js` against the live merchant store — product URLs, sizes, materials, pack contents
- [ ] Replace all six placeholder images in `public/images/`
- [ ] Set real pricing, then flip `PRICES_CONFIRMED`
- [ ] Fill in `LEGAL.address` or confirm it is deliberately blank; confirm `entityType` and `governingLaw`
- [ ] Set up `hello@cleanlivinghq.com` and confirm it is monitored — there is a one-month deadline to answer a data subject request sent there
- [ ] Claim `@cleanlivinghq` on TikTok, Instagram and Facebook
- [ ] Set `GA_ID`, then test the consent banner in a real browser
- [ ] `npm run verify` and `node scripts/check-browser.mjs` both clean
- [ ] Flip `LAUNCHED` to `true`, deploy, confirm robots.txt opened
- [ ] Submit the sitemap in Search Console against the **bare** domain
