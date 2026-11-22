"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { DISH, R } from "@/lib/data";
import { gap, inr, num, cx } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Aspect, Pick } from "@/lib/types";
import { Bars } from "./Bars";
import { Icon } from "./Icon";
import { Photo } from "./Photo";
import { PHOTO_DATES } from "@/lib/photo";

/** A pick inside a chat reply. The one orange bar is the aspect the reply talks about. */
export function DishCard({ pick, delay = 0, rank, focus = null }: { pick: Pick; delay?: number; rank?: number; focus?: Aspect | null }) {
  const d = DISH[pick.id];
  const r = R[d.r];
  const router = useRouter();
  const { compare, toggleCompare } = useStore();
  const [why, setWhy] = useState(false);
  const inCompare = compare.includes(d.id);
  const g = gap(d.price, d.dine);
  return (
    <article
      className="enter group flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] bg-card shadow-flat transition hover:shadow-float"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => router.push(`/dish/${d.id}`)}
    >
      <div className="relative">
        <Photo dish={d} i={0} kind="delivered" ratio="16 / 10" radius={0} label={`Delivered · ${PHOTO_DATES[0]}`} />
        {rank === 0 && <span className="badge absolute left-2 top-2" style={{ background: "var(--card)", color: "var(--ink)" }}>Top pick</span>}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="h3 text-[18px]">
              <Link href={`/dish/${d.id}`} onClick={(e) => e.stopPropagation()} className="group-hover:underline">{d.name}</Link>
            </h3>
            <p className="mt-0.5 truncate text-sm font-medium text-muted">{r.name}</p>
          </div>
          <div className="flex-none text-right">
            <div className="num text-[26px] font-black leading-none">{pick.score.toFixed(1)}</div>
            <div className="whitespace-nowrap text-[11px] font-semibold text-muted">for you</div>
          </div>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="num font-extrabold">{inr(d.price)}</span>
          <span className="text-muted">{g ? <>+{inr(g.diff)} vs dine-in</> : "delivery only"}</span>
          <span className="num ml-auto whitespace-nowrap font-semibold text-ink-2">{r.eta} min</span>
        </div>
        <p className="text-[13px] font-medium text-muted">Based on <span className="num">{num(d.rev)}</span> reviews and <span className="num">{num(d.ph)}</span> photos</p>
        <Bars dish={d} compact focus={focus ?? undefined} />
        {(r.type === "cloud" || pick.flags.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {r.type === "cloud" && <span className="chip warn sm"><Icon name="Building2" />Cloud kitchen · {r.brands} brands</span>}
            {pick.flags.map((f) => <span key={f.text} className="chip warn sm"><Icon name={f.icon} />{f.text}</span>)}
          </div>
        )}
        {why && (
          <div className="rounded-s bg-surface px-3 py-2.5 text-[14px] text-ink-2" onClick={(e) => e.stopPropagation()}>
            {d.why.map((w) => <p key={w}>{w}</p>)}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <button className="link text-sm" onClick={(e) => { e.stopPropagation(); setWhy((v) => !v); }} aria-expanded={why}>{why ? "Less" : "Why this?"}</button>
          <button className={cx("btn xs", !inCompare && "ghost")} onClick={(e) => { e.stopPropagation(); toggleCompare(d.id); }} aria-pressed={inCompare}>
            {inCompare ? <><Check />Comparing</> : <><Plus />Compare</>}
          </button>
        </div>
      </div>
    </article>
  );
}
