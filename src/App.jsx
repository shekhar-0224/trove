import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { buildSampleLots } from "./data/lots.js";
import { enrich } from "./lib/enrich.js";
import AuthSheet from "./components/Auth.jsx";
import Loader from "./components/Loader.jsx";
import TopBar from "./components/TopBar.jsx";
import TabBar from "./components/TabBar.jsx";
import Discover from "./components/Discover.jsx";
import LiveHub from "./components/LiveHub.jsx";
import LotPage from "./components/LotPage.jsx";
import ImportSheet from "./components/ImportSheet.jsx";
import Cabinet from "./components/Cabinet.jsx";
import Moment from "./components/Moment.jsx";
import Orders from "./components/Orders.jsx";
import Lab from "./components/Lab.jsx";
import { lotImg } from "./components/LotCard.jsx";
import Toasts, { toast } from "./components/Toasts.jsx";
import { go } from "./lib/nav.js";
import { demoState } from "./data/demo.js";

const store = {
  get(k, d) { try { const v = localStorage.getItem("trove-" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("trove-" + k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
};

// Tiny hash router: #/ (discover), #/live, #/saved, #/lot/<id>
function parseHash() {
  const h = location.hash.replace(/^#\/?/, "");
  const [a, b] = h.split("/");
  if (a === "lot" && b) return { view: "lot", id: decodeURIComponent(b) };
  if (a === "live") return { view: "live", show: b ? decodeURIComponent(b) : null };
  if (a === "saved" || a === "orders" || a === "lab") return { view: a };
  return { view: "discover" };
}

export default function App() {
  const [user, setUser] = useState(() => store.get("user", null));
  const [intro, setIntro] = useState(() => !store.get("seen", false));
  const [route, setRoute] = useState(parseHash);
  const [lots, setLots] = useState(() => buildSampleLots().map(enrich));
  const [source, setSource] = useState("Sample catalog");
  const [importing, setImporting] = useState(false);
  const [cabinet, setCabinet] = useState(false);
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(() => new Set(store.get("saved", [])));
  const [badges, setBadges] = useState(() => store.get("badges", {}));
  const [moments, setMoments] = useState([]);
  const [orders, setOrders] = useState(() => store.get("orders", []));
  const [bids, setBids] = useState(() => store.get("bids", []));
  const [now, setNow] = useState(Date.now());
  const badgesRef = useRef(badges);
  const userRef = useRef(user);
  badgesRef.current = badges; userRef.current = user;

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { const f = () => { setRoute(parseHash()); window.scrollTo(0, 0); }; addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
  useEffect(() => store.set("saved", [...saved]), [saved]);
  useEffect(() => store.set("badges", badges), [badges]);
  useEffect(() => store.set("orders", orders), [orders]);
  useEffect(() => store.set("bids", bids), [bids]);

  const onBid = useCallback((lot, amount) => setBids(b => [{ lot_id: lot.lot_id, amount, at: Date.now() }, ...b.filter(x => x.lot_id !== lot.lot_id)]), []);
  const onWin = useCallback((lot, amount) => {
    setOrders(o => [...o, { id: lot.lot_id + "-" + Date.now(), lot_id: lot.lot_id, title: lot.title, img: lotImg(lot, 200, 250), amount, shipping: lot.shipping_cost || 0, seller: lot.seller_name, wonAt: Date.now(), paidAt: null }]);
    toast("Won! Find it in Bids & orders.", "Won");
  }, []);
  const payOrder = id => setOrders(o => o.map(x => (x.id === id ? { ...x, paidAt: Date.now() } : x)));
  const confirmOrder = id => setOrders(o => o.map(x => (x.id === id ? { ...x, confirmed: true } : x)));

  const award = useCallback(id => {
    if (!userRef.current || badgesRef.current[id]) return;
    const next = { ...badgesRef.current, [id]: Date.now() };
    badgesRef.current = next; setBadges(next); setMoments(m => [...m, id]);
  }, []);

  // Browsing is open. Actions that need an account ask for sign-in, then carry on.
  const gate = useCallback((reason, then) => {
    if (userRef.current) { then?.(); return true; }
    setAuth({ reason, then }); return false;
  }, []);

  const lotById = useMemo(() => Object.fromEntries(lots.map(l => [l.lot_id, l])), [lots]);

  const toggleSave = useCallback(id => {
    gate("Sign in to save finds and get a heads-up before they go live.", () => {
      setSaved(s => {
        const n = new Set(s);
        if (n.has(id)) n.delete(id);
        else {
          n.add(id);
          if (badgesRef.current.first_save) toast("Saved. We'll tell you before it goes live.", "Saved");
          award("first_save");
          const cats = new Set([...n].map(x => lotById[x]?.category).filter(Boolean));
          if (n.size >= 5 && cats.size >= 3) award("curator");
        }
        return n;
      });
    });
  }, [award, gate, lotById]);

  const signIn = (method, interests) => {
    const u = { method, interests, handle: "you", since: Date.now() };
    store.set("user", u); setUser(u); userRef.current = u;
    if (!store.get("seeded", false)) seedDemo();
    const then = auth?.then; setAuth(null); setLoading(true);
    setTimeout(() => { setLoading(false); then?.(); }, 1700);
  };
  function seedDemo() {
    const d = demoState(lots);
    setSaved(new Set([...saved, ...d.saved])); setBids(d.bids); setOrders(d.orders);
    badgesRef.current = { ...d.badges, ...badgesRef.current }; setBadges(badgesRef.current);
    store.set("seeded", true);
  }
  const resetDemo = () => { seedDemo(); setCabinet(false); toast("Demo account restored", "Reset"); };
  const signOut = () => { store.set("user", null); setUser(null); setCabinet(false); toast("Signed out", "Bye"); };
  const finishIntro = useCallback(() => { store.set("seen", true); setIntro(false); }, []);
  const doneMoment = useCallback(() => setMoments(m => m.slice(1)), []);

  if (intro) return <Loader lots={lots} interests={[]} onDone={finishIntro} />;

  const view = route.view;
  const lotOk = view === "lot" && lotById[route.id];
  return (
    <div className="app">
      <TopBar view={view} user={user} badgeCount={Object.keys(badges).length} savedCount={saved.size} orderCount={orders.filter(o => !o.confirmed).length + bids.length}
        onImport={() => setImporting(true)}
        onProfile={() => (user ? setCabinet(true) : setAuth({ reason: "Sign in to bid, save finds and join live shows." }))} />
      {view === "live" && <LiveHub key={route.show || "hub"} showId={route.show} lots={lots} award={award} gate={gate} saved={saved} toggleSave={toggleSave} onWin={onWin} />}
      {lotOk && <LotPage key={route.id} lot={lotById[route.id]} lots={lots} now={now} user={user} saved={saved} toggleSave={toggleSave} award={award} gate={gate} onBid={onBid} />}
      {view === "lab" && <Lab lots={lots} now={now} user={user} saved={saved} />}
      {view === "orders" && <Orders orders={orders} bids={bids} lots={lots} now={now} onPay={payOrder} onConfirm={confirmOrder} />}
      {(view === "discover" || view === "saved" || (view === "lot" && !lotOk)) && (
        <Discover key={view === "saved" ? "saved" : "discover"} lots={lots} now={now} user={user} saved={saved} toggleSave={toggleSave} source={source} onlySaved={view === "saved"} />
      )}
      {importing && (
        <ImportSheet onClose={() => setImporting(false)}
          onLoad={(newLots, label) => { setLots(newLots.map(enrich)); setSource(label); setImporting(false); go(""); toast(`Loaded ${newLots.length} lots from ${label}`, "Imported"); }}
          onSample={() => { setLots(buildSampleLots().map(enrich)); setSource("Sample catalog"); setImporting(false); }} />
      )}
      {cabinet && <Cabinet badges={badges} user={user} saved={saved} orders={orders} onClose={() => setCabinet(false)} onSignOut={signOut} onImport={() => setImporting(true)} onResetDemo={resetDemo} />}
      {auth && <AuthSheet reason={auth.reason} onSignIn={signIn} onClose={() => setAuth(null)} />}
      {loading && <Loader lots={lots} interests={user?.interests || []} overlay onDone={() => {}} />}
      {moments[0] && <Moment id={moments[0]} onDone={doneMoment} />}
      <TabBar view={view} user={user} savedCount={saved.size} orderCount={orders.filter(o => !o.confirmed).length + bids.length}
        onProfile={() => (user ? setCabinet(true) : setAuth({ reason: "Sign in to bid, save finds and join live shows." }))} />
      <Toasts />
    </div>
  );
}
