/**
 * On-page SEO and accessibility checks over dist/.
 *
 *   npm run build && npm run check:seo
 *
 * These are the checks that catch the mistakes that are invisible in a browser
 * and expensive in search:
 *
 *  - Title length. BaseLayout appends " | CleanLivingHQ", and Google truncates
 *    around 60 characters. A title cut mid-phrase never displays the targeting
 *    it was written for.
 *  - Description length. Truncates near 155.
 *  - Exactly one h1, and no skipped heading levels. Heading level is document
 *    structure; a skip is a real accessibility defect, not a style opinion.
 *  - og:image must be a raster. Social scrapers refuse to render an SVG and
 *    show a blank preview instead.
 *  - Images need an alt attribute (empty alt is valid for decorative images).
 *  - Affiliate links need rel="sponsored", and any page carrying one needs a
 *    visible disclosure.
 *
 * NOTE: a visually-hidden heading passing this check is necessary but not
 * sufficient. Whether it is still in the accessibility tree can only be
 * confirmed in a real browser — see CLAUDE.md.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const TITLE_MAX = 60;
const DESC_MAX = 155;

if (!existsSync(DIST)) {
  console.error('No dist/ — run `npm run build` first.');
  process.exit(1);
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
const strip = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

const problems = [];
const warnings = [];
const pages = walk(DIST);

let longestTitle = 0;
let longestDesc = 0;

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const url = '/' + relative(DIST, file).replace(/index\.html$/, '').replace(/\/$/, '');
  const at = (msg) => `${url || '/'}: ${msg}`;

  // ── Title ──
  const title = strip((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
  if (!title) problems.push(at('no <title>'));
  else {
    longestTitle = Math.max(longestTitle, title.length);
    if (title.length > TITLE_MAX) problems.push(at(`title is ${title.length} chars (max ${TITLE_MAX}) — "${title}"`));
  }

  // ── Description ──
  const desc = decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  if (!desc) problems.push(at('no meta description'));
  else {
    longestDesc = Math.max(longestDesc, desc.length);
    if (desc.length > DESC_MAX) problems.push(at(`description is ${desc.length} chars (max ${DESC_MAX})`));
  }

  // ── Canonical ──
  if (!/<link rel="canonical" href="https:\/\//.test(html)) problems.push(at('no absolute canonical'));

  // ── og:image must be a raster ──
  const og = (html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1];
  if (!og) problems.push(at('no og:image'));
  else if (!/\.(png|jpe?g|webp)(\?|$)/i.test(og)) problems.push(at(`og:image is not a raster: ${og}`));

  // ── Headings ──
  const headings = [...html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map((m) => ({ level: +m[1], text: strip(m[2]) }));

  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length === 0) problems.push(at('no h1'));
  if (h1s.length > 1) problems.push(at(`${h1s.length} h1 elements — there must be exactly one`));

  let prev = 0;
  for (const h of headings) {
    if (prev && h.level > prev + 1) {
      problems.push(at(`heading jumps h${prev} → h${h.level} at "${h.text.slice(0, 48)}"`));
    }
    prev = h.level;
  }

  // ── Images ──
  for (const m of html.matchAll(/<img\b([^>]*)>/gi)) {
    if (!/\salt=/.test(m[1])) problems.push(at(`<img> with no alt: ${m[0].slice(0, 80)}`));
  }

  // ── Affiliate hygiene ──
  const affiliates = [...html.matchAll(/<a\b[^>]*data-affiliate[^>]*>/gi)];
  if (affiliates.length) {
    for (const a of affiliates) {
      if (!/rel="[^"]*sponsored/.test(a[0])) problems.push(at('affiliate link without rel="sponsored"'));
    }
    if (!/class="disclosure"/.test(html)) {
      problems.push(at(`${affiliates.length} affiliate link(s) but no visible disclosure on the page`));
    }
  }

  // ── Robots sanity ──
  if (!/<meta name="robots"/.test(html)) warnings.push(at('no robots meta'));
}

console.log(`\n  Pages checked:    ${pages.length}`);
console.log(`  Longest title:    ${longestTitle} / ${TITLE_MAX}`);
console.log(`  Longest desc:     ${longestDesc} / ${DESC_MAX}`);
console.log(`  Problems:         ${problems.length}`);
console.log(`  Warnings:         ${warnings.length}\n`);

if (problems.length) {
  console.log('  PROBLEMS');
  for (const p of problems) console.log(`    ${p}`);
  console.log('');
}
if (warnings.length) {
  console.log('  WARNINGS');
  for (const w of warnings) console.log(`    ${w}`);
  console.log('');
}

if (problems.length) process.exit(1);
console.log('  All SEO checks pass.\n');
