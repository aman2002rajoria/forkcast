/**
 * Google Places API (New) adapter (live mode, server only; key in GOOGLE_MAPS_API_KEY).
 * Matches a Swiggy listing to a real place and pulls the evidence a dish score needs.
 *
 * Limits worth knowing: Place Details returns at most 5 reviews and 10 photos.
 * reviewSummary (AI review summary) needs the field mask entry and attribution via reviewsUri.
 * Terms: only place_id may be stored long-term; other fields are cached for at most 30 days.
 */

const BASE = "https://places.googleapis.com/v1";
const BLR = { low: { latitude: 12.83, longitude: 77.46 }, high: { latitude: 13.14, longitude: 77.78 } };

export interface PlaceMatch { id: string; name: string; address: string; types: string[]; rating?: number; count?: number; confidence: number }

export async function matchPlace(name: string, area: string, key: string): Promise<PlaceMatch | null> {
  const res = await fetch(`${BASE}/places:searchText`, {
    method: "POST",
    headers: { "content-type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.types,places.rating,places.userRatingCount" },
    body: JSON.stringify({ textQuery: `${name} ${area} Bengaluru`, locationRestriction: { rectangle: BLR }, maxResultCount: 5 }),
  });
  if (!res.ok) throw new Error(`Places search failed: ${res.status}`);
  const { places = [] } = await res.json();
  const scored = places.map((p: { id: string; displayName: { text: string }; formattedAddress: string; types: string[]; rating?: number; userRatingCount?: number }) => ({
    id: p.id, name: p.displayName.text, address: p.formattedAddress, types: p.types, rating: p.rating, count: p.userRatingCount,
    confidence: similarity(name, p.displayName.text) * (p.formattedAddress.toLowerCase().includes(area.toLowerCase()) ? 1 : 0.7),
  }));
  scored.sort((a: PlaceMatch, b: PlaceMatch) => b.confidence - a.confidence);
  // Below 0.6 we say "no dine-in listing found" rather than guess. That absence is itself a cloud-kitchen signal.
  return scored[0]?.confidence >= 0.6 ? scored[0] : null;
}

export async function placeEvidence(placeId: string, key: string) {
  const res = await fetch(`${BASE}/places/${placeId}`, {
    headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "id,rating,userRatingCount,reviews,photos,reviewSummary,websiteUri,dineIn,delivery" },
  });
  if (!res.ok) throw new Error(`Place details failed: ${res.status}`);
  return res.json();
}

/** Token-set similarity, 0..1. Good enough to rank 5 candidates; an LLM breaks ties. */
function similarity(a: string, b: string) {
  const t = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 1));
  const A = t(a), B = t(b);
  const inter = [...A].filter((w) => B.has(w)).length;
  return inter / Math.max(1, Math.min(A.size, B.size));
}
