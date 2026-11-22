"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Camera, Equal, ThumbsDown, ThumbsUp } from "lucide-react";
import { DISH, R } from "@/lib/data";
import { inr, cx } from "@/lib/format";
import { betterThan, dishScore } from "@/lib/rank";
import { ruleKey } from "@/lib/rules";
import { useStore } from "@/lib/store";
import type { Order, Prefs, Rule, Suggestion } from "@/lib/types";
import { Photo } from "@/components/Photo";
import { Suggestions } from "@/components/Suggestions";

const TAGS = ["Too oily", "Cold on arrival", "Raw onion", "Smaller than shown", "Bland", "Too spicy", "Leaked", "Arrived soggy"];
const ASPECTS4 = [["taste", "Taste"], ["quantity", "Quantity"], ["quality", "Quality"], ["packaging", "Packaging"]] as const;
type V = "worse" | "same" | "better";
const VERDICT: { v: V; l: string; I: typeof ThumbsUp }[] = [{ v: "worse", l: "Worse", I: ThumbsDown }, { v: "same", l: "As shown", I: Equal }, { v: "better", l: "Better", I: ThumbsUp }];

export default function Orders() {
  const { orders, ready } = useStore();
  const [sel, setSel] = useState<string>("o1");
  const [fresh, setFresh] = useState<string | null>(null);
  if (!ready) return <div className="wrap pt-8"><div className="skel h-64 rounded-l" /></div>;
  const o = orders.find((x) => x.id === sel) ?? orders[0];
  return (
    <div className="wrap pt-6">
      <h1 className="h1">Orders</h1>
      <p className="mt-1 text-muted">Better or worse than Forkcast showed? {orders.filter((x) => x.status === "needs").length ? `${orders.filter((x) => x.status === "needs").length} to rate.` : ""}</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <section className="card compact h-fit lg:col-span-4" aria-label="Recent orders">
          <ul className="grid gap-1">
            {orders.map((x) => {
              const d = DISH[x.dish];
              return (
                <li key={x.id}>
                  <button onClick={() => { setSel(x.id); setFresh(null); }} aria-current={x.id === o.id} className={cx("flex w-full items-center gap-3 rounded-m p-3 text-left transition", x.id === o.id ? "bg-surface" : "hover:bg-surface")}>
                    <Photo dish={d} i={3} kind="delivered" className="h-12 w-12 flex-none" radius={12} />
                    <div className="min-w-0 flex-1"><div className="truncate font-black">{d.name}</div><div className="truncate text-sm font-medium text-muted">{R[d.r].name} · {x.date}</div></div>
                    {x.status === "needs" ? <span className="chip warn sm">Rate it</span> : <span className="chip sm">{x.verdict === "better" ? "Better" : x.verdict === "worse" ? "Worse" : "As shown"}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="lg:col-span-8">{o.status === "needs" ? <RateForm o={o} onSaved={() => setFresh(o.id)} /> : <Rated o={o} fresh={fresh === o.id} />}</section>
      </div>
    </div>
  );
}

function learn(prefs: Prefs, o: Order, fb: { verdict?: V; aspects?: Record<string, V>; tags?: string[] }): Suggestion[] {
  const d = DISH[o.dish], r = R[d.r], tags = fb.tags ?? [], out: Suggestion[] = [];
  const have = new Set(prefs.rules.map(ruleKey));
  const pendingWeights = prefs.pending.some((p) => p.apply.type === "weights");
  const add = (s: Suggestion) => { if (s.apply.type === "rule" && have.has(ruleKey(s.apply.rule))) return; if (s.apply.type === "weights" && pendingWeights) return; if (!out.some((x) => x.text === s.text)) out.push(s); };
  const rule = (id: string, text: string, why: string, rule: Omit<Rule, "id" | "on" | "source">) => add({ id: `${id}-${o.id}`, text, why, apply: { type: "rule", rule } });
  const weights = (id: string, text: string, why: string, delta: Suggestion["apply"] extends infer A ? A extends { type: "weights"; delta: infer D } ? D : never : never) => add({ id: `${id}-${o.id}`, text, why, apply: { type: "weights", delta } });
  // Learned rules can warn or rank lower, never hide. Hiding stays the user's call.
  if (tags.includes("Raw onion")) rule("s-onion", "Rank dishes with raw onion lower", `Raw onion was in ${d.ing.find((i) => i.name === "onion")?.seen[0] ?? "most"} of 9 photos of this dish.`, { kind: "ingredient", value: "onion", form: "raw", action: "lower" });
  if (tags.includes("Cold on arrival") || tags.includes("Arrived soggy")) rule("s-travel", "Warn me about soggy food on long rides", `This came ${r.km} km and arrived ${tags.includes("Arrived soggy") ? "soggy" : "cold"}.`, { kind: "travel", value: "badly", action: "warn" });
  if (tags.includes("Too oily")) rule("s-oily", "Rank dishes reviewers call oily lower", "You found this one oily. Reviews flag oil on a few dishes near you.", { kind: "oily", value: "oily", action: "lower" });
  if (tags.includes("Too spicy") && d.spice > 0) rule("s-spice", `Rank dishes spicier than ${["no spice", "mild", "medium"][d.spice - 1]} lower`, "This one was too spicy for you.", { kind: "spice", value: d.spice - 1, action: "lower" });
  if (tags.includes("Bland")) weights("s-taste", "Count taste more", "It was bland. Taste will weigh more in your picks.", { taste: 0.3 });
  if (tags.includes("Smaller than shown")) weights("s-qty", "Count quantity more", "The portion was smaller than the photos suggested.", { quantity: 0.3 });
  if (tags.includes("Leaked")) weights("s-pack", "Count packaging more", "It leaked on the way.", { packaging: 0.4 });
  if (fb.aspects?.quality === "worse" && fb.aspects?.quantity !== "worse") weights("s-q", "Count quality more than quantity", "Plenty of food, worse cooking than shown.", { quality: 0.3, quantity: -0.2 });
  if (r.type === "cloud" && fb.verdict === "worse") rule("s-cloud", "Warn me about cloud kitchens too", "This cloud-kitchen order was worse than shown.", { kind: "kitchen", value: "cloud", action: "warn" });
  return out;
}

function RateForm({ o, onSaved }: { o: Order; onSaved: () => void }) {
  const { feedback, setFeedback, setOrders, setPrefs, prefs, toast } = useStore();
  const d = DISH[o.dish], r = R[d.r], fb = feedback[o.id] ?? {};
  const set = (patch: Partial<typeof fb>) => setFeedback(o.id, (f) => ({ ...f, ...patch }));
  const onFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("That isn't an image. Pick a JPG or PNG."); return; }
    const rd = new FileReader();
    rd.onload = () => set({ img: String(rd.result) });
    rd.readAsDataURL(file);
  };
  const save = () => {
    if (!fb.match || !fb.verdict) { toast("Answer the first two questions."); return; }
    const sug = learn(prefs, o, fb);
    setPrefs((p) => ({ ...p, pending: [...sug, ...p.pending.filter((x) => !sug.some((s) => s.id === x.id))], avoidDishes: fb.verdict === "worse" ? [...new Set([...p.avoidDishes, o.dish])] : p.avoidDishes }));
    setOrders((all) => all.map((x) => (x.id === o.id ? { ...x, status: "rated", verdict: fb.verdict, match: fb.match } : x)));
    onSaved();
  };
  return (
    <div className="card flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="h2">{d.name}</h2><p className="font-medium text-muted">{r.name} · {o.date} · <span className="num">{inr(o.total)}</span></p></div>
      </div>
      <div className="grid max-w-[480px] grid-cols-2 gap-3">
        <div><div className="eyebrow mb-2">Forkcast showed</div><Photo dish={d} i={0} kind="delivered" ratio="4 / 3" /></div>
        <div>
          <div className="eyebrow mb-2">You got</div>
          <label className="relative grid aspect-[4/3] cursor-pointer place-items-center overflow-hidden rounded-[16px] border-[1.5px] border-dashed border-line bg-surface text-center text-ink-2 transition"
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            {fb.img ? <img src={fb.img} alt="Your photo of the order" className="absolute inset-0 h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-2 p-4 text-sm font-semibold"><Camera size={24} strokeWidth={1.75} />Add a photo<span className="font-medium text-muted">optional</span></span>}
          </label>
        </div>
      </div>
      <Q label="Looked like the photos?">
        <div className="seg w-fit" role="group" aria-label="Looked like the photos">
          {(["yes", "mostly", "no"] as const).map((v) => <button key={v} aria-pressed={fb.match === v} onClick={() => set({ match: v })}>{v === "yes" ? "Yes" : v === "mostly" ? "Mostly" : "No"}</button>)}
        </div>
      </Q>
      <Q label="Overall, vs what it showed">
        <div className="seg w-fit" role="group" aria-label="Overall">
          {VERDICT.map(({ v, l, I }) => <button key={v} aria-pressed={fb.verdict === v} onClick={() => set({ verdict: v })}><I />{l}</button>)}
        </div>
      </Q>
      {fb.verdict && fb.verdict !== "same" && (
        <div className="enter grid gap-3 rounded-m bg-surface p-4">
          <div className="eyebrow">What was different?</div>
          {ASPECTS4.map(([k, l]) => (
            <div key={k} className="grid items-center gap-2 sm:grid-cols-[150px_minmax(0,1fr)]">
              <div><div className="font-extrabold">{l}</div><Tick v={d.s[k]} /></div>
              <div className="seg full sm bg-card" role="group" aria-label={l}>
                {VERDICT.map(({ v, l: vl, I }) => <button key={v} aria-pressed={fb.aspects?.[k] === v} onClick={() => set({ aspects: { ...(fb.aspects ?? {}), [k]: v } })} aria-label={`${l}: ${vl}`}><I /></button>)}
              </div>
            </div>
          ))}
        </div>
      )}
      <Q label="Anything else?">
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => { const on = fb.tags?.includes(t); return <button key={t} className={cx("chip", on && "accent")} aria-pressed={!!on} onClick={() => set({ tags: on ? fb.tags!.filter((x) => x !== t) : [...(fb.tags ?? []), t] })}>{t}</button>; })}
        </div>
      </Q>
      <div className="flex flex-col items-start gap-2">
        <button className="btn primary" onClick={save}>Save rating</button>
        <p className="reassure">Worse orders rank lower straight away. Anything else waits for your OK.</p>
      </div>
    </div>
  );
}

function Q({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><div className="font-extrabold">{label}</div>{children}</div>;
}
function Tick({ v }: { v: number }) {
  return (
    <div className="mt-1 flex items-center gap-2 text-xs text-muted">
      <div className="relative h-1.5 w-20 rounded-full bg-surface-2"><span className="absolute top-1/2 h-3 w-[3px] -translate-y-1/2 rounded bg-ink-2" style={{ left: `${(v / 5) * 100}%` }} /></div>
      <span className="num">said {v.toFixed(1)}</span>
    </div>
  );
}

function Rated({ o, fresh }: { o: Order; fresh: boolean }) {
  const { prefs } = useStore();
  const d = DISH[o.dish], r = R[d.r];
  const alt = betterThan(d.id, prefs);
  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="h2">{d.name}</h2><p className="font-medium text-muted">{r.name} · {o.date} · <span className="num">{inr(o.total)}</span></p></div>
          <div className="flex gap-2">
            <span className="chip">Photos: {o.match === "yes" ? "matched" : o.match === "mostly" ? "mostly" : "didn't match"}</span>
            <span className={cx("chip", o.verdict === "worse" && "warn")}>{o.verdict === "better" ? "Better than shown" : o.verdict === "worse" ? "Worse than shown" : "As shown"}</span>
          </div>
        </div>
        {fresh && (
          <div className="pop flex items-center gap-4 rounded-m bg-success-tint p-4">
            <div className="illo h-16 w-16 flex-none border-[var(--success-text)] text-[9px] text-success-text">star badge</div>
            <div><div className="font-extrabold text-success-text">Saved</div><p className="text-sm text-ink-2">{o.verdict === "worse" ? "This dish now ranks lower for you." : "Thanks. It counts towards your next suggestions."}</p></div>
          </div>
        )}
      </div>
      {prefs.pending.length > 0 && <Suggestions />}
      {alt && (
        <section className="card">
          <div className="eyebrow mb-3">Order again, but better</div>
          <Link href={`/dish/${alt.d.id}`} className="flex items-center gap-4 rounded-m p-1 transition hover:bg-surface">
            <Photo dish={alt.d} kind="delivered" className="h-20 w-20 flex-none" radius={14} />
            <div className="min-w-0 flex-1">
              <div className="h3">{alt.d.name}</div>
              <div className="text-sm font-medium text-muted">{R[alt.d.r].name} · {inr(alt.d.price)}</div>
              <div className="num mt-1 text-sm font-extrabold text-accent-700">{alt.score.toFixed(1)} for you vs {dishScore(d, prefs.weights).toFixed(1)}</div>
            </div>
            <ArrowRight className="text-muted" />
          </Link>
        </section>
      )}
    </div>
  );
}
