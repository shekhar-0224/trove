import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { eur, inc, rng, hash } from "../lib/format.js";
import { lotImg, Heart } from "./LotCard.jsx";
import { toast } from "./Toasts.jsx";
import { REACTIONS as RX, ReactionGlyph } from "./Reactions.jsx";
import { lotHref } from "../lib/nav.js";
import { hasModel } from "../lib/models.js";

const onOpen = id => { location.hash = lotHref(id); };
// Bid tiers, like paid chat: the bigger the bid, the louder the card.
const tier = a => a >= 1000 ? "t5" : a >= 400 ? "t4" : a >= 150 ? "t3" : a >= 50 ? "t2" : "t1";

const Studio3D = lazy(() => import("./Studio3D.jsx"));

const HANDLES = ["noah.collects", "lena_antiques", "horologist_h", "sasha.prints", "ivy.archive", "the.numismatist", "juno", "marcel_d", "ben.silver", "mira", "luca.lens", "fern", "clara.v", "otto_w", "elise.art", "tom.b", "anya.k", "pieter", "zara.finds", "kenji_m"];
const LINES = ["beautiful piece", "condition looks great", "is there a certificate?", "can you show the back?", "any marks underneath?", "no way it goes under estimate", "lovely patina", "first time bidding live, this is fun", "is shipping insured?", "that colour though", "someone stop me", "bidding war incoming", "that's a fair price", "who's calling the hammer?", "it's going up", "I'm in", "great seller, bought from them before", "zoom in on the details please", "how old is it exactly?", "provenance?"];
const SELLER_LINES = ["Here's a closer look under the light", "Ships insured, fully tracked", "Starting low, let the room decide", "Condition report is on the lot page", "Last one of these I have"];
const LOT_MS = 30000, EXT_MS = 8000;

function useInterval(fn, ms) { const r = useRef(fn); r.current = fn; useEffect(() => { const id = setInterval(() => r.current(), ms); return () => clearInterval(id); }, [ms]); }

export default function LiveRoom({ show, award, gate, saved, toggleSave, onLeave, onWin, nextShow, prevShow, onNext, onPrev, enter = 0 }) {
  const queue = show.lots;
  const own = !!show.own;
  const host = own ? "you" : show.seller;
  const [idx, setIdx] = useState(0);
  const lot = queue[idx % queue.length];
  const r = useRef(rng(hash(show.id)));
  const [phase, setPhase] = useState("bidding");
  const [bid, setBid] = useState(lot.starting_bid);
  const [leader, setLeader] = useState(null);
  const [endAt, setEndAt] = useState(Date.now() + LOT_MS);
  const [tick, setTick] = useState(Date.now());
  const [pulse, setPulse] = useState(0);
  const [ext, setExt] = useState(0);
  const [chat, setChat] = useState([]);
  const [floaters, setFloaters] = useState([]);
  const [viewers, setViewers] = useState(show.viewers);
  const [msg, setMsg] = useState("");
  const [call, setCall] = useState(null);
  const [guess, setGuess] = useState(0);
  const [result, setResult] = useState(null);
  const [wins, setWins] = useState([]);
  const [sales, setSales] = useState(0);
  const [ticker, setTicker] = useState([]);
  const chatRef = useRef(null);
  const video = useRef(null);
  const gridRef = useRef(null), barRef = useRef(null);
  // Swipe up / down between live shows, TikTok style. The room follows your finger, then snaps.
  const mainRef = useRef(null), peekRef = useRef(null), drag = useRef(null);
  const [hint, setHint] = useState(() => { try { return !!onNext && !localStorage.getItem("trove-swiped"); } catch { return !!onNext; } });
  useEffect(() => { if (!hint) return; const id = setTimeout(() => setHint(false), 4200); return () => clearTimeout(id); }, [hint]);
  const leaveTo = d => {
    const m = mainRef.current, go = d > 0 ? onNext : onPrev; if (!go || !m) return;
    try { localStorage.setItem("trove-swiped", "1"); } catch { /* ignore */ }
    m.style.transition = "transform .32s cubic-bezier(.3,.7,.3,1), opacity .32s"; m.style.transform = `translateY(${d > 0 ? -60 : 60}%)`; m.style.opacity = "0";
    setTimeout(go, 230);
  };
  const tStart = e => {
    if (!onNext || e.touches.length !== 1 || e.target.closest("button,input,a,form,.chat,.lp-call")) return;
    drag.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dy: 0, lock: null };
  };
  const tMove = e => {
    const d = drag.current; if (!d) return;
    const dx = e.touches[0].clientX - d.x; d.dy = e.touches[0].clientY - d.y;
    if (!d.lock && Math.hypot(dx, d.dy) > 8) d.lock = Math.abs(d.dy) > Math.abs(dx) ? "y" : "x";
    if (d.lock !== "y") return;
    const m = mainRef.current, p = peekRef.current, k = Math.max(-1, Math.min(1, d.dy / 160));
    m.style.transition = "none"; m.style.transform = `translateY(${d.dy * 0.55}px) scale(${1 - Math.abs(k) * 0.04})`;
    if (p) { p.dataset.dir = d.dy < 0 ? "next" : "prev"; p.style.opacity = Math.min(1, Math.abs(k) * 1.4); }
  };
  const tEnd = () => {
    const d = drag.current; drag.current = null; if (!d || d.lock !== "y") return;
    if (peekRef.current) peekRef.current.style.opacity = 0;
    if (d.dy < -70) leaveTo(1); else if (d.dy > 70) leaveTo(-1);
    else { const m = mainRef.current; m.style.transition = "transform .45s var(--spring)"; m.style.transform = ""; }
  };
  useEffect(() => {
    if (!onNext) return;
    const k = e => { if (e.target.closest?.("input,textarea")) return; if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); leaveTo(1); } if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); leaveTo(-1); } };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [onNext]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!barRef.current || !window.ResizeObserver) return;
    const ro = new ResizeObserver(() => gridRef.current?.style.setProperty("--bidbar-h", barRef.current.offsetHeight + "px"));
    ro.observe(barRef.current); return () => ro.disconnect();
  }, []);
  const target = useMemo(() => (own ? Math.round(lot.hammer * 0.95) : lot.hammer), [lot, own]);

  useEffect(() => { if (video.current && show.stream) video.current.srcObject = show.stream; }, [show.stream]);
  useEffect(() => { document.body.classList.add("immersive"); return () => document.body.classList.remove("immersive"); }, []);
  useEffect(() => () => show.stream?.getTracks().forEach(t => t.stop()), [show.stream]);

  useEffect(() => {
    setBid(lot.starting_bid); setLeader(null); setEndAt(Date.now() + LOT_MS); setPhase("bidding"); setCall(null); setResult(null);
    setGuess(Math.round((lot.estimate_low + lot.estimate_high) / 2 / 5) * 5);
    say(host, `Lot ${idx + 1}: ${lot.title}. Starting at ${eur(lot.starting_bid)}.`, own, true);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [chat]);

  function say(who, text, mine, isHost) { setChat(c => [...c.slice(-60), { id: Math.random(), who, text, mine, host: isHost }]); }
  function react(e, mine) {
    const f = { id: Math.random(), e, x: 10 + Math.random() * 70, mine };
    setFloaters(x => [...x.slice(-24), f]);
    setTimeout(() => setFloaters(x => x.filter(y => y.id !== f.id)), 2400);
  }
  function placeBid(amount, who) {
    setBid(amount); setLeader(who); setPulse(p => p + 1);
    setChat(c => [...c.slice(-60), { id: Math.random(), type: "bid", who, amount, lot: lot.title.split(" – ")[0] }]);
    setTicker(t => [{ id: Math.random(), who, amount }, ...t].slice(0, 8));
    if (endAt - Date.now() < EXT_MS) { setEndAt(Date.now() + EXT_MS); setExt(e => e + 1); }
    if (who === "you") { award("first_bid"); award("in_the_room"); react("steal", true); }
  }
  function closeLot() {
    const won = leader === "you" && !own;
    setPhase("sold");
    const res = { won, who: leader || "no bids", amount: bid };
    if (call) { res.call = call; res.miss = Math.abs(call - bid) / Math.max(bid, 1); if (res.miss <= 0.1) award("sharp_eye"); }
    setResult(res);
    if (leader) setSales(s => s + bid);
    if (won) { award("first_win"); onWin?.(lot, bid); setWins(w => [...w, { ...lot, paid: bid }]); say(host, `Sold to you for ${eur(bid)}! Congrats`, false, true); }
    else if (leader) say(host, `Sold to @${leader} for ${eur(bid)}. Next one coming up.`, own, true);
    setTimeout(() => setIdx(i => i + 1), 4000);
  }

  useInterval(() => {
    const now = Date.now(); setTick(now);
    if (phase !== "bidding") return;
    const R = r.current, left = endAt - now;
    if (left <= 0) { closeLot(); return; }
    const urgency = left < 8000 ? 0.55 : left < 15000 ? 0.32 : 0.18;
    if (bid < target && R() < urgency) {
      const who = HANDLES[Math.floor(R() * HANDLES.length)];
      const amt = bid + inc(bid) * (R() < 0.2 ? 2 : 1);
      if (leader === "you") toast(`@${who} outbid you at ${eur(amt)}`, "Outbid");
      placeBid(amt, who);
    }
    if (R() < 0.42) say(HANDLES[Math.floor(R() * HANDLES.length)], LINES[Math.floor(R() * LINES.length)]);
    if (!own && R() < 0.06) say(host, SELLER_LINES[Math.floor(R() * SELLER_LINES.length)], false, true);
    if (R() < 0.5) react(RX[Math.floor(R() * RX.length)].id);
    if (R() < 0.08) say("system", `${HANDLES[Math.floor(R() * HANDLES.length)]} joined`);
    setViewers(v => Math.max(own ? 12 : 120, v + Math.round((R() - (own ? 0.35 : 0.45)) * (own ? 6 : 18))));
  }, 650);

  const left = Math.max(0, endAt - tick);
  const secs = Math.ceil(left / 1000);
  const next = bid + inc(bid);
  const roomCall = Math.round(((lot.estimate_low + lot.estimate_high) / 2) * 1.05 / 5) * 5;
  const send = e => { e.preventDefault(); if (!msg.trim()) return; gate("Sign in to chat with the room.", () => { say("you", msg.trim(), true, own); setMsg(""); }); };
  const bidMine = amt => gate("Sign in to bid live.", () => placeBid(amt, "you"));
  const shareRoom = async () => {
    try { await navigator.clipboard.writeText(location.origin + "/live/" + show.seller); toast("Show link copied. Bring your friends.", "Invite"); } catch { toast(location.origin + "/live", "Link"); }
    award("plus_one");
  };
  const upNext = [1, 2, 3, 4].slice(0, Math.max(0, queue.length - 1)).map(k => ({ l: queue[(idx + k) % queue.length], n: ((idx + k) % queue.length) + 1 }));

  return (
    <>
    {onNext && (
      <div className="swipe-peek" ref={peekRef} aria-hidden="true">
        <span className="pk next"><img src={lotImg(nextShow.lots[0], 80, 100)} alt="" /><span><small>Next show</small><b>@{nextShow.seller}</b></span></span>
        <span className="pk prev"><img src={lotImg(prevShow.lots[0], 80, 100)} alt="" /><span><small>Previous show</small><b>@{prevShow.seller}</b></span></span>
      </div>
    )}
    <main className={"live-main wrap" + (enter > 0 ? " from-below" : enter < 0 ? " from-above" : "")} ref={mainRef}>
      <div className="live-grid" ref={gridRef}>
        <div className="live-col">
          <section className="stage" aria-label="Live stage" onTouchStart={tStart} onTouchMove={tMove} onTouchEnd={tEnd} onTouchCancel={tEnd}>
            <div className="stage-canvas">
              {show.stream ? (
                <video ref={video} className="cam-feed" autoPlay playsInline muted />
              ) : !hasModel(lot) ? (
                <div className="cam-photo" key={lot.lot_id}><img className="cam-bg" src={lotImg(lot, 600, 750)} alt="" /><img className="cam-fg" src={lotImg(lot, 1100, 1400)} alt={lot.title} /></div>
              ) : (
                <Suspense fallback={<img className="stage-fallback" src={lotImg(lot, 800, 1000)} alt="" />}>
                  <Studio3D src={lotImg(lot, 1024, 1280)} lot={lot} pulse={pulse} />
                </Suspense>
              )}
            </div>
            {(show.stream || hasModel(lot)) && <button className="pip" onClick={() => onOpen(lot.lot_id)} aria-label="Open the lot photos"><img src={lotImg(lot, 240, 300)} alt="" /><span>{show.stream ? `Lot ${idx + 1}` : "Photo"}</span></button>}

            <div className="stage-top">
              <button className="badge glass btnlike" onClick={onLeave} aria-label="Leave show">←</button>
              <div className="host"><span className="h-av">{host[0].toUpperCase()}</span><div><b>{own ? "You're live" : "@" + show.seller}</b><small>{show.title}</small></div></div>
              <span className="badge live"><i className="live-dot" />LIVE</span>
              <span className="badge glass">{viewers.toLocaleString("en-GB")} watching</span>
              <span className="grow" />
              {!own && <button className="badge glass btnlike" onClick={() => gate("Sign in to follow sellers.", () => { toast(`Following @${show.seller}`, "Following"); award("supporter"); })}>Follow</button>}
              <button className="badge glass btnlike" onClick={shareRoom}>Invite</button>
            </div>

            {onNext && (
              <div className="show-nav" aria-label="Switch show">
                <button onClick={() => leaveTo(-1)} aria-label={`Previous show: @${prevShow?.seller}`} title={`@${prevShow?.seller}`}><svg width="18" height="18" viewBox="0 0 24 24"><path d="m6 15 6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                <button onClick={() => leaveTo(1)} aria-label={`Next show: @${nextShow?.seller}`} title={`@${nextShow?.seller}`}><svg width="18" height="18" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
              </div>
            )}
            {hint && <div className="swipe-hint" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24"><path d="m6 14 6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>Swipe up for the next show</div>}
            <div className="floaters" aria-hidden="true">
              {floaters.map(f => <span key={f.id} className={"floater" + (f.mine ? " mine" : "")} style={{ left: f.x + "%" }}><ReactionGlyph id={f.e} size={f.mine ? 40 : 30} /></span>)}
            </div>
            {phase === "sold" && result?.won && <div className="win-burst" aria-hidden="true">{Array.from({ length: 18 }).map((_, i) => <i key={i} style={{ "--a": i * 20 + "deg" }} />)}</div>}
            {phase === "sold" && <div className={"sold-stamp" + (result?.won ? " won" : "")}>{result?.won ? "You won it" : result?.who === "no bids" ? "Passed" : "Sold"}<small>{result?.who !== "no bids" && eur(result?.amount)}</small></div>}
          </section>

          <section className="bidbar" aria-label="Current lot" ref={barRef}>
            <button className="bb-item" onClick={() => onOpen(lot.lot_id)}>
              <img src={lotImg(lot, 160, 200)} alt="" />
              <div><small>Lot {idx + 1} of {queue.length} · {lot.condition}{lot.pieces > 1 ? ` · ${lot.pieces} pieces` : ""}</small><b>{lot.title}</b></div>
            </button>
            <div className="bb-amt">
              <small>{leader === "you" ? "You're winning" : leader ? `@${leader}` : "Opening bid"}</small>
              <div className={"lp-amt" + (leader === "you" ? " me" : "")} key={bid}>{eur(bid)}</div>
            </div>
            <div className={"lp-timer" + (secs <= 8 ? " hot" : "")}>
              <svg viewBox="0 0 44 44" width="52" height="52"><circle cx="22" cy="22" r="19" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="4" />
                <circle cx="22" cy="22" r="19" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="119.4" strokeDashoffset={119.4 * (1 - Math.min(1, left / LOT_MS))} transform="rotate(-90 22 22)" /></svg>
              <span>{phase === "bidding" ? secs : "0"}</span>
              {ext > 0 && left > EXT_MS - 1500 && phase === "bidding" && <em key={ext}>+8s</em>}
            </div>
            <div className="bb-act">
              {own ? (
                <>
                  <div className="seller-stats"><small>Sold this show</small><b>{eur(sales)}</b></div>
                  <button className="btn quiet" onClick={() => phase === "bidding" && closeLot()} disabled={phase !== "bidding"}>Close lot now</button>
                </>
              ) : phase === "bidding" ? (
                <>
                  <button className="btn primary big-bid" onClick={() => bidMine(next)} disabled={leader === "you"}>{leader === "you" ? "You're on top" : `Bid ${eur(next)}`}</button>
                  <button className="btn quiet" onClick={() => bidMine(next + inc(next) * 2)}>{eur(next + inc(next) * 2)}</button>
                  <button className="icon-btn" aria-pressed={saved.has(lot.lot_id)} onClick={() => toggleSave(lot.lot_id)} aria-label="Save"><Heart on={saved.has(lot.lot_id)} /></button>
                </>
              ) : (
                <div className={"sold-banner" + (result?.won ? " won" : "")}>
                  {result?.won ? <>You won it for <b>{eur(result.amount)}</b></> : result?.who === "no bids" ? "No bids, passed" : <>Sold to @{result?.who} for <b>{eur(result?.amount)}</b></>}
                  {result?.call && <span className="callres">Your call {eur(result.call)} · off by {(result.miss * 100).toFixed(0)}%</span>}
                </div>
              )}
            </div>
            {!own && (
              <div className="lp-call">
                {call ? <span>You called <b>{eur(call)}</b> · the room calls {eur(roomCall)}</span> : phase === "bidding" ? (
                  <>
                    <span className="lbl">Call the hammer</span>
                    <input type="range" min={Math.max(5, Math.round(lot.estimate_low * 0.5))} max={Math.round(lot.estimate_high * 1.8)} step="5" value={guess} onChange={e => setGuess(+e.target.value)} aria-label="Your guess for the final price" />
                    <b>{eur(guess)}</b>
                    <button className="chip" onClick={() => gate("Sign in to call the hammer.", () => { setCall(guess); say("you", `calling ${eur(guess)}`, true); })}>Call it</button>
                  </>
                ) : <span className="muted">Next lot in a moment</span>}
              </div>
            )}
          </section>
        </div>

        <aside className="room">
          <div className="room-head"><b>Live chat</b><span className="muted small">{viewers.toLocaleString("en-GB")} here</span></div>
          {ticker.length > 0 && (
            <div className="ticker" aria-label="Recent bids">
              {ticker.map(t => <span key={t.id} className={"tick " + tier(t.amount) + (t.who === "you" ? " me" : "")}><i>{t.who === "you" ? "Y" : t.who[0].toUpperCase()}</i>{eur(t.amount)}</span>)}
            </div>
          )}
          <div className="chat" ref={chatRef}>
            {chat.map(m => m.type === "bid" ? (
              <div key={m.id} className={"bidcard " + tier(m.amount) + (m.who === "you" ? " me" : "")}>
                <div className="bc-head"><i>{m.who === "you" ? "Y" : m.who[0].toUpperCase()}</i><b>{m.who === "you" ? "You" : "@" + m.who}</b><span className="bc-amt">{eur(m.amount)}</span></div>
                <div className="bc-body">bid on {m.lot}</div>
              </div>
            ) : (
              <div key={m.id} className={"msg " + (m.who === "system" ? "sys" : m.host ? "host" : m.mine ? "mine" : "")}>
                {m.who === "system" ? <span>{m.text}</span> : <><b>{m.mine ? "You" : "@" + m.who}</b>{m.host && <em className="seller-tag">Seller</em>} <span>{m.text}</span></>}
              </div>
            ))}
          </div>
          <div className="react-row">{RX.map(r => <button key={r.id} onClick={() => react(r.id, true)} aria-label={"React: " + r.label} title={r.label}><ReactionGlyph id={r.id} size={24} /><small>{r.label}</small></button>)}</div>
          <form className="chat-input" onSubmit={send}>
            <input value={msg} onChange={e => setMsg(e.target.value)} placeholder={own ? "Talk to your room" : "Ask the seller something"} aria-label="Chat message" maxLength={140} />
            <button className="btn primary" type="submit">Send</button>
          </form>
          {upNext.length > 0 && (
            <div className="upnext">
              <b>Up next from {own ? "you" : "@" + show.seller}</b>
              <div className="un-row">
                {upNext.map(({ l, n }) => (
                  <button key={l.lot_id + n} className="un" onClick={() => onOpen(l.lot_id)}>
                    <img src={lotImg(l, 160, 200)} alt="" /><span>{l.title.split(" – ")[0]}</span><small>Lot {n}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
          {wins.length > 0 && (
            <div className="wins">
              <b>Your wins</b>
              {wins.map((w, i) => <div key={i} className="win-row"><img src={lotImg(w, 80, 100)} alt="" /><span>{w.title}</span><b>{eur(w.paid)}</b></div>)}
              <a className="link small" href="#/orders">Pay and track in Bids & orders →</a>
            </div>
          )}
        </aside>
      </div>
    </main>
    </>
  );
}
