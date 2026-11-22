# Forkcast

**Rate the dish, not the restaurant.** Say what you feel like ("something savory under ₹400"), and Forkcast picks 3 dishes near you in Bengaluru, scored on taste, quantity and quality from reviews and real customer photos. It shows what will actually arrive, flags cloud kitchens, compares the app price with the dine-in menu, and learns your taste from feedback you approve.

Built on top of Swiggy's official MCP. Portfolio project by Aman.

## Run it

Needs Node 20.12 or newer (built on Node 26).

```bash
npm ci
npm run dev
```

Open http://localhost:3100 and choose **Try with test data**. Nothing leaves your browser.

Deep links:
- `/?q=savory%20under%20400` runs a search straight away
- `/compare?ids=mutton-biryani,donne-biryani,chicken-biryani` opens a shared shortlist
- `/explore` browses restaurants; `/restaurants/karavali` shows a menu with the side copilot
- `/story` is the case study

## Moving to another machine (with Claude Code)

1. Unzip the project anywhere, for example `~/code/forkcast`.
2. `cd` into it and run `npm ci`, then `npm run dev`.
3. Open Claude Code in the folder. `CLAUDE.md` tells it what the project is, where everything lives, the design rules (`docs/design/design.md` plus screenshots) and what's left to do.
4. For live data: `cp .env.example .env.local`, add your own Google Maps (and optionally Gemini) keys, then follow "Live data" below.
5. Optional: `git init && git add -A && git commit -m "Forkcast"`. Secrets and data are already git-ignored.

Checks: `npm run typecheck`, `npm run test:ingest`, `npm run build`.

## Screens

| Screen | Job |
|---|---|
| Explore (`/explore`) | Browse restaurants directly: search a place, cuisine or dish, sort by for you / most reviewed / nearest, filter pure veg, no cloud kitchens, under 35 min |
| Restaurant (`/restaurants/[id]`) | Best dishes here for you, the full menu with Swiggy ratings and Forkcast scores, and **Ask about this menu**: a side-panel copilot (bottom sheet on phones) that picks from this menu using your rules |
| Ask (`/`) | Chat. A mood becomes chips you can remove, then 3 picks with evidence and follow-ups (Cheaper, For two, Lighter, No cloud kitchens, Something else) |
| Dish (`/dish/[id]`) | Listing photo vs delivered photos with pins on what's visible, app vs dine-in price, reviews per aspect, kitchen check, "Not for me" turns into a rule |
| Compare (`/compare`) | 2 to 4 dishes from different places side by side, winner per row, one verdict line, share link |
| Orders (`/orders`) | Was it better or worse than shown? Leads to suggested changes you approve. "Order again, but better" |
| My taste (`/taste`) | Rules in plain words or a builder (ingredient, diet, allergy, kitchen, spice, price, distance, soggy food, portion) with warn, rank lower or hide, a live impact preview, weights, and your live top 3 |
| Story (`/story`) | The case study: the decision-fatigue loop, who gets stuck, design decisions, the pipeline, what's hard |

## How it's built

```
app/                 Next.js App Router pages, plus /api/copilot
lib/intent.ts        plain words → structured intent, and follow-up refinement
lib/rank.ts          rules first, then weighted dish scores; reply line and follow-ups
lib/rules.ts         rule model, matching, evidence text, plain-words rule parser
lib/data.ts          test catalogue: 14 dishes, 12 places (made-up names, real localities)
lib/photo.ts         drawn stand-ins for customer photos, with positions of what's visible
lib/catalog.ts       Explore's data shape, filters and sorting (test or live)
lib/advisor.ts       the "Ask about this menu" copilot on restaurant pages
lib/server/catalog.ts reads data/catalog/restaurants.json when it exists
scripts/ingest/      the live-data pipeline (Google Places, Swiggy MCP, Gemini)
lib/sources/         earlier adapter sketches for Swiggy, Places and vision
lib/store.tsx        client state in localStorage (rules, weights, orders, compare)
```

Design follows `design.md` (Fira Sans, lip buttons, one accent, every AI output shows its sources).

## Live data: the ingestion pipeline

`scripts/ingest/` builds a real catalogue for Explore: every restaurant within `RADIUS_KM` of Koramangala with at least `MIN_REVIEWS` Google reviews (capped at `MAX_RESTAURANTS`, most-reviewed first), matched to Swiggy, with full menus.

```bash
cp .env.example .env.local        # add GOOGLE_MAPS_API_KEY (Places API (New)); GEMINI_API_KEY is optional
npm run ingest:places -- --dry-run   # plan and cost estimate, no calls
npm run ingest:places             # 1. Google Nearby Search, tiled circles, cached per circle
npm run ingest:details            # 2. reviews (max 5), photos (max 10), review summary per place
npm run swiggy:login              # 3a. once: browser sign-in to Swiggy (phone + OTP)
npm run ingest:swiggy -- --limit 20   # 3b. match each place on Swiggy, fetch its menu
npm run ingest:analyze            # 4. optional: Gemini scores the dishes reviewers mention
npm run ingest:build              # 5. merge into data/catalog/restaurants.json
npm run dev                       # Explore now shows "Live data"
```

Or `npm run ingest:all` after logging in. Every stage caches under `data/raw/` and resumes where it stopped; `--force` refetches. `npm run test:ingest` runs the offline tests (mock Google API, matching, parsing, catalogue build, menu copilot).

How each stage works:

1. **Places.** Nearby Search returns at most 20 places per call with no paging, so the area is tiled with 1.5 km circles in a hex pattern. A circle that comes back full splits into four smaller ones, unless its 20th result is already well under `MIN_REVIEWS` (results are popularity-ranked, so anything hidden is smaller). `STRICT_SPLIT=1` always splits. On a 4,000-place mock it finds every qualifying place.
2. **Details.** Place Details per place, cached for at most 30 days as Google's terms allow.
3. **Swiggy.** `search_restaurants` at the place's own coordinates, matched by name similarity and distance (unsure matches are saved with their candidates for review, not guessed). Then `get_restaurant_menu` page by page; categories cut at 10 items are filled in with `search_menu` scoped to the restaurant.
4. **Analysis.** Gemini reads the reviews with the menu as the only allowed dish names, and returns aspect scores only for dishes reviewers mention.
5. **Build.** Writes the shape the app reads. Prices that look like paise are converted; "1.2K+" counts are parsed.

Costs (check Google's current pricing; these are rough list prices before the monthly free calls): roughly 100 to 500 Nearby Search calls for a 12 km radius (about $3 to $16; `--dry-run` prints the estimate), plus one Place Details call per kept place.

**Swiggy's terms.** Swiggy's builder rules forbid harvesting data beyond your agreed scope and using it for benchmarking. Menus for hundreds of restaurants is exactly that, so keep `SWIGGY_LIMIT` small, keep the delay, keep the catalogue personal, and ask builders@swiggy.in before going further. Tokens live in `.forkcast/` and data in `data/`; both are git-ignored.

What live mode doesn't cover yet: Ask, Compare and the dish page still run on test data. Explore and restaurant pages use the live catalogue, with full Forkcast scores only where the analysis stage scored a dish.

## Live mode: what's needed

1. **Swiggy MCP access.** OAuth with your own Swiggy account. Production access is invite-based; local development is open.
2. **Google Maps key** (`GOOGLE_MAPS_API_KEY`) for Places Text Search and Place Details.
3. **Gemini key** (`GEMINI_API_KEY`) for review aspects and photo matching.
4. **A review source with depth.** Places returns 5 reviews and 10 photos per place; scoring every dish needs more (a paid service such as SerpApi, which is a grey area under Google's terms) or Forkcast users' own photos.

Swiggy's builder terms rule out benchmarking and bulk harvesting, so Forkcast runs on demand for the signed-in user, with a short cache.
