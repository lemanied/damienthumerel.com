interface AcceptLanguageItem {
  tag: string;
  q: number;
}

function parseAcceptLanguage(header: string): AcceptLanguageItem[] {
  return header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return { tag: tag.toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((it) => it.tag.length > 0);
}

function pickLocale(header: string | null): 'en' | 'fr' {
  if (!header) return 'en';
  const items = parseAcceptLanguage(header).sort((a, b) => b.q - a.q);
  for (const it of items) {
    if (it.tag === '*') continue;
    const primary = it.tag.split('-')[0];
    if (primary === 'fr') return 'fr';
    if (primary === 'en') return 'en';
  }
  return 'en';
}

interface PagesContext {
  request: Request;
}

export const onRequest = async (ctx: PagesContext): Promise<Response> => {
  const url = new URL(ctx.request.url);
  const locale = pickLocale(ctx.request.headers.get('accept-language'));
  url.pathname = `/${locale}/`;
  return Response.redirect(url.toString(), 302);
};
