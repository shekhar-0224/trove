import { Logo } from "./Logo.jsx";
import { go } from "../lib/nav.js";

export default function TopBar({ view, user, badgeCount, onImport, onProfile, savedCount, orderCount }) {
  return (
    <header className="topbar">
      <div className="wrap topbar-in">
        <a className="logo-btn" href="#/" aria-label="Trove home"><Logo size={26} /></a>
        <nav className="seg main-seg" aria-label="Sections">
          <button aria-pressed={view === "discover" || view === "lot"} onClick={() => go("")}>Discover</button>
          <button aria-pressed={view === "live"} onClick={() => go("live")}><i className="live-dot" />Live</button>
          <button aria-pressed={view === "lab"} onClick={() => go("lab")}>Ranking lab</button>
          <button aria-pressed={view === "saved"} onClick={() => go("saved")}>Saved{savedCount ? <span className="count">{savedCount}</span> : null}</button>
        </nav>
        <span className="grow" />
        <button className="pill ghost hide-sm" onClick={onImport}>Import lots</button>
        {user && (
          <button className="icon-btn bag" aria-label="Bids and orders" aria-pressed={view === "orders"} onClick={() => go("orders")}>
            <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 11.2A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.8zM9 8V6.5a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {orderCount > 0 && <span className="avatar-badge">{orderCount}</span>}
          </button>
        )}
        {user ? (
          <button className="avatar" onClick={onProfile} aria-label="Your profile and cabinet">
            Y{badgeCount > 0 && <span className="avatar-badge">{badgeCount}</span>}
          </button>
        ) : (
          <button className="pill" onClick={onProfile}>Sign in</button>
        )}
      </div>
    </header>
  );
}
