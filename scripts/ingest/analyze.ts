/**
 * Stage 4 (optional): score dishes from what reviewers wrote, with Gemini.
 * Input per place: Google's reviews and review summary, plus the Swiggy menu as the only allowed dish names.
 * Output per place: data/raw/analysis/{placeId}.json with aspect scores for the dishes reviewers mention.
 *
 *   npm run ingest:analyze [-- --limit 20]
 *
 * With only 5 Google reviews per place, most dishes won't be mentioned. A deeper review source
 * (or Forkcast users' own ratings) is what fills in the rest; the format stays the same.
 */
import path from "node:path";
import { cfg, RAW } from "./config";
import type { PlacesFile } from "./places";
import type { GDetails } from "./details";
import type { SwiggyFile } from "./swiggy-menus";
import { HttpError, limiter, log, readJson, retry, writeJson } from "./util";

export interface DishAnalysis { name: string; mentions: number; taste?: number; quantity?: number; quality?: number; packaging?: number; value?: number; quote?: string }
export interface AnalysisFile { placeId: string; model: string; analysedAt: string; dishes: DishAnalysis[] }

export function prompt(menu: string[], reviews: string[], summary?: string) {
  return [
    "You read restaurant reviews and score individual dishes.",
    `Allowed dish names (use exactly these, nothing else): ${JSON.stringify(menu.slice(0, 250))}`,
    summary ? `Google's summary of all reviews: ${summary}` : "",
    "Reviews:",
    ...reviews.map((r, i) => `${i + 1}. ${r}`),
    "",
    "Return JSON {\"dishes\": [...]} with one entry per dish that a review clearly talks about.",
    "Each entry: name (from the allowed list), mentions (how many reviews mention it),",
    "taste, quantity, quality, packaging, value: numbers 1-5, or null when the reviews don't say,",
    "quote: a short exact phrase from a review about that dish.",
    "Skip dishes nobody mentions. Never invent scores.",
  ].filter(Boolean).join("\n");
}

async function gemini(text: string): Promise<{ dishes: DishAnalysis[] }> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${cfg.geminiModel}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": cfg.geminiKey },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }),
  });
  if (!res.ok) throw new HttpError(res.status, `Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  const out = body.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  return JSON.parse(out);
}

/** Keep only entries that name a real menu item and have sane scores. */
export function clean(raw: { dishes?: unknown[] }, menu: string[]): DishAnalysis[] {
  const names = new Map(menu.map((m) => [m.toLowerCase(), m]));
  const sc = (v: unknown) => (typeof v === "number" && v >= 1 && v <= 5 ? Math.round(v * 10) / 10 : undefined);
  return (raw.dishes ?? []).flatMap((d) => {
    const x = d as Record<string, unknown>;
    const name = names.get(String(x.name ?? "").toLowerCase());
    if (!name) return [];
    return [{ name, mentions: Math.max(1, Number(x.mentions) || 1), taste: sc(x.taste), quantity: sc(x.quantity), quality: sc(x.quality), packaging: sc(x.packaging), value: sc(x.value), quote: typeof x.quote === "string" ? x.quote.slice(0, 160) : undefined }];
  });
}

export async function analyze(opts: { force?: boolean; limit?: number } = {}) {
  if (!cfg.geminiKey) throw new Error("Set GEMINI_API_KEY in .env.local.");
  const pf = readJson<PlacesFile>(path.join(RAW, "places.json"));
  if (!pf) throw new Error("Run the earlier stages first.");
  const wait = limiter(1);
  let done = 0;
  for (const p of pf.places) {
    if (opts.limit && done >= opts.limit) break;
    const out = path.join(RAW, "analysis", `${p.id}.json`);
    if (!opts.force && readJson(out)) continue;
    const det = readJson<GDetails>(path.join(RAW, "details", `${p.id}.json`));
    const sw = readJson<SwiggyFile>(path.join(RAW, "swiggy", `${p.id}.json`));
    const menu = [...new Set(sw?.categories.flatMap((c) => c.items.map((i) => i.name)) ?? [])];
    const reviews = (det?.reviews ?? []).map((r) => r.originalText?.text ?? r.text?.text ?? "").filter(Boolean);
    if (!menu.length || (!reviews.length && !det?.reviewSummary)) continue;
    await wait();
    try {
      const raw = await retry(() => gemini(prompt(menu, reviews, det?.reviewSummary?.text?.text)), p.displayName?.text ?? p.id);
      const dishes = clean(raw, menu);
      writeJson(out, { placeId: p.id, model: cfg.geminiModel, analysedAt: new Date().toISOString(), dishes } satisfies AnalysisFile);
      done++;
      log(`  ${p.displayName?.text}: ${dishes.length} dishes scored`);
    } catch (e) { log(`  skip ${p.displayName?.text}: ${(e as Error).message}`); }
  }
  log(`Analysis: ${done} places scored.`);
}
