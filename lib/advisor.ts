import type { Prefs, Rule } from "./types";
import type { MenuItem } from "./menus";
import type { RestaurantDetail } from "./catalog";
import { itemScore } from "./catalog";
import { DISH, R } from "./data";
import { MOOD_LABEL, parse } from "./intent";
import { effectiveWeights } from "./rank";
import { ruleLabel, ruleMatches } from "./rules";

/**
 * The side-panel copilot on a restaurant page: picks from one menu.
 * Fully scored dishes rank on Forkcast scores; everything else on Swiggy's dish rating,
 * shrunk towards 3.9 when few people rated it, so 4.8 from 12 votes doesn't beat 4.5 from 4,000.
 */
export interface AdvicePick { item: MenuItem; score: number; scored: boolean; why: string; flags: string[] }
export interface Advice { reply: string; picks: AdvicePick[]; hidden: { item: MenuItem; why: string }[]; followups: string[] }

const MOOD_RE: Record<string, RegExp> = {
  spicy: /chilli|chili|pepper|ghee roast|65|schezwan|mirchi|kolhapuri|chettinad|fry|dragon|hot and sour/i,
  light: /salad|soup|idli|bowl|dosa|tikka|steamed|grilled|hummus|neer|kebab/i,
  comfort: /biryani|curry|dal|khichdi|rice|bath|masala|makhani|meals|pulao|noodles|thukpa|mudde/i,
  sweet: /jamun|halwa|payasam|phirni|kesari|kheer|ice cream|brownie|lassi/i,
  cheesy: /cheese|pizza/i,
  crispy: /fry|crispy|dosa|pakoda|65|rava|vada|toast/i,
  smoky: /tandoor|tikka|kebab|kabab|grill|seekh|boti|chops/i,
  rich: /butter|cream|makhani|korma|lababdar|malai|ghee/i,
  fresh: /salad|juice|bowl|raita/i,
  savory: /./,
};
const SKIP_CATEGORIES = /beverage|drink|bread|roti|sides?$|extras|add[- ]?ons/i;
const DESSERT = /dessert|sweet/i;
const ALLERGEN_RE: Record<string, RegExp> = {
  nuts: /cashew|kaju|badam|almond|nut|peanut|pista/i,
  dairy: /paneer|butter|cream|cheese|lassi|malai|ghee|makhani|kulfi|payasam|phirni|raita|curd|dahi|maska|chai|coffee/i,
  gluten: /naan|roti|kulcha|bread|pav|pasta|noodle|bhature|sandwich|toast|momo|bun|rava/i,
  egg: /egg|omelette|mayo|caesar/i,
  shellfish: /prawn|crab|shrimp|lobster/i,
};
const JAIN_RE = /onion|garlic|aloo|potato|masala dosa|ginger|mushroom|egg|chicken|mutton|fish|prawn/i;

function matchesRule(rule: Rule, it: MenuItem, rest: RestaurantDetail): boolean {
  if (it.dishId && DISH[it.dishId] && R[DISH[it.dishId].r]) return ruleMatches(rule, DISH[it.dishId], R[DISH[it.dishId].r]);
  const name = `${it.name} ${it.description ?? ""}`;
  switch (rule.kind) {
    case "diet": return rule.value === "veg" ? !it.veg : rule.value === "egg" ? !it.veg && !/egg/i.test(name) : !it.veg || JAIN_RE.test(name);
    case "allergen": return (ALLERGEN_RE[String(rule.value)] ?? /$^/).test(name);
    case "ingredient": return new RegExp(`\\b${String(rule.value)}`, "i").test(name);
    case "price": return it.price > Number(rule.value);
    case "spice": return Number(rule.value) < 2 && MOOD_RE.spicy.test(name);
    case "kitchen": return rest.type === "cloud";
    case "distance": return rest.km > Number(rule.value);
    default: return false;
  }
}

const shrunk = (it: MenuItem) => (it.rating ? ((it.rating * (it.votes ?? 0)) + 3.9 * 100) / ((it.votes ?? 0) + 100) : 3.6);

export function advise(rest: RestaurantDetail, text: string, prefs: Prefs): Advice {
  const it = parse(text || "what's good here");
  const w = effectiveWeights(prefs, it);
  const forTwo = it.forTwo || prefs.party === 2;
  const askedSides = /drink|coffee|chai|beverage|bread|naan|roti|side/i.test(text);
  const hidden: Advice["hidden"] = [];
  const cands: AdvicePick[] = [];

  for (const item of rest.menu) {
    const dish = item.dishId ? DISH[item.dishId] : undefined;
    const label = `${item.name} ${item.category}`;
    if (!askedSides && SKIP_CATEGORIES.test(item.category)) continue;
    const isDessert = DESSERT.test(item.category) || MOOD_RE.sweet.test(item.name);
    if (isDessert && !it.moods.includes("sweet")) continue;
    if (it.veg && !item.veg) continue;
    if (it.nonveg && item.veg) continue;
    if (it.budget && item.price > it.budget) continue;
    if (it.maxSpice != null && (dish ? dish.spice > it.maxSpice : MOOD_RE.spicy.test(label))) continue;
    if (it.moods.length && !it.moods.every((m) => (dish ? dish.moods.includes(m) : MOOD_RE[m]?.test(label)))) continue;

    const flags: string[] = [];
    let hideWhy: string | null = null;
    let score = itemScore(item, w);
    const scored = score != null;
    score ??= shrunk(item) - 0.15;
    for (const rule of prefs.rules) {
      if (!rule.on || rule.kind === "kitchen" || !matchesRule(rule, item, rest)) continue;
      if (rule.action === "hide" || rule.kind === "allergen" || rule.kind === "diet") { hideWhy = ruleLabel(rule); break; }
      if (rule.action === "lower") score -= 0.35;
      flags.push(ruleLabel(rule));
    }
    if (hideWhy) { hidden.push({ item, why: hideWhy }); continue; }
    if (prefs.rules.some((r) => r.on && r.kind === "allergen") && !dish) flags.push("Ingredients unknown, ask the kitchen");
    for (const a of it.avoid) if (new RegExp(a, "i").test(label)) { score -= 0.3; flags.push(`Has ${a}`); }
    if (forTwo) score += /full|family|combo|meals|platter|biryani|bucket/i.test(item.name) ? 0.2 : item.price < 150 ? -0.25 : 0;
    if (item.bestseller) score += 0.05;
    const why = dish
      ? dish.why[0]
      : item.scores
        ? `${item.mentions ?? "Several"} reviews mention it.`
        : item.rating
          ? `${item.bestseller ? "Bestseller. " : ""}${item.rating} from ${(item.votes ?? 0).toLocaleString("en-IN")} ratings on Swiggy.`
          : "No ratings yet.";
    cands.push({ item, score, scored, why, flags });
  }

  cands.sort((a, b) => b.score - a.score);
  const picks = cands.slice(0, 3);
  const mood = it.moods.filter((m) => m !== "savory").map((m) => MOOD_LABEL[m].toLowerCase()).join(", ");
  let reply: string;
  if (!picks.length) {
    reply = hidden.length
      ? `Nothing here fits that and your rules. ${hidden.length} ${hidden.length === 1 ? "dish is" : "dishes are"} hidden: ${[...new Set(hidden.map((h) => h.why))].slice(0, 2).join(", ")}.`
      : `Nothing on ${rest.name}'s menu fits that. Try asking across all restaurants.`;
  } else {
    const top = picks[0].item.name;
    const lead = text.trim() ? `${picks.length === 1 ? "One fits" : `${picks.length} fit`}${mood ? ` for ${mood}` : ""}${it.budget ? ` under ₹${it.budget}` : ""}.` : `${picks.length} worth ordering here.`;
    reply = `${lead} Start with the ${top.toLowerCase()}.`;
    if (!picks.some((p) => p.scored)) reply += " These use Swiggy ratings only.";
  }
  const followups = ["What's good here?", "Veg and filling", "Something light", forTwo ? "Under ₹300" : "For two", "Spicy"].filter((f) => f.toLowerCase() !== text.trim().toLowerCase());
  return { reply, picks, hidden, followups };
}
