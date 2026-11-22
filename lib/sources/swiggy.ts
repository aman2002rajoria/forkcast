/**
 * Swiggy Food MCP adapter (live mode). Not wired into the UI yet: test mode uses lib/data.ts.
 *
 * Endpoint: POST https://mcp.swiggy.com/food (MCP over streamable HTTP, JSON-RPC 2.0)
 * Auth: OAuth 2.1 + PKCE with the user's own Swiggy account (phone + OTP on Swiggy's page).
 *   Access token lasts 5 days; refresh token 30 days, rotated on refresh.
 *   Whitelisted local redirect: http://localhost/callback
 * Tools used: search_restaurants, search_menu, get_restaurant_menu (read-only).
 *
 * Terms: Swiggy's builder rules forbid benchmarking and harvesting beyond agreed scope.
 * Forkcast only calls these on demand, for the signed-in user's own search, and caches briefly.
 */

const ENDPOINT = "https://mcp.swiggy.com/food";

export interface SwiggyDish {
  name: string; price: number; isVeg: boolean; menu_item_id: string; restaurant_id: string; restaurant_name: string;
  imageUrl?: string; rating?: string | number; totalRatings?: string; isBestseller?: boolean;
}
export interface SwiggyRestaurant {
  id: string; name: string; cuisines: string[]; avgRating: number; totalRatings: string; costForTwo: string;
  areaName: string; distanceKm: number; deliveryTimeMinutes: number; veg: boolean; imageUrl?: string;
}

let rpcId = 0;
async function call<T>(token: string, tool: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", authorization: `Bearer ${token}` },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method: "tools/call", params: { name: tool, arguments: args } }),
  });
  if (res.status === 401 || res.status === 419) throw new SwiggyAuthError();
  if (!res.ok) throw new Error(`Swiggy MCP ${tool} failed: ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(body.error.message ?? "Swiggy MCP error");
  // Tool results come back as content blocks; the first text block holds the JSON payload.
  const text = body.result?.content?.find((c: { type: string }) => c.type === "text")?.text;
  return (text ? JSON.parse(text) : body.result) as T;
}

export class SwiggyAuthError extends Error { constructor() { super("Swiggy signed you out"); } }

export function searchMenu(token: string, query: string, lat: number, lng: number, offset = 0) {
  return call<{ data: { items: SwiggyDish[]; hasMore: boolean; nextOffset?: number } }>(token, "search_menu", { query, latitude: lat, longitude: lng, offset });
}
export function searchRestaurants(token: string, query: string, lat: number, lng: number, offset = 0) {
  return call<{ data: { restaurants: SwiggyRestaurant[]; hasMore: boolean; nextOffset?: number } }>(token, "search_restaurants", { query, latitude: lat, longitude: lng, offset });
}
export function getMenu(token: string, restaurantId: string, lat: number, lng: number, page = 1) {
  return call<{ data: { restaurant: { address: string; city: string; areaName: string }; categories: { title: string; items: SwiggyDish[] }[]; hasMore: boolean } }>(
    token, "get_restaurant_menu", { restaurantId, latitude: lat, longitude: lng, page, pageSize: 8 },
  );
}
