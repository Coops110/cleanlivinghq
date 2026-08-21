# CleanLivingHQ — brief and decision record

Written so nobody has to re-derive any of this, and so no future session
repeats a decision that has already been made and reversed.

Engineering rules: `CLAUDE.md`. Content and marketing: `CONTENT-PLAN.md`.

---

## The brief, as given

> I will be making another website. It must be mobile first, on Astro, fully
> SEO compliant to rank in Google and LLMs, using all meta tags and h1, h2
> headers etc. Must have About Us, T&Cs etc. Look at smarttowel.shop — I will
> be an affiliate for them. But can't go live for about a month. Populate the
> website and think of a name. I don't want you to copy it in any bit but come
> up with a fully interactive site. You can use photos and pricing as a
> placeholder until I get the correct details. I will also be expanding the
> products on the site when they are available. Will be things like organic
> creams and can even use some on horses, so put this in your thinking. This is
> why I don't want a name to do with the towel, as there will be more stuff.
> Towels are not fully organic so don't fall into that trap. Look at
> competitors for keywords etc and Google Ads. This site has to rank. Add
> pillar pages so I can add blogs to bring traffic. If you have a good idea let
> me know. I will also want to hammer TikTok and FB and Instagram. Add this
> chat to a .md so no mistakes are made.

Follow-ups, in order:

1. *"A .com. I don't like those names."* — first four name suggestions
   rejected; `.com` required.
2. *"https://smarttowel.shop/ try again with chrome"* — the merchant domain was
   corrected (it is **smart**towel, not smartowel).
3. Screenshot of the storefront supplied after the domain proved unreachable.
4. *"This has to be better, don't copy the colour scheme but make sure it is
   much better."*
5. *"Forget other horse pages, don't have the info yet — was for your
   information as the sites will expand. Take out of logo for now, concentrate
   on the cooling towel but keep site generic for expansion."*

---

## Decisions made, and why

### Name: CleanLivingHQ (cleanlivinghq.com)

Chosen from a shortlist after four earlier suggestions were rejected. It
matches the operator's existing naming pattern (RigFloorHQ, AirProHQ), the
`.com` was available at ~$11/yr, and — the deciding factor — **"clean" is not a
purity claim**. It covers hygiene, clean-beauty and general wellness without
ever asserting that anything on the site is organic, which is the trap the
brief specifically warned about.

Rejected: WilderKept, PurelyKept, HonestCoat, CoatAndCloth (disliked);
SkinAndCoatHQ, NaturalCareHQ, PureLivingHQ (the last two bake a purity claim
into the brand name).

### The product is a COOLING towel, not an antibacterial one

**This was initially got wrong and it is the most important correction in the
project.** The first build assumed silver-fibre antibacterial towels and the
whole towels pillar was written around debunking "99.9%" claims.

The operator's screenshot showed otherwise: *"The World's Smartest Towel"*,
wet-wring-snap activation copy, and hi-vis workwear imagery. It is an
**evaporative cooling towel** aimed at outdoor workers. Everything was
rewritten.

This is a better business than the original assumption, because evaporative
cooling is real, measurable physics. The site does not have to debunk anything;
it can explain a genuine mechanism and be specific about its limits.

### Colour: deep navy, ocean blue, coral

The merchant's site is charcoal with neon-green accents. The brief was
explicitly not to copy it. The first palette here was deep green on near-black —
too close — so it was replaced.

Every value is measured by `node scripts/contrast.mjs`, not eyeballed. Full
ratios are in `CLAUDE.md`.

### The site is generic; only the range is specific

The brief was explicit: no towel-named site, because more product lines are
coming. The name was chosen for that, and then the homepage was initially
written as a cooling-towel pitch anyway — which would have needed rewriting the
moment a second range launched. That was corrected.

The homepage now leads with what the site does, and renders the live range from
`SITE.liveCategory`. Adding a range is a change in `src/lib/products.js`.
See `CLAUDE.md`, "The site is category-agnostic".

### Horse content: built, then removed

An equine pillar, an equine product line and an equine mode in the heat
calculator were all built, then **deliberately removed** at the operator's
request — the information is not confirmed yet and the site should concentrate
on cooling towels.

**It was removed rather than left half-written**, because a thin, speculative
category page damages a young domain more than an absent one does.

The architecture is unchanged and still generic. Bringing it back is:

1. One entry in `CATEGORIES` in `src/lib/products.js`
2. Its products in the same file
3. `'horse'` added to the pillar enum in `src/content.config.ts`
4. One nav entry in `src/components/Nav.astro`
5. A pillar page at `src/pages/horse.astro`

Nav, footer, homepage, sitemap and `llms.txt` all iterate `CATEGORIES`, so
steps 1–4 light up the whole site automatically.

The equine research is not lost — the guide plan in `CONTENT-PLAN.md` keeps the
mud fever, sweet itch and rain scald cluster, and the reasoning for why it is
the right *seasonal* hedge (those queries peak in autumn and winter, exactly
when cooling traffic dies).

### Tagline names no category

`SITE.tagline` is **"Tested properly. Explained plainly."** The previous version
named product categories and had to be rewritten the moment one was removed.
This one survives every expansion.

---

## What is placeholder and must be replaced

Everything in this list is marked in the code. The launch checklist in
`CLAUDE.md` is the authoritative version.

| Thing | Where | State |
|---|---|---|
| Prices | `src/lib/products.js` | Invented. Gated behind `PRICES_CONFIRMED`, so nothing renders as a number and no `offers` schema is emitted. |
| Product images | `public/images/` | Generated placeholder graphics that deliberately look like placeholders. |
| Merchant product URLs, sizes, materials, pack contents | `src/lib/products.js` | Marked `verify:`. Modelled from a screenshot, not from the live store. |
| Affiliate tracking ref | `MERCHANTS.smarttowel.tracking.ref` | `REPLACE_ME`. |
| Legal identity | `LEGAL` in `src/lib/site.js` | Carried over from the operator's other sites as a starting point. Not verified for this one. |
| Contact address | `SITE.email` | `hello@cleanlivinghq.com` — mailbox does not exist yet. |
| Social handles | `SOCIAL` | `@cleanlivinghq` — not yet claimed on any platform. |

---

## What could not be verified, and why

**The merchant site was never read directly.** `smarttowel.shop` is blocked by
this environment's network egress allowlist:

```
HTTP/2 403   x-deny-reason: host_not_allowed
Host not in allowlist: smarttowel.shop.
```

That block sits at the network layer, so it applied to the fetch tool, to
`curl` with the local proxy bypassed, and would apply equally to Chromium.
There is no client-side workaround. Adding `smarttowel.shop` to the
environment's network egress settings would lift it.

Everything about the merchant's range therefore comes from the operator's
screenshot and is marked `verify:` in the catalogue.

**Two of the site's own checks produced false positives** that were
investigated and turned out to be defects in the checks, not the site. Both are
documented in `CLAUDE.md` so nobody re-"fixes" working code:
`documentElement.scrollWidth` misreporting scroll-container content as page
overflow, and tap targets measured on the control rather than its wrapping
`<label>`.

**One heat-index reference value quoted from memory was wrong.** The
implementation matches the published NWS chart (84°F/100% → 103°F chart,
103.6°F calculated); the "expected" figure used to test it was the error.

---

## Why this is its own repository

It was first built in a subfolder of the RigFloorHQ repo, because that was the
only repository available at the time. It could not be made to build there.

Astro enables Vite's `resolve.tsconfigPaths`, and Rolldown's resolver then
walks up the filesystem parsing every `tsconfig.json` it finds. RigFloorHQ's
config extends `astro/tsconfigs/strict`, which cannot be resolved from a build
rooted in a subfolder — so the build failed before compiling a page, and would
have failed on Vercel too.

Four workarounds contained entirely within this project were tried and none
worked; each moved the error to a different consumer. The only two real options
were editing RigFloorHQ's `tsconfig.json` or separating the projects. **The
operator chose separation, and RigFloorHQ was left completely untouched.**

One side effect worth keeping: this project has **no TypeScript source**. The
three `.ts` files became `.js` during that investigation and stayed that way.

## Verified state at handover

Measured, not asserted:

- **28 pages** build clean, **28/28 sitemap URLs carry a lastmod**
- **907 internal links, 0 broken, 0 missing anchor targets**
- **0 SEO problems** across 28 pages; longest title 48/60, longest description
  146/155
- **All browser checks pass** at 360px: no sideways scroll on any page, exactly
  one `h1` and no skipped heading levels in the real accessibility tree,
  `sr-only` heading confirmed present and clipped to 1×1px, nav disclosure and
  Escape working, calculator correct against NWS reference values, finder and
  sortable table working, affiliate `rel` and per-page sub-id correct,
  disclosure confirmed *above* the first affiliate link, no JavaScript errors
- **Contrast**: every text token passes AA, measured

---

## Open questions for the operator

1. **`smarttowel.shop` egress.** Unblock it and the catalogue can be verified
   against the real store rather than a screenshot.
2. **Legal identity.** `LEGAL` needs confirming — entity type, whether to
   publish an address, and governing law (currently England and Wales, which
   differs from RigFloorHQ's Thailand).
3. **Should the skincare pillar stay?** It was kept because organic creams were
   explicitly named in the brief as the next range. If the preference is a pure
   cooling-towel site at launch, `/skin` and its two `/soon/` pages come out the
   same way the horse pages did.
5. **Does the hi-vis colourway exist?** Marked `verify:`, inferred from the
   workwear imagery in the screenshot.
6. **Southern-hemisphere market.** If Australia is a target, AUD needs adding to
   `CURRENCIES` — their season starts in December, which is exactly when UK and
   US cooling traffic dies.
