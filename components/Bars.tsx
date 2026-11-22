import { ASPECTS, type Aspect, type Dish } from "@/lib/types";

export function Bars({ dish, keys = ["taste", "quantity", "quality"], focus, compact }: { dish: Dish; keys?: Aspect[]; focus?: Aspect; compact?: boolean }) {
  return (
    <div className="grid" style={{ gap: compact ? 6 : 10 }}>
      {keys.map((k) => (
        <div key={k} className="bar" style={compact ? { gridTemplateColumns: "58px minmax(0,1fr) 26px", fontSize: 12.5 } : undefined}>
          <span>{ASPECTS.find((a) => a.key === k)!.label}</span>
          <div className="track" style={compact ? { height: 6 } : undefined}>
            <div className={`fill ${focus === k ? "on" : ""}`} style={{ width: `${(dish.s[k] / 5) * 100}%` }} />
          </div>
          <span className="val">{dish.s[k].toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}
