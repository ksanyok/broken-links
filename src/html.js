// Minimal, dependency-free extraction of <head> metadata from HTML.
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
export const decode = (s) => String(s ?? '').replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => {
  if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1));
  return ENTITIES[e.toLowerCase()] ?? m;
});

/** Parse the attributes of a single start tag. */
export function attrs(tag) {
  const out = {};
  const re = /([\w:-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  const body = tag.replace(/^<\w+/, '').replace(/\/?>$/, '');
  for (let m; (m = re.exec(body));) out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return out;
}

/** All start tags of a given name, as attribute objects. */
export const tags = (html, name) => (html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || []).map(attrs);

/** Text content of the first element with this name. */
export function text(html, name) {
  const m = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i').exec(html);
  return m ? decode(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() : null;
}

/** Remove scripts, styles and comments. */
export const strip = (html) => String(html).replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, '');

/** Collect <meta> tags keyed by name/property (lowercase); repeated keys become arrays. */
export function metaMap(html) {
  const out = {};
  for (const a of tags(html, 'meta')) {
    const key = (a.property || a.name || a['http-equiv'] || '').toLowerCase();
    if (!key || a.content === undefined) continue;
    if (key in out) out[key] = [].concat(out[key], a.content);
    else out[key] = a.content;
  }
  return out;
}

export const first = (v) => (Array.isArray(v) ? v[0] : v);
