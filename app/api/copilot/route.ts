import { NextResponse } from "next/server";
import { parse, refine } from "@/lib/intent";
import { copilot } from "@/lib/rank";
import type { Intent, Prefs } from "@/lib/types";

/**
 * POST /api/copilot
 * { text, prev?, prevPicks?, prevMaxPrice?, intent?, prefs }
 *
 * Test mode: a deterministic parser and the fixture catalogue, so it works with no keys.
 * Live mode swaps in the adapters in lib/sources: Swiggy MCP search_menu/get_restaurant_menu for
 * candidates, the Places + vision cache for dish scores, and an LLM for intent parsing when the
 * deterministic parser is unsure.
 */
export async function POST(req: Request) {
  let body: { text?: string; prev?: Intent; prevPicks?: string[]; prevMaxPrice?: number; intent?: Intent; prefs?: Prefs };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Send JSON." }, { status: 400 }); }
  if (!body.prefs) return NextResponse.json({ error: "Missing prefs." }, { status: 400 });
  let it: Intent | null = body.intent ?? null;
  if (!it) {
    const text = (body.text ?? "").trim();
    if (!text) return NextResponse.json({ error: "Say what you feel like." }, { status: 400 });
    it = body.prev ? refine(body.prev, text, body.prevPicks ?? [], body.prevMaxPrice ?? 400) : null;
    it ??= parse(text);
  }
  return NextResponse.json(copilot(it, body.prefs));
}
