import { LOT_FIELDS } from "../data/schema.js";
import { CATEGORIES } from "../data/lots.js";

// Accepts Trove-template rows, and also common scraper shapes (e.g. Apify: lotTitle, currentBid, imageUrls, categoryPath).
const ALIASES = {
  lot_id: ["lot_id", "lotId", "id"],
  title: ["title", "lotTitle", "name"],
  brand: ["brand", "subtitle"],
  model: ["model"],
  category: ["category", "categoryName"],
  subcategory: ["subcategory"],
  description: ["description", "summary"],
  condition: ["condition"],
  pieces: ["pieces", "items", "quantity", "number_of_items"],
  year: ["year", "period"],
  size: ["size"], materials: ["materials", "material"], dimensions: ["dimensions"], weight: ["weight"],
  authenticity: ["authenticity"],
  images: ["images", "imageUrls", "image_urls", "imageUrl", "image"],
  estimate_low: ["estimate_low", "estimateLow", "lowEstimate"],
  estimate_high: ["estimate_high", "estimateHigh", "highEstimate"],
  starting_bid: ["starting_bid", "startingBid"],
  current_bid: ["current_bid", "currentBid"],
  reserve_price: ["reserve_price", "reservePrice"],
  currency: ["currency"],
  auction_end: ["auction_end", "closingTime", "endTime"],
  live: ["live"],
  ships_from: ["ships_from", "sellerCountry"],
  shipping_cost: ["shipping_cost"],
  insured_shipping: ["insured_shipping"],
  seller_name: ["seller_name", "sellerName"],
  seller_country: ["seller_country", "sellerCountry"],
  seller_rating: ["seller_rating"],
  seller_sales: ["seller_sales"],
  tags: ["tags"],
  url: ["url", "lotUrl"],
  category_path: ["categoryPath"]
};
const get = (o, keys) => { for (const k of keys) { const h = Object.keys(o).find(x => x.toLowerCase() === k.toLowerCase()); if (h != null && o[h] !== "" && o[h] != null) return o[h]; } };
const num = v => { if (v == null) return NaN; if (typeof v === "number") return v; const m = String(v).replace(/\s/g, "").match(/\d[\d.,]*/); if (!m) return NaN; let s = m[0]; if (/,\d{2}$/.test(s)) s = s.replace(/\./g, "").replace(",", "."); else s = s.replace(/,/g, ""); return parseFloat(s); };
const list = v => Array.isArray(v) ? v.map(String) : v == null ? [] : String(v).split(/[|\n]/).map(s => s.trim()).filter(Boolean);

export function csvParse(txt) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"' && txt[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && txt[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const h = rows.shift() || [];
  return rows.filter(r => r.some(x => x.trim())).map(r => Object.fromEntries(h.map((k, i) => [k.trim(), r[i]])));
}

function guessCategory(text) {
  const t = text.toLowerCase();
  const map = { watches: /watch|clock|chrono|horolog/, jewellery: /ring|brooch|necklace|bracelet|jewel|diamond|emerald/, coins: /coin|stater|denarius|tetradrachm|sovereign/, silver: /silver|porcelain|teapot|meissen|sevres/, glass: /glass|tiffany|lalique|favrile/, furniture: /chair|table|cabinet|commode|furniture/, archaeology: /amulet|roman|egypt|antiquit|ancient/, arms: /helmet|sword|armou?r|dagger/, instruments: /guitar|violin|piano|instrument/, photo: /camera|photograph|print|daguerre/, art: /painting|oil on|canvas|watercolou?r/, asian: /japan|china|netsuke|woodblock|ukiyo/, books: /book|manuscript|map|atlas/ };
  return Object.keys(map).find(k => map[k].test(t)) || "art";
}

export function importLots(text) {
  let items;
  items = /^\s*[[{]/.test(text) ? JSON.parse(text) : csvParse(text);
  if (!Array.isArray(items)) items = items.items || items.data || items.results || [];
  const now = Date.now(), warnings = new Set();
  const lots = items.map((o, i) => {
    if (!o || typeof o !== "object") return null;
    const title = String(get(o, ALIASES.title) || "").trim(); if (!title) return null;
    const path = list(get(o, ALIASES.category_path));
    const catRaw = String(get(o, ALIASES.category) || path[path.length - 1] || "");
    const known = CATEGORIES.find(c => c.label.toLowerCase() === catRaw.toLowerCase() || c.id === catRaw.toLowerCase());
    const bid = num(get(o, ALIASES.current_bid));
    let lo = num(get(o, ALIASES.estimate_low)), hi = num(get(o, ALIASES.estimate_high));
    if (isNaN(lo)) { warnings.add("estimate_low"); lo = !isNaN(bid) && bid > 0 ? bid : 50; }
    if (isNaN(hi)) hi = Math.round(lo * 1.5);
    const end = Date.parse(get(o, ALIASES.auction_end) || "");
    const images = list(get(o, ALIASES.images)).map(u => u.startsWith("//") ? "https:" + u : u).filter(u => /^https:\/\//.test(u));
    if (!images.length) warnings.add("images");
    const cond = get(o, ALIASES.condition); if (!cond) warnings.add("condition");
    const pieces = num(get(o, ALIASES.pieces)); if (isNaN(pieces)) warnings.add("pieces");
    const url = get(o, ALIASES.url);
    return {
      lot_id: String(get(o, ALIASES.lot_id) || "IMP-" + (i + 1)),
      title, brand: get(o, ALIASES.brand) || "", model: get(o, ALIASES.model) || "",
      category: known ? known.id : guessCategory(title + " " + catRaw), category_label: catRaw || undefined,
      subcategory: get(o, ALIASES.subcategory) || path[path.length - 1] || "",
      description: String(get(o, ALIASES.description) || ""),
      condition: cond || "Not stated", pieces: isNaN(pieces) ? 1 : pieces,
      year: get(o, ALIASES.year) || "", size: get(o, ALIASES.size), materials: get(o, ALIASES.materials),
      dimensions: get(o, ALIASES.dimensions), weight: get(o, ALIASES.weight), authenticity: get(o, ALIASES.authenticity),
      images, estimate_low: Math.round(lo), estimate_high: Math.round(Math.max(hi, lo)),
      starting_bid: num(get(o, ALIASES.starting_bid)) || 1, reserve_price: num(get(o, ALIASES.reserve_price)) || null,
      currency: get(o, ALIASES.currency) || "EUR",
      auction_end: isNaN(end) || end < now ? now + (i + 1) * 40 * 60000 : end,
      live: String(get(o, ALIASES.live) ?? "yes").toLowerCase() !== "no",
      ships_from: get(o, ALIASES.ships_from) || "", shipping_cost: num(get(o, ALIASES.shipping_cost)) || null,
      insured_shipping: /^y|true/i.test(String(get(o, ALIASES.insured_shipping) || "")),
      seller_name: get(o, ALIASES.seller_name) || "seller", seller_country: get(o, ALIASES.seller_country) || "",
      seller_rating: num(get(o, ALIASES.seller_rating)) || null, seller_sales: num(get(o, ALIASES.seller_sales)) || null,
      tags: list(get(o, ALIASES.tags)), url: typeof url === "string" ? url : null,
      currentBid: !isNaN(bid) ? bid : undefined
    };
  }).filter(Boolean);
  const labels = Object.fromEntries(LOT_FIELDS.map(f => [f.key, f.label]));
  return { lots, warnings: [...warnings].map(k => labels[k] || k) };
}
