/**
 * Stage 2: Place Details for every kept place: up to 5 reviews, up to 10 photos, the AI review
 * summary, website and dine-in/delivery flags. Cached per place in data/raw/details for
 * DETAILS_MAX_AGE_DAYS (Google's terms allow caching for at most 30 days; only the place id may be kept longer).
 *
 *   npm run ingest:details [-- --limit 100] [-- --force]
 */
import path from "node:path";
import { cfg, RAW } from "./config";
import type { PlacesFile } from "./places";
import { ageDays, HttpError, limiter, log, pool, readJson, retry, writeJson } from "./util";

export interface GDetails {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  googleMapsUri?: string;
  dineIn?: boolean;
  delivery?: boolean;
  servesVegetarianFood?: boolean;
  priceRange?: { startPrice?: { units?: string }; endPrice?: { units?: string } };
  reviews?: { rating?: number; text?: { text: string }; originalText?: { text: string }; relativePublishTimeDescription?: string; publishTime?: string; authorAttribution?: { displayName?: string } }[];
  photos?: { name: string; widthPx?: number; heightPx?: number; authorAttributions?: { displayName?: string; uri?: string }[] }[];
  reviewSummary?: { text?: { text: string }; reviewsUri?: string; disclosureText?: { text: string } };
  editorialSummary?: { text: string };
}

const BASE = ["id", "displayName", "formattedAddress", "rating", "userRatingCount", "websiteUri", "googleMapsUri", "dineIn", "delivery", "servesVegetarianFood", "priceRange", "reviews", "photos", "editorialSummary"];
let fields = [...BASE, "reviewSummary"];

async function details(id: string): Promise<GDetails> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${id}?languageCode=en&regionCode=IN`, {
    headers: { "X-Goog-Api-Key": cfg.googleKey, "X-Goog-FieldMask": (process.env.DETAILS_FIELDS ?? fields.join(",")) },
  });
  if (res.status === 400 && fields.includes("reviewSummary")) {
    // Review summaries aren't available everywhere; drop the field and carry on.
    log("  reviewSummary not accepted for this key or region; continuing without it");
    fields = BASE;
    return details(id);
  }
  if (!res.ok) throw new HttpError(res.status, `Place details ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as GDetails;
}

export async function fetchDetails(opts: { force?: boolean; limit?: number } = {}) {
  if (!cfg.googleKey) throw new Error("Set GOOGLE_MAPS_API_KEY in .env.local.");
  const pf = readJson<PlacesFile>(path.join(RAW, "places.json"));
  if (!pf) throw new Error("Run `npm run ingest:places` first.");
  const todo = pf.places.slice(0, opts.limit ?? pf.places.length);
  const wait = limiter(cfg.googleQps);
  let fetched = 0, cached = 0, failed = 0;
  await pool(todo, 4, async (p, i) => {
    const file = path.join(RAW, "details", `${p.id}.json`);
    if (!opts.force && ageDays(file) < cfg.detailsMaxAgeDays) { cached++; return; }
    await wait();
    try { writeJson(file, await retry(() => details(p.id), p.displayName?.text ?? p.id)); fetched++; }
    catch (e) { failed++; log(`  skip ${p.displayName?.text}: ${(e as Error).message}`); }
    if ((i + 1) % 50 === 0) log(`  ${i + 1}/${todo.length}`);
  });
  log(`Details: ${fetched} fetched, ${cached} still fresh, ${failed} failed.`);
}

