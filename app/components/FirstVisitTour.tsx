"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Atom, FlaskConical, Grid3X3, MousePointer2 } from "lucide-react";
import { Dialog } from "./Dialog";

export const TOUR_KEY = "atomic-atelier:tour-complete:v1";

const steps = [
  {
    eyebrow: "Welcome to Atomic Atelier",
    title: "Meet matter up close",
    icon: Atom,
    copy: "Rotate, zoom, and change the teaching view to see how an element’s nucleus, shells, and valence electrons fit together.",
    note: "Start anywhere—the explorer remembers where you left off.",
  },
  {
    eyebrow: "Find the pattern",
    title: "Move from atoms to trends",
    icon: Grid3X3,
    copy: "Search all 118 elements, open the periodic table, then compare two elements to see how position changes their properties.",
    note: "Try Carbon and Nitrogen for a clear across-period trend.",
  },
  {
    eyebrow: "Learn by doing",
    title: "Test and apply it",
    icon: FlaskConical,
    copy: "Take quick quizzes, save useful elements, and balance guided reactions while the app tracks your progress on this device.",
    note: "Nothing is uploaded and you can explore without an account.",
  },
];

export function FirstVisitTour() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(TOUR_KEY) !== "true") queueMicrotask(() => setOpen(true));
    } catch {
      queueMicrotask(() => setOpen(true));
    }
  }, []);

  const finish = () => {
    try { window.localStorage.setItem(TOUR_KEY, "true"); } catch { /* Storage can be blocked. */ }
    setOpen(false);
  };

  if (!open) return null;
  const step = steps[index];
  const Icon = step.icon;

  return (
    <Dialog title={step.title} eyebrow={step.eyebrow} onClose={finish} className="tour-dialog">
      <div className="tour-visual" aria-hidden="true"><Icon /><span><MousePointer2 /></span></div>
      <p className="tour-copy">{step.copy}</p>
      <p className="tour-note">{step.note}</p>
      <div className="tour-footer">
        <div className="tour-dots" aria-label={`Step ${index + 1} of ${steps.length}`}>
          {steps.map((item, stepIndex) => <i key={item.title} className={stepIndex === index ? "active" : ""} />)}
        </div>
        <div className="tour-actions">
          {index === 0 ? <button onClick={finish}>Skip tour</button> : <button onClick={() => setIndex((value) => value - 1)}><ArrowLeft /> Back</button>}
          {index === steps.length - 1
            ? <button className="primary-button" onClick={finish}>Start exploring <ArrowRight /></button>
            : <button className="primary-button" onClick={() => setIndex((value) => value + 1)}>Next <ArrowRight /></button>}
        </div>
      </div>
    </Dialog>
  );
}
