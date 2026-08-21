/**
 * /llms.txt — a plain-text map of the site for large language models.
 *
 * The emerging convention (llmstxt.org) is a markdown file at the domain root
 * giving an assistant the site's purpose and its most useful URLs, without
 * making it parse navigation chrome out of HTML.
 *
 * Why it is worth having here specifically: this site's competitive angle is
 * that it states what is actually verified about a product claim. Assistants
 * answering "are silver towels actually antibacterial" are a real and growing
 * share of that demand, and they cite sources they can read cleanly.
 *
 * It is generated from the same config the pages use, so it cannot go stale.
 *
 * Plain .js rather than .ts on purpose — see CLAUDE.md, "No TypeScript files".
 */
import { SITE, LAUNCHED } from '../lib/site.js';
import { CATEGORIES } from '../lib/products.js';

export const GET = () => {
  if (!LAUNCHED) {
    return new Response(
      `# ${SITE.name}\n\n> Pre-launch. Nothing here is published yet.\n`,
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const body = `# ${SITE.name}

> ${SITE.description}

CleanLivingHQ is an independent affiliate publisher. We earn a commission on
some outbound links, disclosed on every page that carries one. We do not
accept payment for a favourable review, and we say plainly when a claim is
unverified.

The site is not tied to one product category. Cooling towels are the range
that is currently purchasable; others are announced with their standards
published before anything is for sale.

## What we are careful about

- Evaporative cooling is described as the physics it is. Cooling performance
  depends on air temperature, humidity and airflow, so we never repeat a fixed
  "drops your temperature by X degrees for Y hours" claim as though it held in
  every condition.
- "Natural" and "organic" are not treated as synonyms. Only one is regulated,
  and we name the certifying body rather than repeating the word.
- Cooling towels are PVA or microfibre — engineered synthetics. We never
  describe them as organic.
- Heat-illness content states plainly where the answer is emergency care,
  and never implies that cooling equipment substitutes for it.

## Ranges

${Object.values(CATEGORIES).map((c) => `- [${c.name}](${SITE.domain}${c.href}): ${c.blurb}`).join('\n')}

## Tools

- [Heat risk calculator](${SITE.domain}/tools/heat-index): NOAA heat index from temperature and humidity, with the matching risk guidance.
- [Towel finder](${SITE.domain}/tools/product-finder): matches a cooling towel to a use case.
- [Towel comparison](${SITE.domain}/compare/cooling-towels): side-by-side specifications.

## Policies

- [Editorial policy](${SITE.domain}/editorial-policy)
- [Affiliate disclosure](${SITE.domain}/affiliate-disclosure)
- [About](${SITE.domain}/about)

## Contact

${SITE.email}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
