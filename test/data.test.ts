import { describe, expect, it } from "vitest";
import { createElementQuiz, elements } from "../app/lib/elements";

describe("element snapshot", () => {
  it("contains exactly 118 sequential, uniquely named elements", () => {
    expect(elements).toHaveLength(118);
    expect(elements.map((element) => element.atomicNumber)).toEqual(Array.from({ length: 118 }, (_, index) => index + 1));
    expect(new Set(elements.map((element) => element.symbol)).size).toBe(118);
    expect(new Set(elements.map((element) => element.slug)).size).toBe(118);
  });

  it("has valid table, electron, isotope, and source data", () => {
    for (const element of elements) {
      expect(element.period).toBeGreaterThanOrEqual(1);
      expect(element.period).toBeLessThanOrEqual(7);
      expect(element.shells.reduce((sum, count) => sum + count, 0)).toBe(element.atomicNumber);
      if (element.representativeMassNumber !== null) {
        expect(element.neutrons).toBe(element.representativeMassNumber - element.atomicNumber);
        expect(element.neutrons).toBeGreaterThanOrEqual(0);
      }
      expect(element.sourceRefs.length).toBeGreaterThan(0);
      expect(element.sourceRefs.every((source) => source.url.startsWith("https://"))).toBe(true);
    }
  });

  it("uses an evaluated isotope mass rather than rounding a synthetic atomic mass", () => {
    const oganesson = elements[117];
    expect(oganesson.atomicMass).toBe("[294]");
    expect(oganesson.representativeMassNumber).toBe(294);
    expect(oganesson.neutrons).toBe(176);
  });

  it("generates five answerable questions with unique choices", () => {
    for (const element of [elements[0], elements[5], elements[78], elements[117]]) {
      const quiz = createElementQuiz(element);
      expect(quiz).toHaveLength(5);
      for (const question of quiz) {
        expect(new Set(question.options).size).toBe(question.options.length);
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThan(question.options.length);
      }
    }
  });
});
