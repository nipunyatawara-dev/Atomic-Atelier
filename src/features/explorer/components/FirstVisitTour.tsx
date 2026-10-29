"use client";

import { useEffect, useState } from "react";
import { CircleDot, X } from "lucide-react";
import type { ElementRecord } from "@/types";

export const TOUR_KEY = "atomic-atelier:tour-complete:v1";

export function FirstVisitTour({ element, highlighted, onHighlight }: { element: ElementRecord; highlighted: boolean; onHighlight: () => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let complete = false;
    try { complete = window.localStorage.getItem(TOUR_KEY) === "true"; } catch { /* Optional storage. */ }
    if (!complete) queueMicrotask(() => setOpen(true));
  }, []);
  const finish = () => {
    try { window.localStorage.setItem(TOUR_KEY, "true"); } catch { /* Optional storage. */ }
    setOpen(false);
  };
  if (!open) return null;
  return (
    <section className="first-task" aria-label="First exploration task">
      <div><strong>{highlighted ? "You found the outer electrons" : `Try it: find ${element.name}’s outer electrons`}</strong>
        <p>{highlighted ? `The highlighted outer shell contains ${element.shells.at(-1)} electron${element.shells.at(-1) === 1 ? "" : "s"}. These help explain how atoms bond. Explore the other controls whenever you’re ready.` : "Highlight them in the real model, then rotate the atom to take a closer look."}</p></div>
      {highlighted ? <button type="button" className="primary-button" onClick={finish}>Keep exploring</button> : <button type="button" className="primary-button" onClick={onHighlight}><CircleDot size={16} /> Highlight outer electrons</button>}
      <button type="button" className="first-task-close" onClick={finish} aria-label="Dismiss first exploration task"><X size={18} /></button>
    </section>
  );
}
