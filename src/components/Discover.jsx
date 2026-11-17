import { MODEL_CREDITS } from "../lib/models.js";
import { useMemo, useState } from "react";
import { CATEGORIES } from "../data/lots.js";
import { FACTORS, GROUPS, PRESETS, reasons, scoreLot } from "../lib/rank.js";
import { ALGOS, runAlgo } from "../lib/feedAlgos.js";
import { buildIndex, search, suggest, METHODS, FIELDS, DEFAULT_FIELD_W } from "../lib/search.js";
import { eur } from "../lib/format.js";
import LotCard, { lotImg } from "./LotCard.jsx";
import { go, lotHref } from "../lib/nav.js";

const SUGGESTED = ["gold pocket watch", "hokusai", "ancient coin", "silver teapot", "porcelain vase", "renaissance helmet", "oil landscape", "tifany vase"];

// Search results = text relevance (chosen method) blended with feed signals. Feed = chosen algorithm.
function useResults({ lots, query, method, fw, blend, algo, ctx, W, cat, onlySaved, index }) {
  return useMemo(() => {
    const base = lots.filter(l => (cat === "all" || l.category === cat) && (!onlySaved || ctx.saved.has(l.lot_id)));
    if (query.trim()) {
      const ids = new Set(base.map(l => l.lot_id));
      let hits = search(index, query, method, fw).filter(h => ids.has(h.l.lot_id));
      // Live as you type: a half-typed last word still finds things (falls back to prefix matching).
      if (!hits.length && !/\s$/.test(query)) hits = search(index, query, "prefix", fw).filter(h => ids.has(h.l.lot_id));
      const sumW = Object.values(W).reduce((a, b) => a + b, 0) || 1;
      return hits.map(h => {
        const f = scoreLot(h.l, { ...ctx, lots }); const c = {};
        FACTORS.forEach(F => (c[F.k] = (W[F.k] * f[F.k]) / sumW));
        const sig = Object.values(c).reduce((a, b) => a + b, 0);
        return { l: h.l, f, c, text: h.norm, raw: h.score, evidence: h.evidence, sig, s: blend * h.norm + (1 - blend) * sig };
      }).sort((a, b) => b.s - a.s);
    }
    return runAlgo(algo, base, ctx, W);
  }, [lots, query, method, fw, blend, algo, W, cat, onlySaved, ctx.saved, ctx.budget, ctx.affinity, index, Math.floor(ctx.now / 60000)]); // eslint-disable-line react-hooks/exhaustive-deps
}

function Why({ p, rankNo, query, method }) {
  return (
    <details className="why-box">
      <summary>Why #{rankNo}?</summary>
      {query && p.evidence && (
        <div className="why-sec">
          <b>Text match · {METHODS.find(m => m.k === method)?.label} · {(p.text * 100).toFixed(0)}%</b>
          {p.evidence.map((e, i) => <div key={i} className="ev"><span>{e.field}</span><code>{e.terms.join(", ")}</code><em>+{e.contribution}</em></div>)}
        </div>
      )}
      {p.c && (
        <div className="why-sec">
          <b>Feed signals · {Math.round((p.sig ?? p.s) * 100)}</b>
          {FACTORS.filter(F => p.c[F.k] > 0.0005).map(F => <div key={F.k} className="sig"><i style={{ background: F.c }} /><span>{F.name}</span><meter min="0" max="1" value={p.f[F.k]} /><em>{(p.c[F.k] * 100).toFixed(0)}</em></div>)}
        </div>
      )}
      {!p.c && p.why && <div className="why-sec"><b>{p.why}</b></div>}
    </details>
  );
}

export default function Discover({ lots, now, user, saved, toggleSave, source, onlySaved }) {
  const [cat, setCat] = useState("all");
  const [preset, setPreset] = useState("foryou");
  const [W, setW] = useState(PRESETS.foryou.w);
  const [budget, setBudget] = useState(3000);
  const [panel, setPanel] = useState(false);
  const [affinity, setAffinity] = useState({});
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("bm25");
  const [fw, setFw] = useState(DEFAULT_FIELD_W);
  const [blend, setBlend] = useState(0.7);
  const [algo, setAlgo] = useState("weighted");
  const [compare, setCompare] = useState(false);
  const [prev, setPrev] = useState(new Map());
  const [focus, setFocus] = useState(false);
  const [recent, setRecent] = useState(() => { try { return JSON.parse(localStorage.getItem("trove-recent") || "[]"); } catch { return []; } });
  const remember = q => { const t = q.trim(); if (!t) return; const n = [t, ...recent.filter(x => x !== t)].slice(0, 5); setRecent(n); try { localStorage.setItem("trove-recent", JSON.stringify(n)); } catch { /* ignore */ } };
  const pick = q => { mark(); setQuery(q); remember(q); setFocus(false); };
  const index = useMemo(() => buildIndex(lots), [lots]);
  const hidden = useMemo(() => new Set(), []);

  const ctx = { interests: user?.interests || [], affinity, saved, budget, now, hidden };
  const ranked = useResults({ lots, query, method, fw, blend, algo, ctx, W, cat, onlySaved, index });
  const order = new Map(ranked.map((p, i) => [p.l.lot_id, i]));
  const mark = () => setPrev(order);
  const learn = l => setAffinity(a => ({ ...a, [l.category]: Math.min(1, (a[l.category] || 0) + 0.25) }));
  const sugg = query.trim() && ranked.length === 0 ? suggest(index, query) : null;
  // Never a dead end: typo-tolerant retry, then trending.
  const fuzzyHits = useMemo(() => (query.trim() && ranked.length === 0 && method !== "fuzzy" ? search(index, query, "fuzzy", fw).slice(0, 8) : []), [query, ranked.length, method, index, fw]);
  const trending = useMemo(() => runAlgo("popular", lots, ctx, W).slice(0, 8), [lots]); // eslint-disable-line react-hooks/exhaustive-deps
  const ac = useMemo(() => {
    const q = query.trim(); if (!q) return null;
    const titles = search(index, q, "prefix", { title: 5, brand: 3, category: 1, description: 0, tags: 0 }).slice(0, 5).map(h => h.l);
    const cats = CATEGORIES.filter(c => c.label.toLowerCase().includes(q.toLowerCase()));
    const live = [...new Map(search(index, q, "prefix", fw).filter(h => h.l.live).map(h => [h.l.seller_name, h.l])).values()].slice(0, 3);
    return { titles, cats, live };
  }, [query, index, fw]);
  const liveMatches = query.trim() ? [...new Map(ranked.filter(p => p.l.live).map(p => [p.l.seller_name, p.l])).values()].slice(0, 6) : [];

  const liveLots = lots.filter(l => l.live);
  const usedCats = CATEGORIES.filter(c => lots.some(l => l.category === c.id));

  // Compare: three strategies on the same query (or feed), top 6 each.
  const compareCols = useMemo(() => {
    if (!compare) return [];
    if (query.trim()) {
      return ["token", "bm25", "tfidf"].map(m => ({ key: m, label: METHODS.find(x => x.k === m).label, help: METHODS.find(x => x.k === m).help, list: search(index, query, m, fw).slice(0, 6) }));
    }
    return ["weighted", "popular", "diverse"].map(a => ({ key: a, label: ALGOS.find(x => x.k === a).label, help: ALGOS.find(x => x.k === a).help, list: runAlgo(a, lots, ctx, W).slice(0, 6) }));
  }, [compare, query, fw, index, lots, W, budget, saved]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="discover">
      {!onlySaved && !query && (
        <section className="wrap live-banner" onClick={() => go("live")} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && go("live")}>
          <div className="lb-copy">
            <span className="badge live"><i className="live-dot" />Live now</span>
            <h2>Sellers are live right now</h2>
            <p>{new Set(liveLots.map(l => l.seller_name)).size} sellers showing {liveLots.length} lots on camera. Jump in, ask questions, and bid with the room.</p>
            <span className="btn primary">Browse live shows</span>
          </div>
          <div className="lb-stack" aria-hidden="true">
            {liveLots.slice(0, 4).map((l, i) => <img key={l.lot_id} src={lotImg(l, 300, 380)} alt="" style={{ "--i": i }} />)}
          </div>
        </section>
      )}

      <section className="wrap searchbar">
        <form onSubmit={e => { e.preventDefault(); remember(query); setFocus(false); e.target.querySelector("input")?.blur(); }} role="search" className="sbox">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <input value={query} onChange={e => { mark(); setQuery(e.target.value); }} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)}
            placeholder="Search watches, coins, prints, silver…" aria-label="Search lots" enterKeyHint="search" autoComplete="off" />
          {query && <button type="button" className="clear" onClick={() => setQuery("")} aria-label="Clear search">✕</button>}
          {focus && (
            <div className="ac" role="listbox">
              {!query.trim() ? (
                <>
                  {recent.length > 0 && <div className="ac-sec"><span>Recent</span>{recent.map(r => <button type="button" key={r} onMouseDown={() => pick(r)}>{r}</button>)}</div>}
                  <div className="ac-sec"><span>Trending searches</span>{SUGGESTED.slice(0, 5).map(r => <button type="button" key={r} onMouseDown={() => pick(r)}>{r}</button>)}</div>
                </>
              ) : (
                <>
                  {ac.live.length > 0 && <div className="ac-sec"><span>Live now</span>{ac.live.map(l => <button type="button" key={l.seller_name} onMouseDown={() => go("live/" + encodeURIComponent(l.seller_name))}><i className="live-dot" style={{ color: "#ff3b30" }} />@{l.seller_name} is showing {l.title.split(" – ")[0]}</button>)}</div>}
                  {ac.titles.length > 0 && <div className="ac-sec"><span>Lots</span>{ac.titles.map(l => <button type="button" key={l.lot_id} onMouseDown={() => { remember(query); go("lot/" + encodeURIComponent(l.lot_id)); }}><img src={lotImg(l, 60, 75)} alt="" />{l.title}</button>)}</div>}
                  {ac.cats.length > 0 && <div className="ac-sec"><span>Categories</span>{ac.cats.map(c => <button type="button" key={c.id} onMouseDown={() => { setCat(c.id); setQuery(""); setFocus(false); }}>{c.label}</button>)}</div>}
                  {!ac.titles.length && !ac.cats.length && !ac.live.length && <div className="ac-sec"><span>No direct matches · press search for typo-tolerant results</span></div>}
                </>
              )}
            </div>
          )}
        </form>
        {!query && <div className="try">Try {SUGGESTED.map(s => <button key={s} onClick={() => pick(s)}>{s}</button>)}</div>}
      </section>

      <section className="wrap feed-head">
        <div>
          <h1>{query ? `Results for “${query}”` : onlySaved ? "Saved" : "Discover"}</h1>
          <p className="muted">{query ? `${ranked.length} matches · ${METHODS.find(m => m.k === method).label}, blended ${Math.round(blend * 100)}% text / ${Math.round((1 - blend) * 100)}% signals` : `${onlySaved ? "Your saved lots" : source} · ${ranked.length} lots · ${ALGOS.find(a => a.k === algo).label}`}</p>
        </div>
        <div className="feed-controls">
          <label className="pick">
            <span>{query ? "Text model" : "Ranked by"}</span>
            {query ? (
              <select value={method} onChange={e => { mark(); setMethod(e.target.value); }} aria-label="Text model">{METHODS.map(m => <option key={m.k} value={m.k}>{m.label}</option>)}</select>
            ) : (
              <select value={algo} onChange={e => { mark(); setAlgo(e.target.value); }} aria-label="Feed algorithm">{ALGOS.map(a => <option key={a.k} value={a.k}>{a.label}</option>)}</select>
            )}
          </label>
          <button className="pill ghost" aria-pressed={compare} onClick={() => setCompare(c => !c)}>Compare</button>
          <button className="pill ghost" aria-expanded={panel} onClick={() => setPanel(t => !t)}>Tune</button>
          <a className="pill dark" href="#/lab">Ranking lab →</a>
        </div>
      </section>

      <section className="wrap cats" aria-label="Categories">
        <button className="chip" aria-pressed={cat === "all"} onClick={() => { mark(); setCat("all"); }}>All</button>
        {usedCats.map(c => <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => { mark(); setCat(c.id); }}>{c.label}</button>)}
      </section>

      {panel && (
        <section className="wrap tune">
          <div className="tune-cols">
            {query && (
              <div className="tune-block">
                <h3>Text retrieval</h3>
                <p className="muted small">{METHODS.find(m => m.k === method).help}. Field weights decide where a match counts most.</p>
                {FIELDS.map(F => (
                  <div className="w" key={F.k}>
                    <label htmlFor={"f-" + F.k}><span>{F.label}</span><b>{fw[F.k]}</b></label>
                    <input id={"f-" + F.k} type="range" min="0" max="10" value={fw[F.k]} onChange={e => { mark(); setFw(x => ({ ...x, [F.k]: +e.target.value })); }} />
                  </div>
                ))}
                <div className="w">
                  <label htmlFor="blend"><span>Text vs signals</span><b>{Math.round(blend * 100)}% text</b></label>
                  <input id="blend" type="range" min="0" max="1" step="0.05" value={blend} onChange={e => { mark(); setBlend(+e.target.value); }} />
                  <small>Final score = text × {blend.toFixed(2)} + signals × {(1 - blend).toFixed(2)}</small>
                </div>
              </div>
            )}
            <div className="tune-block">
              <h3>Feed signals</h3>
              <div className="profiles">{Object.entries(PRESETS).map(([k, p]) => <button key={k} className="chip" aria-pressed={preset === k} onClick={() => { mark(); setPreset(k); setW(p.w); }}>{p.label}</button>)}</div>
              <div className="w">
                <label htmlFor="budget"><span>Budget per lot</span><b>{eur(budget)}</b></label>
                <input id="budget" type="range" min="100" max="30000" step="100" value={budget} onChange={e => { mark(); setBudget(+e.target.value); }} />
              </div>
              {GROUPS.map(g => (
                <div className="sig-grid" key={g.k}>
                  <span className="wg-h">{g.label}</span>
                  {FACTORS.filter(F => F.g === g.k).map(F => (
                    <div className="w" key={F.k}>
                      <label htmlFor={"w-" + F.k}><span><i style={{ background: F.c }} />{F.name}</span><b>{W[F.k]}</b></label>
                      <input id={"w-" + F.k} type="range" min="0" max="10" value={W[F.k]} onChange={e => { mark(); setPreset(""); setW(w => ({ ...w, [F.k]: +e.target.value })); }} />
                      <small>{F.help}</small>
                    </div>
                  ))}
                </div>
              ))}
              <a className="link small" href="#/lab">See every algorithm × weighting side by side in the Ranking lab →</a>
            </div>
          </div>
        </section>
      )}

      {compare && (
        <section className="wrap compare">
          <h3>{query ? `Same query, three retrieval methods` : "Same catalog, three feed algorithms"}</h3>
          <div className="cmp-cols">
            {compareCols.map((col, ci) => (
              <div className="cmp-col" key={col.key}>
                <div className="cmp-head"><span>0{ci + 1}</span><b>{col.label}</b><small>{col.help}</small></div>
                {col.list.length ? col.list.map((p, i) => {
                  const other = compareCols[0].list.findIndex(x => x.l.lot_id === p.l.lot_id);
                  const d = ci === 0 ? null : other === -1 ? "new" : other - i;
                  return (
                    <a key={p.l.lot_id} className="cmp-row" href={lotHref(p.l.lot_id)}>
                      <em>{i + 1}</em><img src={lotImg(p.l, 80, 100)} alt="" /><span>{p.l.title}</span>
                      {d !== null && <i className={d === "new" ? "nw" : d > 0 ? "up" : d < 0 ? "dn" : "eq"}>{d === "new" ? "new" : d > 0 ? "▲" + d : d < 0 ? "▼" + -d : "="}</i>}
                    </a>
                  );
                }) : <p className="muted small">No matches.</p>}
              </div>
            ))}
          </div>
          <p className="muted small">Arrows compare each column with the first. None of these methods understand meaning; they are transparent, explainable baselines.</p>
        </section>
      )}

      {liveMatches.length > 0 && (
        <section className="wrap live-strip">
          <b><i className="live-dot" style={{ color: "#ff3b30" }} /> Live now for “{query}”</b>
          <div className="ls-row">
            {liveMatches.map(l => (
              <button key={l.seller_name} onClick={() => go("live/" + encodeURIComponent(l.seller_name))}>
                <img src={lotImg(l, 160, 200)} alt="" /><span>@{l.seller_name}</span><small>{l.title.split(" – ")[0]}</small>
              </button>
            ))}
          </div>
        </section>
      )}
      <section className={"wrap grid" + (panel || compare ? " show-why" : "")}>
        {ranked.length === 0 && (
          <div className="empty-state">
            {query ? (
              <>
                <h3>No exact matches for “{query}”</h3>
                <p className="muted">{sugg ? <>Did you mean <button className="link" onClick={() => pick(sugg)}>{sugg}</button>? </> : null}{fuzzyHits.length ? "Here are close matches that allow for typos." : "Here's what collectors are watching right now."}</p>
              </>
            ) : onlySaved ? (
              <>
                <h3>{user ? "Nothing saved yet" : "Save finds to watch them"}</h3>
                <p className="muted">Tap the heart on any lot. You'll get a heads-up before it goes live. Popular to save right now:</p>
              </>
            ) : <h3>No lots in this category yet. Trending instead:</h3>}
          </div>
        )}
        {ranked.length === 0 && (query && fuzzyHits.length ? fuzzyHits.map(h => ({ l: h.l, text: h.norm, evidence: h.evidence })) : trending).map((p, i) => (
          <div className="grid-cell" key={"fb-" + p.l.lot_id}>
            <LotCard p={p} now={now} saved={saved} toggleSave={toggleSave} reasons={[p.text ? "Close match" : "Trending"]} />
          </div>
        ))}
        {ranked.map((p, i) => {
          const was = prev.get(p.l.lot_id);
          const moved = was !== undefined && was !== i ? was - i : 0;
          return (
            <div className="grid-cell" key={p.l.lot_id} onClickCapture={() => learn(p.l)}>
              {moved !== 0 && <span className={"moved " + (moved > 0 ? "up" : "down")}>{moved > 0 ? "▲" : "▼"}{Math.abs(moved)}</span>}
              <LotCard p={p} now={now} saved={saved} toggleSave={toggleSave} reasons={p.c && !query ? reasons(p, ctx) : query ? [`${Math.round(p.text * 100)}% text match`] : [p.why]} />
              <Why p={p} rankNo={i + 1} query={query} method={method} />
            </div>
          );
        })}
      </section>
      <footer className="wrap foot">Trove is a prototype. Sample listings, prices and sellers are illustrative; photos are public-domain images from The Met Open Access. Search methods follow Search Ranking Labs. {MODEL_CREDITS}</footer>
    </main>
  );
}
