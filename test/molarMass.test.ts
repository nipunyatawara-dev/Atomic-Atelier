import { describe, expect, it } from "vitest";
import {
  calculateMolarMass,
  gramsToMoles,
  molesToGrams,
  parseChemicalFormula,
} from "@/features/reactions/lib/molarMass";

describe("Molar mass & chemical formula parser", () => {
  it("parses simple binary formulas", () => {
    const h2o = parseChemicalFormula("H2O");
    expect(h2o).toEqual({ H: 2, O: 1 });

    const nacl = parseChemicalFormula("NaCl");
    expect(nacl).toEqual({ Na: 1, Cl: 1 });
  });

  it("parses formulas with nested parentheses and brackets", () => {
    // Calcium Phosphate: Ca3(PO4)2
    const ca3po42 = parseChemicalFormula("Ca3(PO4)2");
    expect(ca3po42).toEqual({ Ca: 3, P: 2, O: 8 });

    // Ammonium Sulfate: (NH4)2SO4
    const nh42so4 = parseChemicalFormula("(NH4)2SO4");
    expect(nh42so4).toEqual({ N: 2, H: 8, S: 1, O: 4 });

    // Hexaamminecobalt(III) chloride: [Co(NH3)6]Cl3
    const complex = parseChemicalFormula("[Co(NH3)6]Cl3");
    expect(complex).toEqual({ Co: 1, N: 6, H: 18, Cl: 3 });
  });

  it("parses hydrated compounds with middle dot", () => {
    // Copper(II) sulfate pentahydrate: CuSO4·5H2O
    const hydrate = parseChemicalFormula("CuSO4·5H2O");
    expect(hydrate).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
  });

  it("calculates accurate molar mass for Water (H2O)", () => {
    const res = calculateMolarMass("H2O");
    expect(res).not.toBeNull();
    // H: ~1.008 * 2 = 2.016, O: ~15.999 -> Total ~ 18.015
    expect(res!.molarMass).toBeCloseTo(18.015, 1);
    expect(res!.totalAtoms).toBe(3);

    // Sum of percentages should equal 100%
    const totalPercent = res!.breakdown.reduce((acc, el) => acc + el.percentage, 0);
    expect(totalPercent).toBeCloseTo(100, 2);
  });

  it("calculates accurate molar mass for Glucose (C6H12O6)", () => {
    const res = calculateMolarMass("C6H12O6");
    expect(res).not.toBeNull();
    // Glucose is ~180.156 g/mol
    expect(res!.molarMass).toBeCloseTo(180.16, 0);
    expect(res!.totalAtoms).toBe(24);
  });

  it("performs correct mole-to-gram and gram-to-mole conversions", () => {
    const molarMass = 18.015; // Water
    expect(molesToGrams(2, molarMass)).toBeCloseTo(36.03, 1);
    expect(gramsToMoles(36.03, molarMass)).toBeCloseTo(2, 1);
  });

  it("gracefully returns null for invalid element symbols", () => {
    const res = calculateMolarMass("Xz99");
    expect(res).toBeNull();
  });
});
