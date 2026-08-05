import { describe, expect, it } from "vitest";
import { countSide, isBalanced, parseFormula } from "../app/lib/formula";
import { reactions } from "../app/lib/reactions";

describe("reaction records", () => {
  it("contains the twelve planned, fully contextualized reactions", () => {
    expect(reactions).toHaveLength(12);
    expect(new Set(reactions.map((reaction) => reaction.slug)).size).toBe(12);
    for (const reaction of reactions) {
      expect(reaction.steps.length).toBeGreaterThanOrEqual(3);
      expect(reaction.safety.length).toBeGreaterThan(20);
      expect(reaction.conditions.length).toBeGreaterThan(0);
      expect(reaction.observation.length).toBeGreaterThan(0);
      expect(reaction.relatedElements.length).toBeGreaterThan(0);
      expect(reaction.question.options.length).toBeGreaterThanOrEqual(3);
      const authoredAtomCount = reaction.reactants.reduce((total, item, index) => total + item.atoms.length * reaction.coefficients.reactants[index], 0);
      expect(reaction.atomMapping).toHaveLength(authoredAtomCount);
      expect(new Set(reaction.atomMapping.map((mapping) => mapping.from)).size).toBe(authoredAtomCount);
      expect(new Set(reaction.atomMapping.map((mapping) => mapping.to)).size).toBe(authoredAtomCount);
      for (const item of [...reaction.reactants, ...reaction.products]) {
        expect(item.atoms.every((atom) => atom.position.length === 3)).toBe(true);
        expect(item.bonds.every((bond) => bond.from !== bond.to && item.atoms.some((atom) => atom.id === bond.from) && item.atoms.some((atom) => atom.id === bond.to))).toBe(true);
      }
    }
  });

  it("parses nested formula groups", () => {
    expect(parseFormula("Ca(OH)2")).toEqual({ Ca: 1, O: 2, H: 2 });
    expect(parseFormula("C6H12O6")).toEqual({ C: 6, H: 12, O: 6 });
  });

  it("conserves atoms for authored coefficients and rejects a changed coefficient", () => {
    for (const reaction of reactions) {
      expect(isBalanced(reaction.reactants, reaction.products, reaction.coefficients.reactants, reaction.coefficients.products)).toBe(true);
      expect(countSide(reaction.reactants, reaction.coefficients.reactants)).toEqual(countSide(reaction.products, reaction.coefficients.products));
      const incorrect = [...reaction.coefficients.reactants];
      incorrect[0] += 1;
      expect(isBalanced(reaction.reactants, reaction.products, incorrect, reaction.coefficients.products)).toBe(false);
    }
  });
});
