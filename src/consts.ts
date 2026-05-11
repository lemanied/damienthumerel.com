export const SITE = {
  url: 'https://damienthumerel.com',
  name: 'Damien Thumerel',
  titleSuffix: 'Damien Thumerel',
  defaultLocale: 'en' as const,
  locales: ['en', 'fr'] as const,
  description: {
    en: 'Personal site of Damien Thumerel - IT/systems generalist, homelab tinkerer, freelance developer.',
    fr: 'Site personnel de Damien Thumerel - généraliste IT/systèmes, bricoleur de homelab, développeur freelance.',
  },
  tagline: {
    en: 'IT / systems generalist · homelab + freelance · Quebec',
    fr: 'Généraliste IT / systèmes · homelab + freelance · Québec',
  },
  ogImage: '/og-default.png',
};

export type Locale = (typeof SITE.locales)[number];

export const NAV: ReadonlyArray<{
  href: string;
  tKey: 'nav.about' | 'nav.projects' | 'nav.blog' | 'nav.now' | 'nav.uses' | 'nav.contact';
}> = [
  { href: '/about',    tKey: 'nav.about' },
  { href: '/projects', tKey: 'nav.projects' },
  { href: '/blog',     tKey: 'nav.blog' },
  { href: '/now',      tKey: 'nav.now' },
  { href: '/uses',     tKey: 'nav.uses' },
  { href: '/contact',  tKey: 'nav.contact' },
];

export const SOCIALS: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'github', href: 'https://github.com/lemanied' },
  { label: 'email', href: 'mailto:damien.thumerel@gmail.com' },
];
