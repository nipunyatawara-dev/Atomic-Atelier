"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import type { ProgressV1, QuizScore, ReactionGrade } from "./types";

export const PROGRESS_KEY = "atomic-atelier:v1";
const LEGACY_PROGRESS_KEY = "chemistry-atelier:v1";

export const defaultProgress: ProgressV1 = {
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
};

export function sanitizeProgress(value: unknown): ProgressV1 {
  if (!value || typeof value !== "object") return defaultProgress;
  const record = value as Partial<ProgressV1>;
  const numbers = (items: unknown, max = 118) =>
    Array.isArray(items)
      ? [...new Set(items.filter((item): item is number => Number.isInteger(item) && item >= 1 && item <= max))]
      : [];
  const recentElements = numbers(record.recentElements).slice(0, 8);
  const lastElement = Number.isInteger(record.lastElement) && record.lastElement! >= 1 && record.lastElement! <= 118 ? record.lastElement! : 6;
  const rawGrades = record.reactionGrades && typeof record.reactionGrades === "object" ? record.reactionGrades : {};
  const reactionGrades = Object.fromEntries(Object.entries(rawGrades).filter((entry): entry is [string, ReactionGrade] => {
    const grade = entry[1] as Partial<ReactionGrade> | undefined;
    return Boolean(
      grade
      && Number.isFinite(grade.score)
      && grade.score! >= 0
      && grade.score! <= 100
      && Number.isInteger(grade.attempts)
      && grade.attempts! >= 1
      && Number.isInteger(grade.hints)
      && grade.hints! >= 0
      && typeof grade.completedAt === "string"
      && ["Mastery", "Strong", "Developing", "Guided"].includes(grade.label ?? ""),
    );
  }));
  return {
    version: 1,
    favorites: numbers(record.favorites),
    recentElements,
    exploredElements: numbers(record.exploredElements).length
      ? numbers(record.exploredElements)
      : numbers([lastElement, ...recentElements]),
    quizScores: record.quizScores && typeof record.quizScores === "object" ? record.quizScores : {},
    completedReactions: Array.isArray(record.completedReactions)
      ? [...new Set(record.completedReactions.filter((item): item is string => typeof item === "string"))]
      : [],
    reactionGrades,
    lastElement,
    lastReaction: typeof record.lastReaction === "string" ? record.lastReaction : defaultProgress.lastReaction,
    autoRotate: typeof record.autoRotate === "boolean" ? record.autoRotate : true,
  };
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressV1>(defaultProgress);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROGRESS_KEY) ?? window.localStorage.getItem(LEGACY_PROGRESS_KEY);
      if (raw) setProgress(sanitizeProgress(JSON.parse(raw)));
    } catch {
      setProgress(defaultProgress);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      // Storage may be blocked; the current session remains fully functional.
    }
  }, [progress, ready]);

  const update = useCallback((mutator: (current: ProgressV1) => ProgressV1) => setProgress((current) => mutator(current)), []);

  const visitElement = useCallback((atomicNumber: number) => {
    update((current) => ({
      ...current,
      lastElement: atomicNumber,
      recentElements: [atomicNumber, ...current.recentElements.filter((value) => value !== atomicNumber)].slice(0, 8),
      exploredElements: current.exploredElements.includes(atomicNumber)
        ? current.exploredElements
        : [...current.exploredElements, atomicNumber],
    }));
  }, [update]);

  const toggleFavorite = useCallback((atomicNumber: number) => {
    update((current) => ({
      ...current,
      favorites: current.favorites.includes(atomicNumber)
        ? current.favorites.filter((value) => value !== atomicNumber)
        : [...current.favorites, atomicNumber],
    }));
  }, [update]);

  const recordQuiz = useCallback((key: string, score: QuizScore) => {
    update((current) => ({ ...current, quizScores: { ...current.quizScores, [key]: score } }));
  }, [update]);

  const completeReaction = useCallback((slug: string, grade?: ReactionGrade) => {
    update((current) => ({
      ...current,
      lastReaction: slug,
      completedReactions: current.completedReactions.includes(slug)
        ? current.completedReactions
        : [...current.completedReactions, slug],
      reactionGrades: grade && (!current.reactionGrades[slug] || grade.score >= current.reactionGrades[slug].score)
        ? { ...current.reactionGrades, [slug]: grade }
        : current.reactionGrades,
    }));
  }, [update]);

  const visitReaction = useCallback((slug: string) => {
    update((current) => ({ ...current, lastReaction: slug }));
  }, [update]);

  const setAutoRotate = useCallback((autoRotate: boolean) => update((current) => ({ ...current, autoRotate })), [update]);

  return { progress, ready, visitElement, visitReaction, toggleFavorite, recordQuiz, completeReaction, setAutoRotate };
}
