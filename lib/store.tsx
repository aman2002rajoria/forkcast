"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CopilotResponse, Intent, Order, Prefs, Rule } from "./types";
import { DEFAULT_ORDERS } from "./data";
import { newId } from "./rules";

export const DEFAULT_PREFS = (): Prefs => ({
  weights: { taste: 1, quantity: 0.6, quality: 1.2, packaging: 0.4, value: 0.5 },
  party: 1,
  rules: [
    { id: "r-cloud", kind: "kitchen", value: "cloud", action: "lower", on: true, source: "learned" },
    { id: "r-onion", kind: "ingredient", value: "onion", form: "raw", action: "warn", on: true, source: "you" },
  ],
  pending: [
    {
      id: "s-quality",
      text: "Count quality more than quantity",
      why: "2 of your last 3 orders: more food than shown, worse cooking.",
      apply: { type: "weights", delta: { quality: 0.3, quantity: -0.2 } },
    },
  ],
  learned: [{ id: "l-cloud", text: "Cloud kitchens ranked lower", why: "From your veg momos, 2 Nov" }],
  avoidDishes: [],
});

export interface ChatMsg {
  id: string;
  role: "user" | "ai";
  text: string;
  intent?: Intent;
  res?: CopilotResponse;
  status?: "working" | "done" | "error";
}

interface Feedback { match?: "yes" | "mostly" | "no"; verdict?: "better" | "same" | "worse"; aspects?: Record<string, "worse" | "same" | "better">; tags?: string[]; img?: string }

interface Store {
  ready: boolean;
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
  prefs: Prefs;
  setPrefs: (fn: (p: Prefs) => Prefs) => void;
  orders: Order[];
  setOrders: (fn: (o: Order[]) => Order[]) => void;
  feedback: Record<string, Feedback>;
  setFeedback: (id: string, fn: (f: Feedback) => Feedback) => void;
  compare: string[];
  toggleCompare: (id: string) => void;
  setCompare: (ids: string[]) => void;
  chat: ChatMsg[];
  setChat: (fn: (c: ChatMsg[]) => ChatMsg[]) => void;
  addRules: (rules: Omit<Rule, "id" | "on" | "source">[], source?: Rule["source"]) => void;
  toast: (msg: string) => void;
  toastMsg: string | null;
  reset: () => void;
  preview: null | "empty" | "error";
  setPreview: (p: null | "empty" | "error") => void;
}

const Ctx = createContext<Store | null>(null);
const KEY = "forkcast-v2";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(true);
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [orders, setOrdersState] = useState<Order[]>(DEFAULT_ORDERS);
  const [feedback, setFb] = useState<Record<string, Feedback>>({});
  const [compare, setCompareState] = useState<string[]>([]);
  const [chat, setChatState] = useState<ChatMsg[]>([]);
  const [toastMsg, setToast] = useState<string | null>(null);
  const [preview, setPreview] = useState<null | "empty" | "error">(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load after mount so the server render and the first client render match.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.prefs) {
          // Older saves stored weight suggestions as { quality, quantity }; convert them to { delta }.
          type Old = { apply?: { type?: string; delta?: unknown; quality?: number; quantity?: number } };
          const pending = (s.prefs.pending ?? []).map((p: Old) =>
            p.apply?.type === "weights" && !p.apply.delta ? { ...p, apply: { type: "weights", delta: { quality: p.apply.quality ?? 0, quantity: p.apply.quantity ?? 0 } } } : p);
          setPrefsState({ ...DEFAULT_PREFS(), ...s.prefs, pending, avoidDishes: s.prefs.avoidDishes ?? [] });
        }
        if (s.orders) setOrdersState(s.orders);
        if (s.compare) setCompareState(s.compare);
        if (s.feedback) setFb(s.feedback);
        setOnboarded(!!s.onboarded);
      } else setOnboarded(false);
    } catch { setOnboarded(false); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify({ prefs, orders, compare, feedback, onboarded })); } catch { /* storage blocked: keep working in memory */ }
  }, [ready, prefs, orders, compare, feedback, onboarded]);

  const toast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const value = useMemo<Store>(() => ({
    ready, onboarded, setOnboarded,
    prefs, setPrefs: (fn) => setPrefsState((p) => fn(p)),
    orders, setOrders: (fn) => setOrdersState((o) => fn(o)),
    feedback, setFeedback: (id, fn) => setFb((all) => ({ ...all, [id]: fn(all[id] || {}) })),
    compare,
    toggleCompare: (id) => setCompareState((c) => {
      if (c.includes(id)) return c.filter((x) => x !== id);
      if (c.length >= 4) { toast("Compare holds 4. Remove one first."); return c; }
      return [...c, id];
    }),
    setCompare: setCompareState,
    chat, setChat: (fn) => setChatState((c) => fn(c)),
    addRules: (rules, source = "you") => setPrefsState((p) => ({ ...p, rules: [...p.rules, ...rules.map((r) => ({ ...r, id: newId(), on: true, source }))] })),
    toast, toastMsg,
    reset: () => { setPrefsState(DEFAULT_PREFS()); setOrdersState(DEFAULT_ORDERS); setCompareState([]); setChatState([]); setFb({}); setPreview(null); },
    preview, setPreview,
  }), [ready, onboarded, prefs, orders, feedback, compare, chat, toast, toastMsg, preview]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
