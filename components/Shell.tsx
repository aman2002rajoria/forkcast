"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, Columns3, Compass, Link2, MessageCircle, Receipt, RotateCcw, SearchX, SlidersHorizontal, WifiOff } from "lucide-react";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/format";
import { Modal } from "./Modal";

const TABS = [
  { href: "/", label: "Ask", Icon: MessageCircle },
  { href: "/explore", label: "Explore", Icon: Compass },
  { href: "/compare", label: "Compare", Icon: Columns3 },
  { href: "/orders", label: "Orders", Icon: Receipt },
  { href: "/taste", label: "My taste", Icon: SlidersHorizontal },
];
const PORTFOLIO = process.env.NEXT_PUBLIC_PORTFOLIO_URL;

export function TopBar() {
  const { reset, toast, setPreview, setOnboarded } = useStore();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [connect, setConnect] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [menu]);
  const item = "flex w-full items-center gap-3 rounded-s px-3 py-2.5 text-left text-[15px] font-medium hover:bg-surface";
  return (
    <header className="sticky top-0 z-50 border-b border-line" style={{ background: "var(--glass)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", paddingTop: "env(safe-area-inset-top)" }}>
      <div className="wrap flex h-16 items-center gap-3">
        {PORTFOLIO && (
          <a href={PORTFOLIO} className="btn ghost sm mr-2 hidden lg:inline-flex"><ArrowLeft /> Aman&rsquo;s portfolio</a>
        )}
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Forkcast home">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-accent-500 text-lg font-black text-white" style={{ boxShadow: "0 3px 0 color-mix(in srgb, var(--accent-500) 65%, #000)" }}>F</span>
          <span className="hidden text-xl font-black min-[400px]:inline">Forkcast</span>
          <span className="hidden truncate text-[15px] font-medium text-muted md:inline">rate the dish, not the restaurant</span>
        </Link>
        <div className="flex-1" />
        <div className="relative" ref={ref}>
          <button className="badge warn" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            Test data <ChevronDown size={14} />
          </button>
          {menu && (
            <div role="menu" className="absolute right-0 top-11 z-50 w-64 rounded-m bg-card p-2 shadow-float" style={{ animation: "rise .3s var(--soft) both" }}>
              <button role="menuitem" className={item} onClick={() => { setMenu(false); setConnect(true); }}><Link2 size={16} className="text-muted" />Switch to my own data</button>
              <button role="menuitem" className={item} onClick={() => { setMenu(false); reset(); toast("Test data reset."); }}><RotateCcw size={16} className="text-muted" />Reset test data</button>
              <button role="menuitem" className={item} onClick={() => { setMenu(false); setOnboarded(false); router.push("/"); }}><ArrowLeft size={16} className="text-muted" />Show the welcome screen</button>
              <div className="my-1.5 h-px bg-line" />
              <div className="eyebrow px-3 pb-1 pt-2">Preview a state</div>
              <button role="menuitem" className={item} onClick={() => { setMenu(false); setPreview("empty"); router.push("/"); }}><SearchX size={16} className="text-muted" />No results</button>
              <button role="menuitem" className={item} onClick={() => { setMenu(false); setPreview("error"); router.push("/"); }}><WifiOff size={16} className="text-muted" />Swiggy signed out</button>
            </div>
          )}
        </div>
        <Link href="/story" className="btn ghost sm hidden sm:inline-flex">How I built it <ArrowRight /></Link>
        <Link href="/story" className="btn ghost icon sm:hidden" aria-label="How I built it"><BookOpen /></Link>
      </div>
      <ConnectModal open={connect} onClose={() => setConnect(false)} />
    </header>
  );
}

export function ConnectModal({ open, onClose, onTest }: { open: boolean; onClose: () => void; onTest?: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Connect Swiggy" eyebrow="Use my own data">
      <p className="text-ink-2">Sign in on Swiggy with your phone and OTP. Forkcast never sees the OTP, and can&rsquo;t pay or place orders.</p>
      <div className="my-5 flex flex-wrap gap-2">
        <span className="chip">Search menus</span><span className="chip">Add to cart</span><span className="chip">Read past orders</span>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button className="btn ghost" disabled>Sign in with Swiggy <span className="badge">Soon</span></button>
        <button className="btn primary" onClick={onTest ?? onClose}>Try with test data</button>
      </div>
      <p className="reassure mt-3 text-right">Live sign-in needs Swiggy builder access. Not in this build yet.</p>
    </Modal>
  );
}

export function Nav() {
  const path = usePathname();
  const { compare, orders, onboarded, ready } = useStore();
  const needs = orders.some((o) => o.status === "needs");
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href)) || (href === "/" && path.startsWith("/dish")) || (href === "/explore" && path.startsWith("/restaurants"));
  const badge = (href: string) =>
    href === "/compare" && compare.length ? <span className="num ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[11px] font-extrabold text-card">{compare.length}</span>
      : href === "/orders" && needs ? <span className="ml-1 h-2 w-2 rounded-full bg-accent-500" aria-label="needs feedback" /> : null;
  if (path.startsWith("/story") || (path === "/" && ready && !onboarded)) return null;
  const onDish = path.startsWith("/dish");
  return (
    <>
      <nav className="wrap hidden pt-4 sm:block" aria-label="Sections">
        <div className="seg">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} aria-current={active(t.href) ? "page" : undefined} className={cx("inline-flex min-h-[38px] items-center rounded-full px-4 text-sm font-semibold transition", active(t.href) ? "bg-card text-ink shadow-[0_0_0_1px_var(--line),0_1px_0_var(--line)]" : "text-muted hover:text-ink")}>
              {t.label}{badge(t.href)}
            </Link>
          ))}
        </div>
      </nav>
      <nav aria-label="Sections" className={cx("fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-line sm:hidden", onDish && "hidden")} style={{ background: "var(--glass)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", padding: "6px max(8px, env(safe-area-inset-right)) calc(6px + env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left))" }}>
        {TABS.map(({ href, label, Icon }) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={cx("relative flex min-h-[50px] flex-col items-center justify-center gap-0.5 rounded-[14px] text-xs font-semibold", active(href) ? "text-accent-700" : "text-muted")}>
            <Icon size={22} strokeWidth={1.75} />
            <span className="flex items-center">{label}{badge(href)}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

export function Toast() {
  const { toastMsg } = useStore();
  if (!toastMsg) return null;
  return (
    <div role="status" className="fixed left-1/2 z-[90] max-w-[calc(100%-32px)] -translate-x-1/2 rounded-full px-5 py-3 text-[15px] font-medium shadow-float" style={{ bottom: "calc(24px + var(--tabbar-h))", background: "var(--dark)", color: "var(--dark-fg)", animation: "rise .3s var(--soft) both" }}>
      {toastMsg}
    </div>
  );
}
