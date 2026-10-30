"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CARBON, elementByNumber } from "@/features/explorer/lib/elements";
import { formatElementProperty } from "@/lib/elementProperties";
import { ArrowRight, Check, X } from "lucide-react";

let sessionStep: number | null = null;

export const LESSON_INVITATION_KEY = "atomic-atelier:lesson-invitation-hidden:v1";
export const LESSON_KEY = "atomic-atelier:carbon-lesson:v1";
const steps = [
  { title: "Meet Carbon", href: "/?element=carbon&lesson=carbon", task: `Highlight Carbon’s outer electrons in the viewer. Notice the ${CARBON.shells.at(-1)} electrons in its outer shell.`, action: "Compare with Nitrogen" },
  { title: "Compare the pull", href: "/?element=carbon&compare=nitrogen&lesson=carbon", task: `Compare the electronegativity values: Carbon ${formatElementProperty(CARBON, "electronegativity")} and Nitrogen ${formatElementProperty(elementByNumber.get(7)!, "electronegativity")}. Which atom attracts shared electrons more strongly?`, action: "See the periodic pattern" },
  { title: "Find the pattern", href: "/trends?property=electronegativity&element=nitrogen&lesson=carbon", task: "Find Nitrogen beside Carbon in the table. Electronegativity generally increases across this period. Try the 2D heatmap for a direct comparison.", action: "Explore Carbon Dioxide" },
  { title: "From atom to molecule", href: "/molecules?molecule=carbon-dioxide&lesson=carbon", task: "Inspect CO₂’s linear shape and net dipole. Its two C=O bond polarities point in opposite directions and cancel.", action: "Make a prediction" },
  { title: "Make a prediction", href: "/molecules?molecule=carbon-dioxide&lesson=carbon", task: "CO₂ has polar C=O bonds. What do you predict about the whole molecule?", action: "Finish lesson" },
];

export function LessonJourney({ readySteps, onHighlight }: { readySteps: number[]; onHighlight?: () => void }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [step, setStep] = useState<number | null>(null);
  const [invitationHidden, setInvitationHidden] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const query = params.toString();

  useEffect(() => {
    let saved: number | null = null;
    try {
      const raw = window.localStorage.getItem(LESSON_KEY);
      const value: unknown = raw === null ? null : JSON.parse(raw);
      if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= steps.length) saved = value;
    } catch { saved = sessionStep; }
    if (saved === null && new URLSearchParams(query).get("lesson") === "carbon") {
      saved = 0;
      sessionStep = 0;
      try { window.localStorage.setItem(LESSON_KEY, "0"); } catch { /* Session fallback. */ }
    }
    let hidden = false;
    try { hidden = window.localStorage.getItem(LESSON_INVITATION_KEY) === "true"; } catch { /* Optional preference. */ }
    queueMicrotask(() => { setStep(saved); setLoaded(true); setAnswer(null); setInvitationHidden(hidden); });
  }, [query]);

  const save = (next: number | null) => {
    sessionStep = next;
    setStep(next);
    setAnswer(null);
    try {
      if (next === null) window.localStorage.removeItem(LESSON_KEY);
      else window.localStorage.setItem(LESSON_KEY, JSON.stringify(next));
    } catch { /* Keep session state. */ }
  };

  if (!loaded) return null;
  if ((step === null || step === steps.length) && invitationHidden) return null;
  if (step === null || step === steps.length) return (
    <section className="lesson-invitation" aria-label="Guided chemistry lesson">
      <div><strong>{step === steps.length ? "Lesson complete. Keep exploring." : "From atoms to molecules"}</strong><span>A short guided lesson through Carbon, periodic trends, and CO₂.</span></div>
      <Link href={steps[0].href} aria-label={step === steps.length ? "Review lesson" : "Start guided lesson"} onClick={() => save(0)}>{step === steps.length ? "Review lesson" : "Start lesson"}<ArrowRight size={16} /></Link>
      <button className="lesson-invitation-close" type="button" aria-label="Hide lesson invitation" onClick={() => { setInvitationHidden(true); try { window.localStorage.setItem(LESSON_INVITATION_KEY, "true"); } catch { /* Session dismissal. */ } }}><X size={17} /></button>
    </section>
  );

  const current = steps[step];
  const ready = readySteps.includes(step);
  return (
    <section className="lesson-journey" aria-label="Carbon guided lesson">
      <div className="lesson-heading"><strong>{current.title}</strong><span>Activity {step + 1} of {steps.length}</span><button type="button" aria-label="Leave lesson" onClick={() => { save(null); const search = new URLSearchParams(query); search.delete("lesson"); router.replace(`${pathname}${search.size ? `?${search}` : ""}`, { scroll: false }); }}><X size={18} /></button></div>
      <ol className="lesson-progress" aria-label="Lesson progress">{steps.map((item, index) => <li key={item.title} aria-current={index === step ? "step" : undefined} className={index < step ? "complete" : ""}>{index < step && <Check size={12} />}<span>{item.title}</span></li>)}</ol>
      <p>{current.task}</p>
      {!ready ? step === 0 && onHighlight ? <button type="button" className="lesson-next" onClick={onHighlight}>Highlight outer electrons <ArrowRight size={16} /></button> : <Link className="lesson-next" href={current.href}>Open this activity <ArrowRight size={16} /></Link> : step < 4 ? (
        <Link className="lesson-next" href={steps[step + 1].href} onClick={() => save(step + 1)}>{current.action}<ArrowRight size={16} /></Link>
      ) : (
        <div className="lesson-prediction">
          <div role="group" aria-label="Predict CO₂ polarity">{["Non-polar: its opposing bond dipoles cancel", "Polar: every molecule with polar bonds is polar", "Its polarity depends only on its mass"].map((option, index) => <button key={option} type="button" aria-pressed={answer === index} onClick={() => setAnswer(index)}>{option}</button>)}</div>
          {answer !== null && <p role="status">{answer === 0 ? "Exactly. CO₂ is linear and symmetric, so the two equal, opposing bond dipoles cancel." : "Look at the complete shape. Polar bonds can cancel when they have equal strength and point in opposite directions. Try again."}</p>}
          {answer === 0 && <button className="lesson-next" type="button" onClick={() => save(steps.length)}>Finish lesson <Check size={16} /></button>}
        </div>
      )}
    </section>
  );
}
