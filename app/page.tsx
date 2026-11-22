"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUp, Columns3, RotateCcw, Star, X } from "lucide-react";
import { DISH, DISHES, HOME, R } from "@/lib/data";
import { STARTERS, intentChips, removeChip } from "@/lib/intent";
import { num, cx } from "@/lib/format";
import { useStore, type ChatMsg } from "@/lib/store";
import { ruleLabel, ACTION_LABEL } from "@/lib/rules";
import type { CopilotResponse, Intent } from "@/lib/types";
import { DishCard } from "@/components/DishCard";
import { Photo } from "@/components/Photo";
import { ConnectModal } from "@/components/Shell";

const STEPS = [
  `Searching Swiggy near ${HOME.area}`,
  `Matching ${Object.keys(R).length} places on Google Maps`,
  `Reading ${num(DISHES.reduce((a, d) => a + d.rev, 0))} reviews`,
  `Checking ${num(DISHES.reduce((a, d) => a + d.ph, 0))} customer photos`,
  "Ranking for your taste",
];
const uid = () => Math.random().toString(36).slice(2, 9);

export default function Ask() {
  const s = useStore();
  const [deep, setDeep] = useState<string | null>(null);
  // A shared link like /?q=savory+under+400 skips the welcome and runs the search.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) { setDeep(q); window.history.replaceState(null, "", "/"); }
  }, []);
  useEffect(() => { if (deep && s.ready && !s.onboarded) s.setOnboarded(true); }, [deep, s]);
  if (!s.ready) return <div className="wrap pt-8"><div className="skel h-48 rounded-l" /></div>;
  if (!s.onboarded && !deep) return <Welcome />;
  return <Chat initial={deep} />;
}

/* ---------- first run (§16): own data or test data ---------- */
function Welcome() {
  const { setOnboarded } = useStore();
  const [connect, setConnect] = useState(false);
  const d = DISH["paneer-tikka"];
  return (
    <div className="wrap grid items-center gap-10 py-10 lg:grid-cols-2 lg:py-16">
      <div className="enter">
        <div className="eyebrow accent mb-4">Bengaluru · on top of Swiggy</div>
        <h1 className="text-[40px] font-black leading-[1.04] tracking-[-0.01em] sm:text-[56px]">Know what&rsquo;s coming before you order.</h1>
        <p className="mt-5 max-w-[46ch] text-[19px] text-ink-2">Say what you feel like. Forkcast reads the reviews and real customer photos, and picks 3 dishes.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button className="btn primary" onClick={() => setConnect(true)}>Use my own data</button>
          <button className="btn ghost" onClick={() => setOnboarded(true)}>Try with test data</button>
        </div>
        <p className="reassure mt-4">Test data stays in your browser.</p>
      </div>
      <div className="relative mx-auto w-full max-w-[520px]">
        <div className="rounded-xl bg-accent-50 p-6 sm:p-10">
          <div className="pop rounded-[24px] bg-card p-3 shadow-float" style={{ animationDelay: "120ms" }}>
            <Photo dish={d} i={1} kind="delivered" ratio="16 / 10" label="Delivered · 16 Nov" pins flagLabels={["raw onion"]} />
            <div className="flex items-center justify-between px-2 pb-1 pt-3">
              <div><div className="h3">Paneer tikka</div><div className="text-sm font-medium text-muted">Smoke Theory · 28 min</div></div>
              <div className="num text-[28px] font-black">4.4</div>
            </div>
          </div>
        </div>
        <span className="chip warn pop absolute -left-2 top-6 shadow-float sm:-left-8" style={{ animationDelay: "300ms" }}>Raw onion: 7 of 9 photos</span>
        <span className="chip pop absolute -right-2 bottom-24 bg-card shadow-float sm:-right-8" style={{ animationDelay: "380ms" }}>+₹40 vs dine-in</span>
        <span className="chip pop absolute bottom-4 left-6 bg-card shadow-float" style={{ animationDelay: "460ms" }}>1,240 reviews · 312 photos</span>
      </div>
      <ConnectModal open={connect} onClose={() => setConnect(false)} onTest={() => { setConnect(false); setOnboarded(true); }} />
    </div>
  );
}

/* ---------- chat ---------- */
function Chat({ initial }: { initial?: string | null }) {
  const { chat, setChat, prefs, preview, setPreview, orders } = useStore();
  const ran = useRef(false);
  useEffect(() => {
    if (initial && !ran.current) { ran.current = true; send(initial, true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);
  const [text, setText] = useState("");
  const [step, setStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const busy = chat.some((m) => m.status === "working");
  const lastAi = [...chat].reverse().find((m) => m.role === "ai" && m.res);

  useEffect(() => {
    if (!busy) return;
    setStep(0);
    const t = setInterval(() => setStep((x) => Math.min(x + 1, STEPS.length - 1)), 330);
    return () => clearInterval(t);
  }, [busy]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [chat.length, busy]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") { e.preventDefault(); inputRef.current?.focus(); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  useEffect(() => {
    if (preview === "empty") { setPreview(null); send("Something sweet and spicy under ₹50", true); }
    if (preview === "error") { setPreview(null); setChat((c) => [...c, { id: uid(), role: "user", text: "Spicy, no cloud kitchens" }, { id: uid(), role: "ai", text: "", status: "error" }]); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]);

  async function call(body: Record<string, unknown>): Promise<CopilotResponse> {
    const [res] = await Promise.all([
      fetch("/api/copilot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, prefs }) }).then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
    return res as CopilotResponse;
  }

  async function send(raw: string, fresh = false) {
    const q = raw.trim();
    if (!q || busy) return;
    setText("");
    const prev = !fresh ? lastAi?.res : undefined;
    const user: ChatMsg = { id: uid(), role: "user", text: q };
    const ai: ChatMsg = { id: uid(), role: "ai", text: "", status: "working" };
    setChat((c) => [...c, user, ai]);
    try {
      const res = await call({
        text: q,
        prev: prev?.intent,
        prevPicks: prev?.picks.map((p) => p.id),
        prevMaxPrice: prev ? Math.max(...prev.picks.map((p) => DISH[p.id].price), 200) : undefined,
      });
      setChat((c) => c.map((m) => (m.id === user.id ? { ...m, intent: res.intent } : m.id === ai.id ? { ...m, status: "done", text: res.reply, res } : m)));
    } catch {
      setChat((c) => c.map((m) => (m.id === ai.id ? { ...m, status: "error" } : m)));
    }
  }

  async function rerun(userId: string, intent: Intent) {
    const idx = chat.findIndex((m) => m.id === userId);
    const ai = chat[idx + 1];
    if (!ai) return;
    setChat((c) => c.map((m) => (m.id === userId ? { ...m, intent } : m.id === ai.id ? { ...m, status: "working" } : m)));
    const res = await call({ intent });
    setChat((c) => c.map((m) => (m.id === ai.id ? { ...m, status: "done", text: res.reply, res } : m)));
  }

  function onChip(label: string) {
    const drop = label.match(/^Drop “(.+)”$/);
    if (drop && lastAi?.res) {
      const u = chat[chat.indexOf(lastAi) - 1];
      const chip = intentChips(lastAi.res.intent).find((c) => c.l === drop[1]);
      if (u && chip) return rerun(u.id, removeChip(lastAi.res.intent, chip.k));
    }
    if (label === "Start over") { setChat(() => []); return; }
    send(label);
  }

  const empty = chat.length === 0;
  const needs = orders.find((o) => o.status === "needs");
  return (
    <div className="wrap grid gap-4 pt-6 lg:grid-cols-12">
      <section className="min-w-0 lg:col-span-8" aria-label="Chat">
        {empty ? (
          <div className="card enter">
            <h1 className="h1">What are you in the mood for?</h1>
            <p className="mt-2 text-muted">{DISHES.length} dishes rated near {HOME.area}</p>
            <Composer value={text} onChange={setText} onSend={() => send(text)} busy={busy} inputRef={inputRef} big />
            <div className="mt-4 flex flex-wrap gap-2">
              {STARTERS.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}
            </div>
            <Link href="/explore" className="link mt-5 text-sm">Or browse restaurants <ArrowRight /></Link>
            {needs && <RateNudge id={needs.dish} className="mt-6 lg:hidden" />}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 pb-4">
              {chat.map((m, i) => (
                <Fragment key={m.id}>
                  {m.role === "user" ? (
                    <UserMsg m={m} onRemove={(k) => m.intent && rerun(m.id, removeChip(m.intent, k))} />
                  ) : (
                    <AiMsg m={m} step={step} onRetry={() => { const u = chat[i - 1]; setChat((c) => c.filter((x) => x.id !== m.id && x.id !== u?.id)); if (u) send(u.text, true); }} onEdit={() => { setText(chat[i - 1]?.text ?? ""); inputRef.current?.focus(); }} />
                  )}
                </Fragment>
              ))}
              <div ref={endRef} />
            </div>
            <div className="sticky z-20 -mx-1 px-1 pb-3 pt-2" style={{ bottom: "var(--tabbar-h)", background: "linear-gradient(to top, var(--bg) 70%, transparent)" }}>
              {lastAi?.res && !busy && (
                <div className="hscroll mb-2">
                  {lastAi.res.picks.length > 1 && <CompareThese ids={lastAi.res.picks.map((p) => p.id)} />}
                  {lastAi.res.followups.map((f) => <button key={f} className="chip accent" onClick={() => onChip(f)}>{f}</button>)}
                  {!lastAi.res.followups.includes("Start over") && <button className="chip" onClick={() => setChat(() => [])}><RotateCcw />New search</button>}
                </div>
              )}
              <div className="rounded-full bg-card p-1.5 shadow-float">
                <Composer value={text} onChange={setText} onSend={() => send(text)} busy={busy} inputRef={inputRef} />
              </div>
            </div>
          </>
        )}
      </section>
      <Rail />
    </div>
  );
}

function Composer({ value, onChange, onSend, busy, inputRef, big }: { value: string; onChange: (v: string) => void; onSend: () => void; busy: boolean; inputRef: React.RefObject<HTMLInputElement | null>; big?: boolean }) {
  return (
    <form className={cx("flex items-center gap-2", big && "mt-6 gap-3")} onSubmit={(e) => { e.preventDefault(); onSend(); }}>
      <label htmlFor={big ? "q-big" : "q"} className="sr-only">A mood, a dish or a budget</label>
      <input id={big ? "q-big" : "q"} ref={inputRef} className={cx("input", !big && "sm")} autoComplete="off" placeholder="A mood, a dish or a budget" value={value} onChange={(e) => onChange(e.target.value)} autoFocus={big} />
      <button className={cx("btn primary", !big && "icon !h-11 !w-11")} type="submit" disabled={busy || !value.trim()} aria-label="Send">
        {big ? <>Send <ArrowUp /></> : <ArrowUp />}
      </button>
    </form>
  );
}

function UserMsg({ m, onRemove }: { m: ChatMsg; onRemove: (k: string) => void }) {
  const chips = m.intent ? intentChips(m.intent) : [];
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="bubble-user enter">{m.text}</div>
      {chips.length > 0 && (
        <div className="flex max-w-full flex-wrap justify-end gap-1.5" aria-label="Reading this as">
          <span className="self-center text-xs font-semibold text-muted">Reading this as</span>
          {chips.map((c, i) => (
            <span key={c.k} className="chip sm pop" style={{ animationDelay: `${i * 60}ms` }}>
              {c.l}
              <button className="x" onClick={() => onRemove(c.k)} aria-label={`Remove ${c.l}`}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AiMsg({ m, step, onRetry, onEdit }: { m: ChatMsg; step: number; onRetry: () => void; onEdit: () => void }) {
  const [more, setMore] = useState(false);
  const [left, setLeft] = useState(false);
  if (m.status === "working")
    return (
      <div className="flex flex-col gap-3">
        <div className="bubble-ai flex items-center gap-3"><span className="dots"><i /><i /><i /></span><span className="text-[15px] font-medium text-ink-2">{STEPS[step]}…</span></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((k) => <div key={k} className={cx("skel h-[340px] rounded-[24px]", k > 0 && "hidden sm:block", k > 1 && "sm:hidden xl:block")} />)}</div>
      </div>
    );
  if (m.status === "error")
    return (
      <div className="enter rounded-l bg-danger-tint p-5" role="alert">
        <h3 className="h3 text-danger-text">Swiggy signed you out</h3>
        <p className="mt-1 text-ink-2">Sign in again to search live menus. Your chat is saved.</p>
        <div className="mt-4 flex flex-wrap gap-3"><button className="btn sm" onClick={onRetry}><RotateCcw />Try again</button></div>
      </div>
    );
  const res = m.res!;
  const shown = more ? [...res.picks, ...res.more] : res.picks;
  return (
    <div className="flex flex-col gap-3">
      <div className="bubble-ai enter">{m.text}</div>
      {res.picks.length === 0 ? (
        <div className="card enter flex flex-col items-center gap-3 py-10 text-center">
          <div className="illo h-24 w-24">plate and fork</div>
          <h3 className="h3">Nothing fits all of that</h3>
          <p className="max-w-[40ch] text-muted">Drop one condition with the chips below, or start over.</p>
        </div>
      ) : (
        <div className="hscroll -mx-4 px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:px-0 xl:grid-cols-3">
          {shown.map((p, i) => <div key={p.id} className="w-[78%] sm:w-auto"><DishCard pick={p} rank={i} delay={i * 60} focus={res.focus} /></div>)}
        </div>
      )}
      {(res.more.length > 0 || res.hidden.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {res.more.length > 0 && !more && <button className="btn ghost xs" onClick={() => setMore(true)}>{res.more.length} more</button>}
          {res.hidden.length > 0 && <button className="btn ghost xs" onClick={() => setLeft((v) => !v)} aria-expanded={left}>{res.hidden.length} left out</button>}
        </div>
      )}
      {left && (
        <div className="grid gap-2">
          {res.hidden.map((h) => {
            const d = DISH[h.id];
            return (
              <div key={h.id} className="flex flex-wrap items-center justify-between gap-2 rounded-m bg-surface px-4 py-3">
                <div className="min-w-0"><b className="font-extrabold">{d.name}</b> <span className="text-sm text-muted">· {R[d.r].name} · Swiggy {R[d.r].sw} <Star size={12} className="inline -translate-y-px" /></span></div>
                <div className="flex items-center gap-3"><span className="chip sm">{h.why}</span><Link className="link text-sm" href={`/dish/${d.id}`}>Show it</Link></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CompareThese({ ids }: { ids: string[] }) {
  const { compare, setCompare } = useStore();
  const router = useRouter();
  return <button className="chip accent" onClick={() => { setCompare([...new Set([...ids, ...compare])].slice(0, 4)); router.push("/compare"); }}><Columns3 />Compare these</button>;
}

function RateNudge({ id, className }: { id: string; className?: string }) {
  const d = DISH[id];
  return (
    <Link href="/orders" className={cx("flex items-center gap-3 rounded-m bg-card p-3 pr-4 shadow-flat transition hover:shadow-float", className)}>
      <Photo dish={d} i={2} kind="delivered" className="h-14 w-14 flex-none" radius={12} />
      <div className="min-w-0 flex-1"><div className="font-extrabold">How was the {d.name.toLowerCase()}?</div><div className="text-sm text-muted">Rate it to sharpen your picks</div></div>
      <ArrowRight size={18} className="text-muted" />
    </Link>
  );
}

function Rail() {
  const { compare, toggleCompare, prefs, setPrefs, orders } = useStore();
  const needs = orders.find((o) => o.status === "needs");
  const rules = prefs.rules.filter((r) => r.on);
  return (
    <aside className="hidden min-w-0 flex-col gap-4 lg:col-span-4 lg:flex">
      {compare.length > 0 && <section className="card">
        <div className="mb-3 flex items-center justify-between"><h3 className="h3">Compare</h3><span className="num text-sm font-semibold text-muted">{compare.length} of 4</span></div>
        {(
          <div className="grid gap-2">
            {compare.map((id) => (
              <div key={id} className="flex items-center gap-3">
                <Photo dish={DISH[id]} kind="delivered" className="h-11 w-11 flex-none" radius={10} />
                <div className="min-w-0 flex-1"><div className="truncate font-extrabold">{DISH[id].name}</div><div className="truncate text-xs text-muted">{R[DISH[id].r].name}</div></div>
                <button className="btn ghost icon !h-8 !w-8" onClick={() => toggleCompare(id)} aria-label={`Remove ${DISH[id].name}`}><X size={14} /></button>
              </div>
            ))}
            {compare.length < 2 ? <p className="mt-1 text-sm text-muted">Add one more to compare.</p> : <Link href="/compare" className="btn sm mt-2">Compare {compare.length} <ArrowRight /></Link>}
          </div>
        )}
      </section>}
      <section className="card">
        <div className="mb-3 flex items-center justify-between"><h3 className="h3">Your taste</h3><Link href="/taste" className="link text-sm">Edit</Link></div>
        <div className="seg full mb-3" role="group" aria-label="Who's eating">
          <button aria-pressed={prefs.party === 1} onClick={() => setPrefs((p) => ({ ...p, party: 1 }))}>For one</button>
          <button aria-pressed={prefs.party === 2} onClick={() => setPrefs((p) => ({ ...p, party: 2 }))}>For two</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {rules.length ? rules.map((r) => <span key={r.id} className="chip sm">{ruleLabel(r)} · {ACTION_LABEL[r.action].toLowerCase()}</span>) : <span className="text-sm text-muted">No rules yet</span>}
        </div>
      </section>
      {needs && <RateNudge id={needs.dish} />}
    </aside>
  );
}
