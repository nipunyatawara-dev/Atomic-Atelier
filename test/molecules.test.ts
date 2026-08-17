import { describe, expect, it } from "vitest";
import {
  buildCustomVseprMolecule,
  curatedMolecules,
  resolveMolecule,
} from "../app/lib/molecules";

describe("molecules module", () => {
  it("provides valid curated molecules with matching bonds and atoms", () => {
    expect(curatedMolecules.length).toBeGreaterThanOrEqual(10);

    for (const mol of curatedMolecules) {
      expect(mol.slug).toBeDefined();
      expect(mol.name).toBeDefined();
      expect(mol.formula).toBeDefined();
      expect(mol.molarMass).toBeGreaterThan(0);
      expect(mol.atoms.length).toBeGreaterThan(0);
      expect(mol.vsepr).toBeDefined();

      const atomIds = new Set(mol.atoms.map((a) => a.id));
      for (const bond of mol.bonds) {
        expect(atomIds.has(bond.from)).toBe(true);
        expect(atomIds.has(bond.to)).toBe(true);
      }
    }
  });

  it("resolves molecules safely with fallback to water", () => {
    const water = resolveMolecule("water");
    expect(water.name).toBe("Water");

    const unknown = resolveMolecule("non-existent-molecule-slug");
    expect(unknown.slug).toBe("water");
  });

  it("builds a custom VSEPR molecule dynamically", () => {
    const custom = buildCustomVseprMolecule("S", [
      { symbol: "F", bondOrder: 1 },
      { symbol: "F", bondOrder: 1 },
      { symbol: "F", bondOrder: 1 },
      { symbol: "F", bondOrder: 1 },
    ], 1);

    expect(custom.vsepr.axeNotation).toBe("AX₄E");
    expect(custom.vsepr.molecularGeometry).toBe("Seesaw");
    expect(custom.vsepr.stericNumber).toBe(5);
    expect(custom.vsepr.hybridization).toBe("sp³d");
    expect(custom.atoms).toHaveLength(5); // S + 4 F
    expect(custom.lonePairs).toHaveLength(1);
  });
});
