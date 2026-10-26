import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractLinks, checkUrl, findBrokenLinks } from '../src/index.js';

const PAGE = `<html><head><link rel="stylesheet" href="/style.css"><script src="/app.js"></script></head><body>
<a href="/ok">OK page</a> <a href="/ok#section">Same page, anchor</a> <a href="/missing">Missing <b>page</b></a>
<a href="https://other.test/gone" rel="nofollow">External</a> <a href="/moved">Moved</a> <a href="mailto:a@b.c">Mail</a>
<a href="#top">Top</a> <a href="javascript:void(0)">JS</a> <a href="http://[bad">Bad</a> <a href="/slow">Slow</a>
<img src="/img/logo.png"><!-- <a href="/commented">x</a> --></body></html>`;

const site = {
  'https://example.com/page': { status: 200, body: PAGE },
  'https://example.com/ok': { status: 200 },
  'https://example.com/moved': { status: 200, redirectedTo: 'https://example.com/new' },
  'https://example.com/style.css': { status: 200 },
  'https://example.com/app.js': { status: 404 },
  'https://example.com/img/logo.png': { status: 200, headStatus: 405 },
};
const fakeFetch = async (url, init = {}) => {
  if (url === 'https://example.com/slow') return new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
  if (url.startsWith('https://other.test')) throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } });
  const r = site[url];
  const status = !r ? 404 : init.method === 'HEAD' && r.headStatus ? r.headStatus : r.status;
  const res = new Response(r?.body ?? null, { status });
  Object.defineProperty(res, 'url', { value: r?.redirectedTo || url });
  Object.defineProperty(res, 'redirected', { value: !!r?.redirectedTo });
  return res;
};

test('extracts links, skips non-http schemes, dedupes anchors and ignores comments', () => {
  const links = extractLinks(PAGE, 'https://example.com/page');
  const urls = links.map((l) => l.url);
  assert.ok(urls.includes('https://example.com/ok'));
  assert.equal(links.find((l) => l.url === 'https://example.com/ok').count, 2);
  assert.equal(links.find((l) => l.url === 'https://example.com/missing').text, 'Missing page');
  assert.equal(links.find((l) => l.url === 'https://other.test/gone').nofollow, true);
  assert.ok(!urls.some((u) => /mailto|javascript|commented/.test(u)));
  assert.ok(links.some((l) => l.invalid));
  assert.ok(!urls.includes('https://example.com/style.css'));
});

test('includes assets on request and honours <base>', () => {
  const kinds = extractLinks(PAGE, 'https://example.com/page', { assets: true }).map((l) => l.kind);
  for (const k of ['image', 'script', 'resource']) assert.ok(kinds.includes(k), k);
  const based = extractLinks('<base href="https://cdn.test/x/"><a href="a">a</a>', 'https://example.com/');
  assert.equal(based[0].url, 'https://cdn.test/x/a');
});

test('falls back to GET when HEAD is rejected', async () => {
  const r = await checkUrl('https://example.com/img/logo.png', { fetch: fakeFetch });
  assert.equal(r.status, 200);
});

test('finds broken links, redirects and timeouts', async () => {
  const r = await findBrokenLinks('https://example.com/page', { fetch: fakeFetch, assets: true, timeout: 50 });
  const broken = Object.fromEntries(r.broken.map((b) => [b.url, b.status ?? b.error]));
  assert.equal(broken['https://example.com/missing'], 404);
  assert.equal(broken['https://example.com/app.js'], 404);
  assert.equal(broken['https://other.test/gone'], 'ENOTFOUND');
  assert.equal(broken['https://example.com/slow'], 'timeout');
  assert.equal(r.redirected.map((x) => x.url).join(), 'https://example.com/moved');
  assert.equal(r.ok, false);
});

test('scopes and page errors', async () => {
  const internal = await findBrokenLinks('https://example.com/page', { fetch: fakeFetch, scope: 'internal', timeout: 50 });
  assert.ok(internal.links.every((l) => l.internal || l.invalid));
  await assert.rejects(findBrokenLinks('https://example.com/nope', { fetch: fakeFetch }), /HTTP 404/);
});
