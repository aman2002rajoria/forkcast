export interface Pt { lat: number; lng: number }
export interface Cell extends Pt { r: number }

const R = 6371_000;
const rad = (d: number) => (d * Math.PI) / 180;

export function distM(a: Pt, b: Pt) {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const distKm = (a: Pt, b: Pt) => distM(a, b) / 1000;

/** Move a point by metres north/east. */
export function offset(p: Pt, northM: number, eastM: number): Pt {
  return { lat: p.lat + northM / 111_320, lng: p.lng + eastM / (111_320 * Math.cos(rad(p.lat))) };
}

/**
 * Hexagonal packing of circles of radius r covering a disc of radius `radiusM` around `center`.
 * Hex spacing (√3·r across, 1.5·r down) leaves no gaps between neighbouring circles.
 */
export function hexCover(center: Pt, radiusM: number, r: number): Cell[] {
  const dx = Math.sqrt(3) * r, dy = 1.5 * r, out: Cell[] = [];
  const rows = Math.ceil((radiusM + r) / dy);
  for (let i = -rows; i <= rows; i++) {
    const cols = Math.ceil((radiusM + r) / dx) + 1;
    for (let j = -cols; j <= cols; j++) {
      const east = j * dx + (i % 2 ? dx / 2 : 0), north = i * dy;
      if (Math.hypot(east, north) <= radiusM + r * 0.9) out.push({ ...offset(center, north, east), r });
    }
  }
  return out;
}

/** Four circles of radius 0.71·r centred on the quadrants; together they cover the parent circle. */
export function split(c: Cell): Cell[] {
  const h = c.r / 2, r = Math.ceil(c.r * 0.71);
  return [[h, h], [h, -h], [-h, h], [-h, -h]].map(([n, e]) => ({ ...offset(c, n, e), r }));
}

export const cellKey = (c: Cell) => `${c.lat.toFixed(5)}_${c.lng.toFixed(5)}_${c.r}`;
