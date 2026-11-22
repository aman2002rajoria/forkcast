import type { Weights } from "./types";
import { DISH, DISHES, HOME, R } from "./data";
import { META, MENUS, type MenuItem } from "./menus";
import { dishScore } from "./rank";

/** One restaurant in Explore. Same shape for test data and the live catalog built by scripts/ingest. */
export interface RestaurantSummary {
  id: string;
  name: string;
  area: string;
  km: number;
  eta?: number;
  type: "dinein" | "cloud";
  brands?: number;
  /** Google Maps rating and review count */
  g?: number;
  gN?: number;
  /** Swiggy restaurant rating and count label */
  sw?: number;
  swN?: string;
  cuisines: string[];
  costForTwo?: number;
  /** pure veg: every menu item is veg */
  veg: boolean;
  items: number;
  /** items with a full Forkcast score */
  scored: number;
  topDish?: { name: string; dishId?: string; score?: number; rating?: number };
  /** what to show as the card photo: a drawn test photo, or a Google photo resource name */
  photo?: { dishId?: string; place?: string };
  /** set when a search matched a dish on the menu */
  match?: string;
  source: "test" | "live";
}
export interface RestaurantDetail extends RestaurantSummary {
  addr: string;
  since?: number;
  menu: MenuItem[];
  reviewSummary?: string;
  mapsUri?: string;
  swiggyMatched: boolean;
}

export interface ListQuery { q?: string; sort?: "foryou" | "reviews" | "near"; veg?: boolean; dinein?: boolean; quick?: boolean; w?: Weights; offset?: number; limit?: number }
export interface ListResult { mode: "test" | "live"; area: string; total: number; items: RestaurantSummary[] }

export const DEFAULT_W: Weights = { taste: 1, quantity: 0.6, quality: 1.2, packaging: 0.4, value: 0.5 };

/** Score of a menu item for these weights: a full Forkcast dish score, live aspect scores, or nothing. */
export function itemScore(it: MenuItem, w: Weights): number | undefined {
  if (it.dishId && DISH[it.dishId]) return dishScore(DISH[it.dishId], w);
  if (it.scores && Object.keys(it.scores).length >= 2) {
    let s = 0, t = 0;
    for (const [k, v] of Object.entries(it.scores)) { const wk = w[k as keyof Weights]; s += wk * (v as number); t += wk; }
    return t ? s / t : undefined;
  }
  return undefined;
}

export function summarise(d: RestaurantDetail, w: Weights): RestaurantSummary {
  // Desserts and drinks never headline a restaurant.
  const main = (m: MenuItem) => !/dessert|sweet|beverage|drink/i.test(m.category);
  const scored = d.menu.filter(main).map((m) => ({ m, s: itemScore(m, w) })).filter((x) => x.s != null) as { m: MenuItem; s: number }[];
  scored.sort((a, b) => b.s - a.s);
  const byVotes = d.menu.filter((m) => m.rating && main(m)).sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0) || (b.votes ?? 0) - (a.votes ?? 0));
  const top = scored[0] ? { name: scored[0].m.name, dishId: scored[0].m.dishId, score: +scored[0].s.toFixed(1) } : byVotes[0] ? { name: byVotes[0].name, rating: byVotes[0].rating } : undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { menu, addr, since, reviewSummary, mapsUri, swiggyMatched, ...rest } = d;
  return { ...rest, scored: scored.length, items: d.menu.length, topDish: top, photo: d.photo ?? (top && "dishId" in top && top.dishId ? { dishId: top.dishId } : undefined) };
}

/** Test catalogue: the fixture restaurants with their menus. */
export function testCatalog(): RestaurantDetail[] {
  return Object.values(R).map((r) => {
    const menu = MENUS[r.id] ?? [];
    const lead = menu.find((m) => m.dishId) ?? undefined;
    return {
      id: r.id, name: r.name, area: r.area, km: r.km, eta: r.eta, type: r.type, brands: r.brands, g: r.g, gN: r.gN, sw: r.sw, swN: r.swN,
      cuisines: META[r.id]?.cuisines ?? [], costForTwo: META[r.id]?.costForTwo, veg: menu.length > 0 && menu.every((m) => m.veg),
      items: menu.length, scored: 0, source: "test" as const, addr: r.addr, since: r.since, menu, swiggyMatched: true,
      photo: lead?.dishId ? { dishId: lead.dishId } : undefined,
    };
  });
}

export function filterAndSort(all: RestaurantDetail[], q: ListQuery, mode: "test" | "live", area: string = HOME.area): ListResult {
  const w = q.w ?? DEFAULT_W;
  const needle = q.q?.trim().toLowerCase();
  let rows = all.map((d) => {
    let match: string | undefined;
    if (needle) {
      const hay = [d.name, d.area, ...d.cuisines].join(" ").toLowerCase();
      if (!hay.includes(needle)) {
        const item = d.menu.find((m) => m.name.toLowerCase().includes(needle) || m.category.toLowerCase().includes(needle));
        if (!item) return null;
        match = item.name;
      }
    }
    return { ...summarise(d, w), match };
  }).filter(Boolean) as RestaurantSummary[];
  if (q.veg) rows = rows.filter((r) => r.veg);
  if (q.dinein) rows = rows.filter((r) => r.type === "dinein");
  if (q.quick) rows = rows.filter((r) => (r.eta ?? 99) <= 35);
  const forYou = (r: RestaurantSummary) => r.topDish?.score ?? (r.g ?? r.sw ?? 3.5) - 0.3;
  if (q.sort === "reviews") rows.sort((a, b) => (b.gN ?? 0) - (a.gN ?? 0));
  else if (q.sort === "near") rows.sort((a, b) => a.km - b.km);
  else rows.sort((a, b) => forYou(b) - forYou(a) || (b.gN ?? 0) - (a.gN ?? 0));
  const offset = q.offset ?? 0, limit = q.limit ?? 24;
  return { mode, area, total: rows.length, items: rows.slice(offset, offset + limit) };
}

export const TEST_DISH_COUNT = DISHES.length;
