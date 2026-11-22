import type { Dish } from "./types";

/**
 * Drawn stand-ins for customer photos (test data only). In live mode these are real
 * Google Maps user photos matched to the dish by the vision pipeline.
 * Deterministic per (dish, index, kind) so server and client render the same thing.
 */
export type PhotoKind = "delivered" | "dinein" | "listing";
export interface Mark { label: string; x: number; y: number }
export interface Photo { svg: string; marks: Mark[] }

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n: number) => n.toFixed(1);

export const PHOTO_DATES = ["18 Nov", "16 Nov", "12 Nov", "9 Nov", "7 Nov", "3 Nov", "30 Oct", "27 Oct", "21 Oct"];

export function photo(d: Dish, i: number, kind: PhotoKind): Photo {
  const r = rng(d.id + i + kind);
  const W = 200;
  const o: string[] = [];
  const marks: Mark[] = [];
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const tables: Record<PhotoKind, string[]> = {
    delivered: ["#B98A5E", "#9C7A5B", "#5B5F66", "#D9D2C7", "#7A6A5A"],
    dinein: ["#A87B52", "#6E5B4A", "#C9B8A2", "#4F5358"],
    listing: ["#2B2B30", "#33302D"],
  };
  o.push(`<rect width="${W}" height="${W}" fill="${pick(tables[kind])}"/>`);
  if (kind !== "listing") for (let k = 0; k < 6; k++) o.push(`<rect x="0" y="${f(r() * W)}" width="${W}" height="${f(1 + r() * 2)}" fill="#000" opacity=".05"/>`);
  const jitter = kind === "listing" ? 6 : 22;
  const cx = 100 + (r() - 0.5) * jitter, cy = 100 + (r() - 0.5) * jitter;
  const rot = (r() - 0.5) * (kind === "listing" ? 8 : 30);
  const rad = (rot * Math.PI) / 180;
  const mark = (label: string, x: number, y: number) => {
    const dx = x - cx, dy = y - cy;
    marks.push({ label, x: cx + dx * Math.cos(rad) - dy * Math.sin(rad), y: cy + dx * Math.sin(rad) + dy * Math.cos(rad) });
  };
  o.push(`<g transform="rotate(${f(rot)} ${f(cx)} ${f(cy)})">`);
  let vR = 74;
  if (kind === "delivered") {
    const box = pick(d.art === "rice" ? ["foil", "foil", "black"] : d.art === "dosa" ? ["kraft", "foil"] : ["black", "kraft", "black", "foil"]);
    const fill = { black: "#1F1F22", kraft: "#B8895A", foil: "#C8CBD0" }[box]!;
    const inner = { black: "#2A2A2E", kraft: "#A97D50", foil: "#B4B8BE" }[box]!;
    o.push(`<rect x="${f(cx - 78)}" y="${f(cy - 66)}" width="156" height="132" rx="14" fill="${fill}"/><rect x="${f(cx - 70)}" y="${f(cy - 58)}" width="140" height="116" rx="10" fill="${inner}"/>`);
    if (box === "foil") for (let k = 0; k < 5; k++) o.push(`<path d="M${f(cx - 70 + r() * 140)} ${f(cy - 58)} l${f((r() - 0.5) * 20)} 116" stroke="#E3E5E8" stroke-width="1" opacity=".6"/>`);
    vR = 60;
  } else if (d.art === "dosa" && kind === "dinein") {
    o.push(`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="94" ry="80" fill="#3E8E41"/><path d="M${f(cx - 90)} ${f(cy)} H${f(cx + 90)}" stroke="#2F7033" stroke-width="2"/>`);
  } else {
    const steel = ["dosa", "jamun"].includes(d.art) || (d.art === "rice" && r() < 0.5);
    o.push(`<circle cx="${f(cx)}" cy="${f(cy + 3)}" r="84" fill="#000" opacity=".12"/><circle cx="${f(cx)}" cy="${f(cy)}" r="84" fill="${steel ? "#C3C7CC" : "#F7F5F0"}"/><circle cx="${f(cx)}" cy="${f(cy)}" r="66" fill="${steel ? "#B5BAC0" : "#EFECE5"}"/>`);
  }
  const bowl = (x: number, y: number, rr: number, c: string, rim = "#E9E6E0") => o.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${rr}" fill="${rim}"/><circle cx="${f(x)}" cy="${f(y)}" r="${rr - 4}" fill="${c}"/>`);
  const A = d.art;

  if (A === "pieces" || A === "gravy" || A === "gravy2") {
    if (A !== "pieces") o.push(`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${vR - 6}" ry="${vR - 14}" fill="${A === "gravy" ? "#A8361B" : "#5E3A1E"}"/>`);
    const n = A === "pieces" ? (kind === "delivered" ? 7 : 8) : 7;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * 6.28 + r() * 0.4, rr = (vR - 24) * (0.35 + r() * 0.55), x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.8, s = A === "gravy2" ? 14 : 18;
      const base = A === "pieces" ? "#EBB46A" : A === "gravy" ? "#B5481F" : "#7A4E2A";
      o.push(`<rect x="${f(x - s / 2)}" y="${f(y - s / 2)}" width="${s}" height="${f(s * 0.85)}" rx="5" fill="${base}" transform="rotate(${Math.round(r() * 90)} ${f(x)} ${f(y)})"/>`);
      if (A === "pieces") {
        o.push(`<path d="M${f(x - 6)} ${f(y - 3)} l5 2 M${f(x + 1)} ${f(y + 3)} l5 -2" stroke="#6B3510" stroke-width="2.4" stroke-linecap="round"/>`);
        if (r() < 0.6) o.push(`<rect x="${f(x + 8)}" y="${f(y - 4)}" width="9" height="7" rx="2" fill="${r() < 0.5 ? "#4C9A3B" : "#C8402A"}"/>`);
      }
    }
    if (A !== "pieces" || kind === "listing") {
      for (let k = 0; k < 9; k++) o.push(`<ellipse cx="${f(cx + (r() - 0.5) * 90)}" cy="${f(cy + (r() - 0.5) * 70)}" rx="5" ry="2.4" fill="#2F6B2F" transform="rotate(${Math.round(r() * 180)} ${f(cx)} ${f(cy)})"/>`);
      if (A !== "pieces") mark("curry leaves", cx + 18, cy - 20);
    }
    if (A === "gravy2") for (let k = 0; k < 40; k++) o.push(`<circle cx="${f(cx + (r() - 0.5) * 96)}" cy="${f(cy + (r() - 0.5) * 72)}" r="1.1" fill="#111"/>`);
  }
  if (A === "rice") {
    o.push(`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${vR - 6}" ry="${vR - 12}" fill="${d.id === "donne-biryani" ? "#B9C98A" : "#EAD7A4"}"/>`);
    const cols = d.id === "chicken-biryani" ? ["#F08A24", "#F2A93B", "#F7D27A", "#E9D8A6"] : d.id === "donne-biryani" ? ["#C8D69A", "#A9BD6E", "#E2E6C2", "#93A85A"] : ["#F3E3B5", "#E8B65A", "#F6E7C1", "#D9A441"];
    for (let k = 0; k < 170; k++) {
      const a = r() * 6.28, rr = Math.sqrt(r()) * (vR - 12), x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.82;
      o.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="3.4" ry="1.3" fill="${pick(cols)}" transform="rotate(${Math.round(r() * 180)} ${f(x)} ${f(y)})"/>`);
    }
    const meat = d.id === "mutton-biryani" ? "#5A2E17" : "#9A5A2C", mn = d.id === "mutton-biryani" ? 3 : kind === "listing" ? 5 : d.id === "donne-biryani" ? 2 : 3;
    for (let k = 0; k < mn; k++) {
      const x = cx + (r() - 0.5) * 70, y = cy + (r() - 0.5) * 50;
      o.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(13 + r() * 5)}" ry="${f(10 + r() * 3)}" fill="${meat}"/><ellipse cx="${f(x - 3)}" cy="${f(y - 3)}" rx="5" ry="3" fill="#fff" opacity=".12"/>`);
    }
    if (d.id !== "donne-biryani") {
      for (let k = 0; k < 26; k++) { const x = cx + (r() - 0.5) * 80, y = cy + (r() - 0.5) * 60; o.push(`<path d="M${f(x)} ${f(y)} q4 -3 8 0" stroke="#7A3E12" stroke-width="2" fill="none" stroke-linecap="round"/>`); }
      if (kind !== "listing") mark("fried onion", cx - 22, cy - 18);
    }
    if (d.id === "donne-biryani" && kind !== "listing" && r() < 0.5) { onionRings(cx + 44, cy + 44, 2); mark("raw onion", cx + 44, cy + 44); }
    if (kind !== "delivered" || r() < 0.4) { bowl(cx + 70, cy + 62, 17, "#F4F1E6"); if (kind !== "listing") mark("raita", cx + 70, cy + 62); }
  }
  if (A === "dosa") {
    const soft = kind === "delivered" && r() < 0.7;
    o.push(`<path d="M${f(cx - 80)} ${f(cy - 14)} Q${f(cx)} ${f(cy - (soft ? 30 : 40))} ${f(cx + 80)} ${f(cy - 14)} L${f(cx + 80)} ${f(cy + 14)} Q${f(cx)} ${f(cy + (soft ? 24 : 36))} ${f(cx - 80)} ${f(cy + 14)} Z" fill="${soft ? "#C9944A" : "#D9993A"}"/>`);
    for (let k = 0; k < 14; k++) o.push(`<circle cx="${f(cx - 70 + r() * 140)}" cy="${f(cy + (r() - 0.5) * 28)}" r="${f(2 + r() * 3)}" fill="#A8641F" opacity=".55"/>`);
    bowl(cx - 44, cy + 52, 17, "#C8642B"); bowl(cx + 6, cy + 56, 17, "#EFE9D9");
    if (kind !== "listing") { mark("sambar", cx - 44, cy + 52); mark("coconut chutney", cx + 6, cy + 56); if (soft) mark("soft, folded", cx + 30, cy - 4); }
  }
  if (A === "toast") {
    for (let k = 0; k < 4; k++) {
      const x = cx - 56 + (k % 2) * 58 + (r() - 0.5) * 6, y = cy - 48 + Math.floor(k / 2) * 52;
      o.push(`<rect x="${f(x)}" y="${f(y)}" width="52" height="46" rx="6" fill="#D9A659"/><rect x="${f(x + 4)}" y="${f(y + 4)}" width="44" height="38" rx="5" fill="#F5CD52"/>`);
      for (let j = 0; j < 8; j++) o.push(`<circle cx="${f(x + 6 + r() * 40)}" cy="${f(y + 6 + r() * 34)}" r="1.8" fill="${r() < 0.5 ? "#3E8E2F" : "#C8302A"}"/>`);
    }
    if (kind !== "listing") mark("green chilli", cx - 30, cy - 26);
  }
  if (A === "momos") {
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * 6.28, x = cx + Math.cos(a) * 40, y = cy + Math.sin(a) * 34;
      o.push(`<circle cx="${f(x)}" cy="${f(y)}" r="15" fill="${kind === "delivered" && r() < 0.5 ? "#E3D3B4" : "#F1E7D3"}"/><path d="M${f(x - 7)} ${f(y - 4)} q7 6 14 0" stroke="#D2C2A2" stroke-width="1.6" fill="none"/>`);
    }
    bowl(cx, cy, 15, "#C8302A");
    if (kind !== "listing") mark("red chutney", cx, cy);
  }
  if (A === "jamun") {
    bowl(cx, cy, 58, "#E2B04F", "#F1EEE8");
    for (let k = 0; k < 2; k++) { const x = cx - 18 + k * 36, y = cy + (r() - 0.5) * 10; o.push(`<circle cx="${f(x)}" cy="${f(y)}" r="20" fill="#5E2711"/><ellipse cx="${f(x - 6)}" cy="${f(y - 7)}" rx="6" ry="4" fill="#fff" opacity=".18"/>`); }
    if (kind !== "listing") mark("syrup", cx + 30, cy + 30);
  }
  if (A === "salad") {
    for (let k = 0; k < 26; k++) o.push(`<ellipse cx="${f(cx + (r() - 0.5) * 100)}" cy="${f(cy + (r() - 0.5) * 80)}" rx="${f(12 + r() * 8)}" ry="${f(6 + r() * 4)}" fill="${pick(["#6FAE3E", "#8CC152", "#4E8C2B", "#A5D06B"])}" transform="rotate(${Math.round(r() * 180)} ${f(cx)} ${f(cy)})"/>`);
    for (let k = 0; k < 5; k++) o.push(`<rect x="${f(cx - 40 + r() * 70)}" y="${f(cy - 30 + r() * 50)}" width="26" height="9" rx="4" fill="#D9A15C"/>`);
    for (let k = 0; k < 6; k++) o.push(`<rect x="${f(cx - 50 + r() * 90)}" y="${f(cy - 40 + r() * 70)}" width="8" height="8" rx="2" fill="#E0B470"/>`);
    bowl(cx + 70, cy - 62, 15, "#F2EBD3");
    if (kind !== "listing") { mark("dressing", cx + 70, cy - 62); mark("grilled chicken", cx - 10, cy + 4); }
  }
  if (A === "noodles") {
    for (let k = 0; k < 60; k++) { const x = cx + (r() - 0.5) * 110, y = cy + (r() - 0.5) * 90; o.push(`<path d="M${f(x)} ${f(y)} q${f(8 + r() * 8)} ${f((r() - 0.5) * 16)} ${f(18 + r() * 10)} ${f((r() - 0.5) * 8)}" stroke="${pick(["#E8C27A", "#DDB066", "#F0CF8C"])}" stroke-width="3" fill="none" stroke-linecap="round"/>`); }
    for (let k = 0; k < 14; k++) o.push(`<circle cx="${f(cx + (r() - 0.5) * 100)}" cy="${f(cy + (r() - 0.5) * 80)}" r="3" fill="none" stroke="#5DAA3A" stroke-width="2"/>`);
    for (let k = 0; k < 18; k++) o.push(`<circle cx="${f(cx + (r() - 0.5) * 100)}" cy="${f(cy + (r() - 0.5) * 80)}" r="1.8" fill="#B5702A"/>`);
    if (kind !== "listing") { mark("spring onion", cx - 24, cy + 10); mark("fried garlic", cx + 26, cy - 16); }
  }
  if (A === "curry") {
    const pbm = d.id === "paneer-butter-masala";
    o.push(`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${vR - 6}" ry="${vR - 12}" fill="${pbm ? "#E0752C" : "#D4612A"}"/>`);
    for (let k = 0; k < 6; k++) { const a = r() * 6.28, rr = r() * 34, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; o.push(pbm ? `<rect x="${f(x - 8)}" y="${f(y - 7)}" width="16" height="14" rx="3" fill="#F4E3C3"/>` : `<ellipse cx="${f(x)}" cy="${f(y)}" rx="12" ry="9" fill="#9A4A22"/>`); }
    o.push(`<path d="M${f(cx - 30)} ${f(cy - 8)} q20 -18 40 0 t40 0" stroke="#FFF4E6" stroke-width="4" fill="none" opacity=".8"/>`);
    if (kind !== "listing") mark("cream swirl", cx - 6, cy - 12);
    if (d.id === "butter-chicken" && kind !== "listing" && r() < 0.6) { onionRings(cx + 56, cy + 54, 2); mark("raw onion", cx + 56, cy + 54); }
  }
  function onionRings(x: number, y: number, n: number) {
    for (let k = 0; k < n; k++) {
      const px = x + (k - n / 2) * 14, rx = 11, ry = 8;
      o.push(`<ellipse cx="${f(px)}" cy="${f(y)}" rx="${rx}" ry="${ry}" fill="none" stroke="#C88AD6" stroke-width="3"/><ellipse cx="${f(px)}" cy="${f(y)}" rx="${rx - 5}" ry="${ry - 4}" fill="none" stroke="#E2C1EA" stroke-width="2"/>`);
    }
  }
  if (d.id === "paneer-tikka" && kind !== "listing") {
    const showOnion = kind === "delivered" ? i % 9 < 7 : r() < 0.8;
    if (showOnion) {
      const n = 3 + Math.floor(r() * 3);
      let sx = 0, sy = 0;
      for (let k = 0; k < n; k++) {
        const x = cx - 30 + r() * 60, y = cy - 30 + r() * 55, rx = 11 + r() * 5, ry = 8 + r() * 3;
        o.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="#C88AD6" stroke-width="3"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx - 5)}" ry="${f(ry - 4)}" fill="none" stroke="#E2C1EA" stroke-width="2"/>`);
        sx += x; sy += y;
      }
      mark("raw onion", sx / n, sy / n);
    }
    bowl(cx + 64, cy + 60, 16, "#5BA449");
    mark("mint chutney", cx + 64, cy + 60);
    if (r() < 0.6) o.push(`<path d="M${f(cx - 74)} ${f(cy + 40)} a16 16 0 0 1 32 0 z" fill="#F2D43D"/>`);
  }
  o.push(`</g>`);
  let defs = "";
  if (kind === "listing") {
    const id = `vg-${d.id}`;
    defs = `<defs><radialGradient id="${id}" cx=".5" cy=".5" r=".7"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient></defs>`;
    o.push(`<rect width="200" height="200" fill="url(#${id})"/>`);
  } else {
    o.push(`<rect width="200" height="200" fill="#000" opacity="${(r() * 0.12).toFixed(2)}"/>`);
  }
  const label = `${kind === "listing" ? "Swiggy listing photo" : "Customer photo"} of ${d.name}`;
  return {
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}">${defs}${o.join("")}</svg>`,
    marks,
  };
}
