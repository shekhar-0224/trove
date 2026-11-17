import { lotImg } from "../components/LotCard.jsx";

// A lived-in demo account so first-time testers can see every part of Trove working.
export function demoState(lots, now = Date.now()) {
  const pick = n => lots[n % lots.length];
  const STEP = 45000;
  const order = (l, amount, paidAgoSteps, extra = {}) => ({
    id: l.lot_id + "-demo", lot_id: l.lot_id, title: l.title, img: lotImg(l, 200, 250), amount, shipping: l.shipping_cost || 0,
    seller: l.seller_name, wonAt: now - 86400000 * (paidAgoSteps + 1), paidAt: paidAgoSteps == null ? null : now - paidAgoSteps * STEP - 2000, ...extra
  });
  return {
    saved: [pick(3), pick(6), pick(10), pick(16), pick(22)].map(l => l.lot_id),
    bids: [
      { lot_id: pick(1).lot_id, amount: pick(1).currentBid + 50, at: now - 3600000 },
      { lot_id: pick(11).lot_id, amount: pick(11).currentBid + 100, at: now - 7200000 }
    ],
    orders: [
      order(pick(17), pick(17).estimate_low, null),
      order(pick(8), pick(8).estimate_low, 3),
      order(pick(24), pick(24).estimate_low, 9, { confirmed: true })
    ],
    badges: { first_save: now - 5 * 86400000, first_bid: now - 4 * 86400000, in_the_room: now - 3 * 86400000, first_win: now - 3 * 86400000 }
  };
}
