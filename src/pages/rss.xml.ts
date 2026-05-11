import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { sharedSlug } from '@/content/config';
import { SITE } from '@/consts';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ id, data }) => {
    return id.startsWith('en/') && !data.draft;
  });

  const sorted = posts
    .slice()
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  return rss({
    title: SITE.name,
    description: SITE.description.en,
    site: context.site ?? SITE.url,
    items: sorted.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.summary,
      link: `/blog/${sharedSlug(post)}/`,
      categories: [post.data.category, ...post.data.tags],
    })),
    customData: '<language>en-ca</language>',
  });
}
