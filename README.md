# Trove

Live auctions for rare finds. Milestone 1: sign-in + loader, discovery feed with ranking, lot pages with magnifier and 3D view, and a live room with real-time bidding, chat and reactions.

## Run it
```bash
npm install
npm run dev        # http://localhost:5173
```

## Ship it
- **Fastest:** `npx vercel --prod` from this folder (uses your Vercel login).
- **Ongoing:** push to a GitHub repo and import it in Vercel. Every push redeploys.

## Map
- `src/data/schema.js` – the Trove lot format (also `public/trove-lot-template.csv`)
- `src/data/lots.js` – sample catalog (free Unsplash photos, illustrative listings)
- `src/data/badges.js` – the appreciation layer (one-time moments, no points)
- `src/lib/rank.js` – discovery ranking: 7 weighted signals + presets
- `src/lib/importer.js` – CSV/JSON import (Trove template and scraper exports)
- `src/components/LiveRoom.jsx` – live room simulation (bids, extensions, chat, reactions)
- `src/components/Studio3D.jsx`, `Viewer3D.jsx`, `Stage3D.jsx` – Three.js scenes
