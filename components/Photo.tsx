import { photo, type PhotoKind } from "@/lib/photo";
import type { Dish } from "@/lib/types";
import { cx } from "@/lib/format";

export function Photo({
  dish, i = 0, kind = "delivered", label, pins, className, ratio = "1 / 1", flagLabels = [], radius = 16,
}: {
  dish: Dish; i?: number; kind?: PhotoKind; label?: string; pins?: boolean; className?: string; ratio?: string; flagLabels?: string[]; radius?: number;
}) {
  const p = photo(dish, i, kind);
  return (
    <div className={cx("photo", className)} style={{ aspectRatio: ratio, borderRadius: radius }}>
      <div style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: p.svg }} />
      {pins &&
        p.marks.map((m, n) => (
          <span key={m.label} className={cx("pin", flagLabels.includes(m.label) && "flag")} style={{ left: `${(m.x / 200) * 100}%`, top: `${(m.y / 200) * 100}%`, animationDelay: `${n * 60}ms` }} aria-label={m.label}>
            {n + 1}
          </span>
        ))}
      {label && <span className="tag mono-label">{label}</span>}
    </div>
  );
}

export function marksFor(dish: Dish, i: number, kind: PhotoKind) {
  return photo(dish, i, kind).marks;
}
