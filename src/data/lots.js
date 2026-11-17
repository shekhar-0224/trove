// Sample catalogue. Photos are public-domain (CC0) images from The Metropolitan Museum of Art Open Access programme,
// stored in /public/lots. Listings, estimates and sellers are illustrative sample data, not real sales.
export const unsplash = (id, w = 900, h) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=${w}${h ? `&h=${h}` : ""}`;

export const CATEGORIES = [
  { id: "art", label: "Paintings" },
  { id: "asian", label: "Asian art" },
  { id: "watches", label: "Watches & clocks" },
  { id: "jewellery", label: "Jewellery" },
  { id: "coins", label: "Coins" },
  { id: "silver", label: "Silver & porcelain" },
  { id: "glass", label: "Art glass" },
  { id: "furniture", label: "Furniture" },
  { id: "archaeology", label: "Archaeology" },
  { id: "arms", label: "Arms & armour" },
  { id: "instruments", label: "Instruments" },
  { id: "photo", label: "Photography" },
  { id: "books", label: "Books & manuscripts" }
];

// [met id, photos, title, maker, model, category, sub, condition, year, date, est_lo, est_hi, seller, country, rating, sales, tags, description, extra]
const RAW = [
  [199408, 2, "Robert Roskell – Gold pocket watch – 1820", "Robert Roskell", "Pocket watch", "watches", "Pocket watches", "Very good", 1820, "1820–21", 2200, 3200, "tempus.horology", "CH", 4.9, 521, ["gold", "signed", "original-case"], "Liverpool-made gold pocket watch with gold dial and steel hands. Movement signed, running after a recent service. Light wear to the case back.", { materials: "Gold, steel", dimensions: "7.3 × 5.1 cm", authenticity: "Signed movement, service report 2025" }],
  [187197, 1, "Roches – Enamelled gold pocket watch – 19th century", "Roches", "Pocket watch", "watches", "Pocket watches", "Good", 1850, "19th century", 900, 1400, "tempus.horology", "CH", 4.9, 521, ["enamel", "gold"], "Gold and enamel open-face pocket watch. Enamel intact with a hairline near the bow. Not running, sold as a collector's piece.", { materials: "Gold, enamel", dimensions: "Ø 5.1 cm" }],
  [187193, 1, "Gold and enamel pocket watch – early 19th century", "Unsigned", "Pocket watch", "watches", "Pocket watches", "Fair", 1810, "early 19th century", 450, 700, "relic.and.rarity", "BE", 4.6, 140, ["enamel"], "Small gold pocket watch with enamel dial. Unsigned movement, crystal replaced. A good entry piece.", { materials: "Gold, enamel", dimensions: "Ø 4.3 cm" }],
  [194105, 2, "Caspar Behaim – Gilt table clock – 1554", "Caspar Behaim", "Table clock", "watches", "Clocks", "Good", 1554, "case 1554, movement c. 1680", 6000, 9000, "tempus.horology", "CH", 4.9, 521, ["renaissance", "signed", "provenance"], "Renaissance drum-form table clock in gilt brass with an iron stackfreed movement. Case and movement of different dates, as is common.", { materials: "Gilt brass, iron", dimensions: "3.2 × 6.4 cm", authenticity: "Old collection label" }],
  [196403, 2, "Automaton clock in the form of an eagle – c. 1630", "Augsburg workshop", "Automaton clock", "watches", "Clocks", "Very good", 1630, "c. 1630", 18000, 26000, "tempus.horology", "CH", 4.9, 521, ["automaton", "museum-grade", "provenance"], "Gilded brass eagle automaton on an ebony base. The eyes and wings move on the hour. A true centrepiece.", { materials: "Gilded brass, ebony", dimensions: "33.7 × 23.2 cm", authenticity: "Provenance file, condition report" }],
  [1025, 2, "Emerald and diamond brooch in platinum – c. 1900", "American jeweller", "Brooch", "jewellery", "Brooches", "Very good", 1900, "c. 1900", 9000, 14000, "aurum.jewels", "NL", 4.8, 233, ["emerald", "diamond", "platinum"], "Belle Époque brooch centred on a step-cut emerald within a double halo of old-cut diamonds, set in platinum.", { materials: "Emerald, diamonds, platinum", dimensions: "3.2 × 4.4 cm", authenticity: "Gemmological report" }],
  [20519, 1, "Georgian silver and garnet heart brooch – c. 1770", "British", "Brooch", "jewellery", "Brooches", "Good", 1770, "c. 1770", 450, 700, "aurum.jewels", "NL", 4.8, 233, ["georgian", "garnet"], "Witch's heart brooch in silver set with foiled garnets. Pin original, one stone with a small chip.", { materials: "Silver, garnet", dimensions: "2.9 × 3.2 cm" }],
  [248265, 2, "Greek gold ring – 4th–3rd century BCE", "Greek", "Ring", "jewellery", "Ancient jewellery", "Good", -300, "late 4th–3rd century BCE", 3500, 5000, "nile.antiquities", "UK", 4.7, 109, ["ancient", "gold", "provenance"], "Hellenistic gold finger ring with a shaped bezel. Wear consistent with age. Old European collection.", { materials: "Gold", dimensions: "2.6 × 2 cm", authenticity: "Export licence, collection history" }],
  [247103, 1, "Etruscan gold ring – 4th–3rd century BCE", "Etruscan", "Ring", "jewellery", "Ancient jewellery", "Very good", -300, "4th–3rd century BCE", 2800, 4200, "nile.antiquities", "UK", 4.7, 109, ["ancient", "gold"], "Etruscan gold ring with an engraved oval bezel. Strong detail, no repairs.", { materials: "Gold", dimensions: "Ø 3.2 cm" }],
  [322362, 2, "Parthian silver tetradrachm – 212 CE", "Parthian mint", "Tetradrachm", "coins", "Ancient coins", "Very good", 212, "c. 212–213 CE", 300, 500, "aurum.numismatics", "DE", 4.9, 402, ["ancient", "silver"], "Silver tetradrachm with a bust of the king, and an enthroned figure on the reverse. Well centred.", { materials: "Silver", dimensions: "Ø 2.5 cm" }],
  [322356, 2, "Parthian silver tetradrachm – 49 CE", "Parthian mint", "Tetradrachm", "coins", "Ancient coins", "Good", 49, "c. 49–50 CE", 250, 400, "aurum.numismatics", "DE", 4.9, 402, ["ancient", "silver"], "Earlier Parthian tetradrachm, a touch off-centre with honest wear.", { materials: "Silver", dimensions: "Ø 2.8 cm" }],
  [247144, 2, "Greek gold stater, Philip II type – c. 320 BCE", "Macedonian mint", "Stater", "coins", "Ancient coins", "Like new", -320, "c. 323–315 BCE", 3200, 4500, "aurum.numismatics", "DE", 4.9, 402, ["ancient", "gold", "museum-grade"], "Gold stater with a laureate head of Apollo. Sharp strike, lustrous fields. A grail coin for many collectors.", { materials: "Gold", dimensions: "18 mm", authenticity: "Certified, slabbed" }],
  [198685, 2, "Chelsea porcelain vase – 1756–60", "Chelsea Porcelain", "Vase", "silver", "Porcelain", "Very good", 1758, "1756–60", 1800, 2600, "hallmark.house", "UK", 4.8, 312, ["porcelain", "provenance"], "Soft-paste porcelain vase with applied flowers. Gold anchor period. Tiny losses to petals.", { materials: "Soft-paste porcelain", dimensions: "H 26 cm" }],
  [203377, 2, "Chelsea porcelain perfume vase – c. 1761", "Chelsea Porcelain", "Perfume vase", "silver", "Porcelain", "Good", 1761, "c. 1761", 4500, 6500, "hallmark.house", "UK", 4.8, 312, ["porcelain", "rococo"], "Lidded rococo perfume vase with claret ground and painted panels. Restoration to one handle, disclosed.", { materials: "Soft-paste porcelain", dimensions: "43 × 29 cm" }],
  [200114, 2, "Queen Anne silver teapot – 1699", "I. C.", "Teapot", "silver", "Silver", "Very good", 1699, "1699–1700", 5000, 7500, "hallmark.house", "UK", 4.8, 312, ["hallmarked", "silver", "provenance"], "Early English silver teapot with side ebony handle. Fully hallmarked, crisp marks.", { materials: "Silver, ebony", dimensions: "14.3 × 29.5 cm", authenticity: "Hallmarks" }],
  [200224, 2, "French silver coffee pot, Lille – c. 1750", "Lille", "Coffee pot", "silver", "Silver", "Good", 1750, "c. 1750", 2200, 3200, "atelier.antiques", "FR", 4.7, 198, ["hallmarked", "silver"], "Lille silver pot with fluted body and wooden handle. Light dents to the base.", { materials: "Silver, wood", dimensions: "H 19.7 cm", authenticity: "Town marks" }],
  [9480, 2, "Tiffany Favrile glass vase – 1893–96", "Tiffany Studios", "Vase", "glass", "Art glass", "Like new", 1894, "1893–96", 7000, 10000, "lustre.glass", "US", 4.9, 154, ["signed", "art-nouveau", "museum-grade"], "Iridescent Favrile glass vase with peacock-feather decoration. Engraved signature to the base.", { materials: "Favrile glass", dimensions: "35.9 × 29.2 cm", authenticity: "Signed" }],
  [245220, 1, "Roman glass bottle – 4th century CE", "Roman", "Bottle", "glass", "Ancient glass", "Good", 350, "4th century CE", 500, 800, "nile.antiquities", "UK", 4.7, 109, ["ancient", "iridescent"], "Pale green blown-glass bottle with natural iridescence from burial. Intact.", { materials: "Glass", dimensions: "H 18.4 cm" }],
  [221, 1, "Rosewood marquetry armchair – 1865–70", "New York maker", "Armchair", "furniture", "Seating", "Good", 1867, "1865–70", 1500, 2400, "atelier.antiques", "FR", 4.7, 198, ["marquetry"], "Renaissance Revival armchair in rosewood with marquetry and gilt details. Reupholstered.", { materials: "Rosewood, gilt", dimensions: "88 × 64 × 68 cm" }],
  [252, 1, "Pair of walnut armchairs – 1740–60", "American", "Armchair", "furniture", "Seating", "Fair", 1750, "1740–60", 1200, 1800, "atelier.antiques", "FR", 4.7, 198, ["pair"], "Queen Anne walnut armchairs with cabriole legs. Old repairs to one rail; sold as a pair.", { materials: "Walnut, ash, pine", dimensions: "91 × 58 × 53 cm" }],
  [243754, 1, "Egyptian faience amulet of Taweret – 664–334 BCE", "Egyptian", "Amulet", "archaeology", "Egyptian", "Very good", -500, "664–334 BCE", 800, 1200, "nile.antiquities", "UK", 4.7, 109, ["ancient", "provenance"], "Glazed faience amulet of the protective goddess Taweret, with suspension loop intact.", { materials: "Faience", dimensions: "H 4.9 cm", authenticity: "Collection history" }],
  [34339, 1, "German close helmet – c. 1550", "German", "Close helmet", "arms", "Armour", "Good", 1550, "c. 1550, restored c. 1875", 6000, 9000, "armoury.eu", "DE", 4.8, 88, ["renaissance", "provenance"], "Steel close helmet with gilt decoration, restored in the 19th century. Visor moves freely.", { materials: "Steel, gold", dimensions: "H 26 cm" }],
  [26531, 2, "Mongolian helmet with gold and silver – 14th–17th c.", "Mongolian", "Helmet", "arms", "Armour", "Good", 1500, "14th–17th century", 3500, 5500, "armoury.eu", "DE", 4.8, 88, ["inlaid", "ancient"], "Iron helmet inlaid with gold, silver and turquoise. Surface patina, decoration well preserved.", { materials: "Iron, gold, silver, turquoise", dimensions: "19 × 22 cm" }],
  [506864, 1, "Gibson L-4 archtop guitar – c. 1918", "Gibson", "L-4", "instruments", "Guitars", "Good", 1918, "c. 1918", 4000, 6000, "strings.vintage", "US", 4.9, 154, ["vintage", "playable"], "Early Gibson L-4 archtop with mother-of-pearl inlays. Plays well, period-correct repairs.", { materials: "Spruce, maple, mahogany", dimensions: "97.5 × 40.6 cm" }],
  [503057, 2, "Cremonese violin – 1669", "Cremona workshop", "Violin", "instruments", "Strings", "Very good", 1669, "1669", 22000, 32000, "strings.vintage", "US", 4.9, 154, ["museum-grade", "provenance"], "Italian violin from Cremona, 1669. Warm varnish, original scroll. Sold with expert certificate.", { materials: "Spruce, maple", dimensions: "60.3 cm", authenticity: "Expert certificate" }],
  [631211, 2, "Wooden camera obscura – 19th century", "Unknown maker", "Camera obscura", "photo", "Cameras", "Good", 1850, "19th century", 600, 900, "lumen.photo", "NL", 4.9, 178, ["optics", "rare-type"], "Box camera obscura in wood with brass lens. Projects a clear image on the ground glass.", { materials: "Wood, glass, optics" }],
  [917911, 2, "Self-portrait with camera, albumen print – 1880s", "William W. Briley", "Albumen print", "photo", "Photographs", "Very good", 1885, "1880s–1890s", 150, 260, "lumen.photo", "NL", 4.9, 178, ["albumen", "signed"], "Small albumen silver print of the photographer with his camera, on original mount.", { materials: "Albumen silver print", dimensions: "5.7 × 4 cm" }],
  [12122, 1, "Landscape with goatherd, oil on canvas – 1890", "American school", "Oil painting", "art", "Landscapes", "Very good", 1890, "1890–91", 3000, 5000, "canvas.fineart", "FR", 4.8, 266, ["oil", "impressionist"], "Sunlit impressionist landscape with a goatherd and flock. Relined, with a period frame.", { materials: "Oil on canvas", dimensions: "61.6 × 81 cm" }],
  [10181, 1, "Wooded landscape, oil on canvas – 1885–95", "American school", "Oil painting", "art", "Landscapes", "Good", 1890, "1885–95", 1800, 2800, "canvas.fineart", "FR", 4.8, 266, ["oil"], "Tonalist woodland with deep greens. Craquelure consistent with age.", { materials: "Oil on canvas", dimensions: "68.6 × 94.9 cm" }],
  [10777, 2, "Landscape with shepherd, oil on canvas – 1852", "Hudson River school", "Oil painting", "art", "Landscapes", "Very good", 1852, "1852", 6000, 9000, "canvas.fineart", "FR", 4.8, 266, ["oil", "signed", "provenance"], "Hudson River School view with a shepherd at dusk. Signed and dated lower left.", { materials: "Oil on canvas", dimensions: "82.6 × 122.6 cm", authenticity: "Signed, dated" }],
  [37193, 1, "Hokusai – Seaside village in winter, woodblock – 1814", "Katsushika Hokusai", "Woodblock print", "asian", "Japanese prints", "Good", 1814, "1814", 900, 1400, "edo.gallery", "DE", 4.9, 92, ["woodblock", "edo"], "Plate from Hokusai's album of real-life sketches. Soft colours, small margin stain.", { materials: "Ink and colour on paper", dimensions: "20.3 × 31.8 cm" }],
  [57805, 1, "Hokusai Manga, volume 12 – 1834", "Katsushika Hokusai", "Woodblock book", "asian", "Japanese prints", "Good", 1834, "1834", 1200, 1800, "edo.gallery", "DE", 4.9, 92, ["woodblock", "first-edition", "edo"], "Volume 12 of Hokusai's celebrated sketchbooks, with its humorous figures. Binding sound.", { materials: "Woodblock printed book", dimensions: "22.9 × 15.9 cm" }],
  [59356, 2, "Carved wood netsuke – 18th century", "Japan", "Netsuke", "asian", "Netsuke", "Very good", 1750, "18th century", 600, 900, "edo.gallery", "DE", 4.9, 92, ["carved", "edo"], "Boxwood netsuke of a laughing figure, with a rich patina and clear himotoshi.", { materials: "Wood", dimensions: "4.4 × 4.8 cm" }],
  [475399, 1, "Book of Hours leaf, gold on parchment – 15th century", "French illuminator", "Manuscript leaf", "books", "Manuscripts", "Very good", 1450, "15th century", 1800, 2800, "vellum.books", "FR", 4.8, 77, ["illuminated", "provenance"], "Illuminated leaf in tempera and burnished gold, with a decorated border. Bright and fresh.", { materials: "Tempera and gold on parchment", dimensions: "12.1 × 8.2 cm" }]
];

const EXPERTS = ["Maya R.", "Jonas V.", "Ines K.", "Tom B."];
const SHIPS = { NL: "Amsterdam, NL", DE: "Berlin, DE", FR: "Paris, FR", UK: "London, UK", CH: "Geneva, CH", BE: "Antwerp, BE", US: "New York, US" };

export function buildSampleLots(now = Date.now()) {
  return RAW.map((r, i) => {
    const [met, n, title, brand, model, category, sub, condition, year, date, lo, hi, seller, country, rating, sales, tags, description, extra] = r;
    return {
      lot_id: "TRV-" + (1040 + i),
      title, brand, model, category, subcategory: sub, description, condition, pieces: model.startsWith("Pair") || tags.includes("pair") ? 2 : 1,
      year: date, year_num: year,
      images: Array.from({ length: n }, (_, k) => `/lots/met-${met}-${k}.jpg`),
      estimate_low: lo, estimate_high: hi,
      starting_bid: Math.max(5, Math.round(lo * 0.45 / 10) * 10),
      reserve_price: i % 4 === 0 ? Math.round(lo * 0.9) : null,
      currency: "EUR",
      auction_end: now + (i + 1) * 47 * 60 * 1000,
      live: i % 3 !== 2,
      ships_from: SHIPS[country],
      shipping_cost: hi > 5000 ? 45 : hi > 1000 ? 25 : 15,
      insured_shipping: true,
      seller_name: seller, seller_country: country, seller_rating: rating, seller_sales: sales,
      expert: EXPERTS[i % EXPERTS.length],
      tags,
      source: "The Met, Open Access (CC0) · object " + met,
      sample: true,
      ...extra
    };
  });
}
