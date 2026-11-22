import type { Dish, Restaurant, Rule, RuleKind, RuleAction } from "./types";
import { ALLERGENS, INGREDIENTS } from "./data";

export const ACTION_LABEL: Record<RuleAction, string> = { warn: "Warn me", lower: "Rank lower", hide: "Hide" };

export const RULE_KINDS: { kind: RuleKind; label: string; icon: string; hint: string }[] = [
  { kind: "ingredient", label: "An ingredient", icon: "Carrot", hint: "Onion, mushroom, coriander" },
  { kind: "diet", label: "Diet", icon: "Leaf", hint: "Veg, egg, Jain" },
  { kind: "allergen", label: "Allergy", icon: "ShieldAlert", hint: "Nuts, dairy, gluten" },
  { kind: "kitchen", label: "Cloud kitchens", icon: "Building2", hint: "Many brands, one address" },
  { kind: "spice", label: "Spice", icon: "Flame", hint: "Up to mild or medium" },
  { kind: "price", label: "Price", icon: "IndianRupee", hint: "Per dish" },
  { kind: "distance", label: "Distance", icon: "MapPin", hint: "Farther than" },
  { kind: "travel", label: "Food that goes soggy", icon: "Timer", hint: "Dosa, fries, toast on long rides" },
  { kind: "portion", label: "Portion", icon: "Users", hint: "Enough for two" },
  { kind: "oily", label: "Oily food", icon: "Droplet", hint: "Reviews say oily" },
];

const SPICE = ["no spice", "mild", "medium", "hot"];

export function ruleLabel(r: Pick<Rule, "kind" | "value" | "form">): string {
  switch (r.kind) {
    case "ingredient": return `${r.form === "raw" ? "Raw " : ""}${r.form === "raw" ? String(r.value) : cap(String(r.value))}`;
    case "diet": return r.value === "jain" ? "Jain: no onion, garlic or potato" : r.value === "veg" ? "Veg only" : "Veg and egg only";
    case "allergen": return `${cap(String(r.value))} allergy`;
    case "kitchen": return "Cloud kitchens";
    case "spice": return `Spicier than ${SPICE[Number(r.value)]}`;
    case "price": return `Over ₹${r.value}`;
    case "distance": return `Farther than ${r.value} km`;
    case "travel": return "Soggy on long rides";
    case "portion": return "Too small for two";
    case "oily": return "Called oily in reviews";
  }
}
/** One-line sentence form: "Raw onion → Warn me" */
export function ruleSentence(r: Rule) {
  return `${ruleLabel(r)}`;
}
export function ruleIcon(kind: RuleKind) {
  return RULE_KINDS.find((k) => k.kind === kind)!.icon;
}

const JAIN_OUT = ["onion", "garlic", "potato", "spring onion", "ginger", "mushroom", "carrot", "beetroot", "radish"];

export function ruleMatches(rule: Rule, d: Dish, r: Restaurant): boolean {
  switch (rule.kind) {
    case "ingredient": {
      const v = String(rule.value);
      return d.ing.some((i) => (i.name === v || i.name.includes(v)) && (rule.form !== "raw" || i.form === "raw"));
    }
    case "diet":
      if (rule.value === "veg") return d.diet !== "veg";
      if (rule.value === "egg") return d.diet === "nonveg";
      return d.diet !== "veg" || d.ing.some((i) => JAIN_OUT.includes(i.name));
    case "allergen": return d.allergens.includes(String(rule.value));
    case "kitchen": return r.type === "cloud";
    case "spice": return d.spice > Number(rule.value);
    case "price": return d.price > Number(rule.value);
    case "distance": return r.km > Number(rule.value);
    case "travel": return d.travels === "badly" && r.km > 4;
    case "portion": return d.serves < 2;
    case "oily": return d.q.some((q) => /oily|greasy/i.test(q.text));
  }
}

/** What the rule found, for the card flag: "Raw onion in 7 of 9 photos" */
export function ruleEvidence(rule: Rule, d: Dish, r: Restaurant): string {
  switch (rule.kind) {
    case "ingredient": {
      const v = String(rule.value);
      const i = d.ing.find((x) => (x.name === v || x.name.includes(v)) && (rule.form !== "raw" || x.form === "raw"))!;
      return i.seen[0] > 0 ? `${rule.form === "raw" ? "Raw " : cap(i.form) + " "}${i.name} in ${i.seen[0]} of ${i.seen[1]} photos` : `Has ${i.name}${i.note ? `, ${i.note}` : ""}`;
    }
    case "allergen": return `Contains ${rule.value}`;
    case "kitchen": return `Cloud kitchen, 1 of ${r.brands} brands`;
    case "spice": return `Spice: ${SPICE[d.spice]}`;
    case "price": return `₹${d.price}`;
    case "distance": return `${r.km} km away`;
    case "travel": return `Goes soggy over ${r.km} km`;
    case "portion": return "Serves one";
    case "diet": return d.diet === "veg" ? "Has onion or garlic" : d.diet === "egg" ? "Has egg" : "Non-veg";
    case "oily": return "Reviews say oily";
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

let n = 0;
export const newId = () => `r${Date.now().toString(36)}${(n++).toString(36)}`;

/**
 * Plain words to structured rules. "no onion or garlic", "nut allergy", "jain",
 * "nothing over ₹400", "within 5 km", "not too spicy", "no cloud kitchens".
 * Returns [] when it can't read the text, so the UI can say so.
 */
export function parseRuleText(text: string): Omit<Rule, "id" | "on" | "source">[] {
  const t = " " + text.toLowerCase().replace(/[,.;]/g, " ") + " ";
  const out: Omit<Rule, "id" | "on" | "source">[] = [];
  const action: RuleAction = /\b(warn|tell me|flag)\b/.test(t) ? "warn" : /\b(less|lower|fewer|prefer not)\b/.test(t) ? "lower" : "hide";

  if (/\bjain\b/.test(t)) out.push({ kind: "diet", value: "jain", action: "hide" });
  else if (/\b(eggetarian|veg (and|\+|&) egg)\b/.test(t)) out.push({ kind: "diet", value: "egg", action: "hide" });
  else if (/\b(veg only|vegetarian|pure veg|only veg)\b/.test(t)) out.push({ kind: "diet", value: "veg", action: "hide" });

  const ALLERGY_WORDS: Record<string, string> = { nuts: "nuts?|peanuts?|cashews?|almonds?|walnuts?", dairy: "dairy|milk|lactose", gluten: "gluten|wheat", egg: "eggs?", shellfish: "shellfish|prawns?|shrimps?" };
  const allergyContext = /allerg|intoleran|-free| free\b/.test(t);
  for (const a of ALLERGENS) {
    const w = ALLERGY_WORDS[a];
    const direct = new RegExp(`\\b(${w})\\b[^a-z]*(allerg\\w*|intoleran\\w*)|allergic to (\\w+ )?(${w})\\b|\\b(${w})[- ]free\\b`).test(t);
    const negated = a !== "egg" && new RegExp(`\\b(no|without|avoid)\\s+(${w})\\b`).test(t);
    if (direct || negated || (allergyContext && new RegExp(`\\b(${w})\\b`).test(t))) out.push({ kind: "allergen", value: a, action: "hide" });
  }
  if (/\boily|greasy/.test(t)) out.push({ kind: "oily", value: "oily", action: action === "hide" ? "lower" : action });
  if (/cloud kitchen/.test(t)) out.push({ kind: "kitchen", value: "cloud", action: /\bno\b|\bhide\b|\bnever\b/.test(t) && action === "hide" ? "hide" : action === "hide" ? "lower" : action });
  const price = t.match(/(?:over|above|more than|under|below|max|upto|up to)\s*(?:₹|rs\.?\s*)?(\d{2,5})/);
  if (price && !/km/.test(t.slice(t.indexOf(price[0]), t.indexOf(price[0]) + price[0].length + 4))) out.push({ kind: "price", value: +price[1], action });
  const km = t.match(/(\d{1,2})\s*km/);
  if (km) out.push({ kind: "distance", value: +km[1], action });
  if (/not too spicy|mild|no spice|less spicy/.test(t)) out.push({ kind: "spice", value: /no spice/.test(t) ? 0 : 1, action });
  else if (/medium spice|medium/.test(t) && /spic/.test(t)) out.push({ kind: "spice", value: 2, action });
  if (/soggy|goes soft|travel/.test(t)) out.push({ kind: "travel", value: "badly", action: "warn" });
  if (/for two|for 2|small portion|too small/.test(t)) out.push({ kind: "portion", value: 2, action: "lower" });

  if (!out.some((r) => r.kind === "diet" && r.value === "jain")) {
    for (const ing of INGREDIENTS) {
      const stem = ing.replace(/s$/, "");
      const re = new RegExp(`\\b(no|without|avoid|hate|skip|not|nothing with|less)\\b[^.]*?\\b(raw )?${stem}s?\\b`);
      const m = t.match(re);
      const isAllergen = out.some((r) => r.kind === "allergen") && /cashew|egg|cheese|paneer|cream/.test(stem) && allergyContext;
      if (m && !isAllergen && !out.some((r) => r.kind === "allergen" && stem.includes(String(r.value)))) {
        out.push({ kind: "ingredient", value: ing, form: m[2] || /\braw\b/.test(t) ? "raw" : "any", action });
      }
    }
  }
  return out;
}

export function ruleKey(r: Pick<Rule, "kind" | "value" | "form">) {
  return `${r.kind}:${r.value}:${r.form ?? ""}`;
}
