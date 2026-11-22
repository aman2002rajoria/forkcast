# Forkcast: user journeys and the next build

## 1. The "before" journey (Swiggy, 9:10 pm, Koramangala)

| Step | What happens | Time | Feeling |
|---|---|---|---|
| Open | Banners, "Flat ₹125 off", Instamart upsell | 20 s | Hungry, hopeful |
| Scroll | Cuisine carousel, then a list where everything is 4.2 to 4.5 | 1–2 min | Mild overwhelm |
| Open a restaurant | 90-item menu, "Bestseller" tags, a dish rating from 14 votes, studio photos | 1–2 min | Doubt |
| **Loop A: hop** | Back, open 4–6 more restaurants, forget what the first one cost | 4–8 min | Fatigue |
| **Loop B: filters** | Rating 4.0+, Pure Veg, Under 30 mins, "Less than ₹300" (cost for two). Nothing for "savory", "not oily", "travels well" | 1–2 min | Frustration |
| **Loop C: switch apps** | Zomato for reviews, Google Maps for real photos, back to Swiggy | 3–5 min | Suspicion |
| Cart | Platform fee, packaging, rain surge appear; total jumps ₹80–120 | 1 min | Second-guessing |

**Stuck on:** restaurant-level stars, look-alike ratings, styled photos, no reason why a dish is good.

**Exits at 12–20 minutes:**
- **Same safe thing** (the usual biryani). Relief, no delight.
- **Order and regret.** A 4.5 brand that is 1 of 14 run from one HSR kitchen; a dosa that is soggy after 40 minutes; "full" biryani with 3 pieces.
- **Abandon.** Maggi at home or chips from Blinkit. A few such nights, and they churn.

## 2. Personas and jobs

- **P1. Tired solo, 9 pm** (WFH, just off a late call). *Needs:* one confident, comforting single portion that arrives hot. *Filters fail:* "Under 30 mins + 4.0+" still returns 200 places; there is no "comfort" or "one-person" filter.
- **P2. Ordering for two or a group** (4 flatmates in HSR, Friday). *Needs:* dishes that cover a veg, a Jain and two non-veg eaters, from at most two restaurants. *Filters fail:* cost-for-two is a restaurant figure; there is no portion size and no way to vote.
- **P3. Strict diet or allergy** (Jain family in Basavanagudi; a nut allergy). *Needs:* ingredient-level evidence. *Filters fail:* "Pure Veg" is not Jain; cashew paste in paneer butter masala is never labelled; cooking instructions get ignored.
- **P4. Budget at the end of the month** (fresher in Electronic City, the 26th, ₹2,000 until payday). *Needs:* the most filling food per rupee. *Filters fail:* "Less than ₹300" is cost for two; fees are hidden until the cart.
- **P5. Office lunch, 30-minute window** (Outer Ring Road, Bellandur). *Needs:* at the tech-park gate by 1:20, light, easy to eat at a desk. *Filters fail:* ETAs are optimistic at the lunch peak.
- **P6. New to Bengaluru or the area** (moved from Delhi to Whitefield). *Needs:* trusted local places and what the city does well: ghee roast, thatte idli, donne biryani, military-hotel mutton. *Filters fail:* "Popularity" surfaces chains and cloud-kitchen brands.
- **P7. Dine in or order in** (couple in Indiranagar, Saturday 8 pm). *Needs:* whether the dish survives delivery, and the price gap. *Filters fail:* there is no dine-in price, and delivered photos are mixed with restaurant photos.
- **P8. Repeat orderer** (the 40th chicken ghee roast). *Needs:* something new with low risk. *Filters fail:* "Order again" repeats exactly; "people also ordered" suggests the same dish.

## 3. The "after" journey with Forkcast

| Persona | What breaks the loop | Taps: Swiggy → Forkcast |
|---|---|---|
| P1 Tired solo | "Comfort, not heavy" chip, then 3 picks with what actually arrives | ~45 → 3 |
| P2 Group | "Dinner for 4, one veg, ₹1,200" gives a shortlist with "serves 2"; shared to WhatsApp, friends vote without logging in | ~70 → 5 (+1 per friend) |
| P3 Diet/allergy | A one-time Jain template; "no onion or garlic in 12 of 12 delivered photos." Allergy rules hide dishes and say "confirm with the restaurant," never "safe" | ~50 → 2 |
| P4 Budget | Ranked by value and portion (Andhra meals, egg rice, ragi mudde), with a weekly meter | ~40 → 3 |
| P5 Office lunch | A saved "Lunch" context (4 km, travels well, light), plus Order again but better | ~30 → 2 |
| P6 New in town | "Best around me": dine-in institutions with deep Google reviews, cloud kitchens ranked lower | ~60 → 3 |
| P7 Dine in or not | "₹280 at the restaurant, 14% more on the app," a delivered-photo toggle, and "Go there: the dosa goes soggy" | ~35 (+ Maps) → 2 |
| P8 Repeat | The same dish from a better kitchen, or a close neighbour (donne biryani to Bhatkal biryani) with a taste-match score | ~25 → 2 |

## 4. The comparison problem

**Why it can't be done today:**
- One restaurant open at a time, one restaurant per cart; going back loses the scroll; Zomato and Maps are separate apps.
- Stars rate the restaurant, not the dish; dish ratings rest on small samples; portions are never shown.
- Comparing three biryanis means holding about 12 numbers across 6 screens. Nobody does it; they pick the one they remember.

**Compare view.** Add any card with "+ Compare"; the tray holds up to 4. Columns are dishes; rows: Forkcast score for your weights; taste, quantity, quality, packaging and value; portion (pieces, grams, serves N); app vs dine-in price; distance and ETA; kitchen type (cloud kitchen, N brands at this address); 3 delivered photos; rule hits ("raw onion in 7 of 9 photos"); travels well; review and photo count behind the score.

**Verdict line:** "Pick B: same taste as A, about 40% more mutton for ₹30 more. A is 1 of 14 brands from one kitchen."

## 5. A generic rule system

**One shape for every rule:** *subject + condition → action, within a scope, with its source.* Example: "raw onion in delivered photos → warn, always, set by you."

**Rule types (evidence source):** ingredients to avoid (photos, menu); raw vs cooked, such as raw onion or sprouts (photos); diet: Jain, no onion-garlic, vegan, egg-only (menu, reviews, photos); allergens: nuts, gluten, dairy (reviews and menu, always "confirm with the restaurant"); kitchen type (N brands at one address); max distance or ETA; travels badly (dosa, pani puri, fries); price per dish, person or week; spice ("too spicy", "bland" in reviews); portion (pieces, grams, serves N); hygiene ("stomach upset", "hair", "stale" in the last 90 days of reviews; Swiggy's MCP has no FSSAI data, so this rule can only warn).

**Actions:** **warn** (a badge, like the prototype's "Against your rule"), **rank lower** (a score penalty), **hide** (counted in "See what was left out"). When rules conflict, hide beats rank lower, which beats warn. A mood query can never override an allergy rule.

**Scope:** always; a context (Lunch, With partner, Fasting days such as Navratri); or a time limit ("this week").

**Creating a rule in under 10 seconds:**
- **Templates (1 tap):** Jain, No onion-garlic, Nut allergy, High protein, Cloud kitchens lower, Office lunch.
- **Plain words:** "no raw onion" becomes the chip "Raw onion · warn"; tap to change the action.
- **From a photo:** long-press a delivered photo, tap the onion rings, confirm.
- **From "Not for me":** a reason chip (too oily, small, soggy) becomes a rule.

**Learned rules.** After 3 consistent signals, Forkcast proposes one with evidence: "You rated 3 dosas low that took over 35 minutes. Rank crisp dishes lower past a 30-minute ETA?" (Yes / Not now / Never). Learned rules can warn or rank lower, never hide; diet and allergy rules come only from the user.

## 6. Features ranked by impact vs effort

| # | Feature | Impact | Effort | Why |
|---|---|---|---|---|
| 1 | Order again but better | High | Low | Order history plus existing scores; fixes P5, P8 |
| 2 | "Not that, something lighter" in chat | High | Low–Med | Re-ranks current results, no restart |
| 3 | Rule templates and plain-word rules | High | Med | Replaces the toggles; unlocks P3 |
| 4 | Compare tray | High | Med | The task no app can do |
| 5 | Share shortlist with votes | High (groups) | Med | No-login link; also spreads Forkcast |
| 6 | Dine in or order in verdict | Med | Low | The data already exists |
| 7 | Surprise me (1 pick inside your rules, with a confidence score) | Med | Low | Fastest path for P1 |
| 8 | Weekly budget | Med | Med | MCP has no fees; estimate them from past totals |
| 9 | Create a rule from a photo | Med | High | Later |

**Cut or demote:**
- Taste-weight multipliers (0.6×, 1.2×) on Discover: learn them; move edits to My taste.
- "How it works" as a top-level tab: make it a first-run sheet.
- Cuisine carousels and restaurant browsing: they copy Swiggy's loop.
- Reddit as a scoring source: sparse at dish level; keep it as evidence only.
- Any Zomato price scraping (legal and data risk), and calorie counts (no reliable data).

## 7. Success metrics

1. **Time to decision:** median from session start to "Add to Swiggy cart." Target under 90 seconds, against a 12-minute-plus baseline from a 15-person diary study.
2. **Abandoned sessions:** sessions with a query but no cart hand-off within 30 minutes. Target under 25%.
3. **Regret rate:** Forkcast orders rated "not what I expected" or 2 stars or lower, against the user's other orders. Target: half.
4. **First-screen hit rate:** carts from the top 3 picks. Target over 60%.
5. **Low-regret exploration:** new dishes rated 4 or higher, plus 30-day retention.

Ordering happens on Swiggy: confirm orders from MCP order history, not cart hand-offs.
