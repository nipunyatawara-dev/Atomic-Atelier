"use client";

import Link from "next/link";
import {
  ArrowRight,
  Atom,
  Bookmark,
  ChartNoAxesColumnIncreasing,
  Clock3,
  Download,
  FlaskConical,
  Layers,
  Smartphone,
  Trophy,
} from "lucide-react";
import { Dialog } from "./Dialog";
import { usePWA } from "./PWAClient";
import { elementByNumber, elements } from "../lib/elements";
import { reactionBySlug, reactions } from "../lib/reactions";
import { curatedMolecules, moleculeBySlug } from "../lib/molecules";
import type { ElementRecord, MoleculeRecord, ProgressV1 } from "../lib/types";

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

export function SavedModal({
  progress,
  onClose,
  onElement,
  onSelectElement,
}: {
  progress?: ProgressV1;
  onClose: () => void;
  onElement?: (element: ElementRecord) => void;
  onSelectElement?: (element: ElementRecord) => void;
}) {
  const { canInstall, install, isIOS, isStandalone } = usePWA();
  const safeProgress = progress ?? {
    version: 1,
    favorites: [],
    recentElements: [6],
    exploredElements: [6],
    quizScores: {},
    completedReactions: [],
    reactionGrades: {},
    lastElement: 6,
    lastReaction: "water-synthesis",
    autoRotate: true,
    exploredMolecules: ["water"],
    favoriteMolecules: [],
    lastMolecule: "water",
  };

  const favorites = safeProgress.favorites.map((value) => elementByNumber.get(value)).filter(Boolean) as ElementRecord[];
  const recent = safeProgress.recentElements.map((value) => elementByNumber.get(value)).filter(Boolean) as ElementRecord[];
  const favMolecules = (safeProgress.favoriteMolecules ?? [])
    .map((slug) => moleculeBySlug.get(slug))
    .filter(Boolean) as MoleculeRecord[];

  const scores = Object.values(safeProgress.quizScores);
  const quizAverage = scores.length ? Math.round(scores.reduce((sum, score) => sum + percent(score.correct, score.total), 0) / scores.length) : 0;
  const lastElement = elementByNumber.get(safeProgress.lastElement) ?? elements[5];
  const nextReaction = reactions.find((reaction) => !safeProgress.completedReactions.includes(reaction.slug)) ?? reactionBySlug.get(safeProgress.lastReaction) ?? reactions[0];

  const openElement = (element: ElementRecord) => {
    if (onSelectElement) onSelectElement(element);
    else if (onElement) onElement(element);
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
          <Link href={`/molecules?molecule=${safeProgress.lastMolecule ?? "water"}`} onClick={onClose}><Layers /><span><small>Explore 3D geometry</small><b>{moleculeBySlug.get(safeProgress.lastMolecule ?? "water")?.name ?? "Molecules"}</b><em>VSEPR Studio</em></span><ArrowRight /></Link>
          <Link href={`/reactions?reaction=${nextReaction.slug}`} onClick={onClose}><FlaskConical /><span><small>{safeProgress.completedReactions.includes(nextReaction.slug) ? "Practice again" : "Next reaction"}</small><b>{nextReaction.title}</b><em>{nextReaction.type}</em></span><ArrowRight /></Link>
        </div>
      </section>

      <section className="progress-overview" aria-label="Progress overview">
        <article><header><Atom /><span><b>{safeProgress.exploredElements.length}</b> / 118</span></header><strong>Elements explored</strong><i><span style={{ width: `${percent(safeProgress.exploredElements.length, 118)}%` }} /></i><small>{percent(safeProgress.exploredElements.length, 118)}% of the table</small></article>
        <article><header><Layers /><span><b>{(safeProgress.exploredMolecules ?? []).length}</b> / {curatedMolecules.length}</span></header><strong>Molecules explored</strong><i><span style={{ width: `${percent((safeProgress.exploredMolecules ?? []).length, curatedMolecules.length)}%` }} /></i><small>VSEPR 3D structures</small></article>
        <article><header><FlaskConical /><span><b>{safeProgress.completedReactions.length}</b> / {reactions.length}</span></header><strong>Reactions balanced</strong><i><span style={{ width: `${percent(safeProgress.completedReactions.length, reactions.length)}%` }} /></i><small>{reactions.length - safeProgress.completedReactions.length} still to explore</small></article>
        <article><header><Trophy /><span><b>{quizAverage || "—"}</b>{quizAverage ? "%" : ""}</span></header><strong>Quiz average</strong><i><span style={{ width: `${quizAverage}%` }} /></i><small>{scores.length} knowledge check{scores.length === 1 ? "" : "s"}</small></article>
      </section>

      {!isStandalone && (
        <section className="install-card">
          <div><Smartphone /><span><small>Study anywhere</small><strong>Install Atomic Atelier</strong><p>The element data, 3D models, and core lessons are cached for offline use after installation.</p></span></div>
          {canInstall
            ? <button className="primary-button" onClick={() => void install()}><Download /> Install app</button>
            : <p>{isIOS ? "On iPhone or iPad, use Share → Add to Home Screen." : "Use your browser’s Install app command when it appears."}</p>}
        </section>
      )}

      <div className="progress-collections">
        <section className="saved-section"><h3><Bookmark size={16} /> Favorite elements</h3>{collection(favorites, "Bookmark an element from its fact panel and it will appear here.")}</section>
        <section className="saved-section"><h3><Clock3 size={16} /> Recently explored</h3>{collection(recent, "Your recently explored elements will appear here.")}</section>
      </div>

      {favMolecules.length > 0 && (
        <section className="saved-section">
          <h3><Bookmark size={16} /> Favorite molecules</h3>
          <div className="saved-molecules-list">
            {favMolecules.map((m) => (
              <Link
                key={m.slug}
                href={`/molecules?molecule=${m.slug}`}
                onClick={onClose}
                className="saved-mol-chip"
              >
                <b>{m.formula}</b>
                <span>{m.name}</span>
                <small>{m.vsepr.molecularGeometry}</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="saved-section">
        <h3><FlaskConical size={16} /> Reaction record</h3>
        <div className="completed-list">
          {safeProgress.completedReactions.length ? (
            safeProgress.completedReactions.map((slug) => {
              const grade = safeProgress.reactionGrades[slug];
              return (
                <span key={slug}>
                  {reactionBySlug.get(slug)?.title ?? slug}
                  {grade && <b>{grade.score}% · {grade.label}</b>}
                </span>
              );
            })
          ) : (
            <p className="empty-state">Balance and check a reaction to mark it complete.</p>
          )}
        </div>
      </section>
    </Dialog>
  );
}

