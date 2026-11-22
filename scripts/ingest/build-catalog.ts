/**
 * Stage 5: merge places, details, Swiggy menus and analysis into data/catalog/restaurants.json,
 * the file the app's Explore screens read. Re-run any time; it only reads the cached raw files.
 *
 *   npm run ingest:build [-- --only matched]
 */
import path from "node:path";
import { cfg, DATA, RAW } from "./config";
import { distKm } from "./geo";
import type { PlacesFile, GPlace } from "./places";
import type { GDetails } from "./details";
import type { SwiggyFile, SwItem } from "./swiggy-menus";
import type { AnalysisFile } from "./analyze";
import { log, readJson, slug, writeJson } from "./util";
import type { RestaurantDetail } from "../../lib/catalog";
import type { MenuItem } from "../../lib/menus";

/** Swiggy ratings counts come as "1.2K+", "500+", "12". */
export function parseCount(s?: string | number): number | undefined {
  if (s == null) return undefined;
  if (typeof s === "number") return s;
  const m = s.replace(/,/g, "").match(/([\d.]+)\s*([kKlL])?/);
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  return Math.round(m[2]?.toLowerCase() === "k" ? n * 1000 : m[2]?.toLowerCase() === "l" ? n * 100000 : n);
}
export const parseRupees = (s?: string) => (s ? Number(s.replace(/[^\d]/g, "")) || undefined : undefined);

/** Some Swiggy APIs send paise. If a typical price on the menu is above ₹3,000, treat the menu as paise. */
export function priceScale(items: SwItem[]) {
  const sorted = items.map((i) => i.price).filter((p) => p > 0).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  return median > 3000 ? 0.01 : 1;
}

export function buildOne(p: GPlace, det: GDetails | null, sw: SwiggyFile | null, an: AnalysisFile | null): RestaurantDetail {
  const id = `${slug(p.displayName?.text ?? "place")}-${p.id.slice(-6).toLowerCase()}`;
  const all = sw?.categories.flatMap((c) => c.items) ?? [];
  const scale = priceScale(all);
  const byName = new Map((an?.dishes ?? []).map((d) => [d.name.toLowerCase(), d]));
  const seen = new Set<string>();
  const menu: MenuItem[] = (sw?.categories ?? []).flatMap((c) => c.items.filter((i) => !seen.has(i.id) && seen.add(i.id)).map((i) => {
    const a = byName.get(i.name.toLowerCase());
    const scores = a ? Object.fromEntries(Object.entries({ taste: a.taste, quantity: a.quantity, quality: a.quality, packaging: a.packaging, value: a.value }).filter(([, v]) => v != null)) : undefined;
    return {
      id: `${id}-${i.id}`, name: i.name, category: c.title, price: Math.round(i.price * scale), veg: !!i.isVeg,
      rating: i.rating != null && i.rating !== "" ? Number(i.rating) || undefined : undefined, votes: parseCount(i.totalRatings),
      bestseller: !!i.isBestseller, description: i.description || undefined,
      scores: scores && Object.keys(scores).length ? scores : undefined, mentions: a?.mentions,
    };
  }));
  const m = sw?.match;
  const km = +distKm(cfg.center, { lat: p.location.latitude, lng: p.location.longitude }).toFixed(1);
  return {
    id, name: p.displayName?.text ?? m?.name ?? "Unnamed", area: m?.areaName ?? p.shortFormattedAddress?.split(",").slice(-2, -1)[0]?.trim() ?? cfg.center.name,
    km, eta: m?.deliveryTimeMinutes, type: "dinein",
    g: p.rating, gN: p.userRatingCount, sw: m?.avgRating, swN: m?.totalRatings ?? sw?.restaurant?.totalRatingsString,
    cuisines: m?.cuisines?.length ? m.cuisines.slice(0, 3) : [p.primaryTypeDisplayName?.text ?? "Restaurant"],
    costForTwo: parseRupees(m?.costForTwo ?? sw?.restaurant?.costForTwoMessage),
    veg: m?.veg ?? (menu.length > 0 && menu.every((x) => x.veg)),
    items: menu.length, scored: 0, source: "live",
    photo: det?.photos?.[0]?.name ? { place: det.photos[0].name } : undefined,
    addr: det?.formattedAddress ?? p.formattedAddress ?? "",
    menu, reviewSummary: det?.reviewSummary?.text?.text ?? det?.editorialSummary?.text, mapsUri: det?.googleMapsUri ?? p.googleMapsUri,
    swiggyMatched: !!m,
  };
}

export function buildCatalog(opts: { onlyMatched?: boolean } = {}) {
  const pf = readJson<PlacesFile>(path.join(RAW, "places.json"));
  if (!pf) throw new Error("Run `npm run ingest:places` first.");
  const rows = pf.places.map((p) => buildOne(
    p,
    readJson<GDetails>(path.join(RAW, "details", `${p.id}.json`)),
    readJson<SwiggyFile>(path.join(RAW, "swiggy", `${p.id}.json`)),
    readJson<AnalysisFile>(path.join(RAW, "analysis", `${p.id}.json`)),
  )).filter((r) => !opts.onlyMatched || r.swiggyMatched);
  const file = path.join(DATA, "catalog", "restaurants.json");
  writeJson(file, { area: pf.center.name, center: pf.center, radiusKm: pf.radiusKm, builtAt: new Date().toISOString(), restaurants: rows });
  const withMenu = rows.filter((r) => r.menu.length).length;
  const scoredItems = rows.reduce((a, r) => a + r.menu.filter((m) => m.scores).length, 0);
  log(`Catalog: ${rows.length} restaurants (${withMenu} with Swiggy menus, ${scoredItems} dishes scored from reviews) → ${path.relative(process.cwd(), file)}`);
  log("Restart `npm run dev` or wait 30 s; Explore now shows live data. Set FORKCAST_DATA=test to switch back.");
  return rows;
}
