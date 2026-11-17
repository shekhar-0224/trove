export const eur = v => "€" + Math.round(v).toLocaleString("en-GB");
export const inc = v => (v < 100 ? 5 : v < 500 ? 10 : v < 1000 ? 25 : v < 2000 ? 50 : v < 5000 ? 100 : v < 10000 ? 250 : v < 20000 ? 500 : 1000);
export function timeLeft(ms) {
  if (ms <= 0) return "Ended";
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d >= 1) return `${d}d ${h % 24}h`;
  if (h >= 1) return `${h}h ${m % 60}m`;
  const s = Math.floor(ms / 1000) % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
export function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export const hash = str => { let h = 2166136261; for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
export const clamp = v => Math.max(0, Math.min(1, v));
