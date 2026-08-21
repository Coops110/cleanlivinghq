/**
 * robots.txt, generated rather than static, so it cannot disagree with the
 * LAUNCHED switch in src/lib/site.js.
 *
 * Plain .js rather than .ts on purpose — see CLAUDE.md, "No TypeScript
 * files". Nothing here needs types.
 *
 * Pre-launch it disallows everything. That is the point: the site should not
 * be discovered while it carries placeholder pricing and half its catalogue is
 * unreleased. A static robots.txt would have to be remembered and edited by
 * hand on launch day, and it would eventually be forgotten.
 */
import { SITE, LAUNCHED } from '../lib/site.js';

export const GET = () => {
  const body = LAUNCHED
    ? `# ${SITE.name}
User-agent: *
Allow: /

# Thank-you and redirect-target pages carry no content worth indexing.
Disallow: /thanks

Sitemap: ${SITE.domain}/sitemap-index.xml
`
    : `# ${SITE.name} — PRE-LAUNCH. Indexing is deliberately closed.
# Flip LAUNCHED to true in src/lib/site.js to open the site up; this file
# and the per-page robots meta both follow that one switch.
User-agent: *
Disallow: /
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
