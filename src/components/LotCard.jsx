import { useRef } from "react";
import { unsplash } from "../data/lots.js";
import { eur, timeLeft } from "../lib/format.js";
import { lotHref } from "../lib/nav.js";

export function Heart({ on }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20.5s-8-4.7-8-10.4A4.3 4.3 0 0 1 12 7.7a4.3 4.3 0 0 1 8 2.4c0 5.7-8 10.4-8 10.4z" fill={on ? "#ff3b5c" : "none"} stroke={on ? "#ff3b5c" : "currentColor"} strokeWidth="1.8" />
    </svg>
  );
}

export function lotImg(l, w, h, i = 0) {
  const src = l.images[i] ?? l.images[0];
  if (!src) return null;
  return src.startsWith("http") || src.startsWith("/") || src.startsWith("data:") ? src : unsplash(src, w, h);
}

// Product card: the item leads. On hover it lifts and tilts toward the cursor like an object on a shelf.
export default function LotCard({ p, now, saved, toggleSave, reasons }) {
  const l = p.l;
  const ref = useRef(null);
  const tilt = e => {
    if (e.pointerType === "touch" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.setProperty("--rx", (-y * 7).toFixed(2) + "deg");
    ref.current.style.setProperty("--ry", (x * 9).toFixed(2) + "deg");
    ref.current.style.setProperty("--gx", (x * 100 + 50).toFixed(0) + "%");
  };
  const reset = () => { ref.current.style.setProperty("--rx", "0deg"); ref.current.style.setProperty("--ry", "0deg"); };
  return (
    <a className="lot-card" href={lotHref(l.lot_id)} aria-label={l.title}>
      <div className="lc-photo" ref={ref} onPointerMove={tilt} onPointerLeave={reset}>
        <div className="lc-img">{lotImg(l, 600, 750) ? <img src={lotImg(l, 600, 750)} alt="" loading="lazy" draggable="false" /> : <div className="noimg">No photo</div>}</div>
        <div className="lc-gloss" />
        <div className="lc-top">
          {l.live ? <span className="badge live"><i className="live-dot" />Live now</span> : <span className="badge">{timeLeft(l.auction_end - now)}</span>}
          <button className="save" aria-pressed={saved.has(l.lot_id)} aria-label={saved.has(l.lot_id) ? "Unsave" : "Save"}
            onClick={e => { e.preventDefault(); e.stopPropagation(); toggleSave(l.lot_id); }}><Heart on={saved.has(l.lot_id)} /></button>
        </div>
        {reasons?.length > 0 && <div className="lc-why">{reasons[0]}</div>}
      </div>
      <div className="lc-body">
        <div className="lc-title">{l.title}</div>
        <div className="lc-meta">{[l.condition, l.pieces > 1 ? `${l.pieces} pieces` : null, l.seller_name].filter(Boolean).join(" · ")}</div>
        <div className="lc-price">
          <span><small>Current bid</small>{eur(l.currentBid)}</span>
          <span className="muted">{l.bidders} bidders</span>
        </div>
      </div>
    </a>
  );
}
