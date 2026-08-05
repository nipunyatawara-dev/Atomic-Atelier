"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, ChevronUp, CircleHelp, FlaskConical, Lightbulb, Play, RotateCcw, Sparkles, X } from "lucide-react";
import { AppHeader } from "./AppHeader";
import { PeriodicTable } from "./PeriodicTable";
import { QuizModal } from "./QuizModal";
import { SavedModal } from "./SavedModal";
import { countSide, isBalanced } from "../lib/formula";
import { elementByNumber } from "../lib/elements";
import { DEFAULT_REACTION, formatEquation, reactions, resolveReaction } from "../lib/reactions";
import { useProgress } from "../lib/progress";
import type { ElementRecord, QuizQuestion, ReactionGrade, ReactionRecord } from "../lib/types";

const ReactionViewer = dynamic(() => import("./ReactionViewer").then((module) => module.ReactionViewer), { ssr: false, loading: () => <section className="reaction-viewer viewer-loading"><FlaskConical /><strong>Preparing particles…</strong></section> });

function initialCoefficients(reaction: ReactionRecord) {
  return { reactants: reaction.reactants.map(() => 1), products: reaction.products.map(() => 1) };
}

function gradeReaction(attempts: number, hints: number): ReactionGrade {
  const score = Math.max(40, 100 - Math.max(0, attempts - 1) * 10 - hints * 15);
  const label: ReactionGrade["label"] = score === 100 ? "Mastery" : score >= 85 ? "Strong" : score >= 70 ? "Developing" : "Guided";
  return { score, label, attempts, hints, completedAt: new Date().toISOString() };
}

export function ReactionLab() {
  const router = useRouter();
  const params = useSearchParams();
  const { progress, ready, completeReaction, visitReaction, recordQuiz } = useProgress();
  const [reaction, setReaction] = useState(() => resolveReaction(params.get("reaction")));
  const [coefficients, setCoefficients] = useState(() => initialCoefficients(reaction));
  const [message, setMessage] = useState<{ type: "success" | "hint" | "error"; text: string } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [performance, setPerformance] = useState<ReactionGrade | null>(null);
  const [animationRun, setAnimationRun] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [mobileLibrary, setMobileLibrary] = useState(false);
  const libraryRef = useRef<HTMLElement>(null);
  const libraryTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const requested = params.get("reaction");
    if (requested && resolveReaction(requested).slug !== requested) router.replace(`/reactions?reaction=${DEFAULT_REACTION.slug}`, { scroll: false });
  }, [params, router]);

  useEffect(() => {
    if (!ready || params.has("reaction") || progress.lastReaction === DEFAULT_REACTION.slug) return;
    const restored = resolveReaction(progress.lastReaction);
    queueMicrotask(() => {
      setReaction(restored);
      setCoefficients(initialCoefficients(restored));
    });
  }, [params, progress.lastReaction, ready]);

  useEffect(() => {
    if (!mobileLibrary) return;
    const previous = document.activeElement as HTMLElement | null;
    const trigger = libraryTriggerRef.current;
    libraryRef.current?.querySelector<HTMLButtonElement>(".reaction-list button")?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileLibrary(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      (previous ?? trigger)?.focus();
    };
  }, [mobileLibrary]);

  const balanced = isBalanced(reaction.reactants, reaction.products, coefficients.reactants, coefficients.products);
  const leftCounts = useMemo(() => countSide(reaction.reactants, coefficients.reactants), [reaction, coefficients.reactants]);
  const rightCounts = useMemo(() => countSide(reaction.products, coefficients.products), [reaction, coefficients.products]);
  const symbols = [...new Set([...Object.keys(leftCounts), ...Object.keys(rightCounts)])];

  const chooseReaction = (next: ReactionRecord) => {
    setReaction(next); setCoefficients(initialCoefficients(next)); setMessage(null); setAttempts(0); setHintsUsed(0); setPerformance(null); setAnimationRun(0); setAnimating(false); setMobileLibrary(false);
    visitReaction(next.slug);
    router.replace(`/reactions?reaction=${next.slug}`, { scroll: false });
  };

  const updateCoefficient = (side: "reactants" | "products", index: number, delta: number) => {
    setCoefficients((current) => ({ ...current, [side]: current[side].map((value, itemIndex) => itemIndex === index ? Math.min(9, Math.max(1, value + delta)) : value) }));
    setMessage(null); setPerformance(null); setAnimationRun(0);
  };

  const check = () => {
    const checkedAttempts = attempts + 1;
    setAttempts(checkedAttempts);
    if (balanced) {
      const grade = gradeReaction(checkedAttempts, hintsUsed);
      setPerformance(grade);
      setMessage({ type: "success", text: `Balanced. Every atom is conserved—${grade.label.toLowerCase()} technique at ${grade.score}%.` });
      completeReaction(reaction.slug, grade);
    } else {
      setPerformance(null);
      setMessage({ type: "error", text: "Not balanced yet. Compare the highlighted atom totals, then change one coefficient at a time." });
    }
  };

  const hint = () => {
    const correct = reaction.coefficients;
    const side = coefficients.reactants.some((value, index) => value !== correct.reactants[index]) ? "reactants" : "products";
    const index = coefficients[side].findIndex((value, itemIndex) => value !== correct[side][itemIndex]);
    if (index >= 0) {
      setHintsUsed((value) => value + 1);
      setPerformance(null);
      setCoefficients((current) => ({ ...current, [side]: current[side].map((value, itemIndex) => itemIndex === index ? correct[side][index] : value) }));
      const item = side === "reactants" ? reaction.reactants[index] : reaction.products[index];
      setMessage({ type: "hint", text: `Set the coefficient before ${item.formula} to ${correct[side][index]}. Now recount.` });
    } else setMessage({ type: "hint", text: "The coefficients are ready—check the equation." });
  };

  const reset = () => { setCoefficients(initialCoefficients(reaction)); setMessage(null); setAttempts(0); setHintsUsed(0); setPerformance(null); setAnimationRun(0); setAnimating(false); };
  const animate = () => { if (!balanced || animating) return; setAnimating(true); setAnimationRun((value) => value + 1); };
  const onAnimationComplete = useCallback(() => setAnimating(false), []);

  const reactionQuestion: QuizQuestion[] = [{ id: `reaction:${reaction.slug}`, ...reaction.question }];
  const navigateElement = (element: ElementRecord) => router.push(`/?element=${element.slug}`);
  const reactionIndex = reactions.findIndex((item) => item.slug === reaction.slug);

  const coefficientControl = (side: "reactants" | "products", item: ReactionRecord["reactants"][number], index: number) => (
    <div className="species-control" key={`${side}-${item.formula}`}>
      <div className="coefficient-stepper"><button onClick={() => updateCoefficient(side, index, 1)} aria-label={`Increase coefficient for ${item.label}`}><ChevronUp /></button><b>{coefficients[side][index]}</b><button onClick={() => updateCoefficient(side, index, -1)} aria-label={`Decrease coefficient for ${item.label}`}><ChevronDown /></button></div>
      <span><strong>{item.formula}</strong><small>{item.label} · ({item.state})</small></span>
    </div>
  );

  return (
    <main className="app-shell reaction-app">
      <AppHeader
        ref={libraryTriggerRef}
        active="reactions"
        onTable={() => setTableOpen(true)}
        onSaved={() => setSavedOpen(true)}
        mobileContext={{
          label: "Reactions",
          detail: `${String(reactionIndex + 1).padStart(2, "0")} of ${reactions.length}`,
          action: () => setMobileLibrary(true),
          expanded: mobileLibrary,
          controls: "reaction-library",
        }}
      />
      <div className="reaction-workspace">
        <aside id="reaction-library" ref={libraryRef} className={`reaction-library panel ${mobileLibrary ? "open" : ""}`} role={mobileLibrary ? "dialog" : undefined} aria-modal={mobileLibrary ? "true" : undefined} aria-label="Reaction library">
          <div className="panel-heading"><span>Reaction library</span><button className="mobile-close" onClick={() => setMobileLibrary(false)} aria-label="Close reaction library"><X size={17} /></button><i>{reactions.length}</i></div>
          <p>Balance a classroom equation, then watch its atoms rearrange.</p>
          <div className="reaction-list">{reactions.map((item, index) => <button key={item.slug} className={reaction.slug === item.slug ? "active" : ""} onClick={() => chooseReaction(item)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><small>{item.type} · {item.energy}</small></div>{progress.completedReactions.includes(item.slug) && <Check size={15} />}</button>)}</div>
        </aside>

        <section className="reaction-center">
          <div className="reaction-title"><div><em>Guided reaction lab</em><h1>{reaction.title}</h1><p>{reaction.subtitle}</p></div><span><FlaskConical />{reaction.type}</span></div>
          <div className="equation-card" aria-label="Reaction coefficient controls"><div className="equation-side">{reaction.reactants.map((item, index) => coefficientControl("reactants", item, index))}</div><b className="reaction-arrow">→</b><div className="equation-side">{reaction.products.map((item, index) => coefficientControl("products", item, index))}</div></div>
          <ReactionViewer reaction={reaction} reactantCoefficients={coefficients.reactants} productCoefficients={coefficients.products} animationRun={animationRun} onAnimationComplete={onAnimationComplete} />
          <div className="balance-panel">
            <div className="atom-counts"><span>Atom count</span>{symbols.map((symbol) => <div key={symbol} className={leftCounts[symbol] === rightCounts[symbol] ? "balanced" : "unbalanced"}><b>{symbol}</b><small>{leftCounts[symbol] ?? 0}</small><i>↔</i><small>{rightCounts[symbol] ?? 0}</small></div>)}</div>
            <div className="lab-actions"><button onClick={hint}><Lightbulb /> Hint</button><button onClick={reset}><RotateCcw /> Reset</button><button className="check-button" onClick={check}><Check /> Check</button><button className="animate-button" onClick={animate} disabled={!balanced || animating}><Play fill="currentColor" /> {animating ? "Rearranging…" : "Animate"}</button></div>
            <div className="attempt-tracker" aria-label={`${attempts} checks and ${hintsUsed} hints used`}><span>Checks <b>{attempts}</b></span><span>Hints <b>{hintsUsed}</b></span><em>Start at 100% · −10 per extra check · −15 per hint</em></div>
            {message && <div className={`balance-message ${message.type}`}>{message.type === "success" ? <Check /> : message.type === "hint" ? <Lightbulb /> : <CircleHelp />}<span>{message.text}</span></div>}
          </div>
          {performance && <section className="reaction-result-card" aria-label="Reaction grade and balancing strategy"><div className="reaction-grade"><Sparkles /><span><small>Your technique grade</small><strong>{performance.score}%</strong><b>{performance.label}</b></span></div><div className="reaction-strategy"><small>Balancing strategy</small><h2>Use the lowest whole-number ratio: {[...reaction.coefficients.reactants, ...reaction.coefficients.products].join(" : ")}</h2><p>Change coefficients only—changing a subscript would create a different substance.</p><ol>{reaction.steps.map((step) => <li key={step}>{step}</li>)}</ol></div></section>}
        </section>

        <aside className="reaction-info panel">
          <div className="info-kicker"><FlaskConical size={13} /><b>{reaction.type}</b></div>
          <h2>{formatEquation(reaction)}</h2>
          <dl><div><dt>Energy</dt><dd>{reaction.energy}</dd></div><div><dt>Conditions</dt><dd>{reaction.conditions}</dd></div><div><dt>Observation</dt><dd>{reaction.observation}</dd></div></dl>
          <div className="safety-note"><strong>Safety context</strong><p>{reaction.safety}</p></div>
          <h3>Follow the atoms</h3>
          <ol>{reaction.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          <div className="related-elements"><span>Related elements</span><div>{reaction.relatedElements.map((number) => { const element = elementByNumber.get(number)!; return <button key={number} data-category={element.category} onClick={() => navigateElement(element)}><small>{number}</small><b>{element.symbol}</b></button>; })}</div></div>
          <button className="primary-button" onClick={() => setQuizOpen(true)}>Check your understanding <ArrowRight /></button>
        </aside>
      </div>
      {mobileLibrary && <button className="drawer-backdrop" onClick={() => setMobileLibrary(false)} aria-label="Close reaction library" />}
      {tableOpen && <PeriodicTable selected={6} onSelect={navigateElement} onClose={() => setTableOpen(false)} />}
      {quizOpen && <QuizModal title={`${reaction.title} check`} questions={reactionQuestion} onClose={() => setQuizOpen(false)} onComplete={(score) => recordQuiz(`reaction:${reaction.slug}`, score)} />}
      {savedOpen && <SavedModal progress={progress} onClose={() => setSavedOpen(false)} onElement={navigateElement} />}
    </main>
  );
}
