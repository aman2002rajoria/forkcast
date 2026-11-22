"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, eyebrow, children, wide }: { open: boolean; onClose: () => void; title: string; eyebrow?: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const first = ref.current?.querySelector<HTMLElement>("input,button:not([data-close]),a");
    first?.focus();
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4" style={{ background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)", animation: "fade .2s both" }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="pop w-full overflow-auto rounded-l bg-card p-7 shadow-lift" style={{ maxWidth: wide ? 760 : 520, maxHeight: "calc(100dvh - 32px)" }}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
            <h2 className="h2">{title}</h2>
          </div>
          <button data-close className="btn ghost icon" onClick={onClose} aria-label="Close"><X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
