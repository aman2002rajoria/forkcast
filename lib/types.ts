export type Aspect = "taste" | "quantity" | "quality" | "packaging" | "value";
export const ASPECTS: { key: Aspect; label: string }[] = [
  { key: "taste", label: "Taste" },
  { key: "quantity", label: "Quantity" },
  { key: "quality", label: "Quality" },
  { key: "packaging", label: "Packaging" },
  { key: "value", label: "Value" },
];

export type KitchenType = "dinein" | "cloud";

export interface Restaurant {
  id: string;
  name: string;
  area: string;
  km: number;
  eta: number;
  type: KitchenType;
  /** brands that share this kitchen's address on Swiggy */
  brands?: number;
  kitchenId?: string;
  /** Google Maps rating and count, when there is a dine-in listing */
  g?: number;
  gN?: number;
  /** Swiggy restaurant rating and count label */
  sw: number;
  swN: string;
  addr: string;
  since?: number;
}

export type IngredientForm = "raw" | "cooked" | "fried" | "side";
export interface Ingredient {
  name: string;
  form: IngredientForm;
  /** [photos it was seen in, delivered photos checked] */
  seen: [number, number];
  note?: string;
}

export interface Quote {
  aspect: Aspect;
  text: string;
  hl: string;
  source: string;
  date: string;
  channel: "delivery" | "dine-in";
}

export type Art = "pieces" | "gravy" | "gravy2" | "rice" | "dosa" | "toast" | "momos" | "jamun" | "salad" | "noodles" | "curry";

export interface Dish {
  id: string;
  name: string;
  r: string;
  price: number;
  /** dine-in menu price, read from menu photos; null when there is no dine-in menu */
  dine: number | null;
  diet: "veg" | "egg" | "nonveg";
  spice: 0 | 1 | 2 | 3;
  moods: string[];
  kw: string[];
  s: Record<Aspect, number>;
  /** reviews that mention this dish */
  rev: number;
  /** customer photos matched to this dish, of which `del` are delivered */
  ph: number;
  del: number;
  portion: string;
  portionSub: string;
  serves: 1 | 2;
  conf?: "low";
  art: Art;
  ing: Ingredient[];
  allergens: string[];
  travels: "well" | "ok" | "badly";
  listing: { kind: "own" | "stock"; reuse?: number };
  take: string;
  why: string[];
  q: Quote[];
  cap: string;
  capHl: string;
}

export type RuleKind = "ingredient" | "diet" | "allergen" | "kitchen" | "distance" | "price" | "spice" | "portion" | "travel" | "oily";
export type RuleAction = "warn" | "lower" | "hide";
export interface Rule {
  id: string;
  kind: RuleKind;
  /** ingredient name, diet, allergen, km, ₹, spice level, etc. */
  value: string | number;
  /** ingredient rules only */
  form?: "raw" | "any";
  action: RuleAction;
  on: boolean;
  source: "you" | "learned";
}

export interface Weights extends Record<Aspect, number> {}

export interface Prefs {
  weights: Weights;
  party: 1 | 2;
  rules: Rule[];
  pending: Suggestion[];
  learned: { id: string; text: string; why: string }[];
  /** dishes you marked worse than shown, or "not for me": ranked lower */
  avoidDishes: string[];
}

export interface Suggestion {
  id: string;
  text: string;
  why: string;
  apply: { type: "weights"; delta: Partial<Record<Aspect, number>> } | { type: "rule"; rule: Omit<Rule, "id" | "on" | "source"> };
}

export interface Intent {
  raw: string;
  moods: string[];
  dishes: string[];
  budget: number | null;
  forTwo: boolean;
  realOnly: boolean;
  quality: boolean;
  quantity: boolean;
  quick: boolean;
  veg: boolean;
  nonveg: boolean;
  /** soft dislikes from the message: ingredients ("onion") or "oily" */
  avoid: string[];
  surprise: boolean;
  maxSpice: number | null;
  maxKm: number | null;
  exclude: string[];
  /** true when the parser found nothing it understood */
  unsure?: boolean;
}

export interface Pick {
  id: string;
  score: number;
  flags: Flag[];
}
export interface Flag {
  tone: "warn" | "bad" | "ok";
  icon: string;
  text: string;
}
export interface Hidden {
  id: string;
  why: string;
}

export interface CopilotResponse {
  intent: Intent;
  reply: string;
  picks: Pick[];
  more: Pick[];
  hidden: Hidden[];
  followups: string[];
  /** the aspect the reply talks about; the one orange bar on each card */
  focus: Aspect | null;
  scanned: { dishes: number; places: number; reviews: number; photos: number };
}

export interface Order {
  id: string;
  dish: string;
  date: string;
  total: number;
  status: "needs" | "rated";
  verdict?: "better" | "same" | "worse";
  match?: "yes" | "mostly" | "no";
}
