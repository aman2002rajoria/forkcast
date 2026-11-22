"use client";

import { useState } from "react";
import { ArrowLeft, Building2, Carrot, Droplet, Flame, IndianRupee, Leaf, MapPin, ShieldAlert, Timer, Users, type LucideIcon } from "lucide-react";
import { ALLERGENS, DISHES, INGREDIENTS, R } from "@/lib/data";
import { ACTION_LABEL, RULE_KINDS, ruleLabel, ruleMatches } from "@/lib/rules";
import type { Rule, RuleAction, RuleKind } from "@/lib/types";
import { cx } from "@/lib/format";
import { Modal } from "./Modal";

const ICONS: Record<string, LucideIcon> = { Carrot, Leaf, ShieldAlert, Building2, Flame, IndianRupee, MapPin, Timer, Users, Droplet };
export const RuleIcon = ({ kind, size = 18 }: { kind: RuleKind; size?: number }) => {
  const I = ICONS[RULE_KINDS.find((k) => k.kind === kind)!.icon];
  return <I size={size} strokeWidth={1.75} aria-hidden />;
};
type Draft = Omit<Rule, "id" | "on" | "source">;

const DEFAULTS: Record<RuleKind, Draft> = {
  ingredient: { kind: "ingredient", value: "onion", form: "raw", action: "warn" },
  diet: { kind: "diet", value: "veg", action: "hide" },
  allergen: { kind: "allergen", value: "nuts", action: "hide" },
  kitchen: { kind: "kitchen", value: "cloud", action: "lower" },
  spice: { kind: "spice", value: 2, action: "hide" },
  price: { kind: "price", value: 400, action: "hide" },
  distance: { kind: "distance", value: 5, action: "lower" },
  travel: { kind: "travel", value: "badly", action: "warn" },
  portion: { kind: "portion", value: 2, action: "lower" },
  oily: { kind: "oily", value: "oily", action: "lower" },
};

/** "Hides 3 of 14 dishes near you" */
export function impact(rules: Draft[]) {
  const hit = DISHES.filter((d) => rules.some((r) => ruleMatches({ ...r, id: "", on: true, source: "you" }, d, R[d.r]))).length;
  const n = DISHES.length;
  if (!hit) return "No dishes near you match yet";
  if (hit === n) return `Matches all ${n} dishes. Loosen it?`;
  const verb = rules.every((r) => r.action === "hide") ? "Hides" : rules.every((r) => r.action === "warn") ? "Flags" : rules.every((r) => r.action === "lower") ? "Moves down" : "Affects";
  return `${verb} ${hit} of ${n} dishes near you`;
}

export function RuleBuilder({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (r: Draft) => void }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const close = () => { setDraft(null); onClose(); };
  const set = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const Pills = <T extends string | number>({ opts, value, on, label }: { opts: { v: T; l: string }[]; value: T; on: (v: T) => void; label: string }) => (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {opts.map((o) => <button key={String(o.v)} className={cx("chip", value === o.v && "accent")} aria-pressed={value === o.v} onClick={() => on(o.v)}>{o.l}</button>)}
    </div>
  );
  return (
    <Modal open={open} onClose={close} title={draft ? ruleLabel(draft) : "Add a rule"} eyebrow={draft ? "New rule" : "What should Forkcast watch for?"}>
      {!draft ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {RULE_KINDS.map((k) => (
            <button key={k.kind} onClick={() => setDraft({ ...DEFAULTS[k.kind] })} className="flex flex-col items-start gap-2 rounded-m bg-surface p-4 text-left transition hover:bg-[var(--surface-2)] active:scale-[.97]">
              <RuleIcon kind={k.kind} size={20} />
              <span className="font-extrabold leading-tight">{k.label}</span>
              <span className="text-xs font-medium text-muted">{k.hint}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <button className="link -mt-2 w-fit text-sm" onClick={() => setDraft(null)}><ArrowLeft />All rule types</button>
          {draft.kind === "ingredient" && (
            <>
              <Pills label="Ingredient" opts={INGREDIENTS.map((v) => ({ v, l: v }))} value={String(draft.value)} on={(v) => set({ value: v })} />
              <div className="seg" role="group" aria-label="Form">
                <button aria-pressed={draft.form === "raw"} onClick={() => set({ form: "raw" })}>Only raw</button>
                <button aria-pressed={draft.form !== "raw"} onClick={() => set({ form: "any" })}>Raw or cooked</button>
              </div>
            </>
          )}
          {draft.kind === "diet" && <Pills label="Diet" opts={[{ v: "veg", l: "Veg only" }, { v: "egg", l: "Veg and egg" }, { v: "jain", l: "Jain" }]} value={String(draft.value)} on={(v) => set({ value: v })} />}
          {draft.kind === "allergen" && (
            <>
              <Pills label="Allergen" opts={ALLERGENS.map((v) => ({ v, l: v }))} value={String(draft.value)} on={(v) => set({ value: v })} />
              <p className="rounded-s bg-warning-tint px-3 py-2 text-sm font-medium text-warning-text">From photos, menus and reviews, not the kitchen. Ask before you order.</p>
            </>
          )}
          {draft.kind === "spice" && <Pills label="Max spice" opts={[{ v: 0, l: "No spice" }, { v: 1, l: "Mild" }, { v: 2, l: "Medium" }]} value={Number(draft.value)} on={(v) => set({ value: v })} />}
          {draft.kind === "price" && <Pills label="Max price" opts={[200, 300, 400, 500].map((v) => ({ v, l: `₹${v}` }))} value={Number(draft.value)} on={(v) => set({ value: v })} />}
          {draft.kind === "distance" && <Pills label="Max distance" opts={[3, 5, 7].map((v) => ({ v, l: `${v} km` }))} value={Number(draft.value)} on={(v) => set({ value: v })} />}
          <div>
            <div className="eyebrow mb-2">Then</div>
            <div className="seg full" role="group" aria-label="Action">
              {(["warn", "lower", "hide"] as RuleAction[]).map((a) => <button key={a} aria-pressed={draft.action === a} disabled={draft.kind === "allergen" && a !== "hide"} onClick={() => set({ action: a })}>{ACTION_LABEL[a]}</button>)}
            </div>
          </div>
          <p className="num font-semibold text-ink-2">{impact([draft])}</p>
          <div className="flex justify-end gap-3">
            <button className="btn ghost" onClick={close}>Cancel</button>
            <button className="btn" onClick={() => { onAdd(draft); close(); }}>Add rule</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
