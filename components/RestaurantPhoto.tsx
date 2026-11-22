import { DISH } from "@/lib/data";
import type { RestaurantSummary } from "@/lib/catalog";
import { Photo } from "./Photo";

/** Test data: a drawn photo of the restaurant's best dish. Live: a Google Places photo through /api/place-photo. */
export function RestaurantPhoto({ r, ratio = "16 / 10", radius = 0 }: { r: Pick<RestaurantSummary, "photo" | "cuisines" | "name">; ratio?: string; radius?: number }) {
  if (r.photo?.dishId && DISH[r.photo.dishId]) return <Photo dish={DISH[r.photo.dishId]} kind="dinein" i={7} ratio={ratio} radius={radius} />;
  if (r.photo?.place)
    return (
      <div className="photo" style={{ aspectRatio: ratio, borderRadius: radius }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/place-photo?name=${encodeURIComponent(r.photo.place)}&w=800`} alt={`Photo at ${r.name}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <span className="tag mono-label">Google Maps</span>
      </div>
    );
  return (
    <div className="photo grid place-items-center bg-accent-50" style={{ aspectRatio: ratio, borderRadius: radius }}>
      <span className="mono-label text-accent-700">{r.cuisines[0] ?? "Restaurant"}</span>
    </div>
  );
}
