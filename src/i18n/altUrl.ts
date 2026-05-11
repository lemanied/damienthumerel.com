import { getCollection } from 'astro:content';
import { sharedSlug } from '@/content/config';
import type { Locale } from '@/consts';

const LOCALES: Locale[] = ['en', 'fr'];

type CollectionName = 'projects' | 'blog';

async function presentSlugs(name: CollectionName, locale: Locale): Promise<Set<string>> {
  const entries = await getCollection(name, ({ id }) => id.startsWith(`${locale}/`));
  return new Set(entries.map((e) => sharedSlug(e)));
}

interface AltUrls {
  en: string;
  fr: string;
}

export async function altUrls(currentPath: string): Promise<AltUrls> {
  const path = currentPath.endsWith('/') && currentPath !== '/'
    ? currentPath.slice(0, -1)
    : currentPath;

  if (path === '' || path === '/') {
    return { en: '/en/', fr: '/fr/' };
  }

  const segments = path.split('/').filter(Boolean);
  const first = segments[0];
  if (first !== 'en' && first !== 'fr') {
    return { en: '/en/', fr: '/fr/' };
  }

  const rest = segments.slice(1);
  const result: AltUrls = { en: '/en/', fr: '/fr/' };

  for (const target of LOCALES) {
    if ((rest[0] === 'projects' || rest[0] === 'blog') && rest.length >= 2) {
      const collection: CollectionName = rest[0];
      const slug = rest.slice(1).join('/');
      const slugs = await presentSlugs(collection, target);
      if (slugs.has(slug)) {
        result[target] = `/${target}/${collection}/${slug}/`;
      } else {
        result[target] = `/${target}/${collection}/`;
      }
      continue;
    }

    result[target] = `/${target}/${rest.join('/')}${rest.length ? '/' : ''}`;
  }

  return result;
}
