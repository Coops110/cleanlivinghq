import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Guides collection.
 *
 * `faq` is duplicated into the post body by the route deliberately — see
 * FaqList.astro. Marking up a question that is not visible on the page is a
 * structured data violation, so the route renders the same array it marks up.
 *
 * `pillar` is required, not optional. Every post must declare which pillar
 * page it belongs to, because that is what generates the two-way link between
 * hub and post. A post with no pillar is an orphan, and orphans earn nothing:
 * on the sister site every blog post had exactly one inbound link — the index —
 * and four posts of 2,200+ words returned nothing at all.
 */
const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    /** Rendered title budget is ~42 chars before " | CleanLivingHQ" is added. */
    seoTitle: z.string().optional(),
    description: z.string().max(155, 'Meta descriptions truncate near 155 characters'),
    published: z.string(),
    updated: z.string().optional(),
    pillar: z.enum(['cooling', 'heat', 'skin']),
    /** Primary query this post is written for. One per post. */
    targetQuery: z.string(),
    image: z.string().default('/og-default.png'),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    noindex: z.boolean().default(false),
  }),
});

export const collections = { guides };
