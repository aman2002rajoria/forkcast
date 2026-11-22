import { NextResponse } from "next/server";

/**
 * GET /api/place-photo?name=places/XXX/photos/YYY&w=800
 * Live mode only: resolves a Google Places photo to a short-lived image URL, so the API key stays on the server.
 * Google's terms require showing the photo's author attribution next to it (kept in the catalog as authorAttributions).
 */
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const name = u.get("name") ?? "";
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY is not set." }, { status: 501 });
  if (!/^places\/[\w-]+\/photos\/[\w-]+$/.test(name)) return NextResponse.json({ error: "Bad photo name." }, { status: 400 });
  const w = Math.min(1600, Math.max(100, Number(u.get("w")) || 800));
  const res = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=${w}&skipHttpRedirect=true&key=${key}`);
  if (!res.ok) return NextResponse.json({ error: `Photo lookup failed: ${res.status}` }, { status: 502 });
  const { photoUri } = (await res.json()) as { photoUri?: string };
  if (!photoUri) return NextResponse.json({ error: "No photo." }, { status: 404 });
  return NextResponse.redirect(photoUri, { headers: { "cache-control": "private, max-age=3000" } });
}
