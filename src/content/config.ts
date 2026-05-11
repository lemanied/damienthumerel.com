import { defineCollection, z, type CollectionEntry } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      status: z.enum(['active', 'archived', 'past']),
      role: z.string(),
      year: z.union([z.number(), z.string()]),
      summary: z.string().max(160),
      featured: z.boolean().default(false),
      tech: z.array(z.string()),
      links: z
        .object({
          repo: z.string().url().optional(),
          live: z.string().url().optional(),
          demo: z.string().url().optional(),
        })
        .optional(),
      cover: image().optional(),
      order: z.number().default(100),
    }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    summary: z.string().max(200),
    tags: z.array(z.string()),
    category: z.enum(['homelab', 'tutorial', 'career', 'til']),
    draft: z.boolean().default(false),
  }),
});

const now = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    last_updated: z.date(),
  }),
});

export const collections = { projects, blog, now };

export function sharedSlug(entry: CollectionEntry<'projects'> | CollectionEntry<'blog'>): string {
  return entry.id.replace(/^(en|fr)\//, '').replace(/\.(md|mdx)$/, '');
}

export function entryLocale(
  entry: CollectionEntry<'projects'> | CollectionEntry<'blog'>,
): 'en' | 'fr' {
  return entry.id.startsWith('fr/') ? 'fr' : 'en';
}
