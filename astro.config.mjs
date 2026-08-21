import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { buildGitLastmodMap, sourceCandidates } from './scripts/git-lastmod.mjs';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Paths kept out of the sitemap. A URL listed as a crawl priority while its
// robots meta says noindex is a contradictory signal, so the two lists have to
// agree by hand.
const NOINDEX_PATHS = ['/thanks', '/links'];

const lastmodMap = buildGitLastmodMap();

export default defineConfig({
  site: 'https://cleanlivinghq.com',

  // Non-www everywhere: this value, every canonical, the sitemap and
  // robots.txt. Do not introduce a www variant anywhere — a site that answers
  // on both hostnames splits its own signals, and every audit of the sister
  // site that started by inspecting the www host wasted its time.
  trailingSlash: 'never',
  build: { format: 'directory' },
  compressHTML: true,


  integrations: [
    sitemap({
      filter: (page) =>
        !NOINDEX_PATHS.some((p) => page.replace(/\/$/, '').endsWith(p)),

      // <lastmod> comes from the last git commit that touched each page's own
      // source file. See scripts/git-lastmod.mjs for why file mtime cannot be
      // used here.
      serialize(item) {
        if (!lastmodMap) return item;
        const { pathname } = new URL(item.url);
        for (const candidate of sourceCandidates(pathname)) {
          const date = lastmodMap.get(candidate);
          if (date) {
            item.lastmod = date;
            return item;
          }
        }
        return item;
      },
    }),

    // Reports lastmod coverage on every build. Runs after the sitemap
    // integration because integrations fire in array order, so the files it
    // reads already exist. A silently empty git map would otherwise produce a
    // valid-looking sitemap with no dates in it at all.
    {
      name: 'sitemap-lastmod-report',
      hooks: {
        'astro:build:done': ({ dir, logger }) => {
          const outDir = fileURLToPath(dir);
          const files = readdirSync(outDir).filter(
            (f) => f.startsWith('sitemap-') && f.endsWith('.xml') && f !== 'sitemap-index.xml'
          );
          let urls = 0;
          let dated = 0;
          for (const file of files) {
            const xml = readFileSync(`${outDir}/${file}`, 'utf8');
            urls += (xml.match(/<loc>/g) || []).length;
            dated += (xml.match(/<lastmod>/g) || []).length;
          }
          if (!urls) return;
          const pct = Math.round((dated / urls) * 100);
          const line = `${dated}/${urls} sitemap URLs have lastmod (${pct}%)`;
          if (dated === urls) logger.info(line);
          else logger.warn(`${line} — URLs without one had no resolvable source file`);
        },
      },
    },
  ],
});
