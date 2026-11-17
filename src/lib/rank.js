import { clamp, eur } from "./format.js";

// Every signal is normalised to 0–1, then weighted: score = Σ wᵢ·fᵢ / Σ wᵢ.
// Grouped so it's clear which ones come from the market, the item, the auction clock, and you.
export const GROUPS = [
  { k: "market", label: "Market" },
  { k: "item", label: "Item" },
  { k: "auction", label: "Auction" },
  { k: "you", label: "You" }
];
export const FACTORS = [
  { k: "popularity", g: "market", name: "Popularity", help: "Watchers + bidders (a bid counts 6×)", c: "#ff3b30" },
  { k: "value", g: "market", name: "Value vs comps", help: "Estimate below recent sales of similar items", c: "#0a7cff" },
  { k: "price", g: "market", name: "Low price", help: "Cheaper current bid ranks higher (log scale)", c: "#34a853" },
  { k: "rarity", g: "item", name: "Rarity", help: "Grail / deadstock tags, age, how few exist in the catalog", c: "#8e44ff" },
  { k: "brand", g: "item", name: "Brand pull", help: "How sought-after the maker is with collectors", c: "#1d1d1f" },
  { k: "quality", g: "item", name: "Condition & proof", help: "Condition grade, authenticity proof, seller rating", c: "#b08300" },
  { k: "ending", g: "auction", name: "Ending soon", help: "Closes or goes live shortly", c: "#e8590c" },
  { k: "quiet", g: "auction", name: "Few bidders", help: "Less competition, better odds", c: "#12a3b0" },
  { k: "interest", g: "you", name: "Your interests", help: "Categories you picked or keep opening", c: "#ff6a3d" },
  { k: "saved", g: "you", name: "Saved & similar", help: "Things you saved, and lots like them", c: "#c2410c" },
  { k: "budget", g: "you", name: "Budget fit", help: "Estimate sits inside what you'd spend", c: "#1a8f4c" }
];
const W0 = Object.fromEntries(FACTORS.map(f => [f.k, 0]));
const w = o => ({ ...W0, ...o });
export const PRESETS = {
  foryou: { label: "For you", help: "Balanced: your taste first, then market signals", w: w({ interest: 8, saved: 6, budget: 5, value: 4, ending: 3, quiet: 2, quality: 4, popularity: 4, rarity: 4, brand: 3, price: 2 }) },
  hype: { label: "Hyped", help: "What the crowd is chasing", w: w({ popularity: 10, brand: 6, ending: 4, rarity: 3, quality: 2, interest: 2 }) },
  rare: { label: "Rare finds", help: "Scarce, old, proven, wanted makers", w: w({ rarity: 10, quality: 6, brand: 4, popularity: 2, interest: 2 }) },
  deals: { label: "Steals", help: "Under market, cheap, few rivals", w: w({ value: 10, quiet: 9, price: 7, budget: 8, interest: 3, saved: 2 }) },
  ending: { label: "Ending soon", help: "Pure urgency", w: w({ ending: 10, interest: 4, saved: 3, budget: 3, value: 2, popularity: 2 }) }
};

const COND = { "New": 1, "Like new": 0.9, "Very good": 0.75, "Good": 0.55, "Fair": 0.35 };
export const BRAND = { "Tiffany Studios": 0.97, "Katsushika Hokusai": 0.96, Gibson: 0.9, "Cremona workshop": 0.92, "Chelsea Porcelain": 0.78, "Caspar Behaim": 0.8, "Robert Roskell": 0.62, "Augsburg workshop": 0.82, "Hudson River school": 0.75, Roches: 0.45, "I. C.": 0.55, Lille: 0.5, Unsigned: 0.1, "Unknown maker": 0.1 };
const RARE_TAGS = { "museum-grade": 0.45, provenance: 0.2, signed: 0.15, "first-edition": 0.3, automaton: 0.3, "rare-type": 0.25, renaissance: 0.15, ancient: 0.1, hallmarked: 0.08 };
const yearOf = (y, n) => (typeof n === "number" ? n : (m => (m ? +m[1] : null))(String(y || "").match(/(\d{4})/)));

const catCache = new WeakMap();
function catCounts(lots) {
  if (!lots) return { counts: {}, max: 1 };
  let c = catCache.get(lots);
  if (!c) { const counts = {}; lots.forEach(l => (counts[l.category] = (counts[l.category] || 0) + 1)); c = { counts, max: Math.max(1, ...Object.values(counts)) }; catCache.set(lots, c); }
  return c;
}

// Raw metric → 0–1 for each factor, plus a human-readable "raw" string so the lab can show the conversion.
export function signals(l, ctx) {
  const { interests = [], affinity = {}, saved = new Set(), budget = 3000, now = Date.now(), lots } = ctx;
  const catW = (interests.includes(l.category) ? 0.7 : 0.15) + 0.3 * clamp(0.5 + (affinity[l.category] || 0) / 2);
  const savedLots = (lots || []).filter(x => saved.has(x.lot_id));
  const sim = saved.has(l.lot_id) ? 1 : savedLots.some(s => s.category === l.category) ? 0.6 : savedLots.some(s => s.seller_name === l.seller_name) ? 0.4 : 0;
  const bf = budget <= l.estimate_low ? clamp(1 - (l.estimate_low - budget) / budget) : budget >= l.estimate_high ? 1 : 1 - 0.5 * (l.estimate_high - budget) / (l.estimate_high - l.estimate_low || 1);
  const mid = (l.estimate_low + l.estimate_high) / 2;
  const hrs = (l.auction_end - now) / 3.6e6;
  const pop = (l.watchers || 0) + (l.bidders || 0) * 6;
  const yr = yearOf(l.year, l.year_num);
  const { counts, max } = catCounts(lots);
  const tagR = Math.min(0.6, (l.tags || []).reduce((a, t) => a + (RARE_TAGS[t] || 0), 0));
  const ageR = yr != null ? clamp(Math.log10(Math.max(1, 2026 - yr)) / 3.4) * 0.35 : 0;
  const scarR = lots ? (1 - (counts[l.category] || 1) / max) * 0.2 : 0;
  const brandV = BRAND[l.brand] ?? (l.brand ? 0.35 : 0.1);
  const priceV = clamp(1 - Math.log10(Math.max(50, l.currentBid || l.estimate_low) / 50) / 2.8);
  const out = {
    popularity: { v: clamp(pop / 230), raw: `${l.watchers} watching · ${l.bidders} bidders` },
    value: { v: clamp(0.5 + (l.comp - mid) / mid * 2), raw: `est. ${eur(mid)} vs comps ${eur(l.comp)}` },
    price: { v: priceV, raw: `current bid ${eur(l.currentBid || l.estimate_low)}` },
    rarity: { v: clamp(tagR + ageR + scarR), raw: [(l.tags || []).filter(t => RARE_TAGS[t]).join(", ") || "no rare tags", yr != null ? `${l.year}` : null, lots ? `${counts[l.category] || 1} in category` : null].filter(Boolean).join(" · ") },
    brand: { v: brandV, raw: l.brand || "Unknown maker" },
    quality: { v: clamp((COND[l.condition] ?? 0.5) * 0.55 + (l.authenticity ? 0.25 : 0) + ((l.seller_rating || 4.5) - 4.4) / 0.6 * 0.2), raw: `${l.condition}${l.authenticity ? " · proof" : ""} · ★${l.seller_rating}` },
    ending: { v: hrs <= 0 ? 0 : clamp(1 / (1 + hrs / 3)), raw: hrs <= 0 ? "ended" : hrs < 1 ? `${Math.round(hrs * 60)} min left` : `${hrs.toFixed(1)} h left` },
    quiet: { v: clamp(1 - (l.bidders - 2) / 14), raw: `${l.bidders} bidders` },
    interest: { v: clamp(catW), raw: interests.includes(l.category) ? "picked category" : (affinity[l.category] ? "you keep opening these" : "not a picked category") },
    saved: { v: sim, raw: sim === 1 ? "saved" : sim ? "like a saved lot" : "no link to saves" },
    budget: { v: clamp(bf), raw: `budget ${eur(budget)} vs est. ${eur(l.estimate_low)}–${eur(l.estimate_high)}` }
  };
  return out;
}
export function scoreLot(l, ctx) {
  const s = signals(l, ctx); const f = {};
  FACTORS.forEach(F => (f[F.k] = s[F.k].v));
  return f;
}
export function rank(lots, ctx, W) {
  const sumW = FACTORS.reduce((a, F) => a + (W[F.k] || 0), 0) || 1;
  const hidden = ctx.hidden || new Set();
  return lots.filter(l => !hidden.has(l.lot_id)).map(l => {
    const f = scoreLot(l, { ...ctx, lots: ctx.lots || lots });
    const c = {}; FACTORS.forEach(F => (c[F.k] = ((W[F.k] || 0) * f[F.k]) / sumW));
    return { l, f, c, s: Object.values(c).reduce((a, b) => a + b, 0) };
  }).sort((a, b) => b.s - a.s);
}
export function reasons(p, ctx) {
  const { l, c, f } = p, mid = (l.estimate_low + l.estimate_high) / 2;
  const top = Object.entries(c).sort((a, b) => b[1] - a[1]).filter(e => e[1] > 0.02).slice(0, 2).map(e => e[0]);
  const hrs = (l.auction_end - ctx.now) / 3.6e6;
  const tags = l.tags || [];
  const say = {
    popularity: `${l.watchers} watching · ${l.bidders} bidding`,
    value: l.comp > mid ? `~${Math.round((l.comp - mid) / l.comp * 100)}% under recent sales` : "Priced at market",
    price: `Bidding at ${eur(l.currentBid || l.estimate_low)}`,
    rarity: tags.includes("museum-grade") ? "Museum-grade piece" : tags.includes("provenance") ? "With provenance" : `Dates to ${l.year}`,
    brand: (BRAND[l.brand] || 0) > 0.7 ? `${l.brand}, sought-after maker` : `By ${l.brand}`,
    quality: l.authenticity ? "Comes with proof" : `${l.condition} condition`,
    ending: hrs < 1 ? "Ending within the hour" : `Ends in ${Math.round(hrs)}h`,
    quiet: `Only ${l.bidders} bidders`,
    interest: "Matches your interests",
    saved: f.saved === 1 ? "You saved this" : "Like things you saved",
    budget: "Inside your budget"
  };
  return top.map(k => say[k]);
}
