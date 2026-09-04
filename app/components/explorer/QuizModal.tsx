"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { Dialog } from "./Dialog";
import type { QuizQuestion, QuizScore } from "../lib/types";

export function QuizModal({ title, questions, onClose, onComplete }: { title: string; questions: QuizQuestion[]; onClose: () => void; onComplete: (score: QuizScore) => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const safeQuestions = questions && questions.length > 0 ? questions : [];
  const safeIndex = Math.min(index, Math.max(0, safeQuestions.length - 1));
  const question = safeQuestions[safeIndex];

  const choose = (option: number) => {
    if (!question || selected !== null) return;
    setSelected(option);
    if (option === question.answer) setScore((value) => value + 1);
  };

  const next = () => {
    if (index >= safeQuestions.length - 1) {
      const result = { correct: score, total: safeQuestions.length, completedAt: new Date().toISOString() };
      onComplete(result);
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  const total = safeQuestions.length;

  return (
    <Dialog title={title} eyebrow={total === 5 ? "Five-question challenge" : "Curated knowledge check"} onClose={onClose}>
      {finished || !question ? (
        <div className="quiz-result">
          <CheckCircle2 />
          <strong>{score} / {total}</strong>
          <p>
            {total > 0 && score === total
              ? "Perfect orbit. Every answer landed."
              : score >= Math.ceil(total * 0.6)
              ? "Strong work—review the explanations and try for five."
              : "Curiosity compounds. Explore the element, then try again."}
          </p>
          <button className="primary-button" onClick={restart}>
            <RotateCcw size={16} /> Try again
          </button>
        </div>
      ) : (
        <div className="quiz-body">
          <div className="quiz-progress">
            <span>Question {safeIndex + 1} of {total}</span>
            <i style={{ width: `${((safeIndex + 1) / total) * 100}%` }} />
          </div>
          <h3>{question.prompt}</h3>
          <div className="quiz-options">
            {question.options.map((option, optionIndex) => (
              <button
                key={option}
                disabled={selected !== null}
                className={
                  selected === null
                    ? ""
                    : optionIndex === question.answer
                    ? "correct"
                    : selected === optionIndex
                    ? "incorrect"
                    : ""
                }
                onClick={() => choose(optionIndex)}
              >
                <span>{String.fromCharCode(65 + optionIndex)}</span>
                {option}
              </button>
            ))}
          </div>
          {selected !== null && (
            <div className="quiz-explanation">
              <b>{selected === question.answer ? "Exactly." : "Not quite."}</b> {question.explanation}
            </div>
          )}
          <button className="primary-button" onClick={next} disabled={selected === null}>
            {safeIndex === total - 1 ? "See score" : "Next question"}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </Dialog>
  );
}
