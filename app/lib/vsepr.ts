import type {
  VseprElectronGeometry,
  VseprMolecularGeometry,
} from "./types";

export type VseprTemplate = {
  stericNumber: number;
  bondingPairs: number;
  lonePairs: number;
  axeNotation: string;
  electronGeometry: VseprElectronGeometry;
  molecularGeometry: VseprMolecularGeometry;
  idealBondAngle: string;
  predictedBondAngle: string;
  hybridization: string;
  defaultPolarity: "Polar" | "Non-polar";
};

export const VSEPR_TEMPLATES: Record<string, VseprTemplate> = {
  "AX2": {
    stericNumber: 2,
    bondingPairs: 2,
    lonePairs: 0,
    axeNotation: "AX₂",
    electronGeometry: "Linear",
    molecularGeometry: "Linear",
    idealBondAngle: "180°",
    predictedBondAngle: "180°",
    hybridization: "sp",
    defaultPolarity: "Non-polar",
  },
  "AX3": {
    stericNumber: 3,
    bondingPairs: 3,
    lonePairs: 0,
    axeNotation: "AX₃",
    electronGeometry: "Trigonal Planar",
    molecularGeometry: "Trigonal Planar",
    idealBondAngle: "120°",
    predictedBondAngle: "120°",
    hybridization: "sp²",
    defaultPolarity: "Non-polar",
  },
  "AX2E": {
    stericNumber: 3,
    bondingPairs: 2,
    lonePairs: 1,
    axeNotation: "AX₂E",
    electronGeometry: "Trigonal Planar",
    molecularGeometry: "Bent (120°)",
    idealBondAngle: "120°",
    predictedBondAngle: "118.5°",
    hybridization: "sp²",
    defaultPolarity: "Polar",
  },
  "AX4": {
    stericNumber: 4,
    bondingPairs: 4,
    lonePairs: 0,
    axeNotation: "AX₄",
    electronGeometry: "Tetrahedral",
    molecularGeometry: "Tetrahedral",
    idealBondAngle: "109.5°",
    predictedBondAngle: "109.5°",
    hybridization: "sp³",
    defaultPolarity: "Non-polar",
  },
  "AX3E": {
    stericNumber: 4,
    bondingPairs: 3,
    lonePairs: 1,
    axeNotation: "AX₃E",
    electronGeometry: "Tetrahedral",
    molecularGeometry: "Trigonal Pyramidal",
    idealBondAngle: "109.5°",
    predictedBondAngle: "107.0°",
    hybridization: "sp³",
    defaultPolarity: "Polar",
  },
  "AX2E2": {
    stericNumber: 4,
    bondingPairs: 2,
    lonePairs: 2,
    axeNotation: "AX₂E₂",
    electronGeometry: "Tetrahedral",
    molecularGeometry: "Bent (104.5°)",
    idealBondAngle: "109.5°",
    predictedBondAngle: "104.5°",
    hybridization: "sp³",
    defaultPolarity: "Polar",
  },
  "AX5": {
    stericNumber: 5,
    bondingPairs: 5,
    lonePairs: 0,
    axeNotation: "AX₅",
    electronGeometry: "Trigonal Bipyramidal",
    molecularGeometry: "Trigonal Bipyramidal",
    idealBondAngle: "90° & 120°",
    predictedBondAngle: "90° & 120°",
    hybridization: "sp³d",
    defaultPolarity: "Non-polar",
  },
  "AX4E": {
    stericNumber: 5,
    bondingPairs: 4,
    lonePairs: 1,
    axeNotation: "AX₄E",
    electronGeometry: "Trigonal Bipyramidal",
    molecularGeometry: "Seesaw",
    idealBondAngle: "90° & 120°",
    predictedBondAngle: "87° & 102°",
    hybridization: "sp³d",
    defaultPolarity: "Polar",
  },
  "AX3E2": {
    stericNumber: 5,
    bondingPairs: 3,
    lonePairs: 2,
    axeNotation: "AX₃E₂",
    electronGeometry: "Trigonal Bipyramidal",
    molecularGeometry: "T-shaped",
    idealBondAngle: "90°",
    predictedBondAngle: "87.5°",
    hybridization: "sp³d",
    defaultPolarity: "Polar",
  },
  "AX2E3": {
    stericNumber: 5,
    bondingPairs: 2,
    lonePairs: 3,
    axeNotation: "AX₂E₃",
    electronGeometry: "Trigonal Bipyramidal",
    molecularGeometry: "Linear",
    idealBondAngle: "180°",
    predictedBondAngle: "180°",
    hybridization: "sp³d",
    defaultPolarity: "Non-polar",
  },
  "AX6": {
    stericNumber: 6,
    bondingPairs: 6,
    lonePairs: 0,
    axeNotation: "AX₆",
    electronGeometry: "Octahedral",
    molecularGeometry: "Octahedral",
    idealBondAngle: "90°",
    predictedBondAngle: "90°",
    hybridization: "sp³d²",
    defaultPolarity: "Non-polar",
  },
  "AX5E": {
    stericNumber: 6,
    bondingPairs: 5,
    lonePairs: 1,
    axeNotation: "AX₅E",
    electronGeometry: "Octahedral",
    molecularGeometry: "Square Pyramidal",
    idealBondAngle: "90°",
    predictedBondAngle: "85°",
    hybridization: "sp³d²",
    defaultPolarity: "Polar",
  },
  "AX4E2": {
    stericNumber: 6,
    bondingPairs: 4,
    lonePairs: 2,
    axeNotation: "AX₄E₂",
    electronGeometry: "Octahedral",
    molecularGeometry: "Square Planar",
    idealBondAngle: "90°",
    predictedBondAngle: "90°",
    hybridization: "sp³d²",
    defaultPolarity: "Non-polar",
  },
};

export const PAULING_ELECTRONEGATIVITY: Record<string, number> = {
  H: 2.20,
  He: 0,
  Li: 0.98,
  Be: 1.57,
  B: 2.04,
  C: 2.55,
  N: 3.04,
  O: 3.44,
  F: 3.98,
  Ne: 0,
  Na: 0.93,
  Mg: 1.31,
  Al: 1.61,
  Si: 1.90,
  P: 2.19,
  S: 2.58,
  Cl: 3.16,
  Ar: 0,
  K: 0.82,
  Ca: 1.00,
  Br: 2.96,
  I: 2.66,
  Xe: 2.60,
};

export const ELEMENT_RADII_VDW: Record<string, number> = {
  H: 1.20,
  He: 1.40,
  Li: 1.82,
  Be: 1.53,
  B: 1.92,
  C: 1.70,
  N: 1.55,
  O: 1.52,
  F: 1.47,
  Ne: 1.54,
  Na: 2.27,
  Mg: 1.73,
  Al: 1.84,
  Si: 2.10,
  P: 1.80,
  S: 1.80,
  Cl: 1.75,
  Ar: 1.88,
  K: 2.75,
  Ca: 2.31,
  Br: 1.85,
  I: 1.98,
  Xe: 2.16,
};

export const ELEMENT_CPK_COLORS: Record<string, number> = {
  H: 0xf4f1e8,
  C: 0x3d414d,
  N: 0x3b66cf,
  O: 0xe0564c,
  F: 0x76d7c4,
  Cl: 0x48b668,
  Br: 0x9b4722,
  I: 0x712f87,
  He: 0x9c8dbe,
  Ne: 0xb57edc,
  Ar: 0x8a9ba8,
  Xe: 0x7997a8,
  P: 0xe67e22,
  S: 0xecd145,
  B: 0xf39c12,
  Be: 0x88d49e,
  Si: 0xc4b79b,
  Na: 0x9b72d4,
  Mg: 0x74b890,
  Al: 0xa9acb8,
  K: 0xb26ad2,
  Ca: 0xd2b56b,
  Fe: 0xba694c,
};

/**
 * Calculates 3D ideal unit vectors for VSEPR arrangements.
 * Returns both bonded ligand positions and lone pair positions.
 */
export function generateVsepr3DPositions(
  bondingPairs: number,
  lonePairs: number,
  bondLength = 1.35,
  lonePairDistance = 0.95,
): { ligandPositions: [number, number, number][]; lonePairPositions: [number, number, number][] } {
  const steric = bondingPairs + lonePairs;

  if (steric === 2) {
    // Linear
    return {
      ligandPositions: [
        [0, 0, bondLength],
        [0, 0, -bondLength],
      ],
      lonePairPositions: [],
    };
  }

  if (steric === 3) {
    // Trigonal planar base
    const r = bondLength;
    const lpR = lonePairDistance;

    if (lonePairs === 1) {
      // AX2E: Lone pair at top (0, lpR, 0), two ligands below at ~118.5 deg separation
      const halfAngle = (118.5 / 2) * (Math.PI / 180);
      return {
        ligandPositions: [
          [Math.sin(halfAngle) * r, -Math.cos(halfAngle) * r, 0],
          [-Math.sin(halfAngle) * r, -Math.cos(halfAngle) * r, 0],
        ],
        lonePairPositions: [[0, lpR, 0]],
      };
    }

    return {
      ligandPositions: [
        [0, r, 0],
        [Math.cos(-Math.PI / 6) * r, Math.sin(-Math.PI / 6) * r, 0],
        [Math.cos(-5 * Math.PI / 6) * r, Math.sin(-5 * Math.PI / 6) * r, 0],
      ],
      lonePairPositions: [],
    };
  }

  if (steric === 4) {
    if (lonePairs === 0) {
      // AX4: regular tetrahedron
      const r = bondLength;
      const v0: [number, number, number] = [0, r, 0];
      const y = -r / 3;
      const ringR = r * Math.sqrt(8 / 9);
      const v1: [number, number, number] = [ringR, y, 0];
      const v2: [number, number, number] = [-ringR / 2, y, (ringR * Math.sqrt(3)) / 2];
      const v3: [number, number, number] = [-ringR / 2, y, (-ringR * Math.sqrt(3)) / 2];
      return { ligandPositions: [v0, v1, v2, v3], lonePairPositions: [] };
    }

    if (lonePairs === 1) {
      // AX3E: Trigonal pyramidal (e.g. NH3, angle ~107.0)
      const r = bondLength;
      const lpR = lonePairDistance;
      const baseAngle = 107.0 * (Math.PI / 180);
      const thetaApex = Math.acos(1 - (1 - Math.cos(baseAngle)) * (2 / 3));
      const y = -r * Math.cos(thetaApex);
      const ringR = r * Math.sin(thetaApex);

      return {
        ligandPositions: [
          [ringR, y, 0],
          [-ringR / 2, y, (ringR * Math.sqrt(3)) / 2],
          [-ringR / 2, y, (-ringR * Math.sqrt(3)) / 2],
        ],
        lonePairPositions: [[0, lpR, 0]],
      };
    }

    if (lonePairs === 2) {
      // AX2E2: Bent ~104.5 deg (e.g. H2O)
      const r = bondLength;
      const lpR = lonePairDistance;
      const halfHOH = (104.5 / 2) * (Math.PI / 180);
      const halfLP = (112.0 / 2) * (Math.PI / 180);

      return {
        ligandPositions: [
          [Math.sin(halfHOH) * r, -Math.cos(halfHOH) * r, 0],
          [-Math.sin(halfHOH) * r, -Math.cos(halfHOH) * r, 0],
        ],
        lonePairPositions: [
          [0, Math.cos(halfLP) * lpR, Math.sin(halfLP) * lpR],
          [0, Math.cos(halfLP) * lpR, -Math.sin(halfLP) * lpR],
        ],
      };
    }
  }

  if (steric === 5) {
    const r = bondLength;
    const lpR = lonePairDistance;
    const axialUp: [number, number, number] = [0, r * 1.05, 0];
    const axialDown: [number, number, number] = [0, -r * 1.05, 0];
    const eq1: [number, number, number] = [r, 0, 0];
    const eq2: [number, number, number] = [-r / 2, 0, (r * Math.sqrt(3)) / 2];
    const eq3: [number, number, number] = [-r / 2, 0, (-r * Math.sqrt(3)) / 2];

    const lpEq1: [number, number, number] = [lpR, 0, 0];
    const lpEq2: [number, number, number] = [-lpR / 2, 0, (lpR * Math.sqrt(3)) / 2];
    const lpEq3: [number, number, number] = [-lpR / 2, 0, (-lpR * Math.sqrt(3)) / 2];

    if (lonePairs === 0) {
      return { ligandPositions: [axialUp, axialDown, eq1, eq2, eq3], lonePairPositions: [] };
    }
    if (lonePairs === 1) {
      // AX4E: Seesaw (lone pair at eq1)
      return { ligandPositions: [axialUp, axialDown, eq2, eq3], lonePairPositions: [lpEq1] };
    }
    if (lonePairs === 2) {
      // AX3E2: T-shaped (lone pairs at eq2, eq3)
      return { ligandPositions: [axialUp, axialDown, eq1], lonePairPositions: [lpEq2, lpEq3] };
    }
    if (lonePairs === 3) {
      // AX2E3: Linear (lone pairs at eq1, eq2, eq3)
      return { ligandPositions: [axialUp, axialDown], lonePairPositions: [lpEq1, lpEq2, lpEq3] };
    }
  }

  if (steric === 6) {
    const r = bondLength;
    const lpR = lonePairDistance;
    const pX: [number, number, number] = [r, 0, 0];
    const nX: [number, number, number] = [-r, 0, 0];
    const pY: [number, number, number] = [0, r, 0];
    const nY: [number, number, number] = [0, -r, 0];
    const pZ: [number, number, number] = [0, 0, r];
    const nZ: [number, number, number] = [0, 0, -r];

    if (lonePairs === 0) {
      return { ligandPositions: [pX, nX, pY, nY, pZ, nZ], lonePairPositions: [] };
    }
    if (lonePairs === 1) {
      // AX5E: Square Pyramidal
      return { ligandPositions: [pX, nX, pY, pZ, nZ], lonePairPositions: [[0, -lpR, 0]] };
    }
    if (lonePairs === 2) {
      // AX4E2: Square Planar
      return { ligandPositions: [pX, nX, pZ, nZ], lonePairPositions: [[0, lpR, 0], [0, -lpR, 0]] };
    }
  }

  return {
    ligandPositions: [
      [0, bondLength, 0],
      [0, -bondLength, 0],
    ],
    lonePairPositions: [],
  };
}

/**
 * Computes net molecular 3D dipole moment vector and polarity based on atom electronegativity.
 */
export function calculateNetDipole(
  centralSymbol: string,
  centralPos: [number, number, number],
  ligands: { symbol: string; position: [number, number, number] }[],
): { dipoleVector: [number, number, number]; dipoleDebye: number; polarity: "Polar" | "Non-polar" } {
  const centralChi = PAULING_ELECTRONEGATIVITY[centralSymbol] ?? 2.5;
  let netX = 0;
  let netY = 0;
  let netZ = 0;

  for (const ligand of ligands) {
    const ligandChi = PAULING_ELECTRONEGATIVITY[ligand.symbol] ?? 2.5;
    const deltaChi = ligandChi - centralChi;

    const dx = ligand.position[0] - centralPos[0];
    const dy = ligand.position[1] - centralPos[1];
    const dz = ligand.position[2] - centralPos[2];
    const len = Math.hypot(dx, dy, dz) || 1;

    const factor = deltaChi / len;
    netX += dx * factor;
    netY += dy * factor;
    netZ += dz * factor;
  }

  const magnitude = Math.hypot(netX, netY, netZ);
  const isPolar = magnitude > 0.12;
  const dipoleDebye = isPolar ? Number((magnitude * 1.35).toFixed(2)) : 0;

  const normalizedVector: [number, number, number] = magnitude > 0.001
    ? [netX / magnitude, netY / magnitude, netZ / magnitude]
    : [0, 0, 0];

  return {
    dipoleVector: normalizedVector,
    dipoleDebye,
    polarity: isPolar ? "Polar" : "Non-polar",
  };
}

/**
 * Computes the angle in degrees formed by three 3D points (A-B-C with B as vertex).
 */
export function calculateAngleDegrees(
  a: [number, number, number],
  b: [number, number, number],
  c: [number, number, number],
): number {
  const v1 = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const v2 = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];

  const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  const mag1 = Math.hypot(v1[0], v1[1], v1[2]);
  const mag2 = Math.hypot(v2[0], v2[1], v2[2]);

  if (mag1 < 0.0001 || mag2 < 0.0001) return 0;
  const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Number(((Math.acos(cosTheta) * 180) / Math.PI).toFixed(1));
}
