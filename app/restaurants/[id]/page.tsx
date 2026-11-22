"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, Check, Clock, MapPin, MessageCircle, Plus, Search, Sparkles, Star, X } from "lucide-react";
import { DISH } from "@/lib/data";
import { itemScore, type RestaurantDetail } from "@/lib/catalog";
import type { MenuItem } from "@/lib/menus";
import { advise, type Advice } from "@/lib/advisor";
import { effectiveWeights } from "@/lib/rank";
import { useStore } from "@/lib/store";
import { inr, num, cx } from "@/lib/format";
import { DishCard } from "@/components/DishCard";
import { RestaurantPhoto } from "@/components/RestaurantPhoto";

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const [r, setR] = useState<RestaurantDetail | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing" | "error">("loading");
  useEffect(() => {
    fetch(`/api/restaurants/${id}`).then(async (res) => {
      if (res.status === 404) return setState("missing");
      if (!res.ok) throw new Error();
      setR(await res.json()); setState("ok");
    }).catch(() => setState("error"));
  }, [id]);
  if (state === "loading") return <div className="wrap pt-6"><div className="skel mb-4 h-10 w-64" /><div className="grid gap-4 lg:grid-cols-12"><div className="skel h-[520px] rounded-l lg:col-span-8" /><div className="skel h-[420px] rounded-l lg:col-span-4" /></div></div>;
  if (state !== "ok" || !r)
    return <div className="wrap pt-10"><div className="card flex flex-col items-center gap-3 py-12 text-center"><div className="illo h-24 w-24">plate and fork</div><h1 className="h2">{state === "missing" ? "Restaurant not found" : "Couldn't load this restaurant"}</h1><Link href="/explore" className="btn primary">Back to Explore</Link></div></div>;
  return <Restaurant r={r} />;
}

function Restaurant({ r }: { r: RestaurantDetail }) {
  const router = useRouter();
  const { prefs, compare, toggleCompare } = useStore();
  const [cat, setCat] = useState<string>("All");
  const [filter, setFilter] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const w = effectiveWeights(prefs);
  const cats = useMemo(() => ["All", ...new Set(r.menu.map((m) => m.category))], [r.menu]);
  const best = useMemo(() => r.menu.filter((m) => !/dessert|sweet|beverage/i.test(m.category)).map((m) => ({ m, s: itemScore(m, w) })).filter((x) => x.s != null && x.m.dishId && DISH[x.m.dishId]).sort((a, b) => b.s! - a.s!).slice(0, 3), [r.menu, w]);
  const shown = r.menu.filter((m) => (cat === "All" || m.category === cat) && (!vegOnly || m.veg) && (!filter || m.name.toLowerCase().includes(filter.toLowerCase())));
  const groups = [...new Set(shown.map((m) => m.category))].map((c) => ({ c, items: shown.filter((m) => m.category === c) }));
  const focus = (itemId: string) => {
    setSheet(false); setCat("All"); setFilter(""); setVegOnly(false); setHighlight(itemId);
    setTimeout(() => document.getElementById(`item-${itemId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    setTimeout(() => setHighlight(null), 2400);
  };

  return (
    <div className="wrap pt-5">
      <button className="btn ghost sm mb-5" onClick={() => (window.history.length > 1 ? router.back() : router.push("/explore"))}><ArrowLeft />Back</button>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-8">
          <header className="card flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="w-full flex-none sm:w-44"><RestaurantPhoto r={r} ratio="4 / 3" radius={16} /></div>
            <div className="min-w-0 flex-1">
              <h1 className="h1">{r.name}</h1>
              <p className="mt-1 font-medium text-muted">{r.cuisines.join(", ")}{r.costForTwo ? ` · ₹${r.costForTwo} for two` : ""}</p>
              <p className="mt-2 flex flex-wrap gap-x-3 text-sm font-medium text-ink-2">
                <span className="whitespace-nowrap"><MapPin size={13} className="inline -translate-y-px" /> {r.area} · <span className="num">{r.km} km</span></span>
                {r.eta && <span className="whitespace-nowrap"><Clock size={13} className="inline -translate-y-px" /> <span className="num">{r.eta} min</span></span>}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.type === "cloud" ? <span className="chip warn">Cloud kitchen · {r.brands} brands, 1 address</span> : r.since ? <span className="chip">Dine-in since {r.since}</span> : null}
                {r.g != null && <span className="chip"><Star />Google {r.g} · {num(r.gN ?? 0)}</span>}
                {r.sw != null && <span className="chip">Swiggy {r.sw} · {r.swN}</span>}
              </div>
            </div>
          </header>
          {r.reviewSummary && <section className="card compact"><div className="eyebrow mb-1">What reviewers say</div><p className="text-ink-2">{r.reviewSummary}</p><p className="mt-1 text-xs text-faint">Summary from Google Maps</p></section>}

          <section>
            <div className="mb-3 flex items-end justify-between gap-3"><h2 className="h2">Best here for you</h2>{best.length > 0 && <span className="text-sm font-medium text-muted">from reviews and photos</span>}</div>
            {best.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{best.map((b, i) => <DishCard key={b.m.id} pick={{ id: b.m.dishId!, score: +b.s!.toFixed(1), flags: [] }} rank={i} delay={i * 60} />)}</div>
            ) : (
              <p className="rounded-m bg-surface p-4 text-[15px] text-ink-2">No dish here has enough reviews and photos for a full score yet. The menu below uses Swiggy&rsquo;s own ratings.</p>
            )}
          </section>

          <section className="card !px-0 !pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6">
              <h2 className="h2">Menu</h2>
              <span className="num text-sm font-medium text-muted">{r.menu.length} dishes</span>
            </div>
            <div className="mt-4 flex flex-col gap-3 px-6 sm:flex-row">
              <div className="relative flex-1">
                <label htmlFor="menu-q" className="sr-only">Find a dish on this menu</label>
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
                <input id="menu-q" className="input sm !h-11 !pl-10" placeholder="Find a dish" value={filter} onChange={(e) => setFilter(e.target.value)} autoComplete="off" />
              </div>
              <button className={cx("chip", vegOnly && "accent")} aria-pressed={vegOnly} onClick={() => setVegOnly((v) => !v)}>Veg only</button>
            </div>
            <div className="hscroll mt-3 px-6 pb-1">{cats.map((c) => <button key={c} className={cx("chip", cat === c && "accent")} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}</div>
            <div className="mt-2">
              {groups.length === 0 && <p className="px-6 py-8 text-center text-muted">No dish matches. Clear the search or filters.</p>}
              {groups.map((g) => (
                <div key={g.c}>
                  <div className="eyebrow px-6 pb-1 pt-5">{g.c}</div>
                  <ul>{g.items.map((m) => <Row key={m.id} m={m} w={w} highlight={highlight === m.id} inCompare={!!m.dishId && compare.includes(m.dishId)} onCompare={() => m.dishId && toggleCompare(m.dishId)} />)}</ul>
                </div>
              ))}
            </div>
          </section>
          <p className="text-xs text-faint">{r.source === "test" ? "Test data. Restaurant names are made up; localities are real." : "Menu and prices from Swiggy; ratings from Google Maps and Swiggy."}</p>
        </div>

        <aside className="hidden lg:col-span-4 lg:block">
          <div className="sticky top-[88px]"><MenuCopilot r={r} onFocus={focus} /></div>
        </aside>
      </div>

      {/* Phone: the copilot opens as a bottom sheet */}
      <button className="btn fixed right-4 z-40 lg:hidden" style={{ bottom: "calc(var(--tabbar-h) + 16px)" }} onClick={() => setSheet(true)}><Sparkles />Ask about this menu</button>
      {sheet && (
        <div className="fixed inset-0 z-[80] flex items-end bg-[rgba(0,0,0,.4)] lg:hidden" style={{ animation: "fade .2s both" }} onMouseDown={(e) => e.target === e.currentTarget && setSheet(false)}>
          <div className="pop max-h-[85dvh] w-full overflow-auto rounded-t-[28px] bg-bg p-3" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }} role="dialog" aria-modal="true" aria-label="Ask about this menu">
            <div className="mb-2 flex justify-end"><button className="btn ghost icon" onClick={() => setSheet(false)} aria-label="Close"><X /></button></div>
            <MenuCopilot r={r} onFocus={focus} />
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ m, w, highlight, inCompare, onCompare }: { m: MenuItem; w: ReturnType<typeof effectiveWeights>; highlight: boolean; inCompare: boolean; onCompare: () => void }) {
  const s = itemScore(m, w);
  const dish = m.dishId ? DISH[m.dishId] : undefined;
  return (
    <li id={`item-${m.id}`} className={cx("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-6 py-3.5 transition-colors last:border-0", highlight && "bg-accent-50")}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cx("h-3 w-3 flex-none rounded-[3px] border-2", m.veg ? "border-[#0E7A3D]" : "border-[#B3261E]")} aria-label={m.veg ? "Veg" : "Non-veg"} />
          <span className="font-extrabold">{m.name}</span>
          {m.bestseller && <span className="badge">Bestseller</span>}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-muted">
          <span className="num font-semibold text-ink">{inr(m.price)}</span>
          {m.rating != null && <span className="num"><Star size={12} className="inline -translate-y-px" /> {m.rating} · {num(m.votes ?? 0)} on Swiggy</span>}
          {dish && dish.dine && <span className="num">{inr(dish.dine)} dine-in</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {s != null ? (
          <>
            <span className="text-right"><span className="num block text-[20px] font-black leading-none">{s.toFixed(1)}</span><span className="text-[11px] font-semibold text-muted">for you</span></span>
            {dish && <Link href={`/dish/${dish.id}`} className="btn ghost xs">What arrives</Link>}
            {dish && <button className={cx("btn xs icon !h-8 !w-8", !inCompare && "ghost")} onClick={onCompare} aria-pressed={inCompare} aria-label={inCompare ? `Remove ${m.name} from compare` : `Compare ${m.name}`}>{inCompare ? <Check size={14} /> : <Plus size={14} />}</button>}
          </>
        ) : <span className="text-xs font-medium text-faint">Not scored yet</span>}
      </div>
    </li>
  );
}

type Turn = { q: string; a: Advice };
function MenuCopilot({ r, onFocus }: { r: RestaurantDetail; onFocus: (id: string) => void }) {
  const { prefs } = useStore();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [turns.length, busy]);
  const ask = (q: string) => {
    const t = q.trim();
    if (busy) return;
    setText(""); setBusy(true);
    // Runs locally on the menu already loaded; the pause is only so the answer doesn't flash.
    setTimeout(() => { setTurns((x) => [...x, { q: t || "What's good here?", a: advise(r, t, prefs) }]); setBusy(false); }, 500);
  };
  const last = turns[turns.length - 1];
  const chips = last ? last.a.followups : ["What's good here?", "Veg and filling", "Something light", "Under ₹300", "Spicy"];
  const rules = prefs.rules.filter((x) => x.on).length;
  return (
    <section className="flex max-h-[calc(100dvh-110px)] flex-col overflow-hidden rounded-l bg-card shadow-float" aria-label="Ask about this menu">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div><h2 className="h3 flex items-center gap-2"><MessageCircle size={18} />Ask about this menu</h2><p className="text-xs font-medium text-muted">Picks from {r.menu.length} dishes{rules ? `, with your ${rules} rules on` : ""}</p></div>
        <span className="badge accent">AI</span>
      </div>
      <div className="flex-1 space-y-3 overflow-auto px-4 py-4">
        {turns.length === 0 && <div className="bubble-ai text-[15px]">What do you feel like? I&rsquo;ll pick from {r.name}&rsquo;s menu and say why.</div>}
        {turns.map((t, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="bubble-user self-end text-[15px]">{t.q}</div>
            <div className="bubble-ai text-[15px]">{t.a.reply}</div>
            {t.a.picks.map((p) => (
              <button key={p.item.id} onClick={() => onFocus(p.item.id)} className="rounded-m bg-card p-3 text-left shadow-flat transition hover:shadow-float">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-extrabold">{p.item.name}</span>
                  <span className="num flex-none text-sm font-black">{p.scored ? `${p.score.toFixed(1)} for you` : p.item.rating ? `${p.item.rating}` : ""}</span>
                </div>
                <div className="num text-sm font-semibold text-ink-2">{inr(p.item.price)}</div>
                <p className="mt-1 text-[13px] text-muted">{p.why}</p>
                {p.flags.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{p.flags.map((f) => <span key={f} className="chip warn sm">{f}</span>)}</div>}
              </button>
            ))}
            {t.a.hidden.length > 0 && <p className="text-xs text-muted">{t.a.hidden.length} hidden by your rules.</p>}
          </div>
        ))}
        {busy && <div className="bubble-ai flex items-center gap-2"><span className="dots"><i /><i /><i /></span><span className="text-sm text-ink-2">Reading the menu…</span></div>}
        <div ref={endRef} />
      </div>
      <div className="border-t border-line px-4 pb-4 pt-3">
        <div className="hscroll mb-2">{chips.map((c) => <button key={c} className="chip accent sm" onClick={() => ask(c)}>{c}</button>)}</div>
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
          <label htmlFor="menu-ask" className="sr-only">Ask about this menu</label>
          <input id="menu-ask" className="input sm" placeholder="e.g. veg, under ₹300" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
          <button className="btn primary icon !h-11 !w-11 flex-none" type="submit" disabled={busy} aria-label="Ask"><ArrowUp /></button>
        </form>
        {last && <Link href={`/?q=${encodeURIComponent(last.q)}`} className="link mt-2 text-sm">Ask across all restaurants <ArrowRight /></Link>}
      </div>
    </section>
  );
}
