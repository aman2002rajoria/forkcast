export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
export const num = (n: number) => n.toLocaleString("en-IN");
export const gap = (app: number, dine: number | null) => {
  if (dine == null) return null;
  const diff = app - dine;
  return { diff, pct: Math.round((diff / dine) * 100) };
};
export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
