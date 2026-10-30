"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

/** Native fullscreen when available, with an expanded viewport fallback. */
export function useViewerExpansion(ref: RefObject<HTMLElement | null>) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = useCallback(async () => {
    const element = ref.current;
    if (!element) return;
    if (document.fullscreenElement === element) { await document.exitFullscreen(); return; }
    if (expanded) { setExpanded(false); return; }
    try {
      if (element.requestFullscreen) { await element.requestFullscreen(); return; }
    } catch { /* Some mobile browsers do not support element fullscreen. */ }
    setExpanded(true);
  }, [expanded, ref]);
  useEffect(() => {
    const change = () => setExpanded(document.fullscreenElement === ref.current);
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); };
    document.addEventListener("fullscreenchange", change);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("fullscreenchange", change);
      document.removeEventListener("keydown", escape);
    };
  }, [ref]);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("viewer-expanded");
    return () => {
      document.body.style.overflow = previous;
      document.documentElement.classList.remove("viewer-expanded");
    };
  }, [expanded]);
  return { expanded, toggleExpanded };
}
