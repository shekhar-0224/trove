# Trove: project context

**Live:** https://trove-live.vercel.app
**Ranking lab:** https://trove-live.vercel.app/#/lab
**Author:** Shashank Singh. A personal concept project, not affiliated with Catawiki.
**Status:** working prototype (Nov 2026). Sample listings; photos are public-domain from The Met Open Access (CC0).

---

## One-liner
Trove is an auction marketplace with seller-hosted live streams. It is built to explore one question: **how should search and recommendations rank objects that are one of a kind?**

## Why it exists
- Catawiki describes special objects as things that "do not behave like standard inventory". Most lots are unique, so there is no sales history and no reference price to rank against.
- The author's day job is search and recommendations for sports prediction markets (DG3). There, inventory repeats: the same teams, the same fixtures every season, the same market types. Rankings can learn from history and score against a reference price.
- Trove explores the opposite case. With no history, **the object itself has to carry the signal**: condition, provenance, age, maker, scarcity and live market activity.

## What's in the product
| Area | What it does |
|---|---|
| **Discover** | Home feed. A "Ranked by" picker switches algorithms. Compare shows three algorithms side by side. Tune opens the weights. Every card has "Why #n?". |
| **Search** | Live as you type, with autocomplete (recent, trending, live sellers, lots, categories). Typo-tolerant fallback. Never shows an empty state. |
| **Ranking lab** | The centrepiece. It shows the full pipeline and lets you change each step; see below. |
| **Live** | Seller-hosted live auctions. Bids show in chat like paid messages, late bids extend the clock (+8s), and you can call the hammer price. On mobile you swipe up for the next show. Sellers can go live with their webcam. |
| **Lot page** | Photos, buy box, max bid, seller, details and delivery, plus tabs for Similar / More from seller / Picked for you. |
| **Account** | Sign-in is a pop-up only when needed (simulated, no passwords). The demo account comes pre-filled: saves, bids, won lots, orders and delivery tracking, settings, and one-time badges (no streaks). |

## Catalogue
34 lots across 13 auction categories: paintings, Asian art, watches & clocks, jewellery, coins, silver & porcelain, art glass, furniture, archaeology, arms & armour, instruments, photography, books & manuscripts.

Examples: a Robert Roskell gold pocket watch (1820), a Caspar Behaim table clock (1554), a Greek gold stater, an emerald brooch (c. 1900), a Tiffany Favrile vase, a Gibson L-4 guitar, a Cremona violin (1669), Hokusai prints, a German close helmet, and an Egyptian faience amulet.

Market data (watchers, bidders, comparable sales, current bid) is simulated with a fixed seed per lot, so it's the same every time. The lot data follows 31 fields modelled on a real auction listing (title, maker, category, condition, year, dimensions, materials, authenticity, estimate, reserve, shipping, seller…).

---

## How ranking works

### The pipeline (two-stage ranking)
1. **Retrieve:** a text model finds candidates for the query. For the feed, every lot is a candidate.
2. **Score:** each lot gets 11 signals, each scaled to 0–1, then weighted.
3. **Re-rank:** blend text with signals (search), or diversify (MMR) or sort (feed).

**Search score:** `final = α × text_relevance + (1 − α) × Σ wᵢ·signalᵢ / Σw` (α is the "Text vs signals" slider, default 0.6)
**Feed score:** `Σ wᵢ·signalᵢ / Σw`, or an algorithm-specific rule.

### Text models (retrieval)
| Model | Idea |
|---|---|
| Token match | Counts matching query words |
| **BM25** | Gives more weight to rare words and to matches in short fields (k1 = 1.2, b = 0.75) |
| TF-IDF cosine | Compares query and lot as weighted vectors |
| Exact phrase | Rewards the whole query in order |
| Prefix | Matches word starts (good while typing) |
| Fuzzy-lite | Tolerates 1–2 letter typos |

Field weights (adjustable): title 5, maker/model 3, description 2, category 2, tags & condition 1.

### The 11 signals (scoring)
| Group | Signal | How it is computed (0–1) |
|---|---|---|
| Market | **Popularity** | (watchers + 6 × bidders) / 230 |
| Market | **Value vs comps** | estimate midpoint vs recent comparable sales |
| Market | **Low price** | current bid on a log scale (cheaper scores higher) |
| Item | **Rarity** | rare tags (museum-grade, provenance, signed, first edition…) + age (log scale) + how few exist in the catalogue |
| Item | **Maker / brand pull** | how sought-after the maker is (Tiffany, Hokusai, Gibson high; unsigned low) |
| Item | **Condition & proof** | condition grade (New 1.0 → Fair 0.35) × 0.55, plus 0.25 for proof of authenticity, plus up to 0.2 for seller rating |
| Auction | **Ending soon** | 1 / (1 + hours_left / 3) |
| Auction | **Few bidders** | less competition, better odds |
| You | **Your interests** | categories you picked or keep opening |
| You | **Saved & similar** | lots you saved, and lots like them |
| You | **Budget fit** | estimate vs your budget |

### Weight presets
- **For you:** balanced, your taste first
- **Hyped:** popularity + maker
- **Rare finds:** rarity + condition & proof + maker
- **Steals:** value vs comps + few bidders + low price + budget
- **Ending soon:** urgency

### Feed algorithms
| Algorithm | Uses your weights? | Rule |
|---|---|---|
| Weighted signals | Yes | Σ wᵢ·signalᵢ / Σw |
| Popularity | No | watchers + 6 × bidders |
| Ending soon | No | closing time |
| Like your saves | No | item-to-item similarity (category, seller, maker, tags) |
| Diversity (MMR) | Yes | weighted score, then MMR (λ = 0.65) to spread categories and sellers |

### Explainability
- **Why #n:** which fields matched, and how much each signal added.
- **Inspector (Ranking lab):** for any lot shows raw metric → 0–1 score → × weight → points.
- **Baseline arrows:** show how far each lot moved against a pinned setup.
- **Algorithm × weighting grid:** top 3 for every combination, with how many of your current top 5 each shares.

---

## Known gaps and next ideas
- Condition, proof and seller trust are one signal; they should be three separate signals.
- Expert estimates and curation are not a separate signal yet.
- No image similarity to fill in for lots with no history.
- Live-auction behaviour (watch time, outbids, saves during a show) is not used as feedback yet.
- Text models are lexical only; there's no semantic or embedding search.
- 3D viewing is built but switched off: no free 3D models matched antiques. A seller's 3D scan file (GLB) would plug straight in.
- Possible "Collector view / Engineer view" switch: the lot as a buyer sees it vs the scoring behind it.

## Tech
- React 19 + Vite 7, plain CSS (Apple-style system font, mobile-first, bottom tab bar on phones), hash routing.
- All ranking runs in the browser (`src/lib/search.js`, `rank.js`, `feedAlgos.js`). No backend; state lives in localStorage.
- Three.js / react-three-fiber code exists for 3D but isn't used with the current catalogue.
- Hosted on Vercel (project "trove"). Deploy with `npx vercel --prod` from the project folder.

### Key files
| File | Purpose |
|---|---|
| `src/lib/search.js` | Tokeniser, index, the 6 text models, evidence |
| `src/lib/rank.js` | 11 signals, groups, presets, weighted scoring, reasons |
| `src/lib/feedAlgos.js` | Feed algorithms incl. MMR |
| `src/components/Lab.jsx` | Ranking lab |
| `src/components/Discover.jsx` | Feed, search, compare, tune |
| `src/components/LiveRoom.jsx` | Live auction room |
| `src/data/lots.js` | Catalogue (Met Open Access) |
| `src/data/schema.js` | 31-field lot schema + CSV template |

## Credits
- Photos: The Metropolitan Museum of Art, Open Access (CC0).
- Search methods follow the author's earlier project, Search Ranking Labs (https://search-ranking-lab.vercel.app).
