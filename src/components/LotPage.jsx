import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "../data/lots.js";
import { eur, inc, timeLeft, rng, hash } from "../lib/format.js";
import { rank } from "../lib/rank.js";
import { PRESETS } from "../lib/rank.js";
import LotCard, { Heart, lotImg } from "./LotCard.jsx";
import { toast } from "./Toasts.jsx";
import { hasModel } from "../lib/models.js";

const Viewer3D = lazy(() => import("./Viewer3D.jsx"));

// Same photo framed three ways when a lot has a single image; real photos when it has several.
const FRAMES = [
  { label: "Full", pos: "50% 50%", scale: 1 },
  { label: "Detail", pos: "38% 42%", scale: 1.7 },
  { label: "Close-up", pos: "66% 60%", scale: 2.3 }
];

function Lightbox({ src, onClose }) {
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  useEffect(() => {
    const k = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  const at = e => { const r = e.currentTarget.getBoundingClientRect(); setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`); };
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <button className="close light" onClick={onClose} aria-label="Close">✕</button>
      <div className={"lb-frame" + (zoom ? " zoomed" : "")} onClick={e => { at(e); setZoom(z => !z); }} onPointerMove={e => zoom && at(e)}>
        <img src={src} alt="" style={{ transformOrigin: origin }} draggable="false" />
      </div>
      <p className="lb-hint">{zoom ? "Move to look around · click to zoom out" : "Click anywhere to zoom in"}</p>
    </div>
  );
}

export default function LotPage({ lot, lots, now, user, saved, toggleSave, award, gate, onBid }) {
  const [frame, setFrame] = useState(0);
  const [mode3d, setMode3d] = useState(false);
  const [box, setBox] = useState(false);
  const [bid, setBid] = useState(lot.currentBid);
  const [mine, setMine] = useState(false);
  const [max, setMax] = useState("");
  const [tab, setTab] = useState("similar");

  const multi = lot.images.length > 1;
  const frames = multi ? lot.images.map((_, i) => ({ label: "Photo " + (i + 1), img: i, pos: "50% 50%", scale: 1 })) : FRAMES;
  const f = frames[frame];
  const mainSrc = lotImg(lot, 1200, 1500, f.img ?? 0);
  const catLabel = CATEGORIES.find(c => c.id === lot.category)?.label || lot.category_label || lot.category;

  const history = useMemo(() => {
    const r = rng(hash(lot.lot_id + "h")), out = []; let b = lot.currentBid;
    for (let i = 0; i < 5 && b > lot.starting_bid; i++) { out.push({ who: "Bidder " + (1000 + Math.floor(r() * 9000)), amt: b, ago: (i + 1) * (3 + Math.floor(r() * 20)) }); b -= inc(b); }
    return out;
  }, [lot.lot_id, lot.currentBid]);

  const next = bid + inc(bid);
  const reserveMet = !lot.reserve_price || bid >= lot.reserve_price;
  const place = amount => gate("Sign in to place a bid.", () => { setBid(amount); setMine(true); onBid?.(lot, amount); toast(`You're the highest bidder at ${eur(amount)}`, "Winning"); award("first_bid"); });
  const share = async () => {
    try { await navigator.clipboard.writeText(location.href); toast("Link copied. Send it to the group chat.", "Shared"); } catch { toast(location.href, "Link"); }
    award("plus_one");
  };

  const details = [
    ["Brand", lot.brand], ["Model", lot.model], ["Category", [catLabel, lot.subcategory].filter(Boolean).join(" › ")],
    ["Condition", lot.condition], ["Number of items", lot.pieces], ["Year / period", lot.year], ["Size", lot.size],
    ["Materials", lot.materials], ["Dimensions", lot.dimensions], ["Weight", lot.weight], ["Authenticity proof", lot.authenticity || "None provided"],
    ["Ships from", lot.ships_from], ["Shipping", lot.shipping_cost ? eur(lot.shipping_cost) + (lot.insured_shipping ? ", insured" : "") : null]
  ].filter(d => d[1] !== undefined && d[1] !== null && d[1] !== "");

  const others = lots.filter(x => x.lot_id !== lot.lot_id);
  const ctx = { interests: user?.interests || [lot.category], affinity: { [lot.category]: 0.6 }, saved, budget: lot.estimate_high * 1.2, now, hidden: new Set() };
  const TABS = {
    similar: { label: "Similar items", list: rank(others.filter(x => x.category === lot.category), ctx, PRESETS.foryou.w) },
    seller: { label: `More from ${lot.seller_name}`, list: rank(others.filter(x => x.seller_name === lot.seller_name), ctx, PRESETS.foryou.w) },
    foryou: { label: "Picked for you", list: rank(others, ctx, PRESETS.foryou.w) }
  };
  const shown = TABS[tab].list.slice(0, 8);

  return (
    <main className="lotpage">
      <div className="wrap">
        <a className="link back" href="#/">← Back to Discover</a>
        <section className="lp-hero">
          <div className="lp-gallery">
            <div className="lp-stage">
              {mode3d ? (
                <Suspense fallback={<div className="ls-3d-loading">Building 3D view…</div>}><Viewer3D src={lotImg(lot, 1024, 1280)} lot={lot} /></Suspense>
              ) : (
                <button className="lp-photo" onClick={() => setBox(true)} aria-label="Open full-screen photo">
                  <img src={mainSrc} alt={lot.title} style={{ objectPosition: f.pos, transform: `scale(${f.scale})`, transformOrigin: f.pos }} />
                </button>
              )}
              <div className="ls-tools">
                {hasModel(lot) ? (
                  <div className="seg">
                    <button aria-pressed={!mode3d} onClick={() => setMode3d(false)}>Photos</button>
                    <button aria-pressed={mode3d} onClick={() => setMode3d(true)}>3D</button>
                  </div>
                ) : <span />}
                <span className="small hint">{mode3d ? "Drag to turn" : "Click to view full screen"}</span>
              </div>
            </div>
            {!mode3d && (
              <div className="thumbs">
                {frames.map((fr, i) => (
                  <button key={i} className="thumb" aria-pressed={frame === i} onClick={() => setFrame(i)} aria-label={fr.label}>
                    <img src={lotImg(lot, 200, 250, fr.img ?? 0)} alt="" style={{ objectPosition: fr.pos, transform: `scale(${fr.scale})`, transformOrigin: fr.pos }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="lp-buy">
            <div className="crumbs">{catLabel}{lot.subcategory ? " › " + lot.subcategory : ""} · Lot {lot.lot_id}</div>
            <h1>{lot.title}</h1>
            <div className="lp-facts">
              <span>{lot.condition}</span><span>{lot.pieces} {lot.pieces > 1 ? "pieces" : "piece"}</span>{lot.year && <span>{lot.year}</span>}{lot.expert && <span>Selected by {lot.expert}</span>}
            </div>
            <div className="bidbox">
              <div className="bb-row">
                <div><small>{mine ? "Your bid is winning" : "Current bid"}</small><div className="big">{eur(bid)}</div></div>
                <div className="right"><small>Closes in</small><div className="mid">{timeLeft(lot.auction_end - now)}</div></div>
              </div>
              <div className="bb-meta">
                <span className={reserveMet ? "ok" : "warn"}>{lot.reserve_price ? (reserveMet ? "Reserve met" : "Reserve not met yet") : "No reserve"}</span>
                <span>Estimate {eur(lot.estimate_low)}–{eur(lot.estimate_high)}</span>
                <span>{lot.watchers} watching</span>
              </div>
              <div className="bb-actions">
                <button className="btn primary" onClick={() => place(next)}>Bid {eur(next)}</button>
                <button className="btn quiet" onClick={() => place(next + inc(next))}>Bid {eur(next + inc(next))}</button>
                <button className="icon-btn" aria-pressed={saved.has(lot.lot_id)} onClick={() => toggleSave(lot.lot_id)} aria-label="Save"><Heart on={saved.has(lot.lot_id)} /></button>
                <button className="icon-btn" onClick={share} aria-label="Share">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
              <form className="maxbid" onSubmit={e => { e.preventDefault(); const m = +max; if (m > bid) { place(Math.min(m, next)); setMax(""); } }}>
                <label htmlFor="maxbid">Max bid</label>
                <input id="maxbid" inputMode="numeric" placeholder={`${eur(next + inc(next) * 4)} or more`} value={max} onChange={e => setMax(e.target.value.replace(/\D/g, ""))} />
                <button className="btn quiet" type="submit">Set</button>
              </form>
              <p className="protect">Buyer protection: your payment is held until the item arrives as described.</p>
            </div>
            <div className="seller">
              <div className="s-avatar">{lot.seller_name[0].toUpperCase()}</div>
              <div><b>{lot.seller_name}</b><div className="muted small">{[lot.seller_country, lot.seller_rating && `★ ${lot.seller_rating}`, lot.seller_sales && `${lot.seller_sales} sold`].filter(Boolean).join(" · ")}</div></div>
              <button className="pill ghost" onClick={() => gate("Sign in to follow sellers.", () => { toast(`Following ${lot.seller_name}`, "Following"); award("supporter"); })}>Follow</button>
            </div>
          </aside>
        </section>

        <section className="lp-more">
          <div className="lp-col">
            <h2>About this lot</h2>
            <p className="desc open">{lot.description || "No description provided."}</p>
            <dl className="details">{details.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            {lot.url && <a className="link" href={lot.url} target="_blank" rel="noopener noreferrer">View original listing ↗</a>}
          </div>
          <div className="lp-col">
            <h2>Bids</h2>
            <ul className="bids">
              {mine && <li className="me"><span>You</span><b>{eur(bid)}</b><span>just now</span></li>}
              {history.map((h, i) => <li key={i}><span>{h.who}</span><b>{eur(h.amt)}</b><span>{h.ago} min ago</span></li>)}
              {!history.length && !mine && <li><span className="muted">No bids yet. Be first.</span></li>}
            </ul>
            <h2 style={{ marginTop: 28 }}>Delivery & protection</h2>
            <ul className="assure">
              <li><b>Ships from {lot.ships_from || "the seller"}</b><span>{lot.shipping_cost ? eur(lot.shipping_cost) : "Cost shown at checkout"}{lot.insured_shipping ? ", insured and tracked" : ", tracked"}</span></li>
              <li><b>Payment held until it arrives</b><span>The seller is paid once you confirm the item matches the listing.</span></li>
              <li><b>{lot.authenticity ? "Proof included" : "Checked by an expert"}</b><span>{lot.authenticity || `Lot reviewed by ${lot.expert || "a Trove expert"} before listing.`}</span></li>
            </ul>
          </div>
        </section>

        <section className="lp-tabs">
          <div className="seg" role="tablist" aria-label="More lots">
            {Object.entries(TABS).map(([k, t]) => <button key={k} role="tab" aria-selected={tab === k} aria-pressed={tab === k} onClick={() => setTab(k)}>{t.label}</button>)}
          </div>
          <div className="grid">
            {shown.length ? shown.map(p => <div className="grid-cell" key={p.l.lot_id}><LotCard p={p} now={now} saved={saved} toggleSave={toggleSave} /></div>) : <p className="muted">Nothing here yet.</p>}
          </div>
        </section>
        {lot.sample && <p className="foot">Sample listing for the prototype. Photo from Unsplash.</p>}
      </div>
      <div className="mobile-buy" aria-label="Bid">
        <div><small>{mine ? "You're winning" : "Current bid"} · {timeLeft(lot.auction_end - now)}</small><b>{eur(bid)}</b></div>
        <button className="icon-btn" aria-pressed={saved.has(lot.lot_id)} onClick={() => toggleSave(lot.lot_id)} aria-label="Save"><Heart on={saved.has(lot.lot_id)} /></button>
        <button className="btn primary" onClick={() => place(next)}>Bid {eur(next)}</button>
      </div>
      {box && <Lightbox src={lotImg(lot, 2000, 2500, f.img ?? 0)} onClose={() => setBox(false)} />}
    </main>
  );
}
