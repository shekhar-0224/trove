// Transparent lexical search over lots, after Search Ranking Labs: six methods, per-field weights, full evidence.
const STOP = new Set("a an and the of for with in on to by from at or is it this that".split(" "));
export const FIELDS = [
  { k: "title", label: "Title", get: l => l.title },
  { k: "description", label: "Description", get: l => l.description },
  { k: "brand", label: "Brand / model", get: l => [l.brand, l.model].filter(Boolean).join(" ") },
  { k: "category", label: "Category", get: l => [l.category, l.category_label, l.subcategory].filter(Boolean).join(" ") },
  { k: "tags", label: "Tags & condition", get: l => [...(l.tags || []), l.condition, l.year].filter(Boolean).join(" ") }
];
export const DEFAULT_FIELD_W = { title: 5, description: 2, brand: 3, category: 2, tags: 1 };
export const METHODS = [
  { k: "token", label: "Token match", help: "Counts matching query words" },
  { k: "bm25", label: "BM25", help: "Balances term rarity and field length" },
  { k: "tfidf", label: "TF-IDF cosine", help: "Rarer words weigh more; compares vectors" },
  { k: "phrase", label: "Exact phrase", help: "Rewards the whole query in order" },
  { k: "prefix", label: "Prefix", help: "Matches the start of words, good while typing" },
  { k: "fuzzy", label: "Fuzzy-lite", help: "Tolerates small typos (1–2 letters)" }
];

const stem = w => (w.length > 4 && w.endsWith("es") ? w.slice(0, -2) : w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);
export function tokenize(s) {
  return String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter(w => w && !STOP.has(w)).map(stem);
}
function lev(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let best = i;
    for (let j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); best = Math.min(best, cur[j]); }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

export function buildIndex(lots) {
  const docs = lots.map(l => {
    const f = {};
    FIELDS.forEach(F => { const toks = tokenize(F.get(l)); const tf = {}; toks.forEach(t => (tf[t] = (tf[t] || 0) + 1)); f[F.k] = { toks, tf, len: toks.length, raw: String(F.get(l) || "").toLowerCase() }; });
    return { l, f };
  });
  const N = docs.length, df = {}, avg = {};
  FIELDS.forEach(F => { avg[F.k] = docs.reduce((a, d) => a + d.f[F.k].len, 0) / (N || 1) || 1; });
  docs.forEach(d => { const seen = new Set(); FIELDS.forEach(F => d.f[F.k].toks.forEach(t => seen.add(t))); seen.forEach(t => (df[t] = (df[t] || 0) + 1)); });
  const idf = t => Math.log(1 + (N - (df[t] || 0) + 0.5) / ((df[t] || 0) + 0.5));
  return { docs, N, df, avg, idf, vocab: Object.keys(df) };
}

// Returns [{ l, score, evidence: [{field, terms, contribution}] }] for docs with score > 0.
export function search(index, query, method, fw) {
  const q = tokenize(query);
  if (!q.length) return [];
  const qRaw = String(query).toLowerCase().trim();
  const { docs, idf, avg } = index;
  const k1 = 1.2, b = 0.75;
  const out = [];
  for (const d of docs) {
    let score = 0; const evidence = [];
    if (method === "tfidf") {
      const qv = {}; q.forEach(t => (qv[t] = (qv[t] || 0) + idf(t)));
      const dv = {};
      FIELDS.forEach(F => { const w = fw[F.k] || 0; if (!w) return; Object.entries(d.f[F.k].tf).forEach(([t, c]) => (dv[t] = (dv[t] || 0) + w * c * idf(t))); });
      let dot = 0, nq = 0, nd = 0;
      Object.entries(qv).forEach(([t, v]) => { nq += v * v; if (dv[t]) dot += v * dv[t]; });
      Object.values(dv).forEach(v => (nd += v * v));
      score = dot ? dot / (Math.sqrt(nq) * Math.sqrt(nd)) : 0;
      if (score) FIELDS.forEach(F => { const terms = q.filter(t => d.f[F.k].tf[t]); if (terms.length && fw[F.k]) evidence.push({ field: F.label, terms, contribution: +(terms.reduce((a, t) => a + (fw[F.k] * d.f[F.k].tf[t] * idf(t)) * qv[t], 0) / (Math.sqrt(nq) * Math.sqrt(nd))).toFixed(3) }); });
    } else {
      FIELDS.forEach(F => {
        const w = fw[F.k] || 0; if (!w) return;
        const fd = d.f[F.k]; let c = 0; const terms = [];
        if (method === "phrase") {
          if (fd.raw.includes(qRaw)) { c = w * 2; terms.push(`"${qRaw}"`); }
          else { const hit = q.filter(t => fd.tf[t]); if (hit.length === q.length && q.length > 1) { c = w * 0.5; terms.push(...hit); } }
        } else {
          q.forEach(t => {
            let tf = 0, matched = null;
            if (method === "prefix") { fd.toks.forEach(x => { if (x.startsWith(t)) { tf++; matched = x; } }); }
            else if (method === "fuzzy") { const max = t.length > 6 ? 2 : t.length > 3 ? 1 : 0; fd.toks.forEach(x => { const dd = x === t ? 0 : lev(t, x, max); if (dd <= max) { tf += dd === 0 ? 1 : 0.6; matched = x; } }); }
            else { tf = fd.tf[t] || 0; if (tf) matched = t; }
            if (!tf) return;
            terms.push(matched === t ? t : `${t}→${matched}`);
            if (method === "bm25") c += w * idf(t) * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * fd.len / avg[F.k]));
            else c += w * Math.min(tf, 3);
          });
        }
        if (c > 0) { score += c; evidence.push({ field: F.label, terms, contribution: +c.toFixed(2) }); }
      });
    }
    if (score > 0) out.push({ l: d.l, score, evidence });
  }
  out.sort((a, b2) => b2.score - a.score);
  const top = out[0]?.score || 1;
  out.forEach(r => (r.norm = r.score / top));
  return out;
}

// "Did you mean" from the vocabulary, for queries with no hits.
export function suggest(index, query) {
  const q = tokenize(query); if (!q.length) return null;
  const fixed = q.map(t => { if (index.df[t]) return t; let best = t, bd = 3; index.vocab.forEach(v => { const d = lev(t, v, 2); if (d < bd) { bd = d; best = v; } }); return best; });
  return fixed.join(" ") !== q.join(" ") ? fixed.join(" ") : null;
}
