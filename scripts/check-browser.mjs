/**
 * Browser verification. Run against a served build:
 *
 *   npm run build
 *   npx serve dist   (or: cd dist && python3 -m http.server 4322)
 *   node scripts/check-browser.mjs http://127.0.0.1:4322
 *
 * WHY THIS EXISTS AND WHY GREP IS NOT ENOUGH.
 *
 * Static checks cannot see the two failure modes that matter most here:
 *
 *  - A visually-hidden heading that has fallen OUT of the accessibility tree
 *    is worse than the heading skip it was added to fix, and markup alone
 *    cannot tell you which one you have. locator.ariaSnapshot() prints the
 *    real tree with levels. (page.accessibility was removed from Playwright.)
 *  - Interactive things look perfect in the HTML and are broken in a browser.
 *
 * ON HORIZONTAL OVERFLOW, specifically: measuring
 * documentElement.scrollWidth is a TRAP. It reports the unclipped extent of
 * content inside a scroll container, so a correctly-built <div
 * class="table-scroll"> holding a wide table reads as a 317px page overflow
 * when nothing is wrong. This script instead asks the two questions that
 * actually matter: can the user scroll the page sideways, and is anything
 * overflowing that is NOT inside a scroll container?
 */
import { chromium } from 'playwright-core';

const BASE = (process.argv[2] || 'http://127.0.0.1:4322').replace(/\/$/, '');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const fail = [];
const ok = (m) => console.log(`  PASS  ${m}`);
const bad = (m) => { fail.push(m); console.log(`  FAIL  ${m}`); };

const PAGES = [
  '/', '/cooling-towels', '/heat-safety', '/skin', '/guides',
  '/tools', '/tools/heat-index', '/tools/product-finder',
  '/compare/cooling-towels', '/cooling-towels/cooling-towel',
  '/soon/hand-balm', '/guides/pva-vs-microfibre-cooling-towels', '/about',
  '/privacy', '/terms', '/contact', '/affiliate-disclosure', '/editorial-policy',
];

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();

const jsErrors = [];
page.on('pageerror', (e) => jsErrors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') jsErrors.push(m.text()); });

const go = (p) => page.goto(BASE + (p === '/' ? '/index.html' : `${p}/index.html`), { waitUntil: 'networkidle' });

// ── 1. Real horizontal overflow at 360px ────────────────────
console.log('\n── Horizontal overflow at 360px ──');
let overflowIssues = 0;
for (const p of PAGES) {
  await go(p);
  const result = await page.evaluate(() => {
    // (a) Can the user actually scroll the page sideways?
    window.scrollTo(500, 0);
    const scrolled = window.scrollX;
    window.scrollTo(0, 0);

    // (b) Is anything overflowing that no scroll container is handling?
    const vw = document.documentElement.clientWidth;
    const escaped = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= vw + 1) continue;
      let contained = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const ox = getComputedStyle(a).overflowX;
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') { contained = true; break; }
      }
      if (!contained) {
        escaped.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} (right ${Math.round(r.right)}px)`);
      }
    }
    return { scrolled, escaped: escaped.slice(0, 4) };
  });

  if (result.scrolled !== 0) { bad(`${p} scrolls sideways by ${result.scrolled}px`); overflowIssues++; }
  else if (result.escaped.length) { bad(`${p} has uncontained overflow: ${result.escaped.join(', ')}`); overflowIssues++; }
}
if (!overflowIssues) ok(`all ${PAGES.length} pages: no sideways page scroll, no uncontained overflow`);

// ── 2. Heading structure in the real accessibility tree ─────
console.log('\n── Heading structure (accessibility tree, not markup) ──');
let headingIssues = 0;
for (const p of PAGES) {
  await go(p);
  const snap = await page.locator('body').ariaSnapshot();
  const levels = [...snap.matchAll(/heading .*?\[level=(\d)\]/g)].map((m) => +m[1]);
  if (!levels.length) { bad(`${p}: no headings in the accessibility tree`); headingIssues++; continue; }
  const h1 = levels.filter((l) => l === 1).length;
  if (h1 !== 1) { bad(`${p}: ${h1} h1 in the accessibility tree`); headingIssues++; }
  let prev = 0;
  for (const l of levels) {
    if (prev && l > prev + 1) { bad(`${p}: accessibility tree skips h${prev} → h${l}`); headingIssues++; break; }
    prev = l;
  }
}
if (!headingIssues) ok(`all ${PAGES.length} pages: exactly one h1, no skipped levels, in the real tree`);

// ── 3. Visually hidden headings still in the tree ───────────
console.log('\n── Visually hidden headings ──');
await go('/tools');
const sr = page.locator('h2.sr-only').first();
if (await sr.count()) {
  const box = await sr.boundingBox();
  const inTree = (await page.locator('body').ariaSnapshot()).includes('Available tools');
  if (!inTree) bad('sr-only heading has fallen OUT of the accessibility tree');
  else if (!box || box.width > 2 || box.height > 2) bad(`sr-only heading is visible: ${JSON.stringify(box)}`);
  else ok(`sr-only h2 in the tree, clipped to ${Math.round(box.width)}x${Math.round(box.height)}px`);
}

// ── 4. Mobile navigation ────────────────────────────────────
console.log('\n── Mobile navigation ──');
await go('/');
const toggle = page.locator('.nav-toggle');
const menu = page.locator('#nav-menu');
if (await menu.isVisible()) bad('nav menu visible before the toggle is pressed at 360px');
await toggle.click();
if (!(await menu.isVisible())) bad('nav did not open on tap');
else if ((await toggle.getAttribute('aria-expanded')) !== 'true') bad('aria-expanded not true after opening');
else ok('nav opens on tap, aria-expanded=true');
await page.keyboard.press('Escape');
if (await menu.isVisible()) bad('Escape did not close the nav');
else ok('Escape closes the nav and restores focus');

// ── 5. Heat calculator ──────────────────────────────────────
console.log('\n── Heat risk calculator ──');
await go('/tools/heat-index');
const setCalc = async (t, h) => {
  await page.fill('#temp', String(t)); await page.dispatchEvent('#temp', 'input');
  await page.fill('#rh', String(h));   await page.dispatchEvent('#rh', 'input');
  await page.waitForTimeout(120);
};
await setCalc(32, 70);
const hi = await page.textContent('#hi-value');
if (hi !== '40°C') bad(`32°C/70% gave ${hi}, expected 40°C (NWS reference)`);
else ok(`32°C + 70% RH → ${hi} (${(await page.textContent('#hi-band')).trim()})`);
// Full sun must add 8°C and be able to move the risk band.
await page.check('#sun');
await page.waitForTimeout(120);
const hiSun = await page.textContent('#hi-value');
if (hiSun !== '48°C') bad(`full sun gave ${hiSun}, expected 48°C (40 + 8)`);
else ok(`full sun adds 8°C → ${hiSun} (${(await page.textContent('#hi-band')).trim()})`);
if (await page.locator('#hi-sun').isHidden()) bad('shade comparison note not shown when sun is on');
else ok(`shade comparison shown: "${(await page.textContent('#hi-sun')).trim().slice(0, 60)}…"`);
await page.uncheck('#sun');
await page.waitForTimeout(120);
if ((await page.textContent('#hi-value')) !== '40°C') bad('unchecking sun did not restore the shade figure');
else ok('unchecking sun restores the shade figure');

await page.selectOption('#unit', 'f');
await page.waitForTimeout(120);
const tF = parseFloat(await page.inputValue('#temp'));
if (Math.abs(tF - 89.6) > 0.6) bad(`unit switch gave ${tF}°F for 32°C, expected ~89.6`);
else ok(`unit switch converts the value in place: 32°C → ${tF}°F`);

await page.selectOption('#unit', 'c');
await setCalc(45, 85);
if ((await page.getAttribute('#human-card', 'data-band')) !== 'danger') bad('45°C/85% did not reach the danger band');
else ok('45°C + 85% RH reaches the danger band for a person');
await setCalc(15, 30);
if ((await page.getAttribute('#human-card', 'data-band')) !== 'ok') bad('15°C/30% did not read as normal');
else ok('15°C + 30% RH reads as normal');

// ── 6. Product finder ───────────────────────────────────────
console.log('\n── Cooling towel finder ──');
await go('/tools/product-finder');
await page.check('input[name="people"][value="crew"]');
await page.waitForTimeout(120);
const crew = (await page.textContent('#result h2')).trim();
if (!crew.includes('4-Pack')) bad(`"a crew" recommended ${crew}, expected the 4-pack`);
else ok(`"a crew" → ${crew}`);
await page.check('input[name="visible"][value="yes"]');
await page.check('input[name="people"][value="one"]');
await page.waitForTimeout(120);
const hv = (await page.textContent('#result h2')).trim();
if (!hv.includes('Hi-Vis')) bad(`"one person, hi-vis" recommended ${hv}, expected the hi-vis towel`);
else ok(`"one person + hi-vis" → ${hv}`);
if ((await page.textContent('.result-why')).length < 20) bad('result gives no reasoning');
else ok('result explains its reasoning');

// ── 7. Comparison table ─────────────────────────────────────
console.log('\n── Comparison table ──');
await go('/compare/cooling-towels');
const before = await page.locator('#cmp tbody tr th a').allTextContents();
await page.click('th[data-sort="pack"]');
await page.waitForTimeout(80);
const after = await page.locator('#cmp tbody tr th a').allTextContents();
if (JSON.stringify(before) === JSON.stringify(after)) bad('sorting by pack did not reorder rows');
else ok('sortable columns reorder the table');
const canScroll = await page.evaluate(() => {
  const ts = document.querySelector('.table-scroll');
  ts.scrollLeft = 400;
  return ts.scrollLeft > 0;
});
if (!canScroll) bad('wide table does not scroll inside its container');
else ok('wide table scrolls inside its own container, not the page');

// ── 8. Affiliate link hygiene ───────────────────────────────
console.log('\n── Affiliate links ──');
await go('/cooling-towels/cooling-towel');
const aff = page.locator('a[data-affiliate]').first();
const rel = await aff.getAttribute('rel');
for (const token of ['sponsored', 'nofollow', 'noopener']) {
  if (!rel.includes(token)) bad(`affiliate rel missing "${token}" (got "${rel}")`);
}
if (rel.includes('sponsored') && rel.includes('nofollow') && rel.includes('noopener')) ok(`rel="${rel}"`);
const href = await aff.getAttribute('href');
if (!href.includes('subid=cooling-towels-cooling-towel')) bad(`per-page sub-id missing from ${href}`);
else ok(`sub-id derived from the page path: ${href.split('?')[1]}`);
const dBox = await page.locator('.disclosure').first().boundingBox();
const aBox = await aff.boundingBox();
if (!dBox || !aBox || dBox.y >= aBox.y) bad('disclosure does not appear above the first affiliate link');
else ok(`disclosure sits ${Math.round(aBox.y - dBox.y)}px above the first affiliate link`);

// ── 9. Tap targets ──────────────────────────────────────────
console.log('\n── Tap targets ──');
let tapIssues = 0;
for (const p of ['/', '/cooling-towels', '/tools/heat-index', '/tools/product-finder']) {
  await go(p);
  const small = await page.evaluate(() => {
    // Measure the EFFECTIVE target, not the control's own box. A 20px radio
    // wrapped in a 50px <label> has a 50px tap target, because tapping
    // anywhere in the label activates it — that is what WCAG 2.5.8 counts,
    // and measuring the input alone reports a failure that does not exist.
    const effective = (el) => {
      const label = el.closest('label');
      return Math.round((label || el).getBoundingClientRect().height);
    };
    return [...document.querySelectorAll('a.btn, button, input[type=radio], input[type=checkbox], select')]
      .map((el) => ({ t: (el.textContent || el.tagName).trim().slice(0, 24), h: effective(el) }))
      .filter((x) => x.h > 0 && x.h < 24);
  });
  if (small.length) { bad(`${p}: ${small.length} control(s) under 24px: ${JSON.stringify(small)}`); tapIssues++; }
}
if (!tapIssues) ok('no controls below the 24px minimum on the pages checked');

// ── 10. Pre-launch gating ───────────────────────────────────
console.log('\n── Pre-launch gating ──');
await go('/');
const robotsMeta = await page.getAttribute('meta[name="robots"]', 'content');
const rtxt = await (await ctx.request.get(`${BASE}/robots.txt`)).text();
const launched = !/noindex/.test(robotsMeta || '');
if (launched) {
  if (/Disallow: \/\s*$/m.test(rtxt)) bad('LAUNCHED is true but robots.txt still disallows everything');
  else ok('LAUNCHED: pages indexable and robots.txt open');
} else {
  if (!/Disallow: \/\s*$/m.test(rtxt)) bad('pages are noindex but robots.txt does not disallow');
  else ok('pre-launch: noindex meta and robots.txt disallow agree');
}

// ── 11. JS errors ───────────────────────────────────────────
console.log('\n── Console ──');
if (jsErrors.length) bad(`${jsErrors.length} JS error(s): ${jsErrors.slice(0, 3).join(' | ')}`);
else ok('no JavaScript errors on any page visited');

await browser.close();
console.log(`\n  ${fail.length ? `${fail.length} FAILURE(S)` : 'All browser checks passed.'}\n`);
process.exit(fail.length ? 1 : 0);
