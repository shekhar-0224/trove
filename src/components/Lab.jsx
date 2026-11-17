import { useMemo, useState } from "react";
import { FACTORS, GROUPS, PRESETS, signals } from "../lib/rank.js";
import { ALGOS, runAlgo } from "../lib/feedAlgos.js";
import { buildIndex, search, METHODS, FIELDS, DEFAULT_FIELD_W } from "../lib/search.js";
import { lotImg } from "./LotCard.jsx";
import { lotHref } from "../lib/nav.js";
import { eur } from "../lib/format.js";

const QUERIES = ["gold", "silver", "ancient", "pocket watch", "porcelain vase", "landscape", "hokusai", "helmet"];
const TOP = 10;
const FC = Object.fromEntries(FACTORS.map(f => [f.k, f]));
const TEXT_C = "#86868b";
const WEIGHT_AWARE = new Set(["weighted", "diverse"]);
const SCENARIOS = { text: { label: "Text only", help: "Ignore signals, pure retrieval", w: PRESETS.foryou.w, blend: 1 }, ...Object.fromEntries(Object.entries(PRESETS).map(([k, p]) => [k, { ...p, blend: 0.6 }])) };

// One ranking pass: returns rows with the parts that make up each score, so the bar can show them.
function runLab(cfg, lots, index, ctx) {
  const sumW = FACTORS.reduce((a, F) => a + (cfg.W[F.k] || 0), 0) || 1;
  const parts = l => {
    const sig = signals(l, { ...ctx, lots }); const c = {}; let s = 0;
    FACTORS.forEach(F => { c[F.k] = ((cfg.W[F.k] || 0) * sig[F.k].v) / sumW; s += c[F.k]; });
    return { sig, c, s };
  };
  if (cfg.mode === "search") {
    if (!cfg.query.trim()) return [];
    return search(index, cfg.query, cfg.method, cfg.fw).map(h => {
      const p = parts(h.l);
      const segs = [{ k: "text", v: cfg.blend * h.norm }, ...FACTORS.map(F => ({ k: F.k, v: (1 - cfg.blend) * p.c[F.k] }))];
      return { l: h.l, s: cfg.blend * h.norm + (1 - cfg.blend) * p.s, segs, text: h.norm, evidence: h.evidence, sig: p.sig, c: p.c };
    }).sort((a, b) => b.s - a.s);
  }
  return runAlgo(cfg.algo, lots, { ...ctx, hidden: new Set() }, cfg.W).map(r => {
    const p = parts(r.l);
    const segs = WEIGHT_AWARE.has(cfg.algo) ? FACTORS.map(F => ({ k: F.k, v: p.c[F.k] })) : [{ k: "algo", v: r.s }];
    return { l: r.l, s: WEIGHT_AWARE.has(cfg.algo) ? p.s : r.s, segs, why: r.why, sig: p.sig, c: p.c };
  });
}

export default function Lab({ lots, now, user, saved }) {
  const index = useMemo(() => buildIndex(lots), [lots]);
  const ctx = useMemo(() => ({ interests: user?.interests || [], affinity: {}, saved, budget: 3000, now }), [user, saved, Math.floor(now / 60000)]); // eslint-disable-line react-hooks/exhaustive-deps
  const [mode, setMode] = useState("search");
  const [query, setQuery] = useState("gold");
  const [method, setMethod] = useState("bm25");
  const [algo, setAlgo] = useState("weighted");
  const [fw, setFw] = useState(DEFAULT_FIELD_W);
  const [blend, setBlend] = useState(0.6);
  const [scenario, setScenario] = useState("foryou");
  const [W, setW] = useState(PRESETS.foryou.w);
  const [sel, setSel] = useState(null);
  const cfg = { mode, query, method, algo, fw, blend, W };
  const [base, setBase] = useState(() => ({ ...cfg, label: "BM25 · For you" }));

  const rows = useMemo(() => runLab(cfg, lots, index, ctx), [mode, query, method, algo, fw, blend, W, lots, index, ctx]); // eslint-disable-line react-hooks/exhaustive-deps
  const baseRows = useMemo(() => runLab({ ...base, mode, query }, lots, index, ctx), [base, mode, query, lots, index, ctx]);
  const baseRank = new Map(baseRows.map((r, i) => [r.l.lot_id, i]));
  const top = rows.slice(0, TOP);
  const maxS = Math.max(0.01, ...top.map(r => r.s));
  const picked = rows.find(r => r.l.lot_id === sel) || top[0];

  const applyScenario = k => { setScenario(k); setW(SCENARIOS[k].w); if (mode === "search") setBlend(SCENARIOS[k].blend); };
  const setWeight = (k, v) => { setScenario(""); setW(w => ({ ...w, [k]: v })); };
  const sumW = FACTORS.reduce((a, F) => a + (W[F.k] || 0), 0) || 1;
  const methodLabel = METHODS.find(m => m.k === method)?.label, algoObj = ALGOS.find(a => a.k === algo);
  const pin = () => setBase({ ...cfg, label: mode === "search" ? `${methodLabel} · ${SCENARIOS[scenario]?.label || "custom weights"}` : `${algoObj.label} · ${SCENARIOS[scenario]?.label || "custom weights"}` });

  // Matrix: every algorithm against every weight scenario, top 3 each, with overlap against what you're looking at.
  const rowsDef = mode === "search" ? ["token", "bm25", "tfidf", "fuzzy"].map(k => ({ k, label: METHODS.find(m => m.k === k).label })) : ALGOS.map(a => ({ k: a.k, label: a.label }));
  const colsDef = Object.entries(SCENARIOS).filter(([k]) => mode === "search" || k !== "text");
  const myTop5 = new Set(top.slice(0, 5).map(r => r.l.lot_id));
  const matrix = useMemo(() => rowsDef.map(rd => ({
    ...rd,
    cells: colsDef.map(([ck, sc]) => {
      const c = { ...cfg, W: sc.w, blend: sc.blend, ...(mode === "search" ? { method: rd.k } : { algo: rd.k }) };
      const list = runLab(c, lots, index, ctx).slice(0, 5);
      return { ck, list, overlap: list.filter(r => myTop5.has(r.l.lot_id)).length };
    })
  })), [mode, query, fw, lots, index, ctx, rows]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="wrap lab">
      <header className="lab-head">
        <span className="eyebrow">Ranking lab</span>
        <h1>How search and recommendations decide what you see.</h1>
        <p className="muted">Every list on Trove runs the same three steps. Change any step and watch the same lots re-order, with the reason for every position.</p>
      </header>

      <ol className="pipeline" aria-label="Ranking pipeline">
        <li><em>1</em><div><b>Retrieve</b><small>{mode === "search" ? `${methodLabel} finds lots matching “${query || "…"}”` : "Candidates: every lot in the catalogue"}</small></div></li>
        <li><em>2</em><div><b>Score</b><small>{mode === "feed" && !WEIGHT_AWARE.has(algo) ? `${algoObj.label} rule` : `${FACTORS.filter(F => W[F.k] > 0).length} signals × your weights`}</small></div></li>
        <li><em>3</em><div><b>Re-rank</b><small>{mode === "search" ? `Blend ${Math.round(blend * 100)}% text / ${Math.round((1 - blend) * 100)}% signals` : algo === "diverse" ? "Diversify (MMR)" : "Sort by score"}</small></div></li>
      </ol>

      <div className="lab-top">
        <div className="seg lab-mode">
          <button aria-pressed={mode === "search"} onClick={() => setMode("search")}>Search</button>
          <button aria-pressed={mode === "feed"} onClick={() => setMode("feed")}>Recommendations</button>
        </div>
        {mode === "search" ? (
          <form className="sbox lab-q" onSubmit={e => e.preventDefault()} role="search">
            <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Type a query" aria-label="Query" />
          </form>
        ) : null}
      </div>
      {mode === "search" && <div className="try lab-try">Try {QUERIES.map(q => <button key={q} aria-pressed={q === query} onClick={() => setQuery(q)}>{q}</button>)}</div>}

      <section className="lab-algo">
        <h2>{mode === "search" ? "Step 1 · Text model" : "Algorithm"}</h2>
        <div className="seg algo-seg">
          {(mode === "search" ? METHODS : ALGOS).map(m => {
            const on = mode === "search" ? method === m.k : algo === m.k;
            return <button key={m.k} className="algo-card" aria-pressed={on} onClick={() => (mode === "search" ? setMethod(m.k) : setAlgo(m.k))}>{m.label}</button>;
          })}
        </div>
        <p className="algo-help">{mode === "search" ? METHODS.find(m => m.k === method)?.help : <>{algoObj.help} · <span className={WEIGHT_AWARE.has(algo) ? "uses" : "ignores"}>{WEIGHT_AWARE.has(algo) ? "uses your weights" : "ignores weights"}</span></>}</p>
      </section>

      <div className="lab-body">
        <section className="lab-ctrl">
          <h2>Step 2 · What matters</h2>
          <div className="scen">
            {colsDef.map(([k, s]) => <button key={k} className="chip" aria-pressed={scenario === k} onClick={() => applyScenario(k)} title={s.help}>{s.label}</button>)}
          </div>
          <div className="formula" aria-live="polite">
            {mode === "search" ? (
              <><code>score = <b style={{ color: TEXT_C }}>{blend.toFixed(2)} × text</b> + {(1 - blend).toFixed(2)} × Σ wᵢ·signalᵢ / Σw</code>
                <div className="w"><label htmlFor="lab-blend"><span>Text vs signals</span><b>{Math.round(blend * 100)}% text</b></label><input id="lab-blend" type="range" min="0" max="1" step="0.05" value={blend} onChange={e => { setScenario(""); setBlend(+e.target.value); }} /></div></>
            ) : WEIGHT_AWARE.has(algo) ? <code>score = Σ wᵢ·signalᵢ / Σw{algo === "diverse" ? "  →  then re-ordered to spread categories (MMR λ = 0.65)" : ""}</code>
              : <code>{algo === "popular" ? "score = watchers + 6 × bidders (weights ignored)" : algo === "ending" ? "order = closing time (weights ignored)" : "score = similarity to your saves: category, seller, brand, tags"}</code>}
          </div>
          {GROUPS.map(g => (
            <div className="wgroup" key={g.k}>
              <span className="wg-h">{g.label}</span>
              {FACTORS.filter(F => F.g === g.k).map(F => (
                <div className="wrow" key={F.k}>
                  <label htmlFor={"lw-" + F.k} title={F.help}><i style={{ background: F.c }} /><span>{F.name}</span></label>
                  <input id={"lw-" + F.k} type="range" min="0" max="10" value={W[F.k]} onChange={e => setWeight(F.k, +e.target.value)} style={{ "--c": F.c }} />
                  <b title="Share of the signal score">{Math.round((W[F.k] / sumW) * 100)}%</b>
                </div>
              ))}
            </div>
          ))}
          {mode === "search" && (
            <details className="wgroup fieldw">
              <summary className="wg-h">Where the words must match · field weights</summary>
              {FIELDS.map(F => (
                <div className="wrow" key={F.k}>
                  <label htmlFor={"lf-" + F.k}><i style={{ background: TEXT_C }} /><span>{F.label}</span></label>
                  <input id={"lf-" + F.k} type="range" min="0" max="10" value={fw[F.k]} onChange={e => setFw(x => ({ ...x, [F.k]: +e.target.value }))} />
                  <b>{fw[F.k]}</b>
                </div>
              ))}
            </details>
          )}
        </section>

        <section className="lab-res">
          <div className="res-head">
            <h2>The result</h2>
            <span className="muted small">Arrows vs <b>{base.label}</b></span>
            <button className="pill ghost sm" onClick={pin}>Pin current as baseline</button>
          </div>
          <div className="legend">
            {mode === "search" && <span><i style={{ background: TEXT_C }} />Text match</span>}
            {FACTORS.filter(F => (W[F.k] || 0) > 0 && (mode === "search" ? blend < 1 : WEIGHT_AWARE.has(algo))).map(F => <span key={F.k}><i style={{ background: F.c }} />{F.name}</span>)}
          </div>
          {top.length === 0 ? <p className="muted">No lot matches “{query}” with {methodLabel}. Try Fuzzy-lite or Prefix, or another query.</p> : (
            <ol className="lab-list" style={{ height: top.length * 74 }}>
              {rows.slice(0, TOP).map((r, i) => {
                const b = baseRank.get(r.l.lot_id), d = b === undefined ? "new" : b - i;
                return (
                  <li key={r.l.lot_id} className={"lrow" + (picked?.l.lot_id === r.l.lot_id ? " on" : "")} style={{ transform: `translateY(${i * 74}px)` }}>
                    <button onClick={() => setSel(r.l.lot_id)} aria-label={`Inspect ${r.l.title}`}>
                      <em className="rk">{i + 1}</em>
                      <i className={"dl " + (d === "new" ? "nw" : d > 0 ? "up" : d < 0 ? "dn" : "eq")}>{d === "new" ? "new" : d > 0 ? "▲" + d : d < 0 ? "▼" + -d : "–"}</i>
                      <img src={lotImg(r.l, 96, 120)} alt="" />
                      <span className="lt"><b>{r.l.title}</b><small>{r.l.brand} · {r.l.watchers} watching · {r.l.condition} · {eur(r.l.currentBid)}</small>
                        <span className="sbar" aria-hidden="true">{r.segs.filter(s => s.v > 0.0005).map(s => <i key={s.k} style={{ width: (s.v / maxS) * 100 + "%", background: s.k === "text" ? TEXT_C : s.k === "algo" ? "#1d1d1f" : FC[s.k].c }} />)}</span>
                      </span>
                      <strong>{Math.round(r.s * 100)}</strong>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          {picked && (
            <div className="inspect">
              <div className="in-head">
                <img src={lotImg(picked.l, 120, 150)} alt="" />
                <div><small>Why #{rows.indexOf(picked) + 1}{baseRank.has(picked.l.lot_id) ? ` · was #${baseRank.get(picked.l.lot_id) + 1} in baseline` : " · not in baseline"}</small><b>{picked.l.title}</b><a className="link small" href={lotHref(picked.l.lot_id)}>Open lot →</a></div>
                <strong>{Math.round(picked.s * 100)}<small>points</small></strong>
              </div>
              {mode === "search" && picked.evidence && (
                <div className="in-sec">
                  <span className="wg-h">Text · {methodLabel} · {Math.round(picked.text * 100)}% of best match × {blend.toFixed(2)} = {Math.round(picked.text * blend * 100)} pts</span>
                  {picked.evidence.map((e, i) => <div key={i} className="ev"><span>{e.field}</span><code>{e.terms.join(", ")}</code><em>+{e.contribution}</em></div>)}
                </div>
              )}
              {mode === "feed" && !WEIGHT_AWARE.has(algo) && <div className="in-sec"><span className="wg-h">{algoObj.label}: {picked.why}. The weights below don't affect this algorithm.</span></div>}
              <table className="in-tab">
                <thead><tr><th>Signal</th><th>Raw metric</th><th>0–1</th><th>× weight</th><th>pts</th></tr></thead>
                <tbody>
                  {FACTORS.map(F => {
                    const v = picked.sig[F.k].v, pts = (mode === "search" ? 1 - blend : 1) * picked.c[F.k] * 100;
                    return (
                      <tr key={F.k} className={W[F.k] ? "" : "off"}>
                        <td><i style={{ background: F.c }} />{F.name}<small className="raw-m">{picked.sig[F.k].raw}</small></td>
                        <td>{picked.sig[F.k].raw}</td>
                        <td><span className="mini"><i style={{ width: v * 100 + "%", background: F.c }} /></span>{v.toFixed(2)}</td>
                        <td>{W[F.k]}</td>
                        <td><b>{pts >= 0.5 ? "+" + pts.toFixed(0) : "–"}</b></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="lab-matrix">
        <h2>Every algorithm × every weighting</h2>
        <p className="muted small">Top 3 for {mode === "search" ? `“${query}”` : "the feed"} in each combination. The number is how many of your current top 5 it shares. Tap a cell to load it.</p>
        <div className="mx-scroll">
          <table className="mx">
            <thead><tr><th />{colsDef.map(([k, s]) => <th key={k}>{s.label}</th>)}</tr></thead>
            <tbody>
              {matrix.map(r => (
                <tr key={r.k}>
                  <th>{r.label}{mode === "feed" && !WEIGHT_AWARE.has(r.k) && <small>ignores weights</small>}</th>
                  {r.cells.map(c => {
                    const on = (mode === "search" ? method : algo) === r.k && scenario === c.ck;
                    return (
                      <td key={c.ck}>
                        <button className={"mx-cell" + (on ? " on" : "")} onClick={() => { mode === "search" ? setMethod(r.k) : setAlgo(r.k); applyScenario(c.ck); }} aria-label={`${r.label} with ${SCENARIOS[c.ck].label}`}>
                          <span className="mx-th">{c.list.slice(0, 3).map(x => <img key={x.l.lot_id} src={lotImg(x.l, 72, 90)} alt="" title={x.l.title} />)}{!c.list.length && <small className="muted">no hits</small>}</span>
                          <span className="mx-ov" style={{ "--o": c.overlap / 5 }}>{c.overlap}/5</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <footer className="foot">Signals are computed from the listing (tags, year, condition, brand) and simulated market data (watchers, bidders, comps). Lexical methods follow Search Ranking Labs. None of these models understand meaning; they're transparent baselines you can reason about.</footer>
    </main>
  );
}
