import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

function injectTermRoute() {
  return {
    name: 'inject-term-route',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        injectRoute({
          pattern: '/_term',
          entrypoint: './src/hidden/term.astro',
        });
      },
    },
  };
}

export default defineConfig({
  site: 'https://damienthumerel.com',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [
    mdx(),
    injectTermRoute(),
    sitemap({
      filter: (page) => !page.includes('/_term'),
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en-CA', fr: 'fr-CA' },
      },
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
});
