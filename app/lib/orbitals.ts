import type { ElementRecord } from "./types";

export type SubshellType = "s" | "p" | "d" | "f";

export type SubshellInfo = {
  n: number;
  type: SubshellType;
  electrons: number;
  maxElectrons: number;
  label: string;
};

const NOBLE_GAS_CONFIGS: Record<string, SubshellInfo[]> = {
  "[He]": [{ n: 1, type: "s", electrons: 2, maxElectrons: 2, label: "1s" }],
  "[Ne]": [
    { n: 1, type: "s", electrons: 2, maxElectrons: 2, label: "1s" },
    { n: 2, type: "s", electrons: 2, maxElectrons: 2, label: "2s" },
    { n: 2, type: "p", electrons: 6, maxElectrons: 6, label: "2p" },
  ],
  "[Ar]": [
    { n: 1, type: "s", electrons: 2, maxElectrons: 2, label: "1s" },
    { n: 2, type: "s", electrons: 2, maxElectrons: 2, label: "2s" },
    { n: 2, type: "p", electrons: 6, maxElectrons: 6, label: "2p" },
    { n: 3, type: "s", electrons: 2, maxElectrons: 2, label: "3s" },
    { n: 3, type: "p", electrons: 6, maxElectrons: 6, label: "3p" },
  ],
  "[Kr]": [
    { n: 1, type: "s", electrons: 2, maxElectrons: 2, label: "1s" },
    { n: 2, type: "s", electrons: 2, maxElectrons: 2, label: "2s" },
    { n: 2, type: "p", electrons: 6, maxElectrons: 6, label: "2p" },
    { n: 3, type: "s", electrons: 2, maxElectrons: 2, label: "3s" },
    { n: 3, type: "p", electrons: 6, maxElectrons: 6, label: "3p" },
    { n: 3, type: "d", electrons: 10, maxElectrons: 10, label: "3d" },
    { n: 4, type: "s", electrons: 2, maxElectrons: 2, label: "4s" },
    { n: 4, type: "p", electrons: 6, maxElectrons: 6, label: "4p" },
  ],
  "[Xe]": [
    { n: 1, type: "s", electrons: 2, maxElectrons: 2, label: "1s" },
    { n: 2, type: "s", electrons: 2, maxElectrons: 2, label: "2s" },
    { n: 2, type: "p", electrons: 6, maxElectrons: 6, label: "2p" },
    { n: 3, type: "s", electrons: 2, maxElectrons: 2, label: "3s" },
    { n: 3, type: "p", electrons: 6, maxElectrons: 6, label: "3p" },
    { n: 3, type: "d", electrons: 10, maxElectrons: 10, label: "3d" },
    { n: 4, type: "s", electrons: 2, maxElectrons: 2, label: "4s" },
    { n: 4, type: "p", electrons: 6, maxElectrons: 6, label: "4p" },
    { n: 4, type: "d", electrons: 10, maxElectrons: 10, label: "4d" },
    { n: 5, type: "s", electrons: 2, maxElectrons: 2, label: "5s" },
    { n: 5, type: "p", electrons: 6, maxElectrons: 6, label: "5p" },
  ],
  "[Rn]": [
    { n: 1, type: "s", electrons: 2, maxElectrons: 2, label: "1s" },
    { n: 2, type: "s", electrons: 2, maxElectrons: 2, label: "2s" },
    { n: 2, type: "p", electrons: 6, maxElectrons: 6, label: "2p" },
    { n: 3, type: "s", electrons: 2, maxElectrons: 2, label: "3s" },
    { n: 3, type: "p", electrons: 6, maxElectrons: 6, label: "3p" },
    { n: 3, type: "d", electrons: 10, maxElectrons: 10, label: "3d" },
    { n: 4, type: "s", electrons: 2, maxElectrons: 2, label: "4s" },
    { n: 4, type: "p", electrons: 6, maxElectrons: 6, label: "4p" },
    { n: 4, type: "d", electrons: 10, maxElectrons: 10, label: "4d" },
    { n: 4, type: "f", electrons: 14, maxElectrons: 14, label: "4f" },
    { n: 5, type: "s", electrons: 2, maxElectrons: 2, label: "5s" },
    { n: 5, type: "p", electrons: 6, maxElectrons: 6, label: "5p" },
    { n: 5, type: "d", electrons: 10, maxElectrons: 10, label: "5d" },
    { n: 6, type: "s", electrons: 2, maxElectrons: 2, label: "6s" },
    { n: 6, type: "p", electrons: 6, maxElectrons: 6, label: "6p" },
  ],
};

const MAX_ELECTRONS: Record<SubshellType, number> = {
  s: 2,
  p: 6,
  d: 10,
  f: 14,
};

export const SUBSHELL_COLORS: Record<SubshellType, { main: number; hex: string; name: string }> = {
  s: { main: 0x48cae4, hex: "#48cae4", name: "s-orbital (spherical)" },
  p: { main: 0xa564d3, hex: "#a564d3", name: "p-orbital (dumbbell)" },
  d: { main: 0xe0a938, hex: "#e0a938", name: "d-orbital (cloverleaf)" },
  f: { main: 0xe76f51, hex: "#e76f51", name: "f-orbital (multi-lobed)" },
};

/**
 * Parses an electron configuration string (e.g. "[Ne] 3s² 3p²" or "1s² 2s² 2p⁶")
 * into a structured array of occupied subshells.
 */
export function parseElectronConfiguration(configStr: string, element?: ElementRecord): SubshellInfo[] {
  if (!configStr || configStr.trim() === "") {
    return fallbackSubshellsFromShells(element);
  }

  const subshells: SubshellInfo[] = [];
  const parts = configStr.trim().split(/\s+/);

  for (const part of parts) {
    if (NOBLE_GAS_CONFIGS[part]) {
      subshells.push(...NOBLE_GAS_CONFIGS[part].map((s) => ({ ...s })));
      continue;
    }

    // Match patterns like "3s²", "2p⁶", "3d10", "4f14" (supports superscripts and standard digits)
    const match = part.match(/^([1-7])([spdf])([0-9²³⁴⁵⁶⁷⁸⁹⁰¹]+)?$/i);
    if (match) {
      const n = parseInt(match[1], 10);
      const type = match[2].toLowerCase() as SubshellType;
      const countStr = match[3] ?? "1";
      const electrons = parseSuperScriptNumber(countStr);
      subshells.push({
        n,
        type,
        electrons,
        maxElectrons: MAX_ELECTRONS[type],
        label: `${n}${type}`,
      });
    }
  }

  if (subshells.length === 0) {
    return fallbackSubshellsFromShells(element);
  }

  return subshells;
}

function parseSuperScriptNumber(str: string): number {
  const superscripts: Record<string, string> = {
    "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5",
    "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁰": "0",
  };
  const normalized = str.replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g, (char) => superscripts[char] ?? char);
  const parsed = parseInt(normalized, 10);
  return isNaN(parsed) ? 1 : parsed;
}

function fallbackSubshellsFromShells(element?: ElementRecord): SubshellInfo[] {
  if (!element || !element.shells) {
    return [{ n: 1, type: "s", electrons: 1, maxElectrons: 2, label: "1s" }];
  }
  const result: SubshellInfo[] = [];
  const subshellOrder: SubshellType[] = ["s", "p", "d", "f"];

  element.shells.forEach((totalElectrons, shellIdx) => {
    const n = shellIdx + 1;
    let remaining = totalElectrons;
    for (const type of subshellOrder) {
      if (remaining <= 0) break;
      const max = MAX_ELECTRONS[type];
      const count = Math.min(remaining, max);
      result.push({ n, type, electrons: count, maxElectrons: max, label: `${n}${type}` });
      remaining -= count;
    }
  });
  return result;
}

/**
 * Returns a scale radius for principal quantum number n.
 */
export function subshellRadius(n: number, type: SubshellType): number {
  const typeOffset = type === "s" ? 0 : type === "p" ? 0.25 : type === "d" ? 0.5 : 0.75;
  return 0.9 + (n - 1) * 0.7 + typeOffset;
}

/**
 * Generates point cloud positions for a given subshell orbital cloud.
 */
export function generateOrbitalCloudPoints(
  subshell: SubshellInfo,
  totalPoints = 800,
): Float32Array {
  const positions = new Float32Array(totalPoints * 3);
  const rBase = subshellRadius(subshell.n, subshell.type);
  const occupancyRatio = Math.max(0.2, subshell.electrons / subshell.maxElectrons);
  const pointCount = Math.floor(totalPoints * occupancyRatio);

  let idx = 0;

  for (let i = 0; i < pointCount; i++) {
    const [x, y, z] = sampleOrbitalPoint(subshell.n, subshell.type, rBase, i);
    positions[idx++] = x;
    positions[idx++] = y;
    positions[idx++] = z;
  }

  // Fill remaining buffer with zero positions (or hide them)
  while (idx < positions.length) {
    positions[idx++] = 0;
    positions[idx++] = 0;
    positions[idx++] = 0;
  }

  return positions;
}

/**
 * Samples a 3D coordinate (x,y,z) matching spatial probability distribution for s, p, d, f orbitals.
 */
function sampleOrbitalPoint(
  n: number,
  type: SubshellType,
  rBase: number,
  index: number,
): [number, number, number] {
  // Re-producible pseudo-random sampling
  const u1 = (Math.sin(index * 12.9898 + n * 78.233) + 1) / 2;
  const u2 = (Math.cos(index * 43.2341 + n * 19.821) + 1) / 2;
  const u3 = (Math.sin(index * 91.1234 + n * 33.456) + 1) / 2;

  const theta = u1 * Math.PI * 2;
  const phi = Math.acos(2 * u2 - 1); // uniform sphere angle

  // Radial probability thickness
  const radialThickness = 0.25 + 0.15 * Math.sin(index * 3.14);
  const r = rBase + (u3 - 0.5) * radialThickness;

  if (type === "s") {
    // Spherical symmetry
    return [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    ];
  }

  if (type === "p") {
    // Dumbbell lobes along X, Y, Z axes
    const lobeSelector = index % 3; // 0: px, 1: py, 2: pz
    const cosAngle = Math.cos(phi);
    const weight = Math.abs(cosAngle) * 1.5;

    if (lobeSelector === 0) {
      // px lobe along X
      const pz = r * (2 * u2 - 1) * 0.4;
      const py = r * Math.sin(theta) * 0.4;
      const px = (u1 > 0.5 ? 1 : -1) * (r * 0.75 + weight * 0.5);
      return [px, py, pz];
    } else if (lobeSelector === 1) {
      // py lobe along Y
      const px = r * Math.cos(theta) * 0.4;
      const pz = r * (2 * u2 - 1) * 0.4;
      const py = (u1 > 0.5 ? 1 : -1) * (r * 0.75 + weight * 0.5);
      return [px, py, pz];
    } else {
      // pz lobe along Z
      const px = r * Math.cos(theta) * 0.4;
      const py = r * Math.sin(theta) * 0.4;
      const pz = (u1 > 0.5 ? 1 : -1) * (r * 0.75 + weight * 0.5);
      return [px, py, pz];
    }
  }

  if (type === "d") {
    // Cloverleaf 4-lobe structure & dz2 dumbbell+torus
    const dSelector = index % 5;
    const sign1 = u1 > 0.5 ? 1 : -1;
    const sign2 = u2 > 0.5 ? 1 : -1;

    if (dSelector === 4) {
      // dz2: z-dumbbell + xy torus
      if (u3 > 0.4) {
        // Torus ring in XY plane
        const ringR = r * 0.8;
        return [ringR * Math.cos(theta), ringR * Math.sin(theta), (u1 - 0.5) * 0.2];
      } else {
        // Z dumbbell
        return [Math.cos(theta) * 0.3, Math.sin(theta) * 0.3, sign1 * r * 0.95];
      }
    } else {
      // Cloverleaf lobes in diagonal directions
      const diagAngle = ((dSelector * 90 + 45) * Math.PI) / 180;
      const lobeR = r * (0.65 + 0.35 * u3);
      const spread = (u1 - 0.5) * 0.35;
      const x = sign1 * lobeR * Math.cos(diagAngle) + spread;
      const y = sign2 * lobeR * Math.sin(diagAngle) + spread;
      const z = (u2 - 0.5) * 0.5;
      return [x, y, z];
    }
  }

  // f-orbital: multi-polar 8-lobe cluster
  const octantX = (index % 2 === 0 ? 1 : -1) * r * 0.62 * (0.8 + 0.3 * u1);
  const octantY = (Math.floor(index / 2) % 2 === 0 ? 1 : -1) * r * 0.62 * (0.8 + 0.3 * u2);
  const octantZ = (Math.floor(index / 4) % 2 === 0 ? 1 : -1) * r * 0.62 * (0.8 + 0.3 * u3);
  return [octantX, octantY, octantZ];
}
