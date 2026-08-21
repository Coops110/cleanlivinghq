// ─────────────────────────────────────────────────────────────
//  SITE, LEGAL, MERCHANT AND PRODUCT CONFIG
//
//  One file. Every page reads from it, so a value changed here
//  changes everywhere it appears — including the legal pages,
//  which name you as the data controller and must match reality.
//
//  Read the three switches at the top before doing anything else:
//  LAUNCHED, PRICES_CONFIRMED and GA_ID each gate a lot of
//  behaviour, deliberately.
// ─────────────────────────────────────────────────────────────

// ── SWITCH 1: LAUNCH ────────────────────────────────────────
// FALSE until the site genuinely goes live (~late September 2026).
//
// While false, every page sends `noindex, nofollow`, robots.txt
// disallows everything, and the sitemap is not advertised. This is
// deliberate and it matters: letting Google index a half-populated
// affiliate site carrying placeholder prices earns a quality
// assessment you then have to dig out of. Getting re-crawled and
// re-evaluated after a bad first impression is far slower than
// waiting.
//
// Flip to true ON LAUNCH DAY, and only once the checklist in
// CLAUDE.md ("Launch") is fully ticked.
export const LAUNCHED = false;

// ── SWITCH 2: PRICING ───────────────────────────────────────
// FALSE while PRODUCTS carries placeholder pricing.
//
// While false: prices render as "Price on release" instead of a
// number, and Product structured data is emitted WITHOUT an
// `offers` block.
//
// That second part is the important one. Publishing schema.org
// Offer data containing invented prices is a structured-data
// violation — Google checks the marked-up price against the price
// a user sees at the merchant, and a mismatch earns a manual
// action against rich results. Omitting `offers` is valid schema;
// a wrong `offers` is not.
export const PRICES_CONFIRMED = false;

// ── SWITCH 3: ANALYTICS ─────────────────────────────────────
// GA4 measurement ID, format G-XXXXXXXXXX. Admin → Data streams →
// your web stream → "MEASUREMENT ID".
//
// LEAVE EMPTY TO DISABLE. Everything downstream is gated on it: no
// gtag, no consent banner, no "Cookie settings" footer link, and
// the privacy and cookie pages render their no-cookies wording.
// That coupling stops the published policy from describing a site
// you no longer run.
//
// Only injected in production builds, so `npm run dev` never
// reaches the property.
export const GA_ID = '';

export const SITE = {
  name: 'CleanLivingHQ',
  domain: 'https://cleanlivinghq.com',
  // Deliberately names no product category, so it survives every
  // expansion without another rewrite.
  tagline: 'Tested properly. Explained plainly.',
  // CATEGORY-AGNOSTIC ON PURPOSE. This string is the site's identity — it
  // feeds the Organization and WebSite schema, llms.txt and the homepage. It
  // must survive adding a product range without an edit. Say what the site
  // DOES, never what it currently sells.
  description:
    'Independent, evidence-first reviews and buying guides. We check what is behind a claim before we repeat it, and we say plainly when nobody has tested it.',
  // Published contact address. Use a forwarding alias so the destination
  // mailbox can change without editing any page, and make sure it is
  // genuinely monitored: there is a one-month deadline to answer a data
  // subject request sent here.
  email: 'hello@cleanlivinghq.com',
  locale: 'en',
  // Both markets from day one, so copy stays spelling-neutral where it can
  // and both currencies display together. See CLAUDE.md, "Two markets".
  markets: ['UK', 'US'],

  // The range that is actually purchasable today. The homepage reads this
  // rather than hard-coding "cooling towels" into its copy, so launching a
  // second range is a one-line change here, not a homepage rewrite.
  // See CLAUDE.md, "The homepage is category-agnostic".
  liveCategory: 'cooling',
};

export const SOCIAL = {
  tiktok: 'https://www.tiktok.com/@cleanlivinghq',
  instagram: 'https://www.instagram.com/cleanlivinghq',
  facebook: 'https://www.facebook.com/cleanlivinghq',
  // Handle reserved across all three so the brand is consistent. Claim these
  // before launch even if you post nothing — a squatted handle is expensive.
  handle: '@cleanlivinghq',
};

// ── Merchant / affiliate programme ──────────────────────────
// The affiliate relationship this site runs on. Everything user-facing about
// commission is generated from here, so the disclosure can never drift from
// the arrangement it describes.
export const MERCHANTS = {
  smarttowel: {
    name: 'Smart Towel',
    // The merchant's public storefront.
    url: 'https://smarttowel.shop',
    // PLACEHOLDER. Replace with the real tracking parameter from the
    // affiliate dashboard. Kept as a query object rather than a baked-in URL
    // string so switching network (or adding a sub-id per page) is one edit.
    tracking: { ref: 'REPLACE_ME' },
    // Shown verbatim on /affiliate-disclosure.
    commission: 'a commission on qualifying sales',
    active: false,   // flip true once the affiliate account is approved
  },
};

/**
 * Build an outbound affiliate URL.
 *
 * Always used rather than hard-coding links, for two reasons: the tracking
 * parameter lives in exactly one place, and `subId` lets you see in the
 * affiliate dashboard which page earned each click — without that, every
 * conversion looks like it came from the homepage.
 */
export function affiliateUrl(merchantKey, path = '/', subId = '') {
  const m = MERCHANTS[merchantKey];
  if (!m) throw new Error(`Unknown merchant: ${merchantKey}`);
  const url = new URL(path, m.url);
  for (const [k, v] of Object.entries(m.tracking)) url.searchParams.set(k, v);
  if (subId) url.searchParams.set('subid', subId);
  return url.toString();
}

// ── Currency ────────────────────────────────────────────────
// Both markets are targeted, so both prices show. Rates are indicative only
// and exist to render a plausible second figure while pricing is placeholder;
// once PRICES_CONFIRMED is true, put the merchant's real per-market price in
// PRODUCTS and this rate stops being used.
export const CURRENCIES = { GBP: '£', USD: '$' };

export function formatPrice(product) {
  if (!PRICES_CONFIRMED) return 'Price on release';
  const { gbp, usd } = product.price;
  return `£${gbp.toFixed(2)} / $${usd.toFixed(2)}`;
}

// ── Legal identity ──────────────────────────────────────────
// Every legal page reads from this object, so one edit updates all of them.
//
// CONFIRM EVERY FIELD BEFORE LAUNCH. These are carried over from the
// operator's existing sites as a starting point, not verified for this one.
export const LEGAL = {
  // 'company' → registered company; 'sole-trader' → operated by an individual.
  entityType: 'sole-trader',
  legalName: 'CleanLivingHQ',
  // Set to '' to omit the postal address. Naming a controller is required;
  // publishing a street address is not, though it strengthens the position.
  address: '',
  contactEmail: SITE.email,
  governingLaw: 'England and Wales',
  // Must match GA4 → Admin → Data retention if you change it there.
  analyticsRetention: '14 months',
  lastUpdated: '21 August 2026',
};

// ── Processors named in the privacy policy ──────────────────
export const PROCESSORS = [
  ['Vercel Inc.', 'Website hosting and content delivery. Server logs may include IP addresses.', 'United States'],
  ['Google LLC', 'Google Analytics 4, when you consent to analytics cookies.', 'United States'],
  ['Smart Towel', 'Receives your click when you follow an affiliate link, and records that the visit came from this site.', 'See merchant site'],
];

// ── Cookie consent (UK PECR / EU ePrivacy) ──────────────────
export const CONSENT_REQUIRED_REGIONS = [
  'GB',
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE',
  'IS', 'LI', 'NO', 'CH',
];

// Bump the version suffix to re-prompt everyone (e.g. a new vendor is added
// that the existing consent did not cover).
export const CONSENT_STORAGE_KEY = 'clhq_consent_v1';

// 'all' shows the banner to every visitor; 'eu' only where consent is legally
// required. 'all' is safer and gives US visitors the opt-out their state laws
// increasingly expect.
export const CONSENT_BANNER_SCOPE = 'all';
