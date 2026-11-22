import { NextResponse } from "next/server";
import { filterAndSort, DEFAULT_W } from "@/lib/catalog";
import { loadCatalog } from "@/lib/server/catalog";
import type { Weights } from "@/lib/types";

/** GET /api/restaurants?q=dosa&sort=foryou|reviews|near&veg=1&dinein=1&quick=1&w=1,0.6,1.2,0.4,0.5&offset=0&limit=24 */
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const ws = (u.get("w") ?? "").split(",").map(Number);
  const w: Weights = ws.length === 5 && ws.every((x) => Number.isFinite(x))
    ? { taste: ws[0], quantity: ws[1], quality: ws[2], packaging: ws[3], value: ws[4] }
    : DEFAULT_W;
  const sort = (["foryou", "reviews", "near"] as const).find((s) => s === u.get("sort")) ?? "foryou";
  const { rows, mode, area } = loadCatalog();
  return NextResponse.json(filterAndSort(rows, {
    q: u.get("q") ?? undefined, sort, veg: u.get("veg") === "1", dinein: u.get("dinein") === "1", quick: u.get("quick") === "1", w,
    offset: Math.max(0, Number(u.get("offset")) || 0), limit: Math.min(60, Math.max(1, Number(u.get("limit")) || 24)),
  }, mode, area));
}
