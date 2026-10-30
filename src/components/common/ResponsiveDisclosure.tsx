"use client";

import { useEffect, useState, type ReactNode } from "react";

export function ResponsiveDisclosure({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(max-width: 760px)");
    const sync = () => setOpen(!media.matches);
    queueMicrotask(sync);
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return <details className="footer-disclosure" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}><summary>{title}</summary>{children}</details>;
}
