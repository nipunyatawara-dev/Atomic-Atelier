import { elementBySymbol } from "@/features/explorer/lib/elements";

export interface MolarElementBreakdown {
  symbol: string;
  name: string;
  atomicNumber: number;
  cpkColor: string;
  count: number;
  atomicMass: number;
  totalMass: number;
  percentage: number;
}

export interface MolarMassResult {
  formula: string;
  cleanFormula: string;
  molarMass: number;
  breakdown: MolarElementBreakdown[];
  totalAtoms: number;
}

export interface FormulaPreset {
  name: string;
  formula: string;
  category: string;
}

export const FORMULA_PRESETS: FormulaPreset[] = [
  { name: "Water", formula: "H2O", category: "Solvent" },
  { name: "Glucose", formula: "C6H12O6", category: "Sugar / Metabolism" },
  { name: "Caffeine", formula: "C8H10N4O2", category: "Stimulant" },
  { name: "Aspirin", formula: "C9H8O4", category: "Pharmaceutical" },
  {
    name: "Copper(II) Sulfate Pentahydrate",
    formula: "CuSO4·5H2O",
    category: "Hydrated Salt",
  },
  { name: "Calcium Phosphate", formula: "Ca3(PO4)2", category: "Mineral / Bone" },
  { name: "Ammonium Sulfate", formula: "(NH4)2SO4", category: "Fertilizer" },
  { name: "Sodium Bicarbonate", formula: "NaHCO3", category: "Baking Soda" },
  {
    name: "Adenosine Triphosphate (ATP)",
    formula: "C10H16N5O13P3",
    category: "Biochemistry",
  },
];

const AVOGADRO = 6.02214076e23;

/**
 * Parses a chemical formula with parentheses, brackets, and hydrates into element atom counts.
 * E.g., "Ca3(PO4)2" -> { Ca: 3, P: 2, O: 8 }
 * E.g., "CuSO4·5H2O" -> { Cu: 1, S: 1, O: 9, H: 10 }
 */
export function parseChemicalFormula(rawFormula: string): Record<string, number> {
  const formula = rawFormula.trim();
  if (!formula) return {};

  // Split into main salt and hydrate parts if present (·, *, .)
  const hydrateParts = formula.split(/[·*]/);
  const mainPart = hydrateParts[0];
  const hydratePart = hydrateParts[1];

  const counts: Record<string, number> = {};

  function merge(target: Record<string, number>, source: Record<string, number>, mult = 1) {
    for (const [sym, c] of Object.entries(source)) {
      target[sym] = (target[sym] ?? 0) + c * mult;
    }
  }

  function parseSegment(segment: string): Record<string, number> {
    let index = 0;

    function readNumber(): number {
      const match = segment.slice(index).match(/^\d+/);
      if (!match) return 1;
      index += match[0].length;
      return Number(match[0]);
    }

    function parseGroup(stopChar?: string): Record<string, number> {
      const result: Record<string, number> = {};

      while (index < segment.length && segment[index] !== stopChar) {
        const char = segment[index];

        if (char === "(" || char === "[") {
          index += 1;
          const matchingStop = char === "(" ? ")" : "]";
          const inner = parseGroup(matchingStop);
          if (index < segment.length && segment[index] === matchingStop) {
            index += 1;
          }
          const multiplier = readNumber();
          merge(result, inner, multiplier);
          continue;
        }

        // Element symbol match: 1 uppercase letter followed by optional lowercase letter
        const match = segment.slice(index).match(/^[A-Z][a-z]?/);
        if (!match) {
          index += 1;
          continue;
        }

        const symbol = match[0];
        index += symbol.length;
        const count = readNumber();
        result[symbol] = (result[symbol] ?? 0) + count;
      }

      return result;
    }

    return parseGroup();
  }

  merge(counts, parseSegment(mainPart));

  if (hydratePart) {
    // Check if hydrate has a coefficient prefix, e.g. "5H2O"
    const match = hydratePart.match(/^(\d+)(.*)/);
    const hydrateCoefficient = match ? Number(match[1]) : 1;
    const hydrateFormula = match ? match[2] : hydratePart;
    const hydrateCounts = parseSegment(hydrateFormula);
    merge(counts, hydrateCounts, hydrateCoefficient);
  }

  return counts;
}

/**
 * Calculates total molar mass and percentage mass breakdown for any formula.
 */
export function calculateMolarMass(rawFormula: string): MolarMassResult | null {
  const atomCounts = parseChemicalFormula(rawFormula);
  const entries = Object.entries(atomCounts);
  if (entries.length === 0) return null;

  let totalMolarMass = 0;
  let totalAtoms = 0;
  const breakdown: MolarElementBreakdown[] = [];

  for (const [symbol, count] of entries) {
    const el = elementBySymbol.get(symbol);
    if (!el) {
      // Unrecognized element symbol
      return null;
    }

    const atomicMass = parseFloat(el.atomicMass) || 0;
    const totalMass = atomicMass * count;
    totalMolarMass += totalMass;
    totalAtoms += count;

    breakdown.push({
      symbol: el.symbol,
      name: el.name,
      atomicNumber: el.atomicNumber,
      cpkColor: el.cpkColor,
      count,
      atomicMass,
      totalMass,
      percentage: 0, // computed below
    });
  }

  if (totalMolarMass <= 0) return null;

  // Compute percentages and sort from highest mass contribution to lowest
  breakdown.forEach((item) => {
    item.percentage = (item.totalMass / totalMolarMass) * 100;
  });
  breakdown.sort((a, b) => b.totalMass - a.totalMass);

  return {
    formula: rawFormula,
    cleanFormula: rawFormula.replace(/\s+/g, ""),
    molarMass: totalMolarMass,
    breakdown,
    totalAtoms,
  };
}

export function gramsToMoles(grams: number, molarMass: number): number {
  if (molarMass <= 0) return 0;
  return grams / molarMass;
}

export function molesToGrams(moles: number, molarMass: number): number {
  return moles * molarMass;
}

export function molesToParticles(moles: number): number {
  return moles * AVOGADRO;
}
