"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Clock, Images, MapPin, Package, Plus, ShoppingBag, Star, TextQuote, ThumbsDown, UtensilsCrossed } from "lucide-react";
import { DISH, R, SHARED_KITCHEN_BRANDS } from "@/lib/data";
import { gap, inr, num, cx } from "@/lib/format";
import { photo, PHOTO_DATES, type PhotoKind } from "@/lib/photo";
import { dishScore, topAspect } from "@/lib/rank";
import { ruleLabel, ruleMatches } from "@/lib/rules";
import { useStore } from "@/lib/store";
import type { Dish, Rule } from "@/lib/types";
import { Bars } from "@/components/Bars";
import { Modal } from "@/components/Modal";
import { Photo } from "@/components/Photo";
import { Dumbbell, Fraction, Hl } from "@/components/Bits";

const SPICE = ["No spice", "Mild", "Medium", "Hot"];

export default function DishPage() {
  const { id } = useParams<{ id: string }>();
  const d = DISH[id];
  if (!d) return (
    <div className="wrap pt-10"><div className="card flex flex-col items-center gap-3 py-12 text-center"><div className="illo h-24 w-24">plate and fork</div><h1 className="h2">Dish not found</h1><Link href="/" className="btn primary">Back to chat</Link></div></div>
  );
  return <DishView d={d} />;
}

function DishView({ d }: { d: Dish }) {
  const r = R[d.r];
  const router = useRouter();
  const { prefs, compare, toggleCompare, toast, addRules } = useStore();
  const [kind, setKind] = useState<PhotoKind>("delivered");
  const [sel, setSel] = useState(0);
  const [why, setWhy] = useState(false);
  const [notFor, setNotFor] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [quotes, setQuotes] = useState<"all" | "delivery">("all");
  const [allQuotes, setAllQuotes] = useState(false);
  const score = dishScore(d, prefs.weights);
  const g = gap(d.price, d.dine);
  const idx = kind === "delivered" ? sel : sel + 20;
  const marks = useMemo(() => photo(d, idx, kind).marks, [d, idx, kind]);
  const ruleHits = prefs.rules.filter((x) => x.on && x.kind === "ingredient" && ruleMatches(x, d, r));
  const flagLabels = marks.filter((m) => ruleHits.some((x) => m.label.includes(String(x.value)) && (x.form !== "raw" || m.label.includes("raw")))).map((m) => m.label);
  const dineCount = d.ph - d.del;
  const qs = d.q.filter((q) => quotes === "all" || q.channel === "delivery");
  const inCompare = compare.includes(d.id);

  return (
    <div className="wrap pt-5" data-page="dish">
      <button className="btn ghost sm mb-5" onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}><ArrowLeft />Back</button>

      <header className="mb-5 flex flex-col gap-3">
        <h1 className="h1">{d.name}</h1>
        <p className="flex flex-wrap gap-x-2 font-medium text-muted"><Link href={`/restaurants/${r.id}`} className="whitespace-nowrap underline-offset-2 hover:text-ink hover:underline"><MapPin size={14} className="inline -translate-y-px" /> {r.name}</Link><span className="whitespace-nowrap">{r.area} · <span className="num">{r.km} km</span></span><span className="whitespace-nowrap"><Clock size={14} className="inline -translate-y-px" /> <span className="num">{r.eta} min</span></span></p>
        <div className="flex flex-wrap gap-2">
          {r.type === "cloud" && <span className="chip warn">Cloud kitchen · {r.brands} brands, 1 address</span>}
          <span className="chip"><span className={cx("h-2.5 w-2.5 rounded-[3px] border-2", d.diet === "veg" ? "border-[#0E7A3D]" : "border-[#B3261E]")} />{d.diet === "veg" ? "Veg" : d.diet === "egg" ? "Egg" : "Non-veg"}</span>
          <span className="chip">{SPICE[d.spice]}</span>
          {d.conf === "low" && <span className="chip warn">Only {d.ph} photos. Check this.</span>}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-8">
          <section className="card insight">
            <div className="eyebrow accent">The take</div>
            <p className="mt-2 text-[19px] font-medium leading-snug" style={{ color: "var(--on-tint)" }}>{d.take}</p>
            <button className="link mt-2 text-sm" onClick={() => setWhy((v) => !v)} aria-expanded={why}>{why ? "Less" : "Why this?"}</button>
            {why && <ul className="mt-1 grid gap-1 text-[15px]" style={{ color: "var(--on-tint)" }}>{d.why.map((w) => <li key={w}>{w}</li>)}</ul>}
          </section>

          {/* Mobile: the decision card comes before the evidence */}
          <div className="lg:hidden"><Decision d={d} score={score} g={g} inCompare={inCompare} onCompare={() => toggleCompare(d.id)} onNotFor={() => setNotFor(true)} mobile /></div>

          <section className="card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="h3">Listing vs what arrives</h2>
              <div className="seg sm" role="group" aria-label="Photo source">
                <button aria-pressed={kind === "delivered"} onClick={() => { setKind("delivered"); setSel(0); }}><Package />Delivered <span className="num">{d.del}</span></button>
                {dineCount > 0 && <button aria-pressed={kind === "dinein"} onClick={() => { setKind("dinein"); setSel(0); }}><UtensilsCrossed />Dine-in <span className="num">{num(dineCount)}</span></button>}
              </div>
            </div>
            <div className="mb-3"><span className={cx("chip sm", d.listing.kind === "stock" ? "warn" : "ok")}>{d.listing.kind === "stock" ? `Listing is a stock photo · on ${d.listing.reuse} other listings` : "Listing is the restaurant's own photo · matches customers'"}</span></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Photo dish={d} kind="listing" label="On Swiggy" />
              </div>
              <div>
                <Photo dish={d} i={idx} kind={kind} label={`${kind === "delivered" ? "Delivered" : "Dine-in"} · ${PHOTO_DATES[sel]}`} pins flagLabels={flagLabels} />
              </div>
            </div>
            <div className="hscroll mt-3 pb-1">
              {Array.from({ length: 9 }, (_, i) => (
                <button key={i} onClick={() => setSel(i)} aria-label={`Photo from ${PHOTO_DATES[i]}`} aria-pressed={sel === i} className={cx("rounded-[12px] p-0.5 transition", sel === i ? "bg-ink" : "bg-transparent")}>
                  <Photo dish={d} i={kind === "delivered" ? i : i + 20} kind={kind} className="h-14 w-14" radius={10} />
                </button>
              ))}
            </div>
            <div className="mt-2 flex justify-end"><button className="link text-sm" onClick={() => setMatchOpen(true)}>Why this photo?</button></div>

            {marks.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <div className="eyebrow mb-2">In the photos</div>
                <ol className="grid gap-1">
                  {marks.map((m, n) => {
                    const ing = d.ing.find((x) => m.label.includes(x.name));
                    const hit = flagLabels.includes(m.label);
                    return (
                      <li key={m.label} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 rounded-s px-1 py-1.5">
                        <span className={cx("grid h-6 w-6 place-items-center rounded-full text-xs font-extrabold", hit ? "bg-warning text-[#1D1D1F]" : "bg-surface-2 text-ink")}>{n + 1}</span>
                        <span className="font-extrabold capitalize-first">{m.label.charAt(0).toUpperCase() + m.label.slice(1)}</span>
                        <span className="flex items-center gap-2">
                          {hit && <span className="chip warn sm">Your rule</span>}
                          {ing && ing.seen[0] > 0 && <Fraction a={ing.seen[0]} b={ing.seen[1]} />}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-2 text-xs text-faint">Fractions count the 9 latest delivered photos. Test data: drawn stand-ins.</p>
              </div>
            )}
          </section>

          <section className="card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="h3">Reviews of this dish</h2>
              <span className="chip"><TextQuote />{num(d.rev)} reviews</span>
            </div>
            <Bars dish={d} focus={topAspect(prefs.weights)} />
            <div className="mt-3"><Bars dish={d} keys={["packaging", "value"]} /></div>
            <div className="mb-3 mt-6 flex items-center justify-between">
              <span className="eyebrow">Quotes</span>
              <div className="seg sm" role="group" aria-label="Review source">
                <button aria-pressed={quotes === "all"} onClick={() => setQuotes("all")}>All</button>
                <button aria-pressed={quotes === "delivery"} onClick={() => setQuotes("delivery")}>Delivery</button>
              </div>
            </div>
            <div className="grid gap-3">
              {qs.length === 0 && <p className="text-muted">No delivery quotes yet.</p>}
              {(allQuotes ? qs : qs.slice(0, 2)).map((q) => (
                <figure key={q.text} className="rounded-m bg-surface p-4">
                  <blockquote className="text-[16px] text-ink-2">&ldquo;<Hl text={q.text} hl={q.hl} />&rdquo;</blockquote>
                  <figcaption className="mt-2 text-xs font-semibold text-muted">{q.source} · {q.date} · {q.aspect}</figcaption>
                </figure>
              ))}
              {qs.length > 2 && !allQuotes && <button className="link text-sm" onClick={() => setAllQuotes(true)}>{qs.length - 2} more</button>}
            </div>
          </section>

          <section className="card">
            {r.type === "cloud" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="h3">Kitchen</h2><span className="chip warn">{r.brands} brands, 1 address</span></div>
                <p className="mt-2 text-ink-2">{r.addr}. No dine-in listing on Google Maps, so scores use delivery reviews only.</p>
                <div className="mt-3 flex flex-wrap gap-1.5">{SHARED_KITCHEN_BRANDS.map((b) => <span key={b} className={cx("chip sm", b === r.name && "accent")}>{b}</span>)}</div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="h3">Kitchen</h2><p className="text-ink-2">Dine-in since {r.since} · {r.addr}</p></div>
                <span className="chip"><Star />Google {r.g} · {num(r.gN!)} reviews</span>
              </div>
            )}
          </section>
        </div>

        <aside className="hidden lg:col-span-4 lg:block">
          <div className="sticky top-[88px]"><Decision d={d} score={score} g={g} inCompare={inCompare} onCompare={() => toggleCompare(d.id)} onNotFor={() => setNotFor(true)} /></div>
        </aside>
      </div>

      {/* Mobile sticky order bar */}
      <div className="fixed inset-x-0 z-40 flex items-center gap-3 border-t border-line px-4 py-3 lg:hidden" style={{ bottom: "var(--tabbar-h)", background: "var(--glass)", backdropFilter: "blur(16px)" }}>
        <div className="min-w-0 flex-1"><div className="num text-lg font-black">{inr(d.price)}</div><div className="truncate text-xs text-muted">{g ? `+${inr(g.diff)} vs dine-in` : "Delivery only"}</div></div>
        <button className="btn primary" onClick={() => toast("Added in test mode. Nothing sent.")}><ShoppingBag />Add to cart</button>
      </div>
      <div className="h-20 lg:hidden" />

      <NotForMe open={notFor} onClose={() => setNotFor(false)} d={d} onRule={(rule) => { addRules([rule]); toast("Rule added. Picks updated."); }} />
      <Modal open={matchOpen} onClose={() => setMatchOpen(false)} title="Why this photo?" eyebrow="Photo match" wide>
        <div className="grid gap-5 sm:grid-cols-2">
          <Photo dish={d} i={idx} kind={kind} pins flagLabels={flagLabels} />
          <div className="flex flex-col gap-3">
            <figure className="rounded-m bg-surface p-4"><blockquote className="text-ink-2">&ldquo;<Hl text={d.cap} hl={d.capHl} />&rdquo;</blockquote><figcaption className="mt-2 text-xs font-semibold text-muted">{kind === "delivered" ? "Delivery review" : "Google review"} · {PHOTO_DATES[sel]}</figcaption></figure>
            <div className="flex flex-wrap gap-2">
              <span className="chip"><TextQuote />Caption names the dish</span>
              <span className="chip"><Images />Like {Math.max(6, Math.round(d.ph / 8))} other photos of it</span>
              <span className="chip">{kind === "delivered" ? <><Package />In a delivery box</> : <><UtensilsCrossed />On a plate</>}</span>
              <span className={cx("chip", d.conf === "low" ? "warn" : "ok")}>{d.conf === "low" ? "Not sure, check this" : "Confident match"}</span>
            </div>
            <p className="text-sm text-muted">Matched only against this restaurant&rsquo;s own menu, so a photo can&rsquo;t be tagged as a dish they don&rsquo;t sell.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Decision({ d, score, g, inCompare, onCompare, onNotFor, mobile }: { d: Dish; score: number; g: ReturnType<typeof gap>; inCompare: boolean; onCompare: () => void; onNotFor: () => void; mobile?: boolean }) {
  const r = R[d.r];
  const { toast } = useStore();
  return (
    <section className="card flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <div><div className="text-sm font-semibold text-muted">For you</div><div className="num mt-1 text-[34px] font-black leading-none text-accent-700">{score.toFixed(1)}</div><div className="mt-1 text-xs font-medium text-muted"><span className="num">{num(d.rev)}</span> reviews · <span className="num">{d.del}</span> delivered photos</div></div>
        <div><div className="text-sm font-semibold text-muted">Swiggy</div><div className="num mt-1 flex items-center gap-1 text-[34px] font-black leading-none">{r.sw}<Star size={18} strokeWidth={2.2} /></div><div className="mt-1 text-xs font-medium text-muted">whole restaurant</div></div>
      </div>
      <div>
        <div className="mb-2 flex items-baseline justify-between"><span className="text-sm font-semibold text-muted">Price</span>{g && <span className="chip sm">+{inr(g.diff)} · {g.pct}%</span>}</div>
        {g ? <Dumbbell dine={d.dine!} app={d.price} /> : <p className="font-medium"><span className="num text-[22px] font-black">{inr(d.price)}</span> <span className="text-sm text-muted">· delivery only</span></p>}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><div className="font-semibold text-muted">Portion</div><div className="font-extrabold">{d.portion}</div><div className="text-muted">{d.portionSub}</div></div>
        <div><div className="font-semibold text-muted">Arrives in</div><div className="num font-extrabold">{r.eta} min</div><div className="text-muted">{d.travels === "badly" && r.km > 4 ? "may go soft" : d.travels === "well" ? "travels well" : `${r.km} km`}</div></div>
      </div>
      {d.dine && d.travels === "badly" && r.km > 4 && (
        <div className="rounded-m bg-surface p-3 text-sm"><div className="font-extrabold">Better in person</div><p className="text-ink-2">{inr(d.dine)} at the counter and still crisp. Delivered from {r.km} km it usually goes soft.</p></div>
      )}
      {!mobile && (
        <div className="flex flex-col gap-3">
          <button className="btn primary w-full" onClick={() => toast("Added in test mode. Nothing sent.")}><ShoppingBag />Add to Swiggy cart</button>
          <div className="grid grid-cols-2 gap-3">
            <button className={cx("btn sm", !inCompare && "ghost")} onClick={onCompare} aria-pressed={inCompare}>{inCompare ? <><Check />Comparing</> : <><Plus />Compare</>}</button>
            <button className="btn ghost sm" onClick={onNotFor}><ThumbsDown />Not for me</button>
          </div>
          <p className="reassure text-center">You pay on Swiggy.</p>
        </div>
      )}
      {mobile && (
        <div className="grid grid-cols-2 gap-3">
          <button className={cx("btn sm", !inCompare && "ghost")} onClick={onCompare} aria-pressed={inCompare}>{inCompare ? <><Check />Comparing</> : <><Plus />Compare</>}</button>
          <button className="btn ghost sm" onClick={onNotFor}><ThumbsDown />Not for me</button>
        </div>
      )}
    </section>
  );
}

function NotForMe({ open, onClose, d, onRule }: { open: boolean; onClose: () => void; d: Dish; onRule: (r: Omit<Rule, "id" | "on" | "source">) => void }) {
  const r = R[d.r];
  const { toast } = useStore();
  const [pick, setPick] = useState<string | null>(null);
  const reasons: { l: string; rule?: Omit<Rule, "id" | "on" | "source"> }[] = [
    { l: "Too small", rule: { kind: "portion", value: 2, action: "lower" } },
    { l: "Too far", rule: { kind: "distance", value: Math.max(2, Math.floor(r.km) - 1), action: "lower" } },
    ...(d.spice >= 2 ? [{ l: "Too spicy", rule: { kind: "spice" as const, value: d.spice - 1, action: "hide" as const } }] : []),
    ...(d.ing.some((i) => i.form === "raw" && i.name === "onion") ? [{ l: "Raw onion", rule: { kind: "ingredient" as const, value: "onion", form: "raw" as const, action: "hide" as const } }] : []),
    ...(r.type === "cloud" ? [{ l: "Cloud kitchen", rule: { kind: "kitchen" as const, value: "cloud", action: "hide" as const } }] : []),
    { l: "Too expensive", rule: { kind: "price", value: Math.floor((d.price - 1) / 50) * 50, action: "lower" } },
    { l: "Just not today" },
  ];
  const chosen = reasons.find((x) => x.l === pick);
  const close = () => { setPick(null); onClose(); };
  return (
    <Modal open={open} onClose={close} title="What put you off?" eyebrow={d.name}>
      <div className="flex flex-wrap gap-2">
        {reasons.map((x) => <button key={x.l} className={cx("chip", pick === x.l && "accent")} aria-pressed={pick === x.l} onClick={() => setPick(x.l)}>{x.l}</button>)}
      </div>
      {chosen?.rule && (
        <div className="mt-5 rounded-m bg-accent-50 p-4">
          <div className="eyebrow accent">Make it a rule?</div>
          <p className="mt-1 font-extrabold" style={{ color: "var(--on-tint)" }}>{chosen.rule.action === "hide" ? "Hide" : "Rank lower"}: {ruleLabel(chosen.rule)}</p>
        </div>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button className="btn ghost" disabled={!pick} onClick={() => { toast("Got it. Fewer like this."); close(); }}>Just this once</button>
        <button className="btn" disabled={!chosen?.rule} onClick={() => { onRule(chosen!.rule!); close(); }}>Add rule</button>
      </div>
    </Modal>
  );
}
