import { rank } from "./rank.js";
import { clamp } from "./format.js";

// Feed algorithms to compare. Each returns ranked items in the shared shape { l, s, c?, f?, why }.
const sim = (a, b) => (a.category === b.category ? 0.5 : 0) + (a.seller_name === b.seller_name ? 0.25 : 0) + (a.brand && a.brand === b.brand ? 0.2 : 0) + ((a.tags || []).some(t => (b.tags || []).includes(t)) ? 0.15 : 0);

export const ALGOS = [
  { k: "weighted", label: "Weighted signals", help: "Trove's blend of 7 signals you can tune" },
  { k: "popular", label: "Popularity", help: "Most watched and bid on first" },
  { k: "ending", label: "Ending soon", help: "Pure urgency: closing time" },
  { k: "similar", label: "Like your saves", help: "Item-to-item similarity to what you saved" },
  { k: "diverse", label: "Diversity (MMR)", help: "Weighted signals, then spread across categories and sellers" }
];

export function runAlgo(k, lots, ctx, W) {
  if (k === "weighted") return rank(lots, ctx, W).map(p => ({ ...p, why: "Weighted score" }));
  if (k === "popular") {
    const mx = Math.max(...lots.map(l => l.watchers + l.bidders * 6)) || 1;
    return lots.map(l => ({ l, s: (l.watchers + l.bidders * 6) / mx, why: `${l.watchers} watching · ${l.bidders} bidders` })).sort((a, b) => b.s - a.s);
  }
  if (k === "ending") {
    return lots.filter(l => l.auction_end > ctx.now).map(l => ({ l, s: clamp(1 / (1 + (l.auction_end - ctx.now) / 3.6e6)), why: "Closes soonest" })).sort((a, b) => a.l.auction_end - b.l.auction_end);
  }
  if (k === "similar") {
    const seeds = lots.filter(l => ctx.saved.has(l.lot_id));
    if (!seeds.length) return rank(lots, ctx, W).map(p => ({ ...p, why: "No saves yet, using weighted signals" }));
    return lots.filter(l => !ctx.saved.has(l.lot_id)).map(l => {
      let best = 0, by = null; seeds.forEach(s => { const v = sim(l, s); if (v > best) { best = v; by = s; } });
      return { l, s: best, why: by ? `Like ${by.title.split(" – ")[0]}` : "Not similar" };
    }).sort((a, b) => b.s - a.s);
  }
  if (k === "diverse") {
    const pool = rank(lots, ctx, W), picked = [], lambda = 0.65;
    while (pool.length && picked.length < 60) {
      let bi = 0, bv = -1e9;
      pool.forEach((p, i) => { const red = picked.length ? Math.max(...picked.map(q => sim(p.l, q.l))) : 0; const v = lambda * p.s - (1 - lambda) * red; if (v > bv) { bv = v; bi = i; } });
      const [p] = pool.splice(bi, 1); picked.push({ ...p, why: "Relevant and different from what's above" });
    }
    return picked;
  }
  return [];
}
