import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "../data/lots.js";
import { eur, inc, timeLeft, rng, hash } from "../lib/format.js";
import { Heart, Magnify, lotImg } from "./LotCard.jsx";
import { toast } from "./Toasts.jsx";

const Viewer3D = lazy(() => import("./Viewer3D.jsx"));

const VIEWS = [
  { label: "Full", pos: "50% 50%", scale: 1 },
  { label: "Detail", pos: "35% 40%", scale: 1.9 },
  { label: "Close-up", pos: "68% 62%", scale: 2.6 }
];

export default function LotSheet({ lot, lots, now, onClose, onOpen, saved, toggleSave, award }) {
  const [view, setView] = useState(0);
  const [mode3d, setMode3d] = useState(false);
  const [bid, setBid] = useState(lot.currentBid);
  const [mine, setMine] = useState(false);
  const [max, setMax] = useState("");
  const [more, setMore] = useState(false);

  useEffect(() => { setView(0); setMode3d(false); setBid(lot.currentBid); setMine(false); setMore(false); }, [lot.lot_id, lot.currentBid]);
  useEffect(() => {
    const k = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);

  const multi = lot.images.length > 1;
  const shots = multi ? lot.images.map((_, i) => ({ label: "Photo " + (i + 1), img: i })) : VIEWS;
  const shownLot = multi ? { ...lot, images: [lot.images[shots[view]?.img ?? 0]] } : lot;
  const v = multi ? VIEWS[0] : VIEWS[view];

  const history = useMemo(() => {
    const r = rng(hash(lot.lot_id + "h")), out = []; let b = lot.currentBid;
    for (let i = 0; i < 5 && b > lot.starting_bid; i++) { out.push({ who: "Bidder " + (1000 + Math.floor(r() * 9000)), amt: b, ago: (i + 1) * (3 + Math.floor(r() * 20)) }); b -= inc(b); }
    return out;
  }, [lot.lot_id, lot.currentBid]);

  const next = bid + inc(bid);
  const reserveMet = !lot.reserve_price || bid >= lot.reserve_price;
  const place = amount => {
    setBid(amount); setMine(true); toast(`You're the highest bidder at ${eur(amount)}`, "Winning"); award("first_bid");
  };
  const share = async () => {
    const url = location.origin + "/lot/" + lot.lot_id;
    try { await navigator.clipboard.writeText(url); toast("Link copied. Send it to the group chat.", "Shared"); } catch { toast(url, "Link"); }
    award("plus_one");
  };
  const similar = lots.filter(x => x.lot_id !== lot.lot_id && (x.category === lot.category || x.seller_name === lot.seller_name)).slice(0, 4);
  const catLabel = CATEGORIES.find(c => c.id === lot.category)?.label || lot.category_label || lot.category;
  const details = [
    ["Brand", lot.brand], ["Model", lot.model], ["Category", [catLabel, lot.subcategory].filter(Boolean).join(" › ")],
    ["Condition", lot.condition], ["Number of items", lot.pieces], ["Year / period", lot.year], ["Size", lot.size],
    ["Materials", lot.materials], ["Dimensions", lot.dimensions], ["Weight", lot.weight], ["Authenticity proof", lot.authenticity || "None provided"],
    ["Ships from", lot.ships_from], ["Shipping", lot.shipping_cost ? eur(lot.shipping_cost) + (lot.insured_shipping ? ", insured" : "") : null]
  ].filter(d => d[1] !== undefined && d[1] !== null && d[1] !== "");

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="lot-sheet" role="dialog" aria-modal="true" aria-label={lot.title} onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">✕</button>
        <div className="ls-gallery">
          <div className="ls-stage">
            {mode3d ? (
              <Suspense fallback={<div className="ls-3d-loading">Building 3D view…</div>}>
                <Viewer3D src={lotImg(lot, 1024, 1280)} />
              </Suspense>
            ) : (
              <div className="ls-photo" style={{ "--pos": v.pos, "--scale": v.scale }}>
                <Magnify lot={shownLot} w={900} h={1100} zoom={2.4} />
              </div>
            )}
            <div className="ls-tools">
              <div className="seg">
                <button aria-pressed={!mode3d} onClick={() => setMode3d(false)}>Photos</button>
                <button aria-pressed={mode3d} onClick={() => setMode3d(true)}>3D</button>
              </div>
              <span className="muted small">{mode3d ? "Drag to turn · scroll to zoom" : "Hover to magnify"}</span>
            </div>
          </div>
          {!mode3d && (
            <div className="thumbs">
              {shots.map((s, i) => (
                <button key={i} className="thumb" aria-pressed={view === i} onClick={() => setView(i)} aria-label={s.label}>
                  <img src={lotImg(multi ? { images: [lot.images[s.img]] } : lot, 160, 200)} alt="" style={multi ? undefined : { objectPosition: s.pos, transform: `scale(${s.scale})` }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ls-info">
          <div className="crumbs">{catLabel}{lot.subcategory ? " › " + lot.subcategory : ""} · Lot {lot.lot_id}</div>
          <h2>{lot.title}</h2>
          {lot.expert && <div className="expert">Selected by expert <b>{lot.expert}</b></div>}

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
            <form className="maxbid" onSubmit={e => { e.preventDefault(); const m = +max; if (m > bid) { place(Math.min(m, next)); toast(`Auto-bid set up to ${eur(m)}. We bid for you, one step at a time.`, "Max bid"); setMax(""); } }}>
              <label htmlFor="maxbid">Set a max bid</label>
              <input id="maxbid" inputMode="numeric" placeholder={`${eur(next + inc(next) * 4)} or more`} value={max} onChange={e => setMax(e.target.value.replace(/\D/g, ""))} />
              <button className="btn quiet" type="submit">Set</button>
            </form>
            <p className="protect">Buyer protection: your payment is held until the item arrives as described.</p>
          </div>

          <section className="ls-sec">
            <h3>Recent bids</h3>
            <ul className="bids">
              {mine && <li className="me"><span>You</span><b>{eur(bid)}</b><span>just now</span></li>}
              {history.map((h, i) => <li key={i}><span>{h.who}</span><b>{eur(h.amt)}</b><span>{h.ago} min ago</span></li>)}
            </ul>
          </section>

          <section className="ls-sec">
            <h3>From the seller</h3>
            <p className={"desc" + (more ? " open" : "")}>{lot.description || "No description provided."}</p>
            {lot.description?.length > 160 && <button className="link" onClick={() => setMore(m => !m)}>{more ? "Show less" : "Show more"}</button>}
          </section>

          <section className="ls-sec">
            <h3>Details</h3>
            <dl className="details">{details.map(([k, val]) => <div key={k}><dt>{k}</dt><dd>{val}</dd></div>)}</dl>
          </section>

          <section className="ls-sec seller">
            <div className="s-avatar">{lot.seller_name[0].toUpperCase()}</div>
            <div><b>{lot.seller_name}</b><div className="muted small">{[lot.seller_country, lot.seller_rating && `★ ${lot.seller_rating}`, lot.seller_sales && `${lot.seller_sales} sold`].filter(Boolean).join(" · ")}</div></div>
            <button className="pill ghost" onClick={() => { toast(`Following ${lot.seller_name}.`, "Following"); award("supporter"); }}>Follow</button>
          </section>

          {lot.url && <a className="link" href={lot.url} target="_blank" rel="noopener noreferrer">View original listing ↗</a>}

          {similar.length > 0 && (
            <section className="ls-sec">
              <h3>You might also like</h3>
              <div className="similar">
                {similar.map(s => (
                  <button key={s.lot_id} className="sim" onClick={() => onOpen(s.lot_id)}>
                    <img src={lotImg(s, 240, 300)} alt="" /><span>{s.title}</span><b>{eur(s.currentBid)}</b>
                  </button>
                ))}
              </div>
            </section>
          )}
          {lot.sample && <p className="muted small">Sample listing for the prototype. Photo from Unsplash.</p>}
        </div>
      </div>
    </div>
  );
}
