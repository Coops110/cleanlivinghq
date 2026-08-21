// ─────────────────────────────────────────────────────────────
//  PRODUCT CATALOGUE
//
//  Every price is a PLACEHOLDER and every image is a generated
//  placeholder graphic. Nothing renders as a real number until
//  PRICES_CONFIRMED flips in site.js — see the comment on that
//  switch for why invented Offer data is a structured-data
//  problem and not merely a cosmetic one.
//
//  SOURCE OF TRUTH FOR THE MERCHANT RANGE: smarttowel.shop.
//  That host is blocked by this environment's network egress
//  allowlist, so the range below is modelled from the operator's
//  screenshot of the storefront — one cooling towel plus bundles,
//  with "Bundles & Savings", "Wholesale" and "Affiliate" in the
//  footer. EVERY field marked `verify:` must be checked against
//  the live store before launch.
//
//  `status` drives the whole UI:
//    'available'   → affiliate CTA, appears in comparison + finder
//    'coming-soon' → waitlist CTA, no affiliate link, no Offer schema
// ─────────────────────────────────────────────────────────────

// CATEGORIES is a map, not a hard-coded list, precisely so a new range can be
// added without touching a single page. Nav, footer, homepage, sitemap and
// llms.txt all iterate it. An equine range is planned and was deliberately
// REMOVED rather than left half-written — see PROJECT-BRIEF.md. Adding it back
// is: one entry here, its products below, 'horse' in the content.config.ts
// pillar enum, and one nav entry.
export const CATEGORIES = {
  cooling: {
    slug: 'cooling',
    name: 'Cooling Towels',
    short: 'Cooling towels',
    href: '/cooling-towels',
    blurb:
      'Evaporative cooling towels for heat: how the physics actually works, how long the cooling really lasts, and why PVA and microfibre are not the same purchase.',
    // The mechanism here is real and measurable, which is unusual in this
    // corner of the market. That is the site's whole advantage — we can be
    // specific instead of hedging.
    honesty:
      'Evaporative cooling is straightforward physics, not a proprietary technology: water leaving the fabric carries heat with it. Any claim beyond that — a fixed number of degrees, a fixed number of hours — depends entirely on air temperature, humidity and airflow, and no towel can promise it.',
  },
  skin: {
    slug: 'skin',
    name: 'Organic Skin & Body Care',
    short: 'Skin',
    href: '/skin',
    blurb:
      'Balms, butters and creams built on short ingredient lists — for skin that spends its day outdoors, in heat, wind and sun.',
    honesty:
      '"Natural" and "organic" are not the same word, and only one of them is regulated. We name the certifying body rather than repeating the adjective.',
  },
};

export const PRODUCTS = [
  // ── Cooling towels (live affiliate line) ───────────────────
  {
    slug: 'cooling-towel',
    name: 'Smart Cooling Towel',
    category: 'cooling',
    merchant: 'smarttowel',
    merchantPath: '/products/cooling-towel',   // verify: real product URL
    status: 'available',
    image: '/images/towel-bath.png',
    imageAlt: 'Placeholder graphic representing the single cooling towel',
    price: { gbp: 19.99, usd: 24.99 },         // verify: real pricing
    summary:
      'The single towel. Wet it, wring it out hard, snap it through the air — the snap is what brings water to the surface and starts the evaporation.',
    material: 'PVA',                            // verify: PVA or microfibre
    size: '90 × 30 cm / 35 × 12 in',            // verify
    coolingMinutes: 120,                        // verify: manufacturer figure
    packSize: 1,
    dryFeel: 'stiff',
    bestFor: ['outdoor-work', 'gym', 'running', 'hot-flushes', 'travel'],
    features: [
      'Activated by wetting and snapping — no refrigeration, no chemicals, no gel',
      'Re-activates as many times as you like by re-wetting; nothing is consumed',
      'Long enough to wrap a neck, which is where cooling a person actually works best',
    ],
    caveats: [
      'Evaporative cooling weakens as humidity rises. In humid heat it will underperform what you saw in a dry-climate demo video.',
      'PVA dries stiff and board-like. That is normal for the material, not a fault, but it has to be re-wet before it will fold.',
    ],
  },
  {
    slug: 'cooling-towel-2-pack',
    name: 'Cooling Towel 2-Pack',
    category: 'cooling',
    merchant: 'smarttowel',
    merchantPath: '/products/2-pack',
    status: 'available',
    image: '/images/towel-hand.png',
    imageAlt: 'Placeholder graphic representing the two-pack of cooling towels',
    price: { gbp: 34.99, usd: 43.99 },
    summary:
      'Two towels, which is the honest minimum for a working day — one on you, one soaking in a cool box ready to swap in.',
    material: 'PVA',
    size: '2 × 90 × 30 cm',
    coolingMinutes: 120,
    packSize: 2,
    dryFeel: 'stiff',
    bestFor: ['outdoor-work', 'sport', 'events', 'travel'],
    features: [
      'The rotation that actually keeps you cool across a full shift',
      'Cheaper per towel than buying two singles',
    ],
    caveats: [
      'Only a saving if you would genuinely use two. One towel re-wet at a tap works fine for shorter sessions.',
    ],
  },
  {
    slug: 'cooling-towel-4-pack',
    name: 'Cooling Towel 4-Pack',
    category: 'cooling',
    merchant: 'smarttowel',
    merchantPath: '/products/4-pack',
    status: 'available',
    image: '/images/towel-set.png',
    imageAlt: 'Placeholder graphic representing the four-pack of cooling towels',
    price: { gbp: 59.99, usd: 74.99 },
    summary:
      'The bundle that makes sense for a crew, a family or a yard — the per-towel price drops far enough that sharing one stops being worth the argument.',
    material: 'PVA',
    size: '4 × 90 × 30 cm',
    coolingMinutes: 120,
    packSize: 4,
    dryFeel: 'stiff',
    bestFor: ['outdoor-work', 'crew', 'family', 'events'],
    features: [
      'Lowest cost per towel in the range',
      'Enough to keep a small team supplied through a heatwave shift',
    ],
    caveats: [
      'Check the per-towel maths against the 2-pack before assuming the bigger bundle wins.',
    ],
  },
  {
    slug: 'cooling-towel-workwear',
    name: 'Hi-Vis Work Cooling Towel',
    category: 'cooling',
    merchant: 'smarttowel',
    merchantPath: '/products/hi-vis',           // verify: does this variant exist?
    status: 'available',
    image: '/images/towel-gym.png',
    imageAlt: 'Placeholder graphic representing the hi-vis work cooling towel',
    price: { gbp: 22.99, usd: 28.99 },
    summary:
      'The high-visibility colourway, for sites where anything worn on the neck or under a hard hat has to not compromise your visibility.',
    material: 'PVA',
    size: '90 × 30 cm',
    coolingMinutes: 120,
    packSize: 1,
    dryFeel: 'stiff',
    bestFor: ['outdoor-work', 'construction', 'crew'],
    features: [
      'High-visibility colour, so it does not work against your PPE',
      'Sized to fold under a hard-hat harness or sit flat inside a collar',
    ],
    caveats: [
      'A hi-vis colour is not the same as certified hi-vis PPE. Check your site rules — this does not replace a compliant vest.',
    ],
  },

  // ── Skin (announced, not yet stocked) ──────────────────────
  {
    slug: 'after-sun-balm',
    name: 'Organic After-Sun Balm',
    category: 'skin',
    merchant: null,
    status: 'coming-soon',
    image: '/images/cream-body.png',
    imageAlt: 'Placeholder graphic representing the organic after-sun balm',
    price: { gbp: 0, usd: 0 },
    summary:
      'For skin that has had a long day in the sun and wind. Full INCI list and the certifying body published before any buy link goes up.',
    material: null,
    bestFor: ['sun-exposed', 'dry-skin', 'outdoor-work'],
    features: [
      'Full ingredient list on arrival, not a marketing summary',
      'Certification named specifically — the certifier, not the word "organic"',
    ],
    caveats: [
      'Not yet available. Nothing here is a recommendation until we have it in hand.',
      'After-sun soothes; it does not treat a burn. Blistering or widespread burn needs a pharmacist or doctor.',
    ],
  },
  {
    slug: 'hand-balm',
    name: 'Organic Hand Balm',
    category: 'skin',
    merchant: null,
    status: 'coming-soon',
    image: '/images/cream-hand.png',
    imageAlt: 'Placeholder graphic representing the organic hand balm',
    price: { gbp: 0, usd: 0 },
    summary:
      'An anhydrous balm — no water, so no preservative system is needed. That is the whole reason balms have shorter ingredient lists than creams.',
    material: null,
    bestFor: ['cracked-hands', 'outdoor-work', 'dry-skin'],
    features: [
      'Anhydrous formulation, so a preservative is not required',
      'Aimed at hands that get wet, cold and dirty repeatedly',
    ],
    caveats: ['Not yet available.'],
  },

];

// ── Lookups ─────────────────────────────────────────────────
export const byCategory = (slug) => PRODUCTS.filter((p) => p.category === slug);
export const bySlug = (slug) => PRODUCTS.find((p) => p.slug === slug);
export const available = () => PRODUCTS.filter((p) => p.status === 'available');

// Labels for `bestFor` tags, used by the finder and the comparison table.
export const NEED_LABELS = {
  'outdoor-work': 'Outdoor work',
  construction: 'Construction site',
  crew: 'A whole crew',
  gym: 'Gym',
  running: 'Running or cycling',
  sport: 'Sport',
  events: 'Festivals and events',
  travel: 'Travel',
  family: 'Family',
  'hot-flushes': 'Hot flushes',
  'hot-weather': 'Hot weather',
  'sun-exposed': 'Sun-exposed skin',
  'dry-skin': 'Dry skin',
  'cracked-hands': 'Cracked hands',
};
