import { tags, strip } from './html.js';

const UA = 'Mozilla/5.0 (compatible; broken-links; +https://github.com/ksanyok/broken-links)';
const SKIP = /^(mailto:|tel:|javascript:|data:|sms:|#|about:)/i;

/**
 * Collect links and resources from an HTML page.
 * @param {string} html
 * @param {string} base page URL
 * @param {{assets?: boolean}} [options] include images, scripts and stylesheets
 */
export function extractLinks(html, base, options = {}) {
  const clean = strip(html.replace(/<script\b[^>]*\bsrc=[^>]*>/gi, (m) => m.replace(/^<script/i, '<x-script')));
  const baseHref = tags(clean, 'base')[0]?.href;
  const root = baseHref ? new URL(baseHref, base).toString() : base;
  const found = new Map();
  const add = (href, kind, extra = {}) => {
    if (!href || SKIP.test(href.trim())) return;
    let url;
    try { url = new URL(href.trim(), root); } catch { found.set(href, { url: href, kind, invalid: true, text: extra.text }); return; }
    if (!/^https?:$/.test(url.protocol)) return;
    url.hash = '';
    const key = url.toString();
    if (!found.has(key)) found.set(key, { url: key, kind, internal: url.host === new URL(base).host, count: 0, ...extra });
    found.get(key).count++;
  };
  const anchors = clean.match(/<a\b[^>]*>[\s\S]*?<\/a>|<a\b[^>]*>/gi) || [];
  for (const a of anchors) {
    const at = tags(a, 'a')[0] || {};
    const text = a.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
    add(at.href, 'link', { text, nofollow: /nofollow|sponsored|ugc/i.test(at.rel || '') });
  }
  if (options.assets) {
    for (const t of tags(clean, 'img')) add(t.src, 'image');
    for (const t of tags(clean, 'x-script')) add(t.src, 'script');
    for (const t of tags(clean, 'link')) if (/stylesheet|icon|preload/i.test(t.rel || '')) add(t.href, 'resource');
    for (const t of tags(clean, 'iframe')) add(t.src, 'iframe');
  }
  return [...found.values()];
}

/** Check one URL: HEAD first, GET when the server rejects HEAD. */
export async function checkUrl(url, options = {}) {
  const doFetch = options.fetch || globalThis.fetch;
  const timeout = options.timeout ?? 15000;
  const request = async (method) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await doFetch(url, { method, redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': options.userAgent || UA, accept: '*/*' } });
      if (method === 'GET') res.body?.cancel?.().catch(() => {});
      return { status: res.status, finalUrl: res.url || url, redirected: !!res.redirected || (res.url && res.url !== url) };
    } finally { clearTimeout(timer); }
  };
  const started = Date.now();
  try {
    let r = await request('HEAD');
    if ([403, 404, 405, 429, 501].includes(r.status) || r.status >= 500) r = await request('GET');
    return { ...r, ms: Date.now() - started };
  } catch (err) {
    return { status: null, error: err.name === 'AbortError' ? 'timeout' : (err.cause?.code || err.message), ms: Date.now() - started };
  }
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

/**
 * Find broken links on a page.
 * @param {string} pageUrl
 * @param {{fetch?: typeof fetch, assets?: boolean, scope?: 'all'|'internal'|'external', concurrency?: number, timeout?: number, userAgent?: string}} [options]
 */
export async function findBrokenLinks(pageUrl, options = {}) {
  const doFetch = options.fetch || globalThis.fetch;
  const start = new URL(/^https?:\/\//i.test(pageUrl) ? pageUrl : `https://${pageUrl}`).toString();
  const res = await doFetch(start, { redirect: 'follow', headers: { 'user-agent': options.userAgent || UA } });
  if (!res.ok) throw new Error(`The page returned HTTP ${res.status}`);
  const base = res.url || start;
  let links = extractLinks(await res.text(), base, options);
  if (options.scope === 'internal') links = links.filter((l) => l.internal || l.invalid);
  if (options.scope === 'external') links = links.filter((l) => !l.internal || l.invalid);
  const results = await pool(links, options.concurrency ?? 8, async (l) => (l.invalid ? { ...l, status: null, error: 'invalid URL' } : { ...l, ...(await checkUrl(l.url, { ...options, fetch: doFetch })) }));
  const broken = results.filter((r) => r.error || r.status >= 400);
  const redirected = results.filter((r) => !r.error && r.status < 400 && r.redirected);
  return {
    url: start, finalUrl: base, checked: results.length,
    summary: { ok: results.length - broken.length, broken: broken.length, redirected: redirected.length, internal: results.filter((r) => r.internal).length, external: results.filter((r) => !r.internal).length },
    links: results, broken, redirected, ok: broken.length === 0,
  };
}
