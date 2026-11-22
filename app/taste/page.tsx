"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DISH, R } from "@/lib/data";
import { emptyIntent } from "@/lib/intent";
import { copilot } from "@/lib/rank";
import { ACTION_LABEL, parseRuleText, ruleKey, ruleLabel } from "@/lib/rules";
import { useStore } from "@/lib/store";
import { ASPECTS, type Rule, type RuleAction } from "@/lib/types";
import { cx } from "@/lib/format";
import { Photo } from "@/components/Photo";
import { RuleBuilder, RuleIcon, impact } from "@/components/RuleBuilder";
import { Suggestions } from "@/components/Suggestions";

const TEMPLATES = ["Jain", "Nut allergy", "Veg only", "No mushroom", "Nothing over ₹300", "Within 5 km", "Not too spicy", "No cloud kitchens"];

export default function Taste() {
  const { prefs, setPrefs, addRules, toast, ready } = useStore();
  const [text, setText] = useState("");
  const [builder, setBuilder] = useState(false);
  const parsed = useMemo(() => (text.trim().length > 2 ? parseRuleText(text) : []), [text]);
  const top = useMemo(() => copilot(emptyIntent(), prefs).picks, [prefs]);
  if (!ready) return <div className="wrap pt-8"><div className="skel h-64 rounded-l" /></div>;

  const update = (id: string, p: Partial<Rule>) => setPrefs((s) => ({ ...s, rules: s.rules.map((r) => (r.id === id ? { ...r, ...p } : r)) }));
  const add = (rules: Omit<Rule, "id" | "on" | "source">[]) => {
    const have = new Set(prefs.rules.map(ruleKey));
    const fresh = rules.filter((r) => !have.has(ruleKey(r)));
    if (!fresh.length) { toast("You already have that rule."); return; }
    addRules(fresh);
    toast(fresh.length === 1 ? "Rule added." : `${fresh.length} rules added.`);
  };
  const total = ASPECTS.reduce((a, { key }) => a + prefs.weights[key], 0) || 1;

  return (
    <div className="wrap pt-6">
      <h1 className="h1">My taste</h1>
      <p className="mt-1 text-muted">Rules go first. The sliders set what matters most.</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <Suggestions />
          <section className="card">
            <div className="mb-2 flex items-center justify-between"><h2 className="h3">Rules</h2><span className="num text-sm font-semibold text-muted">{prefs.rules.filter((r) => r.on).length} on</span></div>
            <ul className="grid">
              {prefs.rules.length === 0 && <li className="py-6 text-center text-muted">No rules yet. Type one below.</li>}
              {prefs.rules.map((r) => (
                <li key={r.id} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b border-line py-3 last:border-0">
                  <span className={cx("grid h-9 w-9 place-items-center rounded-full bg-surface", r.on ? "text-ink-2" : "text-faint")}><RuleIcon kind={r.kind} /></span>
                  <div className="min-w-0">
                    <div className={cx("font-extrabold", !r.on && "text-muted")}>{ruleLabel(r)}</div>
                    {r.source === "learned" && <div className="text-[13px] font-medium text-muted">Learned · {prefs.learned.find((l) => l.text.toLowerCase().includes(ruleLabel(r).toLowerCase().split(" ")[0]))?.why ?? "from your orders"}</div>}
                    {r.kind === "allergen" && <div className="text-[13px] font-medium text-muted">Always hides. Ask the kitchen before you order.</div>}
                  </div>
                  <button className="btn ghost icon" aria-label={`Delete ${ruleLabel(r)}`} onClick={() => setPrefs((s) => ({ ...s, rules: s.rules.filter((x) => x.id !== r.id) }))}><Trash2 size={16} /></button>
                  <div className="seg sm col-start-2 col-end-4 w-fit max-w-full overflow-x-auto" role="group" aria-label={`${ruleLabel(r)}: what to do`}>
                    <button className="whitespace-nowrap" aria-pressed={!r.on} onClick={() => update(r.id, { on: false })}>Off</button>
                    {(["warn", "lower", "hide"] as RuleAction[]).filter((a) => r.kind !== "allergen" || a === "hide").map((a) => (
                      <button key={a} className="whitespace-nowrap" aria-pressed={r.on && r.action === a} onClick={() => update(r.id, { on: true, action: a })}>{ACTION_LABEL[a]}</button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <form className="mt-4" onSubmit={(e) => { e.preventDefault(); if (parsed.length) { add(parsed); setText(""); } else toast("Couldn't read that. Try “no mushrooms” or “nut allergy”."); }}>
              <label htmlFor="rule-text" className="eyebrow mb-2 block">Type a rule</label>
              <div className="flex gap-2">
                <input id="rule-text" className="input sm" placeholder="e.g. no onion or garlic, nut allergy" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
                <button className="btn sm" type="submit" disabled={!parsed.length}>Add</button>
              </div>
              {text.trim().length > 2 && (
                <div className="mt-3 flex flex-wrap items-center gap-2" aria-live="polite">
                  {parsed.length ? (
                    <>
                      <span className="text-xs font-semibold text-muted">Reads as</span>
                      {parsed.map((r) => <span key={ruleKey(r)} className="chip sm accent">{ruleLabel(r)} · {ACTION_LABEL[r.action].toLowerCase()}</span>)}
                      <span className="num text-xs font-semibold text-muted">· {impact(parsed)}</span>
                    </>
                  ) : <span className="text-sm text-muted">Not sure what that means yet.</span>}
                </div>
              )}
            </form>
            <button className="link mt-2 text-sm" onClick={() => setBuilder(true)}><Plus />Or build one step by step</button>
            <div className="mt-5"><div className="eyebrow mb-2">Popular</div>
              <div className="flex flex-wrap gap-2">{TEMPLATES.map((t) => <button key={t} className="chip" onClick={() => add(parseRuleText(t))}><Plus />{t}</button>)}</div>
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <section className="card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="h3">What counts</h2>
              <div className="seg sm" role="group" aria-label="Who's eating">
                <button aria-pressed={prefs.party === 1} onClick={() => setPrefs((p) => ({ ...p, party: 1 }))}>For one</button>
                <button aria-pressed={prefs.party === 2} onClick={() => setPrefs((p) => ({ ...p, party: 2 }))}>For two</button>
              </div>
            </div>
            {ASPECTS.map(({ key, label }) => (
              <div key={key} className="grid grid-cols-[100px_minmax(0,1fr)_44px] items-center gap-3 py-2">
                <label htmlFor={`w-${key}`} className="text-[15px] font-semibold">{label}</label>
                <input id={`w-${key}`} type="range" min={0} max={2} step={0.1} value={prefs.weights[key]} style={{ ["--p" as string]: `${(prefs.weights[key] / 2) * 100}%` }}
                  onChange={(e) => setPrefs((p) => ({ ...p, weights: { ...p.weights, [key]: +e.target.value } }))} />
                <span className="num text-right text-sm font-semibold text-muted">{Math.round((prefs.weights[key] / total) * 100)}%</span>
              </div>
            ))}
            {prefs.party === 2 && <p className="mt-2 text-sm text-muted">For two: quantity counts almost double.</p>}
          </section>

          <section className="card">
            <h2 className="h3 mb-3">Your top 3 right now</h2>
            <ol className="grid gap-2">
              {top.map((p, i) => {
                const d = DISH[p.id];
                return (
                  <li key={p.id} className="enter" style={{ animationDelay: `${i * 60}ms` }}>
                    <Link href={`/dish/${d.id}`} className="flex items-center gap-3 rounded-m p-2 transition hover:bg-surface">
                      <span className="num w-5 text-center font-black text-muted">{i + 1}</span>
                      <Photo dish={d} kind="delivered" className="h-12 w-12 flex-none" radius={12} />
                      <div className="min-w-0 flex-1"><div className="truncate font-extrabold">{d.name}</div><div className="truncate text-sm text-muted">{R[d.r].name}</div></div>
                      <span className="num text-lg font-black">{p.score.toFixed(1)}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
            <p className="mt-2 text-xs text-faint">Re-sorts as you change rules and balance.</p>
          </section>

        </div>
      </div>
      <RuleBuilder open={builder} onClose={() => setBuilder(false)} onAdd={(r) => add([r])} />
    </div>
  );
}
