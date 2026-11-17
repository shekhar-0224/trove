import { useEffect, useState } from "react";
import { eur, timeLeft } from "../lib/format.js";
import { lotImg } from "./LotCard.jsx";
import { lotHref } from "../lib/nav.js";

// Order journey. In the prototype each step advances on a short timer once you've paid.
export const STAGES = [
  { k: "won", label: "Won", sub: "The hammer fell on your bid" },
  { k: "paid", label: "Paid", sub: "Held safely until delivery" },
  { k: "checked", label: "Authenticated", sub: "Checked against the listing" },
  { k: "packed", label: "Packed", sub: "Boxed and insured by the seller" },
  { k: "shipped", label: "On its way", sub: "Tracked from the seller to you" },
  { k: "delivered", label: "Delivered", sub: "Confirm it matches and the seller gets paid" }
];
const STEP_MS = 45000;
export function stageOf(o, now) {
  if (!o.paidAt) return 0;
  return Math.min(STAGES.length - 1, 1 + Math.floor((now - o.paidAt) / STEP_MS));
}

export default function Orders({ orders, bids, lots, now, onPay, onConfirm }) {
  const [, force] = useState(0);
  useEffect(() => { const id = setInterval(() => force(x => x + 1), 1000); return () => clearInterval(id); }, []);
  const lotById = Object.fromEntries(lots.map(l => [l.lot_id, l]));
  const active = bids.map(b => ({ ...b, lot: lotById[b.lot_id] })).filter(b => b.lot);

  return (
    <main className="wrap orders">
      <h1>Your bids & orders</h1>

      <section>
        <div className="secthd"><h2>Bidding</h2><span className="muted">{active.length} active</span></div>
        {active.length === 0 ? <p className="muted">Bids you place on lots show up here until the auction closes.</p> : (
          <div className="ord-list">
            {active.map(b => (
              <a key={b.lot_id} className="ord bidding" href={lotHref(b.lot_id)}>
                <img src={lotImg(b.lot, 160, 200)} alt="" />
                <div className="ord-main"><b>{b.lot.title}</b><small>Your bid {eur(b.amount)} · closes in {timeLeft(b.lot.auction_end - now)}</small></div>
                <span className="pill-status win">Winning</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="secthd"><h2>Won</h2><span className="muted">{orders.length} {orders.length === 1 ? "order" : "orders"}</span></div>
        {orders.length === 0 ? <p className="muted">Win a lot in a live show and it lands here, with every step to your door.</p> : (
          <div className="ord-list">
            {orders.slice().reverse().map(o => {
              const st = stageOf(o, now), done = st === STAGES.length - 1;
              return (
                <article key={o.id} className="ord">
                  <img src={o.img} alt="" />
                  <div className="ord-main">
                    <b>{o.title}</b>
                    <small>Won for {eur(o.amount)} from @{o.seller} · {new Date(o.wonAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</small>
                    <ol className="track" aria-label="Order progress">
                      {STAGES.map((s, i) => (
                        <li key={s.k} className={i < st ? "done" : i === st ? "now" : ""}><i /><span>{s.label}</span></li>
                      ))}
                    </ol>
                    <p className="track-sub">{STAGES[st].sub}</p>
                  </div>
                  <div className="ord-act">
                    {st === 0 && <button className="btn primary" onClick={() => onPay(o.id)}>Pay {eur(o.amount + (o.shipping || 0))}</button>}
                    {done && !o.confirmed && <button className="btn primary" onClick={() => onConfirm(o.id)}>It arrived, all good</button>}
                    {o.confirmed && <span className="pill-status ok">Complete</span>}
                    {st > 0 && !done && <span className="pill-status">{STAGES[st].label}</span>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <p className="foot">Prototype: payment is simulated and each delivery step advances every 45 seconds after you pay.</p>
    </main>
  );
}
