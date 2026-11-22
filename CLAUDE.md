# CLAUDE.md

Guidance for Claude Code (or any AI assistant) working on this repo. Read this first, then `README.md`.

## What this is

**Forkcast**: "rate the dish, not the restaurant". A personal portfolio project by Aman: an AI layer on top of Swiggy for Bengaluru. People say what they feel like ("something savory under ₹500"), and Forkcast picks 3 dishes scored on taste, quantity and quality from reviews and real customer photos. It also shows what will actually arrive, flags cloud kitchens, compares the app price with dine-in, and learns from feedback the user approves.

- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind 3 + lucide-react. No database: client state lives in localStorage, and live data in JSON files.
- Two data modes:
  - **Test data** (the default): fixtures in `lib/data.ts` and `lib/menus.ts`, with made-up restaurant names in real localities.
  - **Live data**: `data/catalog/restaurants.json`, built by the pipeline in `scripts/ingest/`.

## First run on a new machine

```bash
node -v            # needs Node 20.12+ (developed on Node 26)
npm ci             # or npm install
npm run dev        # http://localhost:3100, then choose "Try with test data"
```

Checks to run after any change:

```bash
npm run typecheck      # tsc --noEmit
npm run test:ingest    # offline tests: crawl on a mock Google API, Swiggy matching, catalog build, menu copilot
npm run build          # production build
```

Live data needs keys in `.env.local`. Copy `.env.example`; the runbook is in the README under "Live data". Never commit `.env.local`, `data/` or `.forkcast/` (Swiggy tokens). `.gitignore` already covers them.

## Map of the code

| Path | What it does |
|---|---|
| `app/page.tsx` | Ask: welcome screen, chat with intent chips, 3 picks, follow-ups. `/?q=...` deep link |
| `app/explore/page.tsx` | Explore: restaurant list with search, sort and filters, from `/api/restaurants` |
| `app/restaurants/[id]/page.tsx` | Restaurant: best dishes, menu, and the "Ask about this menu" side copilot |
| `app/dish/[id]/page.tsx` | Dish: listing vs delivered photos with pins, price dumbbell, reviews, kitchen, "Not for me" |
| `app/compare/page.tsx` | Compare 2 to 4 dishes; `?ids=a,b,c` share link; table on desktop, cards on phones |
| `app/orders/page.tsx` | Order feedback, which turns into suggestions the user approves; "Order again, but better" |
| `app/taste/page.tsx` | Rules (plain words, builder or templates; Off/Warn/Rank lower/Hide), weights, live top 3 |
| `app/story/page.tsx` | Case-study article for the portfolio, with sources |
| `app/api/copilot` | Chat ranking: parse, refine, then rank |
| `app/api/restaurants` | Explore list and detail |
| `app/api/place-photo` | Proxy for Google photos in live mode |
| `lib/intent.ts` | Deterministic natural-language parser: moods, budget, negation, Hinglish, typos; follow-up refinement |
| `lib/rank.ts` | Rules first, then weighted aspect scores, travel/time penalties, empty-state relaxations, reply line |
| `lib/rules.ts` | Rule model (ingredient, diet, allergen, kitchen, spice, price, distance, travel, portion, oily), matching, plain-words parser |
| `lib/advisor.ts` | The restaurant-page copilot: picks from one menu (Forkcast scores, otherwise Swiggy ratings shrunk by vote count) |
| `lib/catalog.ts` | Explore data shape plus filter and sort; `lib/server/catalog.ts` loads live JSON or falls back to test data |
| `lib/photo.ts` | Drawn SVG stand-ins for customer photos (test data), with pin positions for what's visible |
| `lib/store.tsx` | Client state (prefs, rules, orders, compare, chat) in localStorage, with migrations for old saves |
| `scripts/ingest/` | Live-data pipeline; entry point is `cli.ts`, stages run as `npm run ingest:*` |
| `docs/design/design.md` | The design language. **Mandatory for any UI work.** Screenshots are in `docs/design/design-refs/` |
| `docs/research-user-journeys.md` | Personas, the decision-fatigue loop, the rule system and metrics (feeds `/story`) |

## Rules for UI work (from docs/design/design.md)

- Use only the tokens in `app/globals.css`. Forkcast's accent is orange `#FF5A1F`. Headings are Fira Sans 900, body text 400 to 500.
- Every button has the 3D lip (`.btn`, `.btn.primary`, `.btn.ghost`). One primary (orange) button per view.
- No emoji anywhere. Copy is sentence case with no exclamation marks; write ₹ before the amount with no space (`₹320`), and use numbers rather than adjectives. Keep text short.
- Every AI output shows its evidence ("1,240 reviews · 312 photos"), has a "Why this?", and flags low confidence ("Only 22 photos").
- Build every state: loading (skeletons and a status line), empty, error and partial. Test-data mode must keep working.
- Check at 390px width. Component classes come before `@tailwind utilities` in `globals.css`, so responsive utilities win.

## Guardrails

- **Swiggy MCP terms** forbid harvesting beyond agreed scope and benchmarking. Keep the menu fetch personal, small (`SWIGGY_LIMIT`) and throttled. Don't publish menus.
- **Google Maps terms**: cache Places content for at most 30 days; only place ids may be kept longer. Show attribution for photos and review summaries.
- **No real restaurant names next to invented scores, reviews or "cloud kitchen" labels** on anything published. Test data stays fictional.
- **Allergy rules always hide** and tell the user to confirm with the restaurant. Never call a dish "safe".
- **Learned rules can warn or rank lower, never hide.** Hiding, diet and allergy rules come only from the user.

## State of the project (Nov 2026)

Done:
- every screen above, built in test mode
- two rounds of design, usability and copy review applied
- the ingestion pipeline written and tested offline

Not done or not verified:
1. The ingestion has **not been run against the real Google or Swiggy APIs**. Things to confirm on the first real run:
   - whether Swiggy MCP prices are in rupees or paise (`priceScale` guesses)
   - whether `reviewSummary` is available for Indian places (`details.ts` falls back without it)
   - the tool output shapes (`swiggy-menus.ts` types come from Swiggy's docs)
   - whether Google's popularity ranking tracks review count well enough for the circle-split shortcut (`STRICT_SPLIT=1` is the safe option)
2. Live data reaches **Explore and restaurant pages only**. Ask, Compare and the dish page still read the fixtures in `lib/data.ts`. The next step is to serve dishes from `/api` and make `DISH`/`R` lookups data-driven.
3. Photos are drawn stand-ins. Real customer photos and the photo-to-dish matching (`lib/sources/vision.ts`) aren't wired up.
4. The intent parser is rule-based. An LLM fallback for unclear messages would help (Gemini or Claude, server-side in `/api/copilot`).
5. The "Use my own data" button (Swiggy sign-in from the web app) is a placeholder; only the CLI login works.
6. Nothing has been committed to git yet.
