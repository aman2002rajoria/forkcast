import type { Aspect, CopilotResponse, Dish, Flag, Hidden, Intent, Pick, Prefs, Weights } from "./types";
import { ASPECTS } from "./types";
import { DISHES, R } from "./data";
import { ruleEvidence, ruleLabel, ruleMatches } from "./rules";
import { intentChips, removeChip, MOOD_LABEL } from "./intent";

export function dishScore(d: Dish, w: Weights) {
  let s = 0, t = 0;
  for (const { key } of ASPECTS) { s += w[key] * d.s[key]; t += w[key]; }
  return t ? s / t : 0;
}

/** Weights after the party size: for two, quantity counts almost double. */
export function effectiveWeights(prefs: Prefs, it?: Partial<Intent>): Weights {
  const w: Weights = { ...prefs.weights };
  if (it?.quality) { w.quality *= 1.4; w.taste *= 1.15; }
  if (it?.quantity || it?.forTwo || prefs.party === 2) w.quantity *= 1.9;
  return w;
}

const oily = (d: Dish) => d.q.some((q) => /oily|greasy/i.test(q.text));
type Cand = { d: Dish; score: number; flags: Flag[] };

function evaluate(it: Intent, prefs: Prefs) {
  const w = effectiveWeights(prefs, it);
  const forTwo = it.forTwo || prefs.party === 2;
  const shown: Cand[] = [];
  const hidden: Hidden[] = [];

  for (const d of DISHES) {
    const r = R[d.r];
    if (it.exclude.includes(d.id)) continue;
    // "Spicy" also accepts medium-spice dishes, so "spicy biryani" still finds biryani.
    if (it.moods.length && !it.moods.every((m) => d.moods.includes(m) || (m === "spicy" && d.spice >= 2))) continue;
    if (it.dishes.length && !it.dishes.includes(d.id)) continue;
    // Desserts only when asked for: "dinner for two" should never return gulab jamun.
    if (d.moods.includes("sweet") && !it.moods.includes("sweet") && !it.dishes.includes(d.id)) continue;
    if (it.budget && d.price > it.budget) continue;
    if (it.veg && d.diet !== "veg") continue;
    if (it.nonveg && d.diet === "veg") continue;
    if (it.quick && r.eta > 35) continue;
    if (it.maxKm && r.km > it.maxKm) continue;
    if (it.maxSpice != null && d.spice > it.maxSpice) continue;
    if (it.realOnly && r.type === "cloud") { hidden.push({ id: d.id, why: "Cloud kitchen" }); continue; }

    let score = dishScore(d, w);
    const flags: Flag[] = [];
    let hide: string | null = null;
    for (const rule of prefs.rules) {
      if (!rule.on || !ruleMatches(rule, d, r)) continue;
      // Allergy rules always hide, whatever action is set.
      if (rule.action === "hide" || rule.kind === "allergen") { hide = rule.kind === "allergen" || rule.kind === "diet" ? ruleLabel(rule) : ruleEvidence(rule, d, r); break; }
      if (rule.action === "lower") score -= 0.35;
      if (rule.kind !== "kitchen") flags.push({ tone: "warn", icon: rule.kind === "ingredient" ? "Eye" : "TriangleAlert", text: ruleEvidence(rule, d, r) });
    }
    if (hide) { hidden.push({ id: d.id, why: hide }); continue; }
    if (it.moods.includes("spicy")) score += (d.spice - 2) * 0.15;
    if (it.avoid.includes("heavy") && (d.moods.includes("rich") || d.serves === 2)) score -= 0.3;
    for (const a of it.avoid.filter((x) => x !== "heavy")) {
      if (a === "oily" ? oily(d) : d.ing.some((i) => i.name.includes(a))) {
        score -= 0.3;
        flags.push({ tone: "warn", icon: a === "oily" ? "TriangleAlert" : "Eye", text: a === "oily" ? "Reviews say oily" : `Has ${a}` });
      }
    }
    // Arrival time and travel matter even without a rule: a soggy dosa is the regret Forkcast exists to prevent.
    score -= Math.max(0, r.eta - 35) * 0.01;
    if (d.travels === "badly" && r.km > 4) { score -= 0.3; if (!flags.some((f) => f.icon === "Timer")) flags.push({ tone: "warn", icon: "Timer", text: `May arrive soft, ${r.km} km` }); }
    if (prefs.avoidDishes.includes(d.id)) { score -= 0.4; flags.push({ tone: "warn", icon: "TriangleAlert", text: "You rated it worse" }); }
    if (d.conf === "low") { score -= 0.08; flags.push({ tone: "warn", icon: "CircleHelp", text: `Only ${d.ph} photos` }); }
    if (forTwo && d.serves < 2) score -= 0.6;
    shown.push({ d, score, flags });
  }
  shown.sort((a, b) => b.score - a.score);
  return { shown, hidden };
}

function surprise(prefs: Prefs, it: Intent): Cand[] {
  const { shown } = evaluate({ ...it, surprise: false }, prefs);
  const out: Cand[] = [];
  for (const c of shown) if (!out.some((o) => o.d.art === c.d.art || o.d.r === c.d.r)) out.push(c);
  // Rotate by the minute so "surprise me" twice gives something else.
  const k = new Date().getMinutes() % Math.max(1, out.length - 2);
  return [...out.slice(k), ...out.slice(0, k)].slice(0, 3);
}

export function copilot(it: Intent, prefs: Prefs): CopilotResponse {
  const { shown: all, hidden } = evaluate(it, prefs);
  const shown = it.surprise ? surprise(prefs, it) : all;
  const toPick = (c: Cand): Pick => ({ id: c.d.id, score: +c.score.toFixed(1), flags: c.flags });
  const picks = shown.slice(0, 3).map(toPick);
  const more = it.surprise ? [] : shown.slice(3, 5).map(toPick);
  const scanned = { dishes: DISHES.length, places: Object.keys(R).length, reviews: DISHES.reduce((a, d) => a + d.rev, 0), photos: DISHES.reduce((a, d) => a + d.ph, 0) };
  const chips = intentChips(it);
  let reply: string;
  let focus: Aspect | null = null;
  let followups = ["Cheaper", "Lighter", "No cloud kitchens", "Something else"];

  if (!picks.length) {
    // Find the condition whose removal actually brings results back.
    // Prefer loosening a constraint (distance, budget, time) over dropping what the user asked for (a dish or mood).
    const core = (k: string) => k === "dishes" || k.startsWith("mood:");
    const relax = chips.map((c) => ({ c, n: evaluate(removeChip(it, c.k), prefs).shown.length })).filter((x) => x.n > 0).sort((a, b) => Number(core(a.c.k)) - Number(core(b.c.k)) || b.n - a.n)[0];
    if (hidden.length && !relax) {
      const why = [...new Set(hidden.map((h) => h.why))].slice(0, 2).join(" and ");
      reply = `${hidden.length} ${hidden.length === 1 ? "dish matches" : "dishes match"}, but your rules hide ${hidden.length === 1 ? "it" : "them"}: ${why}.`;
      followups = ["Start over"];
    } else if (relax) {
      reply = hidden.length
        ? `Nothing fits all of that, and your rules hide ${hidden.length}. Without “${relax.c.l}” there ${relax.n === 1 ? "is 1" : `are ${relax.n}`}.`
        : `Nothing fits all of that. Without “${relax.c.l}” there ${relax.n === 1 ? "is 1" : `are ${relax.n}`}.`;
      followups = [`Drop “${relax.c.l}”`, "Start over"];
    } else {
      reply = "Nothing near you fits that yet.";
      followups = ["Start over"];
    }
  } else if (it.surprise) {
    reply = `A surprise, inside your rules: ${picks.length} picks from ${picks.length} different kitchens.`;
    followups = ["Something else", "Cheaper", "Lighter"];
  } else if (it.unsure) {
    reply = `Not sure what “${it.raw}” means. Here are the top ${picks.length} near you.`;
    followups = ["Savory", "Spicy", "Light", "Surprise me"];
  } else {
    const ds = picks.map((p) => DISHES.find((d) => d.id === p.id)!);
    const forTwo = it.forTwo || prefs.party === 2;
    focus = forTwo || it.quantity ? "quantity" : it.budget && it.budget <= 300 ? "value" : it.quality ? "quality" : "taste";
    const label = { quantity: "most food", value: "best value", quality: "best cooking", taste: "best taste", packaging: "best packed" }[focus];
    const best = ds.reduce((a, b) => (b.s[focus!] > a.s[focus!] ? b : a));
    const what = it.moods.length ? it.moods.map((m) => MOOD_LABEL[m].toLowerCase()).join(", ") + " " : "";
    const n = picks.length;
    reply = n === 1
      ? `One match: ${ds[0].name.toLowerCase()}.`
      : `${n} ${what}picks${it.budget ? ` under ₹${it.budget}` : ""}. Top pick: ${ds[0].name.toLowerCase()}.`;
    if (n > 1 && best.id !== ds[0].id) reply += ` For the ${label}: ${best.name.toLowerCase()}.`;
    reply = reply.charAt(0).toUpperCase() + reply.slice(1);
    if (it.realOnly) followups = followups.filter((f) => f !== "No cloud kitchens");
    if (!it.forTwo && prefs.party === 1) followups.splice(1, 0, "For two");
    if (!it.veg && ds.some((d) => d.diet !== "veg")) followups.splice(3, 0, "Veg only");
    followups = followups.slice(0, 5);
  }
  return { intent: it, reply, picks, more, hidden, followups, focus, scanned };
}

/** "Order again, but better": same kind of dish, rated higher for you, from another kitchen, inside your rules. */
export function betterThan(id: string, prefs: Prefs) {
  const d = DISHES.find((x) => x.id === id)!;
  const w = effectiveWeights(prefs);
  const specific = d.kw.filter((k) => !["chicken", "paneer", "masala", "butter", "rice", "curry"].includes(k) && k.length > 3);
  const mine = dishScore(d, w);
  return DISHES.filter((x) => x.id !== id && x.r !== d.r && x.kw.some((k) => specific.includes(k)))
    .filter((x) => !prefs.rules.some((r) => r.on && (r.action === "hide" || r.kind === "allergen") && ruleMatches(r, x, R[x.r])))
    .map((x) => ({ d: x, score: dishScore(x, w) - Math.max(0, R[x.r].eta - 35) * 0.01 }))
    .filter((x) => x.score > mine + 0.15)
    .sort((a, b) => b.score - a.score)[0];
}

/** The aspect the user weights most; the dish page highlights it. */
export function topAspect(w: Weights): Aspect {
  return ASPECTS.reduce((a, b) => (w[b.key] > w[a.key] ? b : a)).key;
}
