import { useEffect, useState } from "react";
import { CATEGORIES } from "../data/lots.js";
import { Logo } from "./Logo.jsx";

// Sign-in as a layer over whatever you were doing. Appears only when an action needs an account.
export default function AuthSheet({ reason, onSignIn, onClose }) {
  const [picked, setPicked] = useState(["watches", "asian", "coins"]);
  const toggle = id => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
  useEffect(() => { const k = e => e.key === "Escape" && onClose(); document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="auth-sheet" role="dialog" aria-modal="true" aria-labelledby="authT" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">✕</button>
        <Logo size={30} />
        <h2 id="authT">Join Trove</h2>
        <p className="muted">{reason || "Sign in to bid, save finds and join live shows."}</p>
        <div className="auth-interests">
          <span className="eyebrow">What are you hunting?</span>
          <div className="chips">
            {CATEGORIES.map(c => <button key={c.id} className="chip" aria-pressed={picked.includes(c.id)} onClick={() => toggle(c.id)}>{c.label}</button>)}
          </div>
        </div>
        <div className="auth-buttons">
          <button className="sso dark" onClick={() => onSignIn("apple", picked)}>
            <svg width="16" height="18" viewBox="0 0 16 19" aria-hidden="true"><path fill="currentColor" d="M13.2 10.1c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8C3.7 4.9 2.2 5.8 1.4 7.3c-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.4 3 2.4 1.2 0 1.6-.8 3-.8s1.8.8 3 .8c1.3 0 2.1-1.2 2.8-2.3.9-1.3 1.3-2.6 1.3-2.7 0 0-2.5-1-2.5-4.2zM10.9 3.2c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3z" /></svg>
            Continue with Apple
          </button>
          <button className="sso" onClick={() => onSignIn("google", picked)}>
            <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.7H9v3.3h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z"/><path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.7H.9v2.3A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.9 10.8a5.4 5.4 0 0 1 0-3.5V5H.9a9 9 0 0 0 0 8.1l3-2.3z"/><path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.5 1.4l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"/></svg>
            Continue with Google
          </button>
        </div>
        <p className="fine">Prototype: sign-in is simulated and nothing is sent anywhere.</p>
      </div>
    </div>
  );
}
