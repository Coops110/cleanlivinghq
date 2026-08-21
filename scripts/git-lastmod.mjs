/**
 * Sitemap <lastmod> dates, taken from git history.
 *
 * DO NOT REPLACE THIS WITH FILE MTIME. Vercel clones the repository fresh for
 * every deploy, so every file carries the same checkout timestamp. Using mtime
 * would make all URLs claim they changed on every build, and Google learns to
 * discount a sitemap that does that — across the whole domain, not just the
 * URLs that lied. No lastmod at all is better than a wrong one.
 *
 * Consequence worth knowing: editing BaseLayout, Nav, Footer or global.css
 * bumps NOTHING, because no page's own source file changed. That is correct.
 * A styling fix is not a content update and should not be announced as one.
 */
import { execSync } from 'node:child_process';

const CWD = new URL('..', import.meta.url).pathname;

/**
 * Where this package sits inside the git repository, e.g. "cleanlivinghq/".
 *
 * git log always prints paths relative to the REPOSITORY root, never to the
 * directory you ran it from. This site currently lives in a subdirectory of a
 * larger repo, so every path in the map carries that prefix and the candidate
 * paths have to carry it too. Resolved from git rather than hard-coded, so
 * lifting this folder into its own repository (where the prefix becomes "")
 * keeps working with no edit.
 */
function repoPrefix() {
  try {
    return execSync('git rev-parse --show-prefix', { cwd: CWD, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const PREFIX = repoPrefix();

/**
 * One `git log` pass over the whole repository → Map<sourcePath, YYYY-MM-DD>.
 * Returns null if git is unavailable, in which case no URL gets a lastmod.
 */
export function buildGitLastmodMap() {
  try {
    const out = execSync(
      'git log --name-only --format="%x00%cI" --date-order -- .',
      { cwd: CWD, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
    );

    const map = new Map();
    let date = null;
    for (const line of out.split('\n')) {
      if (line.startsWith('\0')) {
        date = line.slice(1, 11);   // YYYY-MM-DD from the ISO timestamp
        continue;
      }
      const file = line.trim();
      // First sighting wins: git log is newest-first, so the first commit
      // touching a file is its most recent change.
      if (file && date && !map.has(file)) map.set(file, date);
    }
    return map.size ? map : null;
  } catch {
    return null;
  }
}

/**
 * Source files that could produce a given URL, most specific first.
 *
 * Guides resolve to their own markdown source, not to the shared route, so
 * editing one guide does not restamp all of them.
 *
 * Returned paths are repository-relative, matching what git log prints.
 */
export function sourceCandidates(pathname) {
  const clean = pathname.replace(/\/$/, '');
  const p = (rel) => PREFIX + rel;

  if (clean === '' || clean === '/') return [p('src/pages/index.astro')];

  // A guide must resolve to its own markdown file, never to the [slug].astro
  // route — otherwise editing one post restamps every post on the site.
  const guide = clean.match(/^\/guides\/(.+)$/);
  if (guide) return [p(`src/content/blog/${guide[1]}.md`)];

  // Dynamically generated product pages have no source file of their own.
  // Their content comes from the catalogue, so that is what should date them —
  // otherwise every product URL ships with no lastmod at all, and the build
  // report drops below 100%.
  const product = clean.match(/^\/(cooling-towels|soon)\/(.+)$/);
  if (product) {
    return [
      p(`src/pages/${product[1]}/[slug].astro`),
      p('src/lib/products.js'),
    ];
  }

  return [
    p(`src/pages${clean}.astro`),
    p(`src/pages${clean}/index.astro`),
    p(`src/pages${clean}.md`),
  ];
}
