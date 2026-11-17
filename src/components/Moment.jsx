import { useEffect } from "react";
import { BADGES } from "../data/badges.js";

export function Medal({ id, size = 64, earned = true }) {
  const b = BADGES[id];
  return (
    <span className={"medal" + (earned ? "" : " locked")} style={{ "--hue": b.hue, width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size * 0.44} height={size * 0.44} aria-hidden="true"><path d={b.icon} fill="currentColor" /></svg>
    </span>
  );
}

// A quiet, one-time moment of recognition. Appears once per badge, then lives in the cabinet.
export default function Moment({ id, onDone }) {
  const b = BADGES[id];
  useEffect(() => { const t = setTimeout(onDone, 4200); return () => clearTimeout(t); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!b) return null;
  return (
    <div className="moment" role="status" aria-live="polite" onClick={onDone}>
      <div className="moment-card">
        <div className="moment-medal"><Medal id={id} size={52} /></div>
        <div className="moment-copy">
          <span className="eyebrow">Added to your cabinet</span>
          <h3>{b.title}</h3>
          <p>{b.line}</p>
        </div>
      </div>
    </div>
  );
}
