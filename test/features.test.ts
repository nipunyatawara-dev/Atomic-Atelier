import { describe, expect, it } from "vitest";
import { elements, elementByNumber } from "@/features/explorer/lib/elements";
import { computeIonShells, evaluateIsotopeStability } from "@/features/explorer/components/AtomViewer";
import { elementPhaseAtTemperature } from "@/features/explorer/components/PeriodicTable";
import { balanceChemicalEquation } from "@/features/reactions/lib/equationBalancer";

describe("Phase 1–4 Chemistry & Site Features", () => {
  describe("Element dataset prose & typo fixes", () => {
    it("contains zero mid-word truncated ellipses across all 118 elements", () => {
      for (const el of elements) {
        expect(el.history.endsWith("…")).toBe(false);
        expect(el.uses.endsWith("…")).toBe(false);
        expect(el.compounds.endsWith("…")).toBe(false);
        expect(el.safety.endsWith("…")).toBe(false);
      }
    });

    it("fixes upstream Wikipedia typos in Carbon", () => {
      const carbon = elementByNumber.get(6)!;
      const allProse = `${carbon.history} ${carbon.uses} ${carbon.compounds} ${carbon.safety}`;
      expect(allProse).not.toContain("fullerines");
      expect(allProse).not.toContain("Ceraphite");
      expect(allProse.toLowerCase()).toContain("fullerenes");
    });
  });

  describe("Ion & Isotope Builder logic", () => {
    it("strips outer shell electrons for cations (Na+ -> [2, 8])", () => {
      const na = elementByNumber.get(11)!;
      expect(computeIonShells(na.shells, 1)).toEqual([2, 8]);
    });

    it("adds outer shell electrons for anions (Cl- -> [2, 8, 8])", () => {
      const cl = elementByNumber.get(17)!;
      expect(computeIonShells(cl.shells, -1)).toEqual([2, 8, 8]);
    });

    it("evaluates isotope stability accurately", () => {
      // Carbon-12 (Z=6, N=6) is stable
      expect(evaluateIsotopeStability(6, 6, 6).stable).toBe(true);
      // Carbon-14 (Z=6, N=8) is unstable/radioactive
      expect(evaluateIsotopeStability(6, 8, 6).stable).toBe(false);
      // Oganesson-294 (Z=118) is radioactive (Z > 82)
      expect(evaluateIsotopeStability(118, 176, 176).stable).toBe(false);
    });
  });

  describe("Periodic Table Temperature & Phase Simulator", () => {
    it("classifies mercury as solid at 100 K, liquid at 298 K, and gas at 700 K", () => {
      const hg = elementByNumber.get(80)!;
      expect(elementPhaseAtTemperature(hg, 100)).toBe("Solid");
      expect(elementPhaseAtTemperature(hg, 298)).toBe("Liquid");
      expect(elementPhaseAtTemperature(hg, 700)).toBe("Gas");
    });

    it("keeps tungsten solid at 3000 K and melts it above 3695 K", () => {
      const w = elementByNumber.get(74)!;
      expect(elementPhaseAtTemperature(w, 3000)).toBe("Solid");
      expect(elementPhaseAtTemperature(w, 4000)).toBe("Liquid");
    });
  });

  describe("Custom Chemical Equation Balancer (Gaussian Elimination)", () => {
    it("balances iron oxidation (Fe + O2 -> Fe2O3)", () => {
      const res = balanceChemicalEquation("Fe + O2 -> Fe2O3");
      expect(res.valid).toBe(true);
      expect(res.reactants.map((r) => r.coefficient)).toEqual([4, 3]);
      expect(res.products.map((p) => p.coefficient)).toEqual([2]);
      expect(res.atomTotals).toEqual({ Fe: 4, O: 6 });
    });

    it("balances polyatomic double-replacement (Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O)", () => {
      const res = balanceChemicalEquation("Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O");
      expect(res.valid).toBe(true);
      expect(res.reactants.map((r) => r.coefficient)).toEqual([3, 2]);
      expect(res.products.map((p) => p.coefficient)).toEqual([1, 6]);
    });

    it("balances permanganate redox reaction (KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2)", () => {
      const res = balanceChemicalEquation("KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2");
      expect(res.valid).toBe(true);
      expect(res.reactants.map((r) => r.coefficient)).toEqual([2, 16]);
      expect(res.products.map((p) => p.coefficient)).toEqual([2, 2, 8, 5]);
    });

    it("rejects unbalanced element sets across sides", () => {
      const res = balanceChemicalEquation("H2 + O2 -> H2O + NaCl");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("appears in products");
    });
  });
});
