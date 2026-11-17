import { useMemo, useState } from "react";
import { buildShows } from "../data/shows.js";
import { CATEGORIES } from "../data/lots.js";
import { lotImg } from "./LotCard.jsx";
import LiveRoom from "./LiveRoom.jsx";
import SellerStudio from "./SellerStudio.jsx";

// Live: browse seller-hosted shows, join one, or go live yourself.
export default function LiveHub({ lots, award, gate, saved, toggleSave, onWin, showId }) {
  const shows = useMemo(() => buildShows(lots), [lots]);
  const [current, setCurrent] = useState(() => (showId ? shows.find(s => s.seller === showId) || null : null));
  const [q, setQ] = useState("");
  const [studio, setStudio] = useState(false);
  const [cat, setCat] = useState("all");
  const [dir, setDir] = useState(0);
  const at = current ? shows.findIndex(s => s.id === current.id) : -1;
  const near = d => shows[(at + d + shows.length) % shows.length];
  const goShow = d => { const n = near(d); setDir(d); setCurrent(n); try { history.replaceState(null, "", "#/live/" + encodeURIComponent(n.seller)); } catch { /* ignore */ } };

  if (current) {
    const nav = at >= 0 && shows.length > 1;
    return <LiveRoom key={current.id} show={current} enter={dir} award={award} gate={gate} saved={saved} toggleSave={toggleSave} onWin={onWin}
      nextShow={nav ? near(1) : null} prevShow={nav ? near(-1) : null} onNext={nav ? () => goShow(1) : null} onPrev={nav ? () => goShow(-1) : null}
      onLeave={() => { setCurrent(null); setDir(0); if (location.hash !== "#/live") location.hash = "#/live"; }} />;
  }
  if (studio) return <SellerStudio lots={lots} onCancel={() => setStudio(false)} onStart={show => { setStudio(false); setDir(0); setCurrent(show); }} />;

  const ql = q.trim().toLowerCase();
  const list = shows.filter(s => (cat === "all" || s.category === cat) && (!ql || [s.seller, s.title, ...s.lots.map(l => l.title)].join(" ").toLowerCase().includes(ql)));
  const cats = CATEGORIES.filter(c => shows.some(s => s.category === c.id));
  return (
    <main className="wrap hub">
      <div className="hub-head">
        <div>
          <h1>Live now</h1>
          <p className="muted">{shows.length} sellers live · {shows.reduce((a, s) => a + s.viewers, 0).toLocaleString("en-GB")} people watching</p>
        </div>
        <button className="btn primary" onClick={() => gate("Sign in to go live and sell to the room.", () => setStudio(true))}><i className="live-dot" style={{ color: "#ff3b30" }} />Go live and sell</button>
      </div>
      <form className="sbox hub-search" role="search" onSubmit={e => e.preventDefault()}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search live shows, sellers and items" aria-label="Search live shows" />
        {q && <button type="button" className="clear" onClick={() => setQ("")} aria-label="Clear">✕</button>}
      </form>
      <div className="cats">
        <button className="chip" aria-pressed={cat === "all"} onClick={() => setCat("all")}>All</button>
        {cats.map(c => <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</button>)}
      </div>
      {list.length === 0 && <p className="muted">No live show matches “{q}” right now. These sellers are live:</p>}
      <div className="shows">
        {(list.length ? list : shows.slice(0, 6)).map(s => (
          <button key={s.id} className="show" onClick={() => setCurrent(s)}>
            <div className="show-ph">
              <img src={lotImg(s.lots[0], 520, 650)} alt="" loading="lazy" />
              <span className="badge live"><i className="live-dot" />LIVE</span>
              <span className="badge show-v">{s.viewers.toLocaleString("en-GB")} watching</span>
              {s.lots.length > 1 && <div className="show-strip">{s.lots.slice(1, 4).map(l => <img key={l.lot_id} src={lotImg(l, 120, 150)} alt="" />)}</div>}
            </div>
            <div className="show-meta">
              <span className="s-av sm">{s.seller[0].toUpperCase()}</span>
              <div><b>{s.title}</b><small>@{s.seller} · {s.lots.length} lots{s.rating ? ` · ★ ${s.rating}` : ""}</small></div>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
