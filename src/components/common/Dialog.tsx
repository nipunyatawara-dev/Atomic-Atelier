"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Dialog({ title, eyebrow, children, onClose, wide = false, className = "" }: { title: string; eyebrow?: string; children: ReactNode; onClose: () => void; wide?: boolean; className?: string }) {
  const titleId = useId();
  const [portalHost, setPortalHost] = useState<Element | null>(() => typeof document === "undefined" ? null : document.fullscreenElement ?? document.body);
  useEffect(() => {
    const sync = () => setPortalHost(document.fullscreenElement ?? document.body);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const ref = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.querySelector<HTMLElement>("button, input, select")?.focus();
    const onKey = (event: KeyboardEvent) => {
      // Only the top dialog handles keyboard input when a term explanation is open.
      const dialogs = document.querySelectorAll('[role="dialog"]');
      if (dialogs[dialogs.length - 1] !== dialog) return;
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); previous?.focus(); };
  }, [portalHost]);
  if (!portalHost) return null;
  return createPortal(
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section ref={ref} className={`dialog-card ${wide ? "wide" : ""} ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        {eyebrow && <em className="dialog-eyebrow">{eyebrow}</em>}
        <h2 id={titleId}>{title}</h2>
        {children}
      </section>
    </div>,
    portalHost,
  );
}
