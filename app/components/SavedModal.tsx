"use client";

import { Bookmark, Clock3, FlaskConical, Trophy } from "lucide-react";
import { Dialog } from "./Dialog";
import { elementByNumber } from "../lib/elements";
import { reactionBySlug } from "../lib/reactions";
import type { ElementRecord, ProgressV1 } from "../lib/types";

export function SavedModal({ progress, onClose, onElement }: { progress: ProgressV1; onClose: () => void; onElement: (element: ElementRecord) => void }) {
  const favorites = progress.favorites.map((value) => elementByNumber.get(value)).filter(Boolean) as ElementRecord[];
  const recent = progress.recentElements.map((value) => elementByNumber.get(value)).filter(Boolean) as ElementRecord[];
  const scores = Object.values(progress.quizScores);
  const best = scores.length ? Math.max(...scores.map((score) => Math.round((score.correct / score.total) * 100))) : null;
  const collection = (items: ElementRecord[], empty: string) => items.length ? <div className="saved-elements">{items.map((element) => <button key={element.atomicNumber} data-category={element.category} onClick={() => { onElement(element); onClose(); }}><small>{element.atomicNumber}</small><b>{element.symbol}</b><span>{element.name}</span></button>)}</div> : <p className="empty-state">{empty}</p>;
  return (
    <Dialog title="Your collection" eyebrow="Stored on this device" onClose={onClose} wide>
      <div className="saved-summary"><span><Bookmark /> <b>{favorites.length}</b> favorites</span><span><FlaskConical /> <b>{progress.completedReactions.length}</b> reactions</span><span><Trophy /> <b>{best === null ? "—" : `${best}%`}</b> best quiz</span></div>
      <section className="saved-section"><h3><Bookmark size={16} /> Favorite elements</h3>{collection(favorites, "Bookmark an element from its fact panel and it will appear here.")}</section>
      <section className="saved-section"><h3><Clock3 size={16} /> Recently explored</h3>{collection(recent, "Your recently explored elements will appear here.")}</section>
      <section className="saved-section"><h3><FlaskConical size={16} /> Completed reactions</h3><div className="completed-list">{progress.completedReactions.length ? progress.completedReactions.map((slug) => <span key={slug}>{reactionBySlug.get(slug)?.title ?? slug}</span>) : <p className="empty-state">Balance and check a reaction to mark it complete.</p>}</div></section>
    </Dialog>
  );
}
