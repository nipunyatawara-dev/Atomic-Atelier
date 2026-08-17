import { describe, expect, it } from "vitest";
import {
  calculateAngleDegrees,
  calculateNetDipole,
  generateVsepr3DPositions,
  VSEPR_TEMPLATES,
} from "../app/lib/vsepr";

describe("vsepr engine", () => {
  it("defines standard VSEPR templates with valid electron and molecular geometries", () => {
    expect(VSEPR_TEMPLATES["AX2"].molecularGeometry).toBe("Linear");
    expect(VSEPR_TEMPLATES["AX3"].molecularGeometry).toBe("Trigonal Planar");
    expect(VSEPR_TEMPLATES["AX2E"].molecularGeometry).toBe("Bent (120°)");
    expect(VSEPR_TEMPLATES["AX4"].molecularGeometry).toBe("Tetrahedral");
    expect(VSEPR_TEMPLATES["AX3E"].molecularGeometry).toBe("Trigonal Pyramidal");
    expect(VSEPR_TEMPLATES["AX2E2"].molecularGeometry).toBe("Bent (104.5°)");
    expect(VSEPR_TEMPLATES["AX5"].molecularGeometry).toBe("Trigonal Bipyramidal");
    expect(VSEPR_TEMPLATES["AX4E"].molecularGeometry).toBe("Seesaw");
    expect(VSEPR_TEMPLATES["AX3E2"].molecularGeometry).toBe("T-shaped");
    expect(VSEPR_TEMPLATES["AX2E3"].molecularGeometry).toBe("Linear");
    expect(VSEPR_TEMPLATES["AX6"].molecularGeometry).toBe("Octahedral");
    expect(VSEPR_TEMPLATES["AX5E"].molecularGeometry).toBe("Square Pyramidal");
    expect(VSEPR_TEMPLATES["AX4E2"].molecularGeometry).toBe("Square Planar");
  });

  it("generates correct number of 3D ligand and lone pair positions for AX2E2 (Water geometry)", () => {
    const { ligandPositions, lonePairPositions } = generateVsepr3DPositions(2, 2);
    expect(ligandPositions).toHaveLength(2);
    expect(lonePairPositions).toHaveLength(2);

    // Calculate angle between the two ligands relative to center (0,0,0)
    const angle = calculateAngleDegrees(ligandPositions[0], [0, 0, 0], ligandPositions[1]);
    expect(Math.round(angle)).toBe(105);
  });

  it("generates correct 3D positions for regular tetrahedron AX4", () => {
    const { ligandPositions, lonePairPositions } = generateVsepr3DPositions(4, 0);
    expect(ligandPositions).toHaveLength(4);
    expect(lonePairPositions).toHaveLength(0);

    const angle = calculateAngleDegrees(ligandPositions[0], [0, 0, 0], ligandPositions[1]);
    expect(angle).toBeCloseTo(109.5, 0);
  });

  it("calculates zero net dipole for symmetric non-polar molecules like linear CO2", () => {
    const ligands: { symbol: string; position: [number, number, number] }[] = [
      { symbol: "O", position: [1.16, 0, 0] },
      { symbol: "O", position: [-1.16, 0, 0] },
    ];
    const res = calculateNetDipole("C", [0, 0, 0], ligands);
    expect(res.polarity).toBe("Non-polar");
    expect(res.dipoleDebye).toBe(0);
  });

  it("calculates non-zero net dipole for bent polar molecules like H2O", () => {
    const ligands: { symbol: string; position: [number, number, number] }[] = [
      { symbol: "H", position: [0.76, -0.48, 0] },
      { symbol: "H", position: [-0.76, -0.48, 0] },
    ];
    const res = calculateNetDipole("O", [0, 0, 0], ligands);
    expect(res.polarity).toBe("Polar");
    expect(res.dipoleDebye).toBeGreaterThan(0.5);
  });
});
