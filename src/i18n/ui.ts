import en from './en.json';
import fr from './fr.json';
import type { Locale } from '@/consts';

type Dict = Record<string, string>;
const dicts: Record<Locale, Dict> = { en: en as Dict, fr: fr as Dict };

export type TKey = keyof typeof en;

export function t(key: TKey | string, locale: Locale): string {
  const k = key as string;
  return dicts[locale]?.[k] ?? dicts.en[k] ?? k;
}

export function pathLocale(pathname: string): Locale {
  const seg = pathname.split('/').filter(Boolean)[0];
  return seg === 'fr' ? 'fr' : 'en';
}

export function localizePath(path: string, locale: Locale): string {
  if (!path.startsWith('/')) return path;
  if (/^\/(en|fr)(\/|$)/.test(path)) return path;
  if (path === '/') return `/${locale}/`;
  return `/${locale}${path}`;
}
