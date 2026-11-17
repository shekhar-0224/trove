import { useEffect, useState } from "react";
import { BADGES, BADGE_ORDER } from "../data/badges.js";
import { CATEGORIES } from "../data/lots.js";
import { Medal } from "./Moment.jsx";
import { go } from "../lib/nav.js";

const read = (k, d) => { try { const v = localStorage.getItem("trove-" + k); return v ? JSON.parse(v) : d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem("trove-" + k, JSON.stringify(v)); } catch { /* storage unavailable */ } };
const DEFAULTS = { notifyLive: true, notifyOutbid: true, notifySaved: true, notifyFollow: false, email: false, currency: "EUR", showBids: true };

function Toggle({ id, label, sub, on, set }) {
  return (
    <label className="set-row" htmlFor={id}>
      <span><b>{label}</b>{sub && <small>{sub}</small>}</span>
      <input id={id} type="checkbox" role="switch" className="switch" checked={on} onChange={e => set(e.target.checked)} />
    </label>
  );
}

// Profile: who you are, what you're doing, your cabinet, and settings, in one place.
export default function Cabinet({ badges, user, saved, orders = [], onClose, onSignOut, onImport, onResetDemo }) {
  const [tab, setTab] = useState("activity");
  const [s, setS] = useState(() => ({ ...DEFAULTS, ...read("settings", {}) }));
  const [interests, setInterests] = useState(user?.interests || []);
  useEffect(() => { const k = e => e.key === "Escape" && onClose(); document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [onClose]);
  useEffect(() => write("settings", s), [s]);
  useEffect(() => { const u = read("user", null); if (u) write("user", { ...u, interests }); }, [interests]);
  const set = k => v => setS(x => ({ ...x, [k]: v }));
  const earned = BADGE_ORDER.filter(id => badges[id]);
  const since = user?.since ? new Date(user.since).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "today";
  const nav = path => { onClose(); go(path); };

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="cabinet profile" role="dialog" aria-modal="true" aria-labelledby="cabT" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">✕</button>
        <div className="cab-head">
          <div className="avatar big">Y</div>
          <div>
            <h2 id="cabT">You</h2>
            <p className="muted">Collecting since {since} · signed in with {user?.method === "apple" ? "Apple" : "Google"}</p>
          </div>
        </div>

        <div className="stats">
          <button onClick={() => nav("saved")}><b>{saved.size}</b><small>Saved</small></button>
          <button onClick={() => setTab("cabinet")}><b>{earned.length}</b><small>Moments</small></button>
          <button onClick={() => nav("orders")}><b>{orders.length}</b><small>Wins</small></button>
          <button onClick={() => setTab("settings")}><b>{interests.length}</b><small>Interests</small></button>
        </div>

        <div className="seg" role="tablist">
          {[["activity", "Activity"], ["cabinet", "Cabinet"], ["settings", "Settings"]].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} aria-pressed={tab === k} onClick={() => setTab(k)}>{l}</button>)}
        </div>

        {tab === "activity" && (
          <div className="menu">
            <button onClick={() => nav("saved")}><b>Saved finds</b><small>{saved.size} lots you're watching</small></button>
            <button onClick={() => nav("orders")}><b>Bids & orders</b><small>What you're winning, what you've won, and where it is</small></button>
            <div className="menu-sep">Selling</div>
            <button onClick={() => nav("live")}><b>Go live and sell</b><small>Run a show from your camera</small></button>
            <button onClick={() => { onClose(); onImport(); }}><b>Import your lots</b><small>CSV or JSON, with the Trove template</small></button>
          </div>
        )}

        {tab === "cabinet" && (
          <>
            <div className="shelf">
              {BADGE_ORDER.map(id => {
                const on = !!badges[id];
                return (
                  <div className={"cab-item" + (on ? " on" : "")} key={id} title={BADGES[id].line}>
                    <Medal id={id} size={64} earned={on} />
                    <b>{BADGES[id].title}</b>
                    <small>{on ? new Date(badges[id]).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Not yet"}</small>
                  </div>
                );
              })}
            </div>
            <p className="muted small">Moments are earned once, for things that matter: a first bid, a first win, a sharp call. No points, no streaks.</p>
          </>
        )}

        {tab === "settings" && (
          <div className="settings">
            <h3>Notifications</h3>
            <Toggle id="n1" label="Saved lot is going live" sub="A heads-up two lots before it's on stage" on={s.notifySaved} set={set("notifySaved")} />
            <Toggle id="n2" label="You've been outbid" on={s.notifyOutbid} set={set("notifyOutbid")} />
            <Toggle id="n3" label="Sellers you follow go live" on={s.notifyLive} set={set("notifyLive")} />
            <Toggle id="n4" label="Weekly finds by email" on={s.email} set={set("email")} />
            <h3>What you're hunting</h3>
            <div className="chips">
              {CATEGORIES.map(c => <button key={c.id} className="chip" aria-pressed={interests.includes(c.id)} onClick={() => setInterests(p => p.includes(c.id) ? p.filter(x => x !== c.id) : [...p, c.id])}>{c.label}</button>)}
            </div>
            <h3>Preferences</h3>
            <label className="set-row" htmlFor="cur"><span><b>Currency</b></span>
              <select id="cur" value={s.currency} onChange={e => set("currency")(e.target.value)}><option>EUR</option><option>GBP</option><option>USD</option><option>INR</option></select>
            </label>
            <Toggle id="p1" label="Show my handle on bids" sub="Off shows you as an anonymous bidder number" on={s.showBids} set={set("showBids")} />
            <h3>Account</h3>
            <div className="menu">
              <button disabled><b>Shipping address</b><small>Added at your first checkout</small></button>
              <button disabled><b>Payment methods</b><small>Added at your first checkout</small></button>
              <button disabled><b>Help & buyer protection</b><small>How bidding, payment and returns work</small></button>
              <button onClick={onResetDemo}><b>Reset demo data</b><small>Restore the sample saves, bids, wins and orders</small></button>
            </div>
          </div>
        )}

        <button className="pill ghost signout" onClick={onSignOut}>Sign out</button>
      </div>
    </div>
  );
}
