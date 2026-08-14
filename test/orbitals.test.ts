import { describe, expect, it } from "vitest";
import { parseElectronConfiguration, generateOrbitalCloudPoints, subshellRadius, SUBSHELL_COLORS } from "../app/lib/orbitals";
import { elements } from "../app/lib/elements";
import type { SubshellInfo } from "../app/lib/orbitals";
import type { ElementRecord } from "../app/lib/types";

const mockCarbon: ElementRecord = {
  atomicNumber: 6,
  symbol: "C",
  slug: "carbon",
  name: "Carbon",
  atomicMass: "12.011",
  representativeMassNumber: 12,
  neutrons: 6,
  period: 2,
  group: 14,
  block: "p",
  category: "nonmetal",
  categoryLabel: "Nonmetal",
  standardState: "solid",
  electronConfiguration: "[He] 2s² 2p²",
  shells: [2, 4],
  valenceElectrons: 4,
  electronegativity: 2.55,
  atomicRadius: 70,
  ionizationEnergy: 11.26,
  electronAffinity: 1.26,
  oxidationStates: ["-4", "+2", "+4"],
  meltingPoint: 3823,
  boilingPoint: 4300,
  density: 2.26,
  yearDiscovered: "Ancient",
  cpkColor: "#909090",
  history: "",
  uses: "",
  compounds: "",
  safety: "",
  sourceRefs: [],
};

const mockIron: ElementRecord = {
  ...mockCarbon,
  atomicNumber: 26,
  symbol: "Fe",
  slug: "iron",
  name: "Iron",
  electronConfiguration: "[Ar] 3d⁶ 4s²",
  shells: [2, 8, 14, 2],
  block: "d",
};

describe("orbitals module", () => {
  it("parses noble gas shorthand configuration for Carbon", () => {
    const subshells = parseElectronConfiguration(mockCarbon.electronConfiguration, mockCarbon);
    expect(subshells).toHaveLength(3);
    expect(subshells[0]).toEqual({ n: 1, type: "s", electrons: 2, maxElectrons: 2, label: "1s" });
    expect(subshells[1]).toEqual({ n: 2, type: "s", electrons: 2, maxElectrons: 2, label: "2s" });
    expect(subshells[2]).toEqual({ n: 2, type: "p", electrons: 2, maxElectrons: 6, label: "2p" });
  });

  it("parses transition metal configuration for Iron", () => {
    const subshells = parseElectronConfiguration(mockIron.electronConfiguration, mockIron);
    expect(subshells.map((s) => s.label)).toContain("3d");
    expect(subshells.map((s) => s.label)).toContain("4s");

    const dSubshell = subshells.find((s) => s.label === "3d");
    expect(dSubshell).toBeDefined();
    expect(dSubshell?.electrons).toBe(6);
  });

  it("generates 3D orbital cloud points array of correct dimensions", () => {
    const subshell = { n: 2, type: "p" as const, electrons: 2, maxElectrons: 6, label: "2p" };
    const points = generateOrbitalCloudPoints(subshell, 100);
    expect(points).toBeInstanceOf(Float32Array);
    expect(points.length).toBe(300); // 100 * 3 coordinates
  });

  it("provides distinct radii and color definitions for subshell types", () => {
    const r1s = subshellRadius(1, "s");
    const r2s = subshellRadius(2, "s");
    const r2p = subshellRadius(2, "p");

    expect(r2s).toBeGreaterThan(r1s);
    expect(r2p).toBeGreaterThan(r2s);
    expect(SUBSHELL_COLORS.s.hex).toBeDefined();
    expect(SUBSHELL_COLORS.p.hex).toBeDefined();
    expect(SUBSHELL_COLORS.d.hex).toBeDefined();
    expect(SUBSHELL_COLORS.f.hex).toBeDefined();
  });

  it("parses unspaced PubChem configuration strings accurately", () => {
    // Lithium: [He]2s1
    const li = parseElectronConfiguration("[He]2s1");
    expect(li.map((s) => s.label)).toEqual(["1s", "2s"]);
    expect(li.reduce((sum, s) => sum + s.electrons, 0)).toBe(3);

    // Iron from PubChem: [Ar]4s2 3d6
    const fe = parseElectronConfiguration("[Ar]4s2 3d6");
    expect(fe.map((s) => s.label)).toEqual(["1s", "2s", "2p", "3s", "3p", "4s", "3d"]);
    expect(fe.reduce((sum, s) => sum + s.electrons, 0)).toBe(26);

    // Palladium: [Kr]4d10
    const pd = parseElectronConfiguration("[Kr]4d10");
    expect(pd.reduce((sum, s) => sum + s.electrons, 0)).toBe(46);

    // Lutetium: [Xe]6s2 4f14 5d1
    const lu = parseElectronConfiguration("[Xe]6s2 4f14 5d1");
    expect(lu.reduce((sum, s) => sum + s.electrons, 0)).toBe(71);

    // Oganesson: [Rn]7s2 5f14 6d10 7p6
    const og = parseElectronConfiguration("[Rn]7s2 5f14 6d10 7p6");
    expect(og.reduce((sum, s) => sum + s.electrons, 0)).toBe(118);
  });

  it("parses electron configurations for all 118 elements without electron count errors", () => {
    for (const element of elements) {
      const subshells = parseElectronConfiguration(element.electronConfiguration, element);
      expect(subshells.length).toBeGreaterThan(0);
      const totalElectrons = subshells.reduce((sum: number, s: SubshellInfo) => sum + s.electrons, 0);
      expect(totalElectrons).toBe(element.atomicNumber);
    }
  });
});
