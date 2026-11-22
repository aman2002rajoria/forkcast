/**
 * Stage 1: find restaurants around the centre with Google Places API (New) Nearby Search.
 *
 * Nearby Search returns at most 20 places per call and has no paging, so the area is tiled with
 * search circles (hexagonal cover). A circle that comes back full is split into four smaller ones,
 * unless its 20th result is already well below MIN_REVIEWS: results are ranked by popularity, so
 * anything it hid would be less reviewed still. STRICT_SPLIT=1 always splits.
 *
 *   npm run ingest:places                 # crawl, cached per circle in data/raw/cells
 *   npm run ingest:places -- --dry-run    # print the plan and a cost estimate, no API calls
 *
 * Output: data/raw/places.json, places with >= MIN_REVIEWS reviews, most-reviewed first, capped at MAX_RESTAURANTS.
 */
import path from "node:path";
import { cfg, RAW } from "./config";
import { cellKey, distKm, hexCover, split, type Cell } from "./geo";
import { HttpError, limiter, log, pool, readJson, retry, writeJson } from "./util";

export interface GPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  primaryTypeDisplayName?: { text: string };
  types?: string[];
  businessStatus?: string;
  priceLevel?: string;
  googleMapsUri?: string;
}
export interface PlacesFile {
  center: typeof cfg.center; radiusKm: number; minReviews: number; crawledAt: string;
  stats: { requests: number; cells: number; seen: number; kept: number };
  places: GPlace[];
}

const FIELDS = [
  "places.id", "places.displayName", "places.formattedAddress", "places.shortFormattedAddress", "places.location",
  "places.rating", "places.userRatingCount", "places.primaryType", "places.primaryTypeDisplayName", "places.types",
  "places.businessStatus", "places.priceLevel", "places.googleMapsUri",
].join(",");
/** Rough list price per 1,000 Nearby Search calls at the tier that includes rating fields. Check Google's pricing page. */
const EST_USD_PER_1000 = 35;

export async function nearby(c: Cell): Promise<GPlace[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: { "content-type": "application/json", "X-Goog-Api-Key": cfg.googleKey, "X-Goog-FieldMask": FIELDS },
    body: JSON.stringify({
      includedTypes: cfg.includedTypes, maxResultCount: 20, rankPreference: "POPULARITY", languageCode: "en", regionCode: "IN",
      locationRestriction: { circle: { center: { latitude: c.lat, longitude: c.lng }, radius: c.r } },
    }),
  });
  if (!res.ok) throw new HttpError(res.status, `Nearby search ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return ((await res.json()) as { places?: GPlace[] }).places ?? [];
}

export async function crawl(opts: { force?: boolean; dryRun?: boolean; search?: (c: Cell) => Promise<GPlace[]> } = {}) {
  const search = opts.search ?? nearby;
  const radiusM = cfg.radiusKm * 1000;
  const start = hexCover(cfg.center, radiusM, cfg.cellRadiusM);
  log(`Centre ${cfg.center.name} (${cfg.center.lat}, ${cfg.center.lng}), radius ${cfg.radiusKm} km, ${start.length} starting circles of ${cfg.cellRadiusM} m`);
  if (opts.dryRun) {
    const low = start.length, high = Math.round(start.length * 5); // dense areas like Koramangala split 2-3 levels deep
    log(`Dry run: about ${low} to ${high} Nearby Search calls once busy circles split. Roughly $${((low * EST_USD_PER_1000) / 1000).toFixed(0)} to $${((high * EST_USD_PER_1000) / 1000).toFixed(0)} at list price, before Google's monthly free calls.`);
    return null;
  }
  if (!cfg.googleKey && !opts.search) throw new Error("Set GOOGLE_MAPS_API_KEY in .env.local (Places API (New) enabled).");

  const seen = new Map<string, GPlace>();
  const wait = limiter(cfg.googleQps);
  let requests = 0, cells = 0, queue: Cell[] = start;
  while (queue.length) {
    const next: Cell[] = [];
    await pool(queue, 4, async (c) => {
      const file = path.join(RAW, "cells", `${cellKey(c)}.json`);
      let places = opts.force ? null : readJson<GPlace[]>(file);
      if (!places) {
        await wait();
        places = await retry(() => search(c), `cell ${cellKey(c)}`);
        requests++;
        writeJson(file, places);
      }
      cells++;
      for (const p of places) if (!seen.has(p.id)) seen.set(p.id, p);
      if (places.length >= 20 && c.r / 2 >= cfg.minCellRadiusM) {
        const least = Math.min(...places.map((p) => p.userRatingCount ?? 0));
        if (cfg.strictSplit || least >= cfg.minReviews * 0.5) next.push(...split(c));
      }
      if (cells % 50 === 0) log(`  ${cells} circles searched, ${seen.size} places seen, ${requests} API calls`);
    });
    if (next.length) log(`  splitting ${next.length / 4} busy circles`);
    queue = next;
  }

  const kept = [...seen.values()]
    .filter((p) => (p.userRatingCount ?? 0) >= cfg.minReviews)
    .filter((p) => !p.businessStatus || p.businessStatus === "OPERATIONAL")
    .filter((p) => distKm(cfg.center, { lat: p.location.latitude, lng: p.location.longitude }) <= cfg.radiusKm)
    .sort((a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0))
    .slice(0, cfg.maxRestaurants);
  const out: PlacesFile = {
    center: cfg.center, radiusKm: cfg.radiusKm, minReviews: cfg.minReviews, crawledAt: new Date().toISOString(),
    stats: { requests, cells, seen: seen.size, kept: kept.length }, places: kept,
  };
  writeJson(path.join(RAW, "places.json"), out);
  log(`Done: ${seen.size} places seen, ${kept.length} with ${cfg.minReviews}+ reviews kept (cap ${cfg.maxRestaurants}). ${requests} new API calls, about $${((requests * EST_USD_PER_1000) / 1000).toFixed(2)} at list price.`);
  return out;
}

