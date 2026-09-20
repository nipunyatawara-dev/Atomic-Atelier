import type { ElementRecord } from "@/types";
import {
  parseElectronConfiguration,
  type SubshellType,
} from "./orbitals";

export interface OrbitalBox {
  id: string;
  subshellLabel: string;
  orbitalIndex: number;
  label: string;
  electrons: number;
  spins: ("up" | "down")[];
}

export interface SubshellBoxes {
  label: string;
  n: number;
  type: SubshellType;
  electrons: number;
  maxElectrons: number;
  energyRank: number;
  boxes: OrbitalBox[];
}

export interface AufbauAnomaly {
  atomicNumber: number;
  symbol: string;
  name: string;
  expectedConfig: string;
  actualConfig: string;
  reason: string;
}

export const AUFBAU_SEQUENCE: { n: number; type: SubshellType; label: string; max: number }[] = [
  { n: 1, type: "s", label: "1s", max: 2 },
  { n: 2, type: "s", label: "2s", max: 2 },
  { n: 2, type: "p", label: "2p", max: 6 },
  { n: 3, type: "s", label: "3s", max: 2 },
  { n: 3, type: "p", label: "3p", max: 6 },
  { n: 4, type: "s", label: "4s", max: 2 },
  { n: 3, type: "d", label: "3d", max: 10 },
  { n: 4, type: "p", label: "4p", max: 6 },
  { n: 5, type: "s", label: "5s", max: 2 },
  { n: 4, type: "d", label: "4d", max: 10 },
  { n: 5, type: "p", label: "5p", max: 6 },
  { n: 6, type: "s", label: "6s", max: 2 },
  { n: 4, type: "f", label: "4f", max: 14 },
  { n: 5, type: "d", label: "5d", max: 10 },
  { n: 6, type: "p", label: "6p", max: 6 },
  { n: 7, type: "s", label: "7s", max: 2 },
  { n: 5, type: "f", label: "5f", max: 14 },
  { n: 6, type: "d", label: "6d", max: 10 },
  { n: 7, type: "p", label: "7p", max: 6 },
];

export const ORBITAL_NAMES: Record<SubshellType, string[]> = {
  s: [""],
  p: ["x", "y", "z"],
  d: ["xy", "yz", "xz", "x²−y²", "z²"],
  f: ["1", "2", "3", "4", "5", "6", "7"],
};

export const AUFBAU_ANOMALIES: Record<number, AufbauAnomaly> = {
  24: {
    atomicNumber: 24,
    symbol: "Cr",
    name: "Chromium",
    expectedConfig: "[Ar] 4s² 3d⁴",
    actualConfig: "[Ar] 4s¹ 3d⁵",
    reason: "Promoting one 4s electron creates a half-filled 3d⁵ subshell, which maximizes exchange energy and minimizes electron repulsion.",
  },
  29: {
    atomicNumber: 29,
    symbol: "Cu",
    name: "Copper",
    expectedConfig: "[Ar] 4s² 3d⁹",
    actualConfig: "[Ar] 4s¹ 3d¹⁰",
    reason: "A fully-filled 3d¹⁰ subshell provides spherical symmetry and high exchange stabilization, favoring the 4s¹ 3d¹⁰ state.",
  },
  41: {
    atomicNumber: 41,
    symbol: "Nb",
    name: "Niobium",
    expectedConfig: "[Kr] 5s² 4d³",
    actualConfig: "[Kr] 5s¹ 4d⁴",
    reason: "Small energy gap between 5s and 4d favors electron pairing in 4d.",
  },
  42: {
    atomicNumber: 42,
    symbol: "Mo",
    name: "Molybdenum",
    expectedConfig: "[Kr] 5s² 4d⁴",
    actualConfig: "[Kr] 5s¹ 4d⁵",
    reason: "Half-filled 4d⁵ stability parallel to Chromium.",
  },
  44: {
    atomicNumber: 44,
    symbol: "Ru",
    name: "Ruthenium",
    expectedConfig: "[Kr] 5s² 4d⁶",
    actualConfig: "[Kr] 5s¹ 4d⁷",
    reason: "Electron transfer to 4d maximizes exchange stabilization.",
  },
  45: {
    atomicNumber: 45,
    symbol: "Rh",
    name: "Rhodium",
    expectedConfig: "[Kr] 5s² 4d⁷",
    actualConfig: "[Kr] 5s¹ 4d⁸",
    reason: "Inter-electron repulsion in 5s makes 5s¹ 4d⁸ ground state lower in energy.",
  },
  46: {
    atomicNumber: 46,
    symbol: "Pd",
    name: "Palladium",
    expectedConfig: "[Kr] 5s² 4d⁸",
    actualConfig: "[Kr] 4d¹⁰",
    reason: "Complete abandonment of 5s in favor of a completely filled 4d¹⁰ closed subshell.",
  },
  47: {
    atomicNumber: 47,
    symbol: "Ag",
    name: "Silver",
    expectedConfig: "[Kr] 5s² 4d⁹",
    actualConfig: "[Kr] 5s¹ 4d¹⁰",
    reason: "Completely filled 4d¹⁰ subshell provides major stability, analogous to Copper.",
  },
  78: {
    atomicNumber: 78,
    symbol: "Pt",
    name: "Platinum",
    expectedConfig: "[Xe] 6s² 4f¹⁴ 5d⁸",
    actualConfig: "[Xe] 6s¹ 4f¹⁴ 5d⁹",
    reason: "Relativistic contraction of 6s and expansion of 5d lowers the energy of 6s¹ 5d⁹.",
  },
  79: {
    atomicNumber: 79,
    symbol: "Au",
    name: "Gold",
    expectedConfig: "[Xe] 6s² 4f¹⁴ 5d⁹",
    actualConfig: "[Xe] 6s¹ 4f¹⁴ 5d¹⁰",
    reason: "Relativistic effects strongly stabilize the fully filled 5d¹⁰ subshell.",
  },
};

/**
 * Distributes electrons into orbital boxes for a single subshell according to Hund's Rule.
 * Orbitals are occupied singly with parallel spins (up) first, then paired with opposite spins (down).
 */
export function fillSubshellBoxes(
  label: string,
  type: SubshellType,
  electronCount: number,
  n: number,
  energyRank: number,
): SubshellBoxes {
  const boxCount = type === "s" ? 1 : type === "p" ? 3 : type === "d" ? 5 : 7;
  const maxElectrons = boxCount * 2;
  const count = Math.min(Math.max(0, electronCount), maxElectrons);
  const names = ORBITAL_NAMES[type];

  const boxes: OrbitalBox[] = [];

  for (let i = 0; i < boxCount; i++) {
    const spins: ("up" | "down")[] = [];
    if (count > i) {
      spins.push("up");
    }
    if (count > boxCount + i) {
      spins.push("down");
    }

    const subName = names[i] ? `${label}<sub>${names[i]}</sub>` : label;

    boxes.push({
      id: `${label}-${i}`,
      subshellLabel: label,
      orbitalIndex: i,
      label: subName,
      electrons: spins.length,
      spins,
    });
  }

  return {
    label,
    n,
    type,
    electrons: count,
    maxElectrons,
    energyRank,
    boxes,
  };
}

/**
 * Generates the full orbital box breakdown for an element.
 * Respects actual electron configuration when available (including anomalies like Cr and Cu).
 */
export function generateOrbitalBoxes(element: ElementRecord): SubshellBoxes[] {
  const parsed = parseElectronConfiguration(element.electronConfiguration, element);
  const parsedMap = new Map(parsed.map((s) => [s.label, s.electrons]));

  // Find max occupied index in AUFBAU_SEQUENCE
  let lastOccupiedIndex = 0;
  AUFBAU_SEQUENCE.forEach((sub, index) => {
    if (parsedMap.has(sub.label) && (parsedMap.get(sub.label) ?? 0) > 0) {
      lastOccupiedIndex = Math.max(lastOccupiedIndex, index);
    }
  });

  // Display all subshells up to the highest occupied subshell
  const activeSequence = AUFBAU_SEQUENCE.slice(0, lastOccupiedIndex + 1);

  return activeSequence.map((sub, index) => {
    const count = parsedMap.get(sub.label) ?? 0;
    return fillSubshellBoxes(sub.label, sub.type, count, sub.n, index);
  });
}

/**
 * Generates the simulated filling step (1 to Z electrons) according to ideal Aufbau sequence.
 * Ideal for step-by-step interactive demonstrations of Hund's Rule.
 */
export function generateAufbauSimulation(totalElectrons: number): SubshellBoxes[] {
  let remaining = Math.max(0, totalElectrons);
  const result: SubshellBoxes[] = [];

  for (let index = 0; index < AUFBAU_SEQUENCE.length; index++) {
    const sub = AUFBAU_SEQUENCE[index];
    const fill = Math.min(remaining, sub.max);
    result.push(fillSubshellBoxes(sub.label, sub.type, fill, sub.n, index));
    remaining -= fill;
    if (remaining <= 0) break;
  }

  return result;
}
