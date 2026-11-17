import { useEffect, useState } from "react";

const subs = new Set();
let id = 0;
export function toast(msg, tag) { const t = { id: ++id, msg, tag }; subs.forEach(fn => fn(t)); }

export default function Toasts() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const fn = t => {
      setItems(x => [...x.slice(-2), t]);
      setTimeout(() => setItems(x => x.filter(i => i.id !== t.id)), 2600);
    };
    subs.add(fn); return () => subs.delete(fn);
  }, []);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map(t => (
        <div key={t.id} className="toast">{t.tag && <span className="tag">{t.tag}</span>}<span>{t.msg}</span></div>
      ))}
    </div>
  );
}
