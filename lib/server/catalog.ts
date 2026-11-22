import fs from "node:fs";
import path from "node:path";
import { testCatalog, type RestaurantDetail } from "../catalog";

/**
 * Where Explore reads from. If `npm run ingest:build` has written data/catalog/restaurants.json,
 * Explore shows the live catalog; otherwise it shows test data. Set FORKCAST_DATA=test to force test data.
 */
const DIR = path.join(process.cwd(), "data", "catalog");
let cache: { at: number; rows: RestaurantDetail[]; mode: "test" | "live"; area: string } | null = null;

export function loadCatalog() {
  if (cache && Date.now() - cache.at < 30_000) return cache;
  const file = path.join(DIR, "restaurants.json");
  if (process.env.FORKCAST_DATA !== "test" && fs.existsSync(file)) {
    try {
      const raw = JSON.parse(fs.readFileSync(file, "utf8")) as { area: string; restaurants: RestaurantDetail[] };
      cache = { at: Date.now(), rows: raw.restaurants, mode: "live", area: raw.area };
      return cache;
    } catch (e) {
      console.error("[catalog] could not read data/catalog/restaurants.json, falling back to test data", e);
    }
  }
  cache = { at: Date.now(), rows: testCatalog(), mode: "test", area: "Indiranagar" };
  return cache;
}
