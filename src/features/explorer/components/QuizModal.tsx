"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { Dialog } from "@/components/common/Dialog";
import type { QuizQuestion, QuizScore } from "@/types";

export function QuizModal({ title, questions, onClose, onComplete }: { title: string; questions: QuizQuestion[]; onClose: () => void; onComplete: (score: QuizScore) => void }) {
  const [practiceQuestions, setPracticeQuestions] = useState<QuizQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<QuizQuestion[]>([]);
  const [finished, setFinished] = useState(false);
  const safeQuestions = practiceQuestions ?? questions ?? [];
  const question = safeQuestions[index];
  const total = safeQuestions.length;

  const choose = (option: number) => {
    if (!question || selected !== null) return;
    setSelected(option);
    if (option === question.answer) setScore((value) => value + 1);
    else setMissed((items) => [...items, question]);
  };
  const next = () => {
    if (index >= total - 1) {
      // A targeted retry must not replace a full quiz result in the dashboard.
      if (!practiceQuestions) onComplete({ correct: score, total, completedAt: new Date().toISOString() });
      setFinished(true);
    } else { setIndex((value) => value + 1); setSelected(null); }
  };
  const restart = (targeted = false) => {
    setPracticeQuestions(targeted ? missed : null);
    setIndex(0); setSelected(null); setScore(0); setMissed([]); setFinished(false);
  };

  return (
    <Dialog title={title} eyebrow={practiceQuestions ? "Targeted practice" : "Observe, recall, and predict"} onClose={onClose} className="practice-dialog">
      {finished || !question ? (
        <div className="quiz-result">
          <CheckCircle2 /><strong>{score} / {total}</strong>
          <p>{total > 0 && score === total ? "Every answer landed. Try applying the idea in another studio." : "Review the concepts below, then practice just the questions you missed."}</p>
          {missed.length > 0 && <section className="quiz-review" aria-label="Concepts to revisit"><h3>Focus your next practice</h3>{missed.map((item) => <article key={item.id}><strong>{item.prompt}</strong><p>{item.explanation}</p>{item.followUp && <Link href={item.followUp.href} onClick={onClose}>{item.followUp.label}<ArrowRight size={14} /></Link>}</article>)}</section>}
          <div className="quiz-result-actions">{missed.length > 0 && <button className="primary-button" onClick={() => restart(true)}><RotateCcw size={16} /> Practice missed questions</button>}<button onClick={() => restart()}><RotateCcw size={16} /> Try full quiz again</button></div>
        </div>
      ) : (
        <div className="quiz-body">
          <div className="quiz-progress"><span>Question {index + 1} of {total}</span><i style={{ width: `${((index + 1) / total) * 100}%` }} /></div>
          <h3>{question.prompt}</h3>
          <div className="quiz-options">{question.options.map((option, optionIndex) => <button key={option} disabled={selected !== null} className={selected === null ? "" : optionIndex === question.answer ? "correct" : selected === optionIndex ? "incorrect" : ""} onClick={() => choose(optionIndex)}><span>{String.fromCharCode(65 + optionIndex)}</span>{" "}{option}</button>)}</div>
          {selected !== null && <div className="quiz-explanation" role="status"><b>{selected === question.answer ? "Exactly." : "Not quite."}</b> {question.explanation}</div>}
          <button className="primary-button" onClick={next} disabled={selected === null}>{index === total - 1 ? "See score" : "Next question"}<ArrowRight size={16} /></button>
        </div>
      )}
    </Dialog>
  );
}
