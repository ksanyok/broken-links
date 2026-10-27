#!/usr/bin/env node
import { findBrokenLinks } from '../src/index.js';

const HELP = `Usage: broken-links <url> [options]

Collects every link on a page (and optionally images, scripts, stylesheets and
iframes), checks them in parallel and reports 4xx/5xx responses, timeouts,
DNS failures, invalid URLs and redirects.

Options:
  --assets            Also check images, scripts, stylesheets and iframes
  --internal          Only links to the same host
  --external          Only links to other hosts
  --redirects         List links that redirect
  --concurrency <n>   Parallel requests (default: 8)
  --timeout <ms>      Timeout per request (default: 15000)
  --json              Print JSON
  -h, --help          Show this help

Online version (no install): https://promopilot.link/en/tools/broken-links.php?utm_source=github&utm_medium=cli&utm_campaign=tools&utm_content=broken-links
`;

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const value = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
if (!args.length || flag('-h') || flag('--help')) { process.stdout.write(HELP); process.exit(args.length ? 0 : 2); }

const color = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (color ? `\x1b[${code}m${s}\x1b[0m` : s);
const valued = new Set(['--concurrency', '--timeout']);

try {
  const r = await findBrokenLinks(args.find((a, i) => !a.startsWith('-') && !valued.has(args[i - 1])), {
    assets: flag('--assets'), scope: flag('--internal') ? 'internal' : flag('--external') ? 'external' : 'all',
    concurrency: Number(value('--concurrency') || 8), timeout: Number(value('--timeout') || 15000),
  });
  if (flag('--json')) { console.log(JSON.stringify(r, null, 2)); process.exit(r.ok ? 0 : 1); }
  const s = r.summary;
  console.log(`${c(1, 'Page:')}    ${r.finalUrl}`);
  console.log(`${c(1, 'Checked:')} ${r.checked} (${s.internal} internal, ${s.external} external) — ${c(32, `${s.ok} ok`)}, ${s.broken ? c(31, `${s.broken} broken`) : '0 broken'}, ${s.redirected} redirected\n`);
  for (const b of r.broken) {
    console.log(`  ${c(31, String(b.status ?? 'ERR').padEnd(4))} ${b.url}${b.error ? c(2, `  (${b.error})`) : ''}`);
    if (b.text) console.log(`       ${c(2, `"${b.text}"${b.count > 1 ? ` ×${b.count}` : ''}${b.kind !== 'link' ? ` [${b.kind}]` : ''}`)}`);
  }
  if (flag('--redirects')) for (const x of r.redirected) console.log(`  ${c(33, String(x.status).padEnd(4))} ${x.url}\n       ${c(2, `→ ${x.finalUrl}`)}`);
  if (r.ok) console.log(c(32, '✔ No broken links found'));
  process.exit(r.ok ? 0 : 1);
} catch (err) {
  console.error(c(31, `Error: ${err.message}`));
  process.exit(2);
}
