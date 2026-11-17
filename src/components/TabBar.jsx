import { go } from "../lib/nav.js";

const I = {
  discover: "M11 4a7 7 0 1 0 4.4 12.4l3.6 3.6 1.4-1.4-3.6-3.6A7 7 0 0 0 11 4zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10z",
  live: "M4 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm12 3 4-3v10l-4-3z",
  saved: "M12 20.3s-7.6-4.5-7.6-10A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7.6 2.5c0 5.5-7.6 10-7.6 10z",
  orders: "M5 8h14l-1.2 11.2A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.8zM9 8V6.5a3 3 0 0 1 6 0V8",
  lab: "M4 19h16M7 16V9m5 7V5m5 11v-4",
  you: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8c0-3.3 3.1-6 7-6s7 2.7 7 6"
};

// Phone navigation: thumb-reachable tabs, iOS style.
export default function TabBar({ view, onProfile, savedCount, orderCount, user }) {
  const tabs = [
    { k: "discover", label: "Discover", on: view === "discover" || view === "lot", act: () => go("") },
    { k: "live", label: "Live", on: view === "live", act: () => go("live") },
    { k: "saved", label: "Saved", on: view === "saved", act: () => go("saved"), n: savedCount },
    { k: "lab", label: "Lab", on: view === "lab", act: () => go("lab") },
    { k: "you", label: user ? "You" : "Sign in", on: false, act: onProfile }
  ];
  return (
    <nav className="tabbar" aria-label="Main">
      {tabs.map(t => (
        <button key={t.k} aria-current={t.on ? "page" : undefined} onClick={t.act}>
          <span className="tb-ic">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path d={I[t.k]} fill={t.k === "discover" || t.k === "live" ? "currentColor" : t.on ? "currentColor" : "none"} stroke="currentColor" strokeWidth={t.k === "discover" || t.k === "live" ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round" fillRule="evenodd" />
            </svg>
            {t.k === "live" && <i className="tb-live" />}
            {t.n > 0 && <b>{t.n}</b>}
          </span>
          <small>{t.label}</small>
        </button>
      ))}
    </nav>
  );
}
