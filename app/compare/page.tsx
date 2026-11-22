"use client";

import Link from "next/link";
import { Fragment, useEffect, type ReactNode } from "react";
import { Clock, Link2, ShoppingBag, Star, X } from "lucide-react";
import { DISH, R } from "@/lib/data";
import { gap, inr, num, cx } from "@/lib/format";
import { dishScore, effectiveWeights } from "@/lib/rank";
import { ruleEvidence, ruleMatches } from "@/lib/rules";
import { useStore } from "@/lib/store";
import { ASPECTS, type Dish } from "@/lib/types";
import { Photo } from "@/components/Photo";

const PRESETS = [
  { l: "3 biryanis", ids: ["mutton-biryani", "donne-biryani", "chicken-biryani"] },
  { l: "Paneer, two kitchens", ids: ["paneer-tikka", "paneer-butter-masala"] },
  { l: "Quick savory snacks", ids: ["chilli-cheese-toast", "veg-momos", "masala-dosa"] },
];

export default function Compare() {
  const { compare, setCompare, toggleCompare, prefs, toast, ready } = useStore();
  // Shared shortlists: /compare?ids=a,b,c
  useEffect(() => {
    if (!ready) return;
    const ids = new URLSearchParams(window.location.search).get("ids");
    if (ids) { setCompare(ids.split(",").filter((x) => DISH[x]).slice(0, 4)); window.history.replaceState(null, "", "/compare"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  if (!ready) return <div className="wrap pt-8"><div className="skel h-64 rounded-l" /></div>;
  const ds = compare.map((id) => DISH[id]).filter(Boolean);

  if (ds.length < 2)
    return (
      <div className="wrap pt-6">
        <div className="card enter flex flex-col items-center gap-4 py-12 text-center">
          <div className="illo h-32 w-32">plate and fork</div>
          <h1 className="h2">Line up dishes from different places</h1>
          <p className="max-w-[44ch] text-[17px] text-muted" style={{ textWrap: "balance" }}>Tap Compare on any dish in chat, or start with one of these.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button className="btn primary" onClick={() => setCompare(PRESETS[0].ids)}>Compare {PRESETS[0].l}</button>
            {PRESETS.slice(1).map((p) => <button key={p.l} className="btn ghost" onClick={() => setCompare(p.ids)}>{p.l}</button>)}
          </div>
          {ds.length === 1 && <p className="reassure">{ds[0].name} is waiting. Add one more.</p>}
        </div>
      </div>
    );

  const w = effectiveWeights(prefs);
  const score = (d: Dish) => dishScore(d, w) - Math.max(0, R[d.r].eta - 35) * 0.01;
  const isBest = (f: (d: Dish) => number, low = false) => {
    const vals = ds.map(f);
    const v = low ? Math.min(...vals) : Math.max(...vals);
    return (d: Dish) => f(d) === v;
  };
  const winner = ds.reduce((a, b) => (score(b) > score(a) ? b : a));
  const most = ds.reduce((a, b) => (b.s.quantity > a.s.quantity ? b : a));
  const cheap = ds.reduce((a, b) => (b.price < a.price ? b : a));
  const cloud = ds.filter((d) => R[d.r].type === "cloud");
  const lines = [
    most.id !== winner.id && `Most food: ${most.name.toLowerCase()}`,
    cheap.id !== winner.id && `${inr(winner.price - cheap.price)} cheaper: ${cheap.name.toLowerCase()}`,
    cloud.length > 0 && `${cloud.map((d) => R[d.r].name).join(" and ")}: cloud kitchen, ${R[cloud[0].r].brands} brands at one address`,
  ].filter(Boolean) as string[];
  const hits = (d: Dish) => prefs.rules.filter((x) => x.on && ruleMatches(x, d, R[d.r]) && x.kind !== "kitchen");

  const rows: { label: string; cell: (d: Dish) => ReactNode }[] = [
    { label: "For you", cell: (d) => <span className={cx("num text-[24px] font-black", d.id === winner.id ? "text-accent-700" : "text-ink")}>{score(d).toFixed(1)}</span> },
    { label: "Price", cell: (d) => { const g = gap(d.price, d.dine); return <div><Val on={isBest((x) => x.price, true)(d)}>{inr(d.price)}</Val><div className="text-xs text-muted">{g ? `+${inr(g.diff)} vs dine-in` : "delivery only"}</div></div>; } },
    { label: "Portion", cell: (d) => <div><Val on={isBest((x) => x.s.quantity)(d)}>{d.portion}</Val><div className="text-xs text-muted">{d.portionSub} · serves {d.serves}</div></div> },
    ...ASPECTS.map((a) => ({
      label: a.label,
      cell: (d: Dish) => {
        const on = isBest((x) => x.s[a.key])(d);
        return <div className="grid w-full grid-cols-[minmax(0,1fr)_28px] items-center gap-2"><div className="track"><div className="fill" style={{ width: `${(d.s[a.key] / 5) * 100}%`, background: on ? "var(--ink-2)" : undefined }} /></div><span className={cx("num text-right text-sm", on ? "font-black text-ink" : "font-semibold text-muted")}>{d.s[a.key].toFixed(1)}</span></div>;
      },
    })),
    { label: "Arrives", cell: (d) => <span className="text-sm"><Clock size={13} className="inline -translate-y-px" /> <Val on={isBest((x) => -R[x.r].eta)(d)}>{R[d.r].eta} min</Val> <span className="text-muted">· {R[d.r].km} km</span></span> },
    { label: "Kitchen", cell: (d) => R[d.r].type === "cloud" ? <span className="chip warn sm">Cloud · {R[d.r].brands} brands</span> : <span className="text-sm font-medium text-ink-2">Dine-in, <Star size={12} className="inline -translate-y-px" /> {R[d.r].g}</span> },
    { label: "Your rules", cell: (d) => hits(d).length ? <div className="flex flex-wrap gap-1">{hits(d).map((h) => <span key={h.id} className="chip warn sm whitespace-normal">{ruleEvidence(h, d, R[d.r])}</span>)}</div> : <span className="text-sm text-faint">None</span> },
    { label: "Based on", cell: (d) => <span className="text-xs font-medium text-muted">{num(d.rev)} reviews · {num(d.ph)} photos{d.conf === "low" && <span className="chip warn sm ml-1">Few photos</span>}</span> },
  ];

  const share = async () => {
    const url = `${window.location.origin}/compare?ids=${ds.map((d) => d.id).join(",")}`;
    try { await navigator.clipboard.writeText(url); toast("Link copied. Friends see the same shortlist."); } catch { toast(url); }
  };
  const Head = ({ d }: { d: Dish }) => (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Photo dish={d} kind="delivered" ratio="4 / 3" label="Delivered" radius={14} />
        {d.id === winner.id && <span className="badge absolute left-2 top-2" style={{ background: "var(--card)", color: "var(--ink)" }}>Top pick</span>}
        <button className="btn ghost icon absolute right-2 top-2" onClick={() => toggleCompare(d.id)} aria-label={`Remove ${d.name}`}><X size={16} /></button>
      </div>
      <Link href={`/dish/${d.id}`} className="font-black leading-tight hover:underline">{d.name}</Link>
      <span className="truncate text-xs font-medium text-muted">{R[d.r].name}</span>
    </div>
  );

  return (
    <div className="wrap flex flex-col gap-4 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="h1">Compare</h1><p className="mt-1 text-muted">{ds.length} dishes from {new Set(ds.map((d) => d.r)).size} places, scored for {prefs.party === 2 ? "two" : "you"}</p></div>
        <div className="flex gap-2">
          <button className="btn ghost sm" onClick={share}><Link2 />Share</button>
          <button className="btn ghost sm" onClick={() => setCompare([])}>Clear</button>
        </div>
      </div>

      <section className="card insight">
        <div className="eyebrow accent">Verdict</div>
        <h2 className="h3 mt-2" style={{ color: "var(--on-tint)" }}>{winner.name} wins for {prefs.party === 2 ? "two" : "you"}.</h2>
        {lines.length > 0 && <ul className="mt-2 grid gap-1 text-[15px] font-medium" style={{ color: "var(--on-tint)" }}>{lines.map((l) => <li key={l}>{l}</li>)}</ul>}
      </section>

      {/* Desktop and tablet: one table, dishes as columns */}
      <section className="card hidden overflow-hidden !p-0 sm:block">
        <div className="overflow-x-auto">
          <div className="grid" style={{ gridTemplateColumns: `minmax(88px,120px) repeat(${ds.length}, minmax(156px, 1fr))` }}>
            <div className="sticky left-0 z-10 bg-card" />
            {ds.map((d) => <div key={d.id} className="border-l border-line p-3"><Head d={d} /></div>)}
            <div className="col-span-full h-px bg-line" />
            {rows.map((r) => (
              <Fragment key={r.label}>
                <div className="sticky left-0 z-10 flex items-center bg-card py-3 pl-6 pr-3 text-[13px] font-semibold text-muted">{r.label}</div>
                {ds.map((d) => <div key={d.id} className="flex min-w-0 items-center border-l border-line px-3 py-3">{r.cell(d)}</div>)}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Phone: one card per dish, labels inline */}
      <div className="grid gap-3 sm:hidden">
        {ds.map((d) => (
          <section key={d.id} className="card !p-4">
            <Head d={d} />
            <dl className="mt-3 grid gap-2.5">
              {rows.map((r) => (
                <div key={r.label} className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-3">
                  <dt className="text-[13px] font-semibold text-muted">{r.label}</dt>
                  <dd className="min-w-0">{r.cell(d)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <div className="flex flex-col items-start gap-2">
        <button className="btn primary" onClick={() => toast("Added in test mode. Nothing sent.")}><ShoppingBag />Add {winner.name.toLowerCase()} to Swiggy cart</button>
        <p className="reassure">You pay on Swiggy.</p>
      </div>
    </div>
  );
}

function Val({ on, children }: { on: boolean; children: ReactNode }) {
  return <span className={cx("num", on ? "font-black text-ink" : "font-semibold text-ink-2")}>{children}</span>;
}
