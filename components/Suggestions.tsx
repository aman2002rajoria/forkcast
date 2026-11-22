"use client";

import { useStore } from "@/lib/store";
import { newId } from "@/lib/rules";

export function Suggestions() {
  const { prefs, setPrefs, toast } = useStore();
  if (!prefs.pending.length) return null;
  const apply = (id: string) => setPrefs((p) => {
    const s = p.pending.find((x) => x.id === id);
    if (!s) return p;
    let next = { ...p, pending: p.pending.filter((x) => x.id !== id), learned: [{ id: s.id, text: s.text, why: s.why }, ...p.learned] };
    if (s.apply.type === "weights") {
      const w = { ...p.weights };
      for (const [k, v] of Object.entries(s.apply.delta)) w[k as keyof typeof w] = Math.min(2, Math.max(0, +(w[k as keyof typeof w] + (v ?? 0)).toFixed(1)));
      next = { ...next, weights: w };
    } else {
      const rule = s.apply.rule;
      next = { ...next, rules: [...p.rules.filter((r) => !(r.kind === rule.kind && String(r.value) === String(rule.value) && r.form === rule.form)), { ...rule, id: newId(), on: true, source: "learned" }] };
    }
    return next;
  });
  return (
    <section className="card">
      <div className="mb-3 flex items-center justify-between"><h2 className="h3">Suggested</h2><span className="badge accent">AI</span></div>
      <div className="grid gap-3">
        {prefs.pending.map((s) => (
          <div key={s.id} className="grid gap-2 rounded-m bg-accent-50 p-4">
            <div className="font-black" style={{ color: "var(--on-tint)" }}>{s.text}</div>
            <p className="text-[15px]" style={{ color: "var(--on-tint)" }}>{s.why}</p>
            <div className="mt-1 flex gap-2">
              <button className="btn sm" onClick={() => { apply(s.id); toast("Picks updated."); }}>Apply</button>
              <button className="btn ghost sm" onClick={() => setPrefs((p) => ({ ...p, pending: p.pending.filter((x) => x.id !== s.id) }))}>Not now</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
