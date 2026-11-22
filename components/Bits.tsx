import { inr, cx } from "@/lib/format";

export function Dumbbell({ dine, app }: { dine: number; app: number }) {
  const lo = Math.min(dine, app) * 0.8, hi = app * 1.08, x = (v: number) => ((v - lo) / (hi - lo)) * 100;
  return (
    <div className="relative h-12" role="img" aria-label={`₹${dine} at the restaurant, ₹${app} on Swiggy`}>
      <div className="absolute top-[14px] h-[3px] rounded-full bg-surface-2" style={{ left: 0, right: 0 }} />
      <div className="absolute top-[14px] h-[3px] rounded-full bg-ink-2" style={{ left: `${x(dine)}%`, width: `${x(app) - x(dine)}%` }} />
      <div className="absolute top-[9px] h-[13px] w-[13px] -translate-x-1/2 rounded-full border-2 border-ink-2 bg-card" style={{ left: `${x(dine)}%` }} />
      <div className="absolute top-[8px] h-[15px] w-[15px] -translate-x-1/2 rounded-full bg-accent-500" style={{ left: `${x(app)}%` }} />
      <div className="absolute top-7 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-muted" style={{ left: `${x(dine)}%` }}><span className="num text-ink">{inr(dine)}</span> dine-in</div>
      <div className="absolute top-7 -translate-x-[85%] whitespace-nowrap text-xs font-semibold text-muted" style={{ left: `${x(app)}%` }}><span className="num text-ink">{inr(app)}</span> app</div>
    </div>
  );
}

export function Fraction({ a, b }: { a: number; b: number }) {
  return (
    <span className="flex items-center gap-2" aria-label={`${a} of ${b} photos`}>
      <span className="hidden gap-[2px] sm:flex">{Array.from({ length: b }, (_, i) => <span key={i} className={cx("h-3 w-1.5 rounded-[2px]", i < a ? "bg-ink-2" : "bg-surface-2")} />)}</span>
      <span className="num text-xs font-semibold text-muted">{a}/{b}</span>
    </span>
  );
}

export function Hl({ text, hl }: { text: string; hl: string }) {
  const i = text.indexOf(hl);
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark>{hl}</mark>{text.slice(i + hl.length)}</>;
}

