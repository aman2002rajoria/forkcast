"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, MapPin, Search, Star, X } from "lucide-react";
import type { ListResult, RestaurantSummary } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { num, cx } from "@/lib/format";
import { RestaurantPhoto } from "@/components/RestaurantPhoto";

type Sort = "foryou" | "reviews" | "near";
const SORTS: { v: Sort; l: string }[] = [{ v: "foryou", l: "For you" }, { v: "reviews", l: "Most reviewed" }, { v: "near", l: "Nearest" }];

export default function Explore() {
  const { prefs, ready } = useStore();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<Sort>("foryou");
  const [veg, setVeg] = useState(false);
  const [dinein, setDinein] = useState(false);
  const [quick, setQuick] = useState(false);
  const [data, setData] = useState<ListResult | null>(null);
  const [items, setItems] = useState<RestaurantSummary[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const w = prefs.weights;
  const wq = useMemo(() => [w.taste, w.quantity * (prefs.party === 2 ? 1.9 : 1), w.quality, w.packaging, w.value].map((x) => x.toFixed(2)).join(","), [w, prefs.party]);

  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 250); return () => clearTimeout(t); }, [q]);
  const params = (offset: number) => new URLSearchParams({ q: debounced, sort, w: wq, offset: String(offset), limit: "24", ...(veg && { veg: "1" }), ...(dinein && { dinein: "1" }), ...(quick && { quick: "1" }) });

  useEffect(() => {
    if (!ready) return;
    let live = true;
    setLoading(true); setError(false);
    fetch(`/api/restaurants?${params(0)}`).then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: ListResult) => { if (live) { setData(d); setItems(d.items); } })
      .catch(() => live && setError(true))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, sort, veg, dinein, quick, wq, ready, tick]);

  const more = async () => {
    const d: ListResult = await fetch(`/api/restaurants?${params(items.length)}`).then((r) => r.json());
    setItems((x) => [...x, ...d.items]);
  };
  const filters = [{ on: veg, set: setVeg, l: "Pure veg" }, { on: dinein, set: setDinein, l: "No cloud kitchens" }, { on: quick, set: setQuick, l: "Under 35 min" }];
  const clear = () => { setQ(""); setVeg(false); setDinein(false); setQuick(false); };

  return (
    <div className="wrap pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">Explore</h1>
          <p className="mt-1 text-muted">{data ? `${num(data.total)} places near ${data.area}` : "Places near you"}{data?.mode === "live" && <span className="badge accent ml-2 align-middle">Live data</span>}</p>
        </div>
        <Link href="/" className="link text-sm">Not sure what you want? Ask instead <ArrowRight /></Link>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <label htmlFor="explore-q" className="sr-only">Search a place, cuisine or dish</label>
          <Search size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-faint" />
          <input id="explore-q" className="input sm !pl-12" placeholder="Search a place, cuisine or dish" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          {q && <button className="btn ghost icon absolute right-1 top-1/2 !h-9 !w-9 -translate-y-1/2 !shadow-none" onClick={() => setQ("")} aria-label="Clear search"><X size={16} /></button>}
        </div>
        <div className="seg w-fit" role="group" aria-label="Sort">
          {SORTS.map((s) => <button key={s.v} aria-pressed={sort === s.v} onClick={() => setSort(s.v)}>{s.l}</button>)}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {filters.map((f) => <button key={f.l} className={cx("chip", f.on && "accent")} aria-pressed={f.on} onClick={() => f.set(!f.on)}>{f.l}</button>)}
      </div>

      {error ? (
        <div className="mt-6 rounded-l bg-danger-tint p-5" role="alert"><h2 className="h3 text-danger-text">Couldn&rsquo;t load restaurants</h2><p className="mt-1 text-ink-2">The catalog didn&rsquo;t respond. Your filters are kept.</p><button className="btn sm mt-4" onClick={() => setTick((t) => t + 1)}>Try again</button></div>
      ) : loading && !items.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skel h-[330px] rounded-[24px]" />)}</div>
      ) : items.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 py-12 text-center">
          <div className="illo h-24 w-24">plate and fork</div>
          <h2 className="h3">No places match</h2>
          <p className="text-muted">{debounced ? `Nothing near you serves “${debounced}” with these filters.` : "Loosen a filter to see more."}</p>
          <button className="btn primary" onClick={clear}>Clear filters</button>
        </div>
      ) : (
        <>
          <div className={cx("mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3", loading && "opacity-60")}>
            {items.map((r, i) => <Card key={r.id} r={r} delay={Math.min(i, 8) * 60} />)}
          </div>
          {data && items.length < data.total && <div className="mt-6 flex justify-center"><button className="btn ghost" onClick={more}>Show more places</button></div>}
        </>
      )}
    </div>
  );
}

function Card({ r, delay }: { r: RestaurantSummary; delay: number }) {
  return (
    <Link href={`/restaurants/${r.id}`} className="enter group flex flex-col overflow-hidden rounded-[24px] bg-card shadow-flat transition hover:shadow-float" style={{ animationDelay: `${delay}ms` }}>
      <div className="relative">
        <RestaurantPhoto r={r} />
        {r.type === "cloud" && <span className="chip warn sm absolute left-2 top-2">Cloud kitchen · {r.brands} brands</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="h3 text-[18px] group-hover:underline">{r.name}</h2>
            <p className="truncate text-sm font-medium text-muted">{r.cuisines.join(", ")}{r.costForTwo ? ` · ₹${r.costForTwo} for two` : ""}</p>
          </div>
          {r.g != null && <div className="flex-none text-right"><div className="num flex items-center justify-end gap-1 text-[20px] font-black leading-none">{r.g}<Star size={14} strokeWidth={2.2} /></div><div className="num text-[11px] font-semibold text-muted">{num(r.gN ?? 0)} on Google</div></div>}
        </div>
        <p className="flex flex-wrap gap-x-3 text-sm font-medium text-ink-2">
          <span className="whitespace-nowrap"><MapPin size={13} className="inline -translate-y-px" /> {r.area} · <span className="num">{r.km} km</span></span>
          {r.eta && <span className="whitespace-nowrap"><Clock size={13} className="inline -translate-y-px" /> <span className="num">{r.eta} min</span></span>}
          {r.sw && <span className="whitespace-nowrap text-muted">Swiggy {r.sw}</span>}
        </p>
        {r.match && <p className="text-sm font-semibold text-accent-700">Serves {r.match.toLowerCase()}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 rounded-m bg-surface px-3 py-2.5 text-sm">
          {r.topDish ? (
            <>
              <span className="min-w-0 truncate"><span className="text-muted">{r.topDish.score != null ? "Best here" : "Top on Swiggy"}:</span> <b className="font-extrabold">{r.topDish.name}</b></span>
              <span className="num flex-none font-black">{r.topDish.score != null ? `${r.topDish.score.toFixed(1)} for you` : `${r.topDish.rating}`}</span>
            </>
          ) : <span className="text-muted">Menu not loaded yet</span>}
        </div>
      </div>
    </Link>
  );
}
