/**
 * Stage 3: match each Google place to its Swiggy listing and pull the full menu through the Swiggy MCP.
 *
 *   npm run swiggy:login                      # once
 *   npm run ingest:swiggy [-- --limit 20]     # most-reviewed places first; cached per place in data/raw/swiggy
 *
 * Swiggy's builder rules forbid harvesting data beyond your agreed scope and using it for
 * benchmarking. This is meant for your own account and a personal catalogue: keep SWIGGY_LIMIT small,
 * keep the delay, and don't publish the menus. Ask builders@swiggy.in before running it at scale.
 */
import path from "node:path";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { cfg, RAW } from "./config";
import type { PlacesFile, GPlace } from "./places";
import { connectSwiggy, SwiggySignedOut, tool } from "./swiggy-mcp";
import { log, readJson, retry, sleep, writeJson } from "./util";

export interface SwRestaurant { id: string; name: string; cuisines?: string[]; avgRating?: number; totalRatings?: string; costForTwo?: string; areaName?: string; distanceKm?: number; deliveryTimeMinutes?: number; veg?: boolean; availabilityStatus?: string }
export interface SwItem { id: string; name: string; description?: string; price: number; isVeg?: boolean; isBestseller?: boolean; rating?: string | number; totalRatings?: string; inStock?: boolean | number; imageUrl?: string }
interface SwCategory { title: string; categoryId?: string; totalItems?: number; hasMoreItems?: boolean; items?: SwItem[]; subcategories?: { title: string; items?: SwItem[]; hasMoreItems?: boolean }[] }
export interface SwiggyFile {
  placeId: string; matchedAt: string;
  match: SwRestaurant | null; score?: number; candidates: SwRestaurant[];
  restaurant?: { address?: string; city?: string; areaName?: string; costForTwoMessage?: string; totalRatingsString?: string };
  categories: { title: string; items: SwItem[] }[];
  complete: boolean;
}

const STOP = new Set(["the", "restaurant", "restaurants", "and", "cafe", "bar", "kitchen", "hotel", "co", "pvt", "ltd", "bangalore", "bengaluru"]);
const tokens = (s: string) => new Set(s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w)));

/** 0..1. Token overlap against the shorter name, so "Meghana Foods" matches "Meghana Foods (Koramangala)". */
export function nameSim(a: string, b: string) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  const inter = [...A].filter((w) => B.has(w)).length;
  return inter / Math.min(A.size, B.size);
}

/** Pick the Swiggy listing for a Google place: similar name, and close to the place (we search at its coordinates). */
export function pickMatch(place: GPlace, cands: SwRestaurant[]) {
  const name = place.displayName?.text ?? "";
  const scored = cands.map((c) => {
    const sim = nameSim(name, c.name);
    const near = c.distanceKm == null ? 0.5 : Math.max(0, 1 - c.distanceKm / 2);
    const area = c.areaName && place.formattedAddress?.toLowerCase().includes(c.areaName.toLowerCase()) ? 0.1 : 0;
    return { c, score: sim * 0.75 + near * 0.25 + area, sim };
  }).sort((a, b) => b.score - a.score);
  const best = scored[0];
  return best && best.sim >= 0.6 && (best.c.distanceKm ?? 0) <= 1.5 ? { match: best.c, score: +best.score.toFixed(2) } : { match: null, score: best ? +best.score.toFixed(2) : 0 };
}

function flatten(cats: SwCategory[]) {
  return cats.flatMap((c) => [
    { title: c.title, items: c.items ?? [], more: !!c.hasMoreItems },
    ...(c.subcategories ?? []).map((s) => ({ title: `${c.title} · ${s.title}`, items: s.items ?? [], more: !!s.hasMoreItems })),
  ]).filter((c) => c.items.length || c.more);
}

async function menuFor(client: Client, sw: SwRestaurant, lat: number, lng: number) {
  const cats: { title: string; items: SwItem[]; more: boolean }[] = [];
  let restaurant: SwiggyFile["restaurant"];
  for (let page = 1; page <= 20; page++) {
    const r = await retry(() => tool<{ data: { categories: SwCategory[]; hasMore: boolean; restaurant?: SwiggyFile["restaurant"] } }>(client, "get_restaurant_menu", { restaurantId: sw.id, latitude: lat, longitude: lng, page, pageSize: 8 }), `menu ${sw.name} p${page}`);
    cats.push(...flatten(r.data.categories ?? []));
    if (page === 1) restaurant = r.data.restaurant;
    if (!r.data.hasMore) break;
    await sleep(cfg.swiggyDelayMs);
  }
  // The browse view shows at most 10 items per category. Fill the rest with a menu search scoped to this restaurant.
  let complete = true;
  for (const c of cats.filter((x) => x.more)) {
    const have = new Set(c.items.map((i) => i.id));
    let offset = 0;
    for (let k = 0; k < 3; k++) {
      await sleep(cfg.swiggyDelayMs);
      const r = await retry(() => tool<{ data: { items: (SwItem & { menu_item_id?: string; restaurant_id?: string })[]; hasMore: boolean; nextOffset?: number } }>(client, "search_menu", { query: c.title.split(" · ").pop(), restaurantIdOfAddedItem: sw.id, latitude: lat, longitude: lng, offset }), `search ${c.title}`);
      for (const it of r.data.items ?? []) {
        const id = it.id ?? it.menu_item_id!;
        if (String(it.restaurant_id ?? sw.id) === String(sw.id) && !have.has(id)) { have.add(id); c.items.push({ ...it, id }); }
      }
      if (!r.data.hasMore || r.data.nextOffset == null) break;
      offset = r.data.nextOffset;
      if (k === 2) complete = false;
    }
  }
  return { categories: cats.map(({ title, items }) => ({ title, items })), complete, restaurant };
}

export async function fetchMenus(opts: { force?: boolean; limit?: number; client?: Client } = {}) {
  const pf = readJson<PlacesFile>(path.join(RAW, "places.json"));
  if (!pf) throw new Error("Run `npm run ingest:places` first.");
  const limit = opts.limit ?? cfg.swiggyLimit;
  const todo = pf.places.filter((p) => opts.force || !readJson(path.join(RAW, "swiggy", `${p.id}.json`))).slice(0, limit);
  if (limit > 100) log(`Note: ${limit} places is a lot of Swiggy calls. Swiggy's builder rules forbid bulk harvesting; keep this personal.`);
  log(`Swiggy menus: ${todo.length} places to fetch (${pf.places.length - todo.length} already cached or over the limit of ${limit}).`);
  const client = opts.client ?? (await connectSwiggy(false));
  let matched = 0, missed = 0;
  try {
    for (const [i, p] of todo.entries()) {
      const lat = p.location.latitude, lng = p.location.longitude, name = p.displayName?.text ?? p.id;
      try {
        const s = await retry(() => tool<{ data: { restaurants: SwRestaurant[] } }>(client, "search_restaurants", { query: name, latitude: lat, longitude: lng }), `search ${name}`);
        const cands = (s.data.restaurants ?? []).slice(0, 10);
        const { match, score } = pickMatch(p, cands);
        const out: SwiggyFile = { placeId: p.id, matchedAt: new Date().toISOString(), match, score, candidates: cands, categories: [], complete: false };
        if (match) {
          await sleep(cfg.swiggyDelayMs);
          const m = await menuFor(client, match, lat, lng);
          Object.assign(out, m);
          matched++;
          log(`  [${i + 1}/${todo.length}] ${name} → ${match.name} (${m.categories.reduce((a, c) => a + c.items.length, 0)} items${m.complete ? "" : ", partial"})`);
        } else {
          missed++;
          log(`  [${i + 1}/${todo.length}] ${name} → no confident Swiggy match (best ${score}); kept candidates for review`);
        }
        writeJson(path.join(RAW, "swiggy", `${p.id}.json`), out);
      } catch (e) {
        if (e instanceof SwiggySignedOut) throw e;
        log(`  [${i + 1}/${todo.length}] ${name}: ${(e as Error).message}`);
      }
      await sleep(cfg.swiggyDelayMs);
    }
  } finally {
    if (!opts.client) await client.close();
  }
  log(`Swiggy: ${matched} matched with menus, ${missed} without a confident match.`);
}
