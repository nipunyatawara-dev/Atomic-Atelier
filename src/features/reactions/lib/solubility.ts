export type SolubilityState = "S" | "I" | "sS" | "D";

export interface IonRecord {
  formula: string;
  name: string;
  charge: number;
}

export interface SolubilityCell {
  cation: string;
  anion: string;
  state: SolubilityState;
  compoundFormula: string;
  color?: string;
  notes?: string;
}

export const CATIONS: IonRecord[] = [
  { formula: "Na⁺", name: "Sodium", charge: 1 },
  { formula: "K⁺", name: "Potassium", charge: 1 },
  { formula: "NH₄⁺", name: "Ammonium", charge: 1 },
  { formula: "Ag⁺", name: "Silver(I)", charge: 1 },
  { formula: "Mg²⁺", name: "Magnesium", charge: 2 },
  { formula: "Ca²⁺", name: "Calcium", charge: 2 },
  { formula: "Ba²⁺", name: "Barium", charge: 2 },
  { formula: "Fe²⁺", name: "Iron(II)", charge: 2 },
  { formula: "Fe³⁺", name: "Iron(III)", charge: 3 },
  { formula: "Cu²⁺", name: "Copper(II)", charge: 2 },
  { formula: "Zn²⁺", name: "Zinc", charge: 2 },
  { formula: "Pb²⁺", name: "Lead(II)", charge: 2 },
  { formula: "Al³⁺", name: "Aluminum", charge: 3 },
];

export const ANIONS: IonRecord[] = [
  { formula: "NO₃⁻", name: "Nitrate", charge: -1 },
  { formula: "C₂H₃O₂⁻", name: "Acetate", charge: -1 },
  { formula: "Cl⁻", name: "Chloride", charge: -1 },
  { formula: "Br⁻", name: "Bromide", charge: -1 },
  { formula: "I⁻", name: "Iodide", charge: -1 },
  { formula: "SO₄²⁻", name: "Sulfate", charge: -2 },
  { formula: "OH⁻", name: "Hydroxide", charge: -1 },
  { formula: "CO₃²⁻", name: "Carbonate", charge: -2 },
  { formula: "PO₄³⁻", name: "Phosphate", charge: -3 },
  { formula: "S²⁻", name: "Sulfide", charge: -2 },
];

export const SOLUBILITY_RULES = [
  {
    title: "Group 1 & Ammonium",
    rule: "All common salts of alkali metals (Li⁺, Na⁺, K⁺) and ammonium (NH₄⁺) are soluble.",
    type: "always-soluble",
  },
  {
    title: "Nitrates & Acetates",
    rule: "All nitrates (NO₃⁻) and acetates (C₂H₃O₂⁻) are soluble without exception.",
    type: "always-soluble",
  },
  {
    title: "Halides (Cl⁻, Br⁻, I⁻)",
    rule: "Most halides are soluble, EXCEPT with Ag⁺, Pb²⁺, and Hg₂²⁺.",
    type: "exceptions",
  },
  {
    title: "Sulfates (SO₄²⁻)",
    rule: "Most sulfates are soluble, EXCEPT BaSO₄, PbSO₄, and slightly CaSO₄/SrSO₄.",
    type: "exceptions",
  },
  {
    title: "Hydroxides (OH⁻)",
    rule: "Most hydroxides are insoluble, EXCEPT alkali metals and Ba(OH)₂ (Ca(OH)₂ is slightly soluble).",
    type: "mostly-insoluble",
  },
  {
    title: "Carbonates & Phosphates",
    rule: "Carbonates (CO₃²⁻), phosphates (PO₄³⁻), and sulfides (S²⁻) are insoluble, EXCEPT with alkali metals & NH₄⁺.",
    type: "mostly-insoluble",
  },
];

/**
 * Returns empirical aqueous solubility status for a given cation & anion pair.
 */
export function getSolubility(cation: string, anion: string): SolubilityCell {
  // Always soluble cations (Group 1 & NH4)
  if (["Na⁺", "K⁺", "NH₄⁺"].includes(cation)) {
    return { cation, anion, state: "S", compoundFormula: formatSaltFormula(cation, anion) };
  }

  // Always soluble anions (NO3 & Acetate)
  if (["NO₃⁻", "C₂H₃O₂⁻"].includes(anion)) {
    return { cation, anion, state: "S", compoundFormula: formatSaltFormula(cation, anion) };
  }

  // Halides (Cl, Br, I)
  if (["Cl⁻", "Br⁻", "I⁻"].includes(anion)) {
    if (cation === "Ag⁺") {
      const color = anion === "Cl⁻" ? "White" : anion === "Br⁻" ? "Cream" : "Bright Yellow";
      return {
        cation,
        anion,
        state: "I",
        compoundFormula: formatSaltFormula(cation, anion),
        color,
        notes: `${color} precipitate forms immediately.`,
      };
    }
    if (cation === "Pb²⁺") {
      const color = anion === "I⁻" ? "Golden Yellow" : "White";
      return {
        cation,
        anion,
        state: "I",
        compoundFormula: formatSaltFormula(cation, anion),
        color,
        notes: `${color} precipitate. PbI₂ sparkles upon slow cooling.`,
      };
    }
    return { cation, anion, state: "S", compoundFormula: formatSaltFormula(cation, anion) };
  }

  // Sulfates (SO4²⁻)
  if (anion === "SO₄²⁻") {
    if (["Ba²⁺", "Pb²⁺"].includes(cation)) {
      return {
        cation,
        anion,
        state: "I",
        compoundFormula: formatSaltFormula(cation, anion),
        color: "White",
        notes: "Heavy, dense white precipitate.",
      };
    }
    if (cation === "Ca²⁺") {
      return {
        cation,
        anion,
        state: "sS",
        compoundFormula: formatSaltFormula(cation, anion),
        color: "White",
        notes: "Slightly soluble (~2 g/L at 20°C).",
      };
    }
    return { cation, anion, state: "S", compoundFormula: formatSaltFormula(cation, anion) };
  }

  // Hydroxides (OH⁻)
  if (anion === "OH⁻") {
    if (cation === "Ba²⁺") {
      return { cation, anion, state: "S", compoundFormula: "Ba(OH)₂" };
    }
    if (cation === "Ca²⁺") {
      return {
        cation,
        anion,
        state: "sS",
        compoundFormula: "Ca(OH)₂",
        color: "White",
        notes: "Limewater (sparingly soluble).",
      };
    }
    if (cation === "Cu²⁺") {
      return {
        cation,
        anion,
        state: "I",
        compoundFormula: "Cu(OH)₂",
        color: "Sky Blue",
        notes: "Gelatinous sky-blue precipitate.",
      };
    }
    if (cation === "Fe²⁺") {
      return {
        cation,
        anion,
        state: "I",
        compoundFormula: "Fe(OH)₂",
        color: "Dirty Green",
        notes: "Oxidizes to brown Fe(OH)₃ upon air exposure.",
      };
    }
    if (cation === "Fe³⁺") {
      return {
        cation,
        anion,
        state: "I",
        compoundFormula: "Fe(OH)₃",
        color: "Rust Red-Brown",
        notes: "Flocculent reddish-brown rust precipitate.",
      };
    }
    if (cation === "Al³⁺") {
      return {
        cation,
        anion,
        state: "I",
        compoundFormula: "Al(OH)₃",
        color: "White Gelatinous",
        notes: "Amphoteric: redissolves in excess strong base.",
      };
    }
    if (cation === "Ag⁺") {
      return {
        cation,
        anion,
        state: "I",
        compoundFormula: "Ag₂O",
        color: "Dark Brown",
        notes: "Decomposes immediately to silver oxide Ag₂O.",
      };
    }
    return {
      cation,
      anion,
      state: "I",
      compoundFormula: formatSaltFormula(cation, anion),
      color: "White",
    };
  }

  // Carbonates, Phosphates, Sulfides
  if (["CO₃²⁻", "PO₄³⁻", "S²⁻"].includes(anion)) {
    let color = "White";
    if (anion === "S²⁻") {
      if (["Fe²⁺", "Cu²⁺", "Pb²⁺", "Ag⁺"].includes(cation)) {
        color = "Black";
      } else if (cation === "Zn²⁺") {
        color = "White";
      }
    }
    return {
      cation,
      anion,
      state: "I",
      compoundFormula: formatSaltFormula(cation, anion),
      color,
      notes: `${color} insoluble precipitate.`,
    };
  }

  return { cation, anion, state: "S", compoundFormula: formatSaltFormula(cation, anion) };
}

function formatSaltFormula(cation: string, anion: string): string {
  // Simple heuristic formula representation
  const cleanCat = cation.replace(/[⁺²³]/g, "");
  const cleanAn = anion.replace(/[⁻²³]/g, "");
  return `${cleanCat}${cleanAn}`;
}

// Activity Series of metals in descending order of reactivity (most active to least noble)
export interface ActivityMetal {
  symbol: string;
  name: string;
  standardPotential: number; // E° in Volts (reduction potential Mⁿ⁺ + ne⁻ -> M)
  reactsWith: "cold-water" | "steam" | "acids" | "unreactive";
}

export const ACTIVITY_SERIES: ActivityMetal[] = [
  { symbol: "Li", name: "Lithium", standardPotential: -3.04, reactsWith: "cold-water" },
  { symbol: "K", name: "Potassium", standardPotential: -2.93, reactsWith: "cold-water" },
  { symbol: "Ba", name: "Barium", standardPotential: -2.91, reactsWith: "cold-water" },
  { symbol: "Ca", name: "Calcium", standardPotential: -2.87, reactsWith: "cold-water" },
  { symbol: "Na", name: "Sodium", standardPotential: -2.71, reactsWith: "cold-water" },
  { symbol: "Mg", name: "Magnesium", standardPotential: -2.37, reactsWith: "steam" },
  { symbol: "Al", name: "Aluminum", standardPotential: -1.66, reactsWith: "steam" },
  { symbol: "Mn", name: "Manganese", standardPotential: -1.18, reactsWith: "steam" },
  { symbol: "Zn", name: "Zinc", standardPotential: -0.76, reactsWith: "acids" },
  { symbol: "Cr", name: "Chromium", standardPotential: -0.74, reactsWith: "acids" },
  { symbol: "Fe", name: "Iron", standardPotential: -0.44, reactsWith: "acids" },
  { symbol: "Ni", name: "Nickel", standardPotential: -0.26, reactsWith: "acids" },
  { symbol: "Sn", name: "Tin", standardPotential: -0.14, reactsWith: "acids" },
  { symbol: "Pb", name: "Lead", standardPotential: -0.13, reactsWith: "acids" },
  { symbol: "H2", name: "Hydrogen (Reference)", standardPotential: 0.00, reactsWith: "acids" },
  { symbol: "Cu", name: "Copper", standardPotential: +0.34, reactsWith: "unreactive" },
  { symbol: "Ag", name: "Silver", standardPotential: +0.80, reactsWith: "unreactive" },
  { symbol: "Pt", name: "Platinum", standardPotential: +1.20, reactsWith: "unreactive" },
  { symbol: "Au", name: "Gold", standardPotential: +1.50, reactsWith: "unreactive" },
];

export interface DisplacementResult {
  occurs: boolean;
  metalA: ActivityMetal;
  metalB: ActivityMetal;
  equation: string;
  explanation: string;
  voltageDelta: number;
}

/**
 * Predicts whether Metal A will displace Metal B from its salt solution in a single replacement reaction:
 * Metal A + Metal B(salt) -> Metal A(salt) + Metal B
 */
export function predictDisplacement(
  metalASymbol: string,
  metalBSymbol: string,
): DisplacementResult | null {
  const metalA = ACTIVITY_SERIES.find((m) => m.symbol === metalASymbol);
  const metalB = ACTIVITY_SERIES.find((m) => m.symbol === metalBSymbol);
  if (!metalA || !metalB || metalASymbol === metalBSymbol) return null;

  const indexA = ACTIVITY_SERIES.findIndex((m) => m.symbol === metalASymbol);
  const indexB = ACTIVITY_SERIES.findIndex((m) => m.symbol === metalBSymbol);

  // Metal A is higher in the series (indexA < indexB) -> more reactive -> can displace Metal B
  const occurs = indexA < indexB;
  const voltageDelta = metalB.standardPotential - metalA.standardPotential;

  let equation = "";
  let explanation = "";

  if (occurs) {
    equation = `${metalA.symbol}(s) + ${metalB.symbol}²⁺(aq) → ${metalA.symbol}²⁺(aq) + ${metalB.symbol}(s)`;
    explanation = `${metalA.name} is higher in the activity series than ${metalB.name} (E°cell = +${voltageDelta.toFixed(2)} V). It oxidizes spontaneously, transferring electrons to reduce ${metalB.name} ions into solid metal precipitate.`;
  } else {
    equation = `${metalA.symbol}(s) + ${metalB.symbol}²⁺(aq) → No Reaction`;
    explanation = `${metalA.name} is lower in the activity series than ${metalB.name} (less electropositive). It cannot reduce ${metalB.name} ions, so no reaction occurs under standard conditions.`;
  }

  return {
    occurs,
    metalA,
    metalB,
    equation,
    explanation,
    voltageDelta,
  };
}
