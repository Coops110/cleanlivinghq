/**
 * Internal link checker.
 *
 * Run against dist/ after a build. Every internal href must resolve to
 * something the deploy will actually serve, or the check fails.
 *
 *   npm run build && npm run check:links
 *
 * This exists because the single most common way to ship a broken page is to
 * publish an article whose links point at pages that do not exist yet. The
 * rule on this project is that a new page and the links pointing to it go into
 * ONE commit and ONE deploy — there is never a moment where a link is live and
 * its target is not.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

if (!existsSync(DIST)) {
  console.error('No dist/ — run `npm run build` first. Without it there is nothing to check.');
  process.exit(1);
}

const files = walk(DIST);
const pages = files.filter((f) => f.endsWith('.html'));

/** Does this internal path resolve to something in dist? */
function resolves(pathname) {
  const clean = decodeURIComponent(pathname.replace(/\/$/, '')) || '/';
  const candidates = [
    join(DIST, clean === '/' ? 'index.html' : `${clean}/index.html`),
    join(DIST, `${clean}.html`),
    join(DIST, clean),                 // a real asset: /og-default.png, /robots.txt
  ];
  return candidates.some((c) => existsSync(c) && statSync(c).isFile());
}

let checked = 0;
const broken = [];
const anchorsMissing = [];

for (const file of pages) {
  const raw = readFileSync(file, 'utf8');

  // Strip <script> and <style> bodies before looking for links. Client-side
  // templates legitimately contain strings like href="/x/${slug}", which are
  // not links and would otherwise be reported as broken forever.
  const html = raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

  const from = '/' + relative(DIST, file).replace(/index\.html$/, '').replace(/\/$/, '');

  // Collect the ids present on this page, so same-page #anchors can be checked.
  const ids = new Set([...raw.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

  for (const m of html.matchAll(/\shref="([^"]+)"/g)) {
    const href = m[1];

    // External, mail, tel, protocol-relative — not ours to verify.
    if (/^(https?:|mailto:|tel:|\/\/|data:)/i.test(href)) continue;

    if (href.startsWith('#')) {
      const id = href.slice(1);
      if (id && !ids.has(id)) anchorsMissing.push(`${from || '/'} → ${href}`);
      continue;
    }
    if (!href.startsWith('/')) continue;   // relative links are not used on this site

    checked++;
    const [pathname, hash] = href.split('#');
    if (!resolves(pathname)) {
      broken.push(`${from || '/'} → ${href}`);
      continue;
    }
    // A cross-page #anchor is only verified when it points at an HTML page.
    if (hash) {
      const target = join(DIST, (pathname.replace(/\/$/, '') || '/') === '/' ? 'index.html' : `${pathname.replace(/\/$/, '')}/index.html`);
      if (existsSync(target)) {
        const targetIds = new Set([...readFileSync(target, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]));
        if (!targetIds.has(hash)) anchorsMissing.push(`${from || '/'} → ${href}`);
      }
    }
  }
}

console.log(`\n  Pages scanned:   ${pages.length}`);
console.log(`  Internal links:  ${checked}`);
console.log(`  Broken links:    ${broken.length}`);
console.log(`  Missing anchors: ${anchorsMissing.length}\n`);

if (broken.length) {
  console.log('  BROKEN LINKS');
  for (const b of broken) console.log(`    ${b}`);
  console.log('');
}
if (anchorsMissing.length) {
  console.log('  MISSING ANCHOR TARGETS');
  for (const a of anchorsMissing) console.log(`    ${a}`);
  console.log('');
}

if (broken.length || anchorsMissing.length) process.exit(1);
console.log('  All internal links resolve.\n');
