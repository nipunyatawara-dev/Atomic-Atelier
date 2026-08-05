"use client";

import Link from "next/link";
import { ArrowRight, Atom, Bookmark, ChartNoAxesColumnIncreasing, Clock3, Download, FlaskConical, Smartphone, Trophy } from "lucide-react";
import { Dialog } from "./Dialog";
import { usePWA } from "./PWAClient";
import { elementByNumber, elements } from "../lib/elements";
import { reactionBySlug, reactions } from "../lib/reactions";
import type { ElementRecord, ProgressV1 } from "../lib/types";

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

export function SavedModal({ progress, onClose, onElement }: { progress: ProgressV1; onClose: () => void; onElement: (element: ElementRecord) => void }) {
  const { canInstall, install, isIOS, isStandalone } = usePWA();
  const favorites = progress.favorites.map((value) => elementByNumber.get(value)).filter(Boolean) as ElementRecord[];
  const recent = progress.recentElements.map((value) => elementByNumber.get(value)).filter(Boolean) as ElementRecord[];
  const scores = Object.values(progress.quizScores);
  const quizAverage = scores.length ? Math.round(scores.reduce((sum, score) => sum + percent(score.correct, score.total), 0) / scores.length) : 0;
  const reactionGrades = Object.values(progress.reactionGrades);
  const reactionAverage = reactionGrades.length ? Math.round(reactionGrades.reduce((sum, grade) => sum + grade.score, 0) / reactionGrades.length) : 0;
  const lastElement = elementByNumber.get(progress.lastElement) ?? elements[5];
  const nextReaction = reactions.find((reaction) => !progress.completedReactions.includes(reaction.slug)) ?? reactionBySlug.get(progress.lastReaction) ?? reactions[0];
  const weakestElementQuiz = Object.entries(progress.quizScores)
    .filter(([key]) => key.startsWith("element:"))
    .sort((left, right) => percent(left[1].correct, left[1].total) - percent(right[1].correct, right[1].total))[0];
  const weakestNumber = weakestElementQuiz ? Number(weakestElementQuiz[0].split(":")[1]) : null;
  const reviewElement = (weakestNumber && elementByNumber.get(weakestNumber)) || elements.find((element) => !progress.exploredElements.includes(element.atomicNumber)) || lastElement;

  const openElement = (element: ElementRecord) => {
    onElement(element);
    onClose();
  };
  const collection = (items: ElementRecord[], empty: string) => items.length
    ? <div className="saved-elements">{items.map((element) => <button key={element.atomicNumber} data-category={element.category} onClick={() => openElement(element)}><small>{element.atomicNumber}</small><b>{element.symbol}</b><span>{element.name}</span></button>)}</div>
    : <p className="empty-state">{empty}</p>;

  return (
    <Dialog title="Your learning progress" eyebrow="Private · stored on this device" onClose={onClose} wide className="progress-dialog">
      <section className="continue-section" aria-label="Continue learning">
        <div className="continue-heading"><div><span>Continue learning</span><h3>Pick up where curiosity left you</h3></div><ChartNoAxesColumnIncreasing /></div>
        <div className="continue-grid">
          <button onClick={() => openElement(lastElement)} data-category={lastElement.category}><Atom /><span><small>Resume explorer</small><b>{lastElement.name}</b><em>{lastElement.symbol} · element {lastElement.atomicNumber}</em></span><ArrowRight /></button>
          <Link href={`/reactions?reaction=${nextReaction.slug}`} onClick={onClose}><FlaskConical /><span><small>{progress.completedReactions.includes(nextReaction.slug) ? "Practice again" : "Next reaction"}</small><b>{nextReaction.title}</b><em>{nextReaction.type}</em></span><ArrowRight /></Link>
          <button onClick={() => openElement(reviewElement)} data-category={reviewElement.category}><Trophy /><span><small>{weakestElementQuiz ? "Strengthen a score" : "Explore something new"}</small><b>{reviewElement.name} quiz</b><em>{weakestElementQuiz ? `${percent(weakestElementQuiz[1].correct, weakestElementQuiz[1].total)}% last score` : "Five-question challenge"}</em></span><ArrowRight /></button>
        </div>
      </section>

      <section className="progress-overview" aria-label="Progress overview">
        <article><header><Atom /><span><b>{progress.exploredElements.length}</b> / 118</span></header><strong>Elements explored</strong><i><span style={{ width: `${percent(progress.exploredElements.length, 118)}%` }} /></i><small>{percent(progress.exploredElements.length, 118)}% of the table</small></article>
        <article><header><FlaskConical /><span><b>{progress.completedReactions.length}</b> / {reactions.length}</span></header><strong>Reactions balanced</strong><i><span style={{ width: `${percent(progress.completedReactions.length, reactions.length)}%` }} /></i><small>{reactions.length - progress.completedReactions.length} still to explore</small></article>
        <article><header><Trophy /><span><b>{quizAverage || "—"}</b>{quizAverage ? "%" : ""}</span></header><strong>Quiz average</strong><i><span style={{ width: `${quizAverage}%` }} /></i><small>{scores.length} knowledge check{scores.length === 1 ? "" : "s"}</small></article>
        <article><header><ChartNoAxesColumnIncreasing /><span><b>{reactionAverage || "—"}</b>{reactionAverage ? "%" : ""}</span></header><strong>Reaction technique</strong><i><span style={{ width: `${reactionAverage}%` }} /></i><small>Best graded attempts</small></article>
      </section>

      {!isStandalone && (
        <section className="install-card">
          <div><Smartphone /><span><small>Study anywhere</small><strong>Install Atomic Atelier</strong><p>The element data and core lessons are cached for offline use after installation.</p></span></div>
          {canInstall
            ? <button className="primary-button" onClick={() => void install()}><Download /> Install app</button>
            : <p>{isIOS ? "On iPhone or iPad, use Share → Add to Home Screen." : "Use your browser’s Install app command when it appears."}</p>}
        </section>
      )}

      <div className="progress-collections">
        <section className="saved-section"><h3><Bookmark size={16} /> Favorite elements</h3>{collection(favorites, "Bookmark an element from its fact panel and it will appear here.")}</section>
        <section className="saved-section"><h3><Clock3 size={16} /> Recently explored</h3>{collection(recent, "Your recently explored elements will appear here.")}</section>
      </div>

      <section className="saved-section"><h3><FlaskConical size={16} /> Reaction record</h3><div className="completed-list">{progress.completedReactions.length ? progress.completedReactions.map((slug) => { const grade = progress.reactionGrades[slug]; return <span key={slug}>{reactionBySlug.get(slug)?.title ?? slug}{grade && <b>{grade.score}% · {grade.label}</b>}</span>; }) : <p className="empty-state">Balance and check a reaction to mark it complete.</p>}</div></section>
    </Dialog>
  );
}
