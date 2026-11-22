import type { Intent } from "./types";
import { DISHES, INGREDIENTS } from "./data";

/** Mood → regex fragments. Stems (\w*) catch "comforting", "spicier"; Hinglish included. */
export const MOODS: Record<string, string[]> = {
  savory: ["savou?ry", "salty", "umami", "chatpat\\w*", "masaledar"],
  spicy: ["spic\\w*", "spicey", "teekh\\w*", "tikha", "mirch\\w*", "fiery", "hot(?!el)"],
  light: ["light\\w*", "halk\\w*", "healthy", "snack\\w*", "not heavy"],
  comfort: ["comfort\\w*", "homely", "hearty", "co[sz]y", "ghar ka"],
  sweet: ["sweet\\w*", "dessert\\w*", "mithai", "meetha"],
  cheesy: ["chees\\w*"],
  crispy: ["crisp\\w*", "crunch\\w*"],
  smoky: ["smok\\w*", "tandoor\\w*", "grill\\w*", "charred"],
  fresh: ["fresh", "salads?"],
  rich: ["rich", "cream\\w*", "butter\\w*"],
};
export const MOOD_LABEL: Record<string, string> = {
  savory: "Savory", spicy: "Spicy", light: "Light", comfort: "Comfort food", sweet: "Sweet", cheesy: "Cheesy",
  crispy: "Crispy", smoky: "Smoky", fresh: "Fresh", rich: "Rich",
};

export const STARTERS = ["Savory under ₹400", "Big portions for two", "Light and quick", "Spicy, no cloud kitchens", "Something sweet", "Best biryani nearby"];

/** Words that appear in many dish names. They only narrow when nothing more specific matched. */
const GENERIC = new Set(["chicken", "paneer", "masala", "butter", "healthy", "snack", "starter", "curry", "rice", "fry", "sweet", "dessert", "garlic", "cheese", "pepper"]);

export function emptyIntent(raw = ""): Intent {
  return { raw, moods: [], dishes: [], budget: null, forTwo: false, realOnly: false, quality: false, quantity: false, quick: false, veg: false, nonveg: false, avoid: [], surprise: false, maxSpice: null, maxKm: null, exclude: [] };
}

function lev(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Fix one-letter typos against the words Forkcast knows ("biriyani" → "biryani"). */
function normalise(text: string) {
  const vocab = new Set(DISHES.flatMap((d) => d.kw.filter((k) => !k.includes(" "))));
  const moodWords = Object.values(MOODS).flat();
  const isMood = (w: string) => moodWords.some((m) => new RegExp(`^${m}$`).test(w));
  return text.split(/\s+/).map((w) => (w.length >= 6 && !vocab.has(w) && !isMood(w) ? [...vocab].find((v) => v.length >= 6 && lev(w, v) === 1) ?? w : w)).join(" ");
}

/** Plain words → structured intent. Deterministic, so test mode works with no API key. */
export function parse(q: string): Intent {
  let t = " " + normalise(q.toLowerCase().replace(/[,.!?]/g, " ").replace(/\s+/g, " ").trim()) + " ";
  const it = emptyIntent(q);

  // Negations first, so "not spicy" never adds Spicy and "no onion" becomes a dislike.
  const negated = new Set<string>();
  t = t.replace(/\b(not|no|without|bina|less|kam|avoid|nothing)\s+(too\s+|very\s+)?([a-z]+)/g, (_m, _n, _t, w: string) => {
    if (/^spic|^teekh|^hot$|^mirch/.test(w)) it.maxSpice = 1;
    else if (/^heavy|^rich/.test(w)) { negated.add("rich"); it.avoid.push("heavy"); }
    else if (/^oil|^greasy/.test(w)) it.avoid.push("oily");
    else if (/^sweet|^meeth/.test(w)) negated.add("sweet");
    else if (/^cloud/.test(w)) it.realOnly = true;
    else if (/^pyaa?z|^onion/.test(w)) it.avoid.push("onion");
    else if (/^lahsun|^garlic/.test(w)) it.avoid.push("garlic");
    else { const ing = INGREDIENTS.find((i) => i.startsWith(w.replace(/s$/, ""))); if (ing) it.avoid.push(ing); }
    return " ";
  });

  for (const [m, syn] of Object.entries(MOODS)) if (!negated.has(m) && syn.some((s) => new RegExp(`\\b${s}\\b`).test(t))) it.moods.push(m);
  it.moods = [...new Set(it.moods)];

  const b = t.match(/(?:under|below|less than|within|upto|up to|max|<)\s*(?:rs\.?\s*|₹\s*|inr\s*)?(\d{2,5})(?!\s*km)/) || t.match(/₹\s*(\d{2,5})/) || t.match(/\b(\d{3})\s*(?:rs|rupees|bucks)\b/);
  if (b) it.budget = +b[1];
  if (!it.budget && /\b(cheap\w*|sasta|budget|affordable|kam paise)\b/.test(t)) it.budget = 250;
  if (/for (two|2)|for us|big portion|sharing|share|two of us/.test(t)) { it.forTwo = true; it.quantity = true; }
  if (/good restaurant|real restaurant|no cloud|not a cloud|dine[- ]?in|proper restaurant/.test(t)) { it.realOnly = true; it.quality = true; }
  if (/\b(quality|tasty|really good|best)\b/.test(t)) it.quality = true;
  if (/\b(big|filling|hungry|starving|bhook\w*|quantity|portion)\b/.test(t)) it.quantity = true;
  if (/\b(quick|fast|soon|jaldi|late night|30 ?min)\b/.test(t)) it.quick = true;
  if (/non[- ]?veg|\b(meat|mutton|fish)\b/.test(t)) it.nonveg = true;
  else if (/\bveg\b|vegetarian/.test(t)) it.veg = true;
  if (/\b(mild|not spicy)\b/.test(t)) { it.maxSpice = 1; it.moods = it.moods.filter((m) => m !== "spicy"); }
  if (/\b(surprise|anything|you pick|kuch bhi|dealer'?s choice|whatever)\b/.test(t)) it.surprise = true;
  const km = t.match(/(\d{1,2})\s*km/);
  if (km) it.maxKm = +km[1];
  else if (/\bcloser\b/.test(t)) it.maxKm = 3;

  // Dishes: specific words decide; generic words ("chicken", "masala") only narrow within them.
  const words = (d: (typeof DISHES)[number]) => d.kw.filter((k) => k.length > 3 && new RegExp(`\\b${k}\\b`).test(t));
  const specific = DISHES.filter((d) => words(d).some((k) => !GENERIC.has(k)));
  if (specific.length) {
    const narrowed = specific.filter((d) => words(d).length === Math.max(...specific.map((x) => words(x).length)));
    it.dishes = narrowed.map((d) => d.id);
  } else {
    const generic = DISHES.filter((d) => words(d).some((k) => ["chicken", "paneer", "mutton"].includes(k)));
    it.dishes = generic.map((d) => d.id);
  }
  // "healthy", "snack", "dessert" are moods, never a single-dish filter.

  it.unsure = !it.surprise && !it.moods.length && !it.dishes.length && !it.budget && !it.forTwo && !it.realOnly && !it.quick && !it.veg && !it.nonveg
    && !it.maxKm && !it.quantity && !it.quality && it.maxSpice == null && !it.avoid.length;
  return it;
}

/** Follow-ups refine the last search instead of starting over. Returns null when the text is a new search. */
export function refine(prev: Intent, text: string, prevPicks: string[], prevMaxPrice: number): Intent | null {
  const t = " " + text.toLowerCase().trim() + " ";
  const it: Intent = { ...prev, moods: [...prev.moods], dishes: [...prev.dishes], exclude: [...prev.exclude], avoid: [...prev.avoid], raw: prev.raw, unsure: false, surprise: false };
  let hit = false;
  if (/\b(cheaper|less expensive|sasta|sasti|cheap)\b/.test(t)) { it.budget = Math.max(80, Math.floor(((prev.budget ?? prevMaxPrice) * 0.75) / 10) * 10); hit = true; }
  if (/\b(for two|for 2|for us|bigger|more food)\b/.test(t)) { it.forTwo = true; it.quantity = true; hit = true; }
  if (/\b(lighter|halka)\b/.test(t)) { it.moods = it.moods.filter((m) => !["comfort", "rich", "sweet"].includes(m)); if (!it.moods.includes("light")) it.moods.push("light"); it.dishes = []; hit = true; }
  if (/\b(less spicy|not spicy|milder|kam teekha)\b/.test(t)) { it.maxSpice = 1; it.moods = it.moods.filter((m) => m !== "spicy"); hit = true; }
  if (/\bspicier\b/.test(t)) { if (!it.moods.includes("spicy")) it.moods.push("spicy"); it.maxSpice = null; hit = true; }
  if (/\b(closer|nearer|nearby)\b/.test(t)) { it.maxKm = 3; hit = true; }
  if (/^ ?veg( only| please)? ?$/.test(t)) { it.veg = true; it.dishes = it.dishes.filter((id) => DISHES.find((d) => d.id === id)?.diet === "veg"); hit = true; }
  if (/\bno cloud\b/.test(t)) { it.realOnly = true; hit = true; }
  if (/\b(something else|not these|other options|show others|aur dikhao)\b/.test(t)) { it.exclude = [...new Set([...it.exclude, ...prevPicks])]; hit = true; }
  if (!hit) return null;
  it.raw = `${prev.raw} · ${text}`;
  return it;
}

export function intentChips(it: Intent): { k: string; l: string }[] {
  const c: { k: string; l: string }[] = [];
  if (it.surprise) c.push({ k: "surprise", l: "Surprise me" });
  it.moods.forEach((m) => c.push({ k: "mood:" + m, l: MOOD_LABEL[m] }));
  if (it.dishes.length) {
    const names = it.dishes.map((id) => DISHES.find((d) => d.id === id)!);
    const common = names[0].kw.find((k) => !GENERIC.has(k) && names.every((n) => n.kw.includes(k))) ?? names[0].kw.find((k) => names.every((n) => n.kw.includes(k)));
    c.push({ k: "dishes", l: common ? common.charAt(0).toUpperCase() + common.slice(1) : `${names.length} dishes` });
  }
  if (it.budget) c.push({ k: "budget", l: `Under ₹${it.budget}` });
  if (it.forTwo) c.push({ k: "forTwo", l: "For two" });
  if (it.realOnly) c.push({ k: "realOnly", l: "No cloud kitchens" });
  if (it.quality && !it.realOnly) c.push({ k: "quality", l: "Quality first" });
  if (it.quick) c.push({ k: "quick", l: "Under 35 min" });
  if (it.veg) c.push({ k: "veg", l: "Veg" });
  if (it.nonveg) c.push({ k: "nonveg", l: "Non-veg" });
  if (it.maxSpice != null) c.push({ k: "maxSpice", l: "Mild" });
  if (it.maxKm) c.push({ k: "maxKm", l: `Within ${it.maxKm} km` });
  (it.avoid ?? []).forEach((a) => c.push({ k: "avoid:" + a, l: a === "oily" ? "Not oily" : a === "heavy" ? "Not heavy" : `No ${a}` }));
  if (it.exclude?.length) c.push({ k: "exclude", l: `Not the last ${it.exclude.length}` });
  return c;
}

export function removeChip(it: Intent, k: string): Intent {
  const n: Intent = { ...it, moods: [...it.moods], dishes: [...it.dishes], exclude: [...it.exclude], avoid: [...it.avoid] };
  if (k.startsWith("mood:")) n.moods = n.moods.filter((m) => m !== k.slice(5));
  else if (k.startsWith("avoid:")) n.avoid = n.avoid.filter((a) => a !== k.slice(6));
  else if (k === "dishes") n.dishes = [];
  else if (k === "budget") n.budget = null;
  else if (k === "maxSpice") n.maxSpice = null;
  else if (k === "maxKm") n.maxKm = null;
  else if (k === "exclude") n.exclude = [];
  else if (k === "realOnly") { n.realOnly = false; n.quality = false; }
  else (n as unknown as Record<string, boolean>)[k] = false;
  return n;
}
