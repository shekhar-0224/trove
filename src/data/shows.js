// Seller-hosted live shows. Each seller with live lots runs their own show.
const TITLES = {
  watches: ["Horology evening: pocket watches & clocks", "Clocks from the workshop"],
  jewellery: ["Fine jewellery, unboxed live", "Ancient gold, explained"],
  coins: ["Coin night: Greek & Parthian", "Numismatics under the loupe"],
  silver: ["Silver & porcelain from English houses"],
  glass: ["Art Nouveau glass, under the lights"],
  furniture: ["Furniture walk-through"],
  archaeology: ["Antiquities with paperwork"],
  arms: ["Arms & armour: helmets up close"],
  instruments: ["Vintage instruments, played live"],
  photo: ["Early photography & optics"],
  art: ["Paintings: landscapes up close"],
  asian: ["Edo prints & netsuke"],
  books: ["Manuscripts & illuminated leaves"]
};

export function buildShows(lots) {
  const bySeller = new Map();
  lots.filter(l => l.live).forEach(l => { if (!bySeller.has(l.seller_name)) bySeller.set(l.seller_name, []); bySeller.get(l.seller_name).push(l); });
  let i = 0;
  return [...bySeller.entries()].map(([seller, sl]) => {
    const cat = sl[0].category, t = TITLES[cat] || ["Live drop"];
    const show = {
      id: "show-" + seller, seller, country: sl[0].seller_country, rating: sl[0].seller_rating, sales: sl[0].seller_sales,
      title: t[i % t.length], category: cat, lots: sl, viewers: 180 + ((seller.length * 97 + i * 131) % 1400)
    };
    i++;
    return show;
  }).sort((a, b) => b.viewers - a.viewers);
}
