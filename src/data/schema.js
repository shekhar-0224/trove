// The Trove lot format. Every imported row maps onto these fields.
// Modelled on what a real auction lot page needs: identity, photos, details, pricing, timing, shipping and seller.
export const LOT_FIELDS = [
  { key: "lot_id", label: "Lot ID", req: true, ex: "TRV-1042", note: "Unique per lot" },
  { key: "title", label: "Title", req: true, ex: "Nike Dunk Low – University Red – 2021", note: "Brand – Model – Year/Period" },
  { key: "brand", label: "Brand / maker", req: false, ex: "Nike" },
  { key: "model", label: "Model", req: false, ex: "Dunk Low" },
  { key: "category", label: "Category", req: true, ex: "Sneakers", note: "Top-level category" },
  { key: "subcategory", label: "Subcategory", req: false, ex: "Low-tops" },
  { key: "description", label: "Description", req: true, ex: "Worn twice, original box…", note: "Seller's words. Condition notes, history, flaws" },
  { key: "condition", label: "Condition", req: true, ex: "Like new", note: "New · Like new · Very good · Good · Fair" },
  { key: "pieces", label: "Number of items", req: true, ex: "2", note: "Pieces in the lot (a pair = 2, a set of 4 = 4)" },
  { key: "year", label: "Year / period", req: false, ex: "2021" },
  { key: "size", label: "Size", req: false, ex: "EU 42 / US 8.5" },
  { key: "materials", label: "Materials", req: false, ex: "Leather, rubber" },
  { key: "dimensions", label: "Dimensions", req: false, ex: "30 × 12 × 11 cm" },
  { key: "weight", label: "Weight", req: false, ex: "0.9 kg" },
  { key: "authenticity", label: "Authenticity proof", req: false, ex: "Receipt, original box", note: "Certificate, receipt, box & papers, or none" },
  { key: "images", label: "Image URLs", req: true, ex: "https://…/1.jpg|https://…/2.jpg", note: "Pipe-separated. First image is the cover. Plain background works best" },
  { key: "estimate_low", label: "Estimate low", req: true, ex: "180" },
  { key: "estimate_high", label: "Estimate high", req: true, ex: "240" },
  { key: "starting_bid", label: "Starting bid", req: true, ex: "1" },
  { key: "reserve_price", label: "Reserve price", req: false, ex: "150", note: "Leave empty for no reserve" },
  { key: "currency", label: "Currency", req: true, ex: "EUR" },
  { key: "auction_end", label: "Auction end", req: true, ex: "2026-11-02T20:00:00Z", note: "ISO 8601" },
  { key: "live", label: "In a live show", req: false, ex: "yes", note: "yes = can be featured in a live stream" },
  { key: "ships_from", label: "Ships from", req: true, ex: "Amsterdam, NL" },
  { key: "shipping_cost", label: "Shipping cost", req: false, ex: "14" },
  { key: "insured_shipping", label: "Insured shipping", req: false, ex: "yes" },
  { key: "seller_name", label: "Seller", req: true, ex: "tempus.horology" },
  { key: "seller_country", label: "Seller country", req: false, ex: "NL" },
  { key: "seller_rating", label: "Seller rating", req: false, ex: "4.9" },
  { key: "seller_sales", label: "Seller sales", req: false, ex: "312" },
  { key: "tags", label: "Tags", req: false, ex: "grail|deadstock|og-box", note: "Pipe-separated" }
];

export const CONDITIONS = ["New", "Like new", "Very good", "Good", "Fair"];

export function templateCSV() {
  const head = LOT_FIELDS.map(f => f.key).join(",");
  const row = LOT_FIELDS.map(f => /[,"]/.test(f.ex) ? `"${f.ex.replace(/"/g, '""')}"` : f.ex).join(",");
  return head + "\n" + row + "\n";
}
