import { rng, hash } from "./format.js";
// Adds simulated market signals to a lot: likely hammer, recent comparable sales, watchers, bidders.
export function enrich(lot) {
  const r = rng(hash(lot.lot_id));
  const mid = (lot.estimate_low + lot.estimate_high) / 2;
  return {
    ...lot,
    hammer: Math.max(lot.estimate_low * 0.8, Math.round((mid * (0.82 + r() * 0.48)) / 5) * 5),
    comp: Math.round((mid * (0.85 + r() * 0.5)) / 5) * 5,
    watchers: 8 + Math.floor(r() * 140),
    bidders: 2 + Math.floor(r() * 14),
    currentBid: Math.max(lot.starting_bid, Math.round((lot.estimate_low * (0.25 + r() * 0.5)) / 5) * 5)
  };
}
