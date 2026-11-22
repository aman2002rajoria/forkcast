/**
 * Ingestion config. Everything is overridable from .env.local (see .env.example).
 * Run stages with `npm run ingest:<stage>`; each stage caches its output under data/raw so it can resume.
 */
import path from "node:path";

for (const f of [".env.local", ".env"]) {
  try { process.loadEnvFile(path.resolve(f)); } catch { /* file is optional */ }
}

const num = (v: string | undefined, d: number) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : d);

export const cfg = {
  googleKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  geminiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  /** Koramangala by default */
  center: { name: process.env.CENTER_NAME ?? "Koramangala", lat: num(process.env.CENTER_LAT, 12.9352), lng: num(process.env.CENTER_LNG, 77.6245) },
  radiusKm: num(process.env.RADIUS_KM, 12),
  /** keep places with at least this many Google reviews */
  minReviews: num(process.env.MIN_REVIEWS, 1000),
  /** and at most this many places, most-reviewed first */
  maxRestaurants: num(process.env.MAX_RESTAURANTS, 2000),
  includedTypes: (process.env.PLACE_TYPES ?? "restaurant,cafe,bakery,meal_takeaway").split(",").map((s) => s.trim()).filter(Boolean),
  /** starting search circle; saturated circles split into smaller ones down to minCellRadiusM */
  cellRadiusM: num(process.env.CELL_RADIUS_M, 1500),
  minCellRadiusM: num(process.env.MIN_CELL_RADIUS_M, 200),
  /** split a full circle (20 results) even when its least-reviewed result is below the threshold */
  strictSplit: process.env.STRICT_SPLIT === "1",
  googleQps: num(process.env.GOOGLE_QPS, 5),
  detailsMaxAgeDays: num(process.env.DETAILS_MAX_AGE_DAYS, 30),
  swiggyUrl: process.env.SWIGGY_MCP_URL ?? "https://mcp.swiggy.com/food",
  swiggyRedirect: process.env.SWIGGY_REDIRECT_URL ?? "http://localhost/callback",
  /** places to fetch Swiggy menus for in one run, most-reviewed first */
  swiggyLimit: num(process.env.SWIGGY_LIMIT, 50),
  swiggyDelayMs: num(process.env.SWIGGY_DELAY_MS, 2500),
};

export const DATA = path.resolve(process.env.FORKCAST_DATA_DIR ?? "data");
export const RAW = path.join(DATA, "raw");
export const STATE = path.resolve(process.env.FORKCAST_STATE_DIR ?? ".forkcast");

export function args() {
  const a = process.argv.slice(2);
  const val = (k: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  return { force: a.includes("--force"), dryRun: a.includes("--dry-run"), limit: val("--limit") ? Number(val("--limit")) : undefined, only: val("--only") };
}
