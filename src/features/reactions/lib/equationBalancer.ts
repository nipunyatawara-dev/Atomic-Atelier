import { elementBySymbol } from "@/features/explorer/lib/elements";
import { parseChemicalFormula } from "./molarMass";

export interface BalancedSpecies {
  formula: string;
  coefficient: number;
  counts: Record<string, number>;
}

export interface BalancedEquationResult {
  valid: boolean;
  error?: string;
  reactants: BalancedSpecies[];
  products: BalancedSpecies[];
  elements: string[];
  atomTotals: Record<string, number>;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a * b) / gcd(a, b));
}

type Fraction = { num: number; den: number };

function makeFrac(num: number, den = 1): Fraction {
  if (den === 0) return { num: 0, den: 1 };
  if (num === 0) return { num: 0, den: 1 };
  const sign = (num < 0) !== (den < 0) ? -1 : 1;
  const g = gcd(Math.abs(num), Math.abs(den));
  return { num: sign * (Math.abs(num) / g), den: Math.abs(den) / g };
}

function addFrac(a: Fraction, b: Fraction): Fraction {
  return makeFrac(a.num * b.den + b.num * a.den, a.den * b.den);
}

function subFrac(a: Fraction, b: Fraction): Fraction {
  return makeFrac(a.num * b.den - b.num * a.den, a.den * b.den);
}

function mulFrac(a: Fraction, b: Fraction): Fraction {
  return makeFrac(a.num * b.num, a.den * b.den);
}

function divFrac(a: Fraction, b: Fraction): Fraction {
  return makeFrac(a.num * b.den, a.den * b.num);
}

/**
 * Balances a chemical equation string (e.g. "Fe + O2 -> Fe2O3" or "KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2")
 * using exact rational Gaussian elimination (RREF) to find the smallest whole-number stoichiometric coefficients.
 */
export function balanceChemicalEquation(rawInput: string): BalancedEquationResult {
  const cleaned = rawInput
    .replace(/[₀-₉]/g, (d) =>
      ({ "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9" }[d] || d),
    )
    .trim();

  if (!cleaned) {
    return { valid: false, error: "Enter a chemical equation (e.g. Fe + O2 -> Fe2O3).", reactants: [], products: [], elements: [], atomTotals: {} };
  }

  const arrowMatch = cleaned.split(/\s*(?:->|-->|→|=|⇌|<=>)\s*/);
  if (arrowMatch.length !== 2 || !arrowMatch[0].trim() || !arrowMatch[1].trim()) {
    return {
      valid: false,
      error: "Separate reactants and products with '->' or '=' (e.g. CH4 + O2 -> CO2 + H2O).",
      reactants: [],
      products: [],
      elements: [],
      atomTotals: {},
    };
  }

  const parseSide = (sideStr: string) => {
    const rawTerms = sideStr
      .split(/\s*\+\s*/)
      .map((t) => t.trim())
      .filter(Boolean);
    const parsed: { formula: string; counts: Record<string, number> }[] = [];
    for (const term of rawTerms) {
      // Strip any leading stoichiometric coefficient user may have typed
      const formulaOnly = term.replace(/^\d+\s*/, "").trim();
      const counts = parseChemicalFormula(formulaOnly);
      const entries = Object.entries(counts);
      if (entries.length === 0) {
        return { error: `Invalid chemical formula: "${term}"`, items: [] };
      }
      for (const [sym] of entries) {
        if (!elementBySymbol.has(sym)) {
          return { error: `Unknown element symbol "${sym}" in "${term}"`, items: [] };
        }
      }
      parsed.push({ formula: formulaOnly, counts });
    }
    return { error: undefined, items: parsed };
  };

  const leftParsed = parseSide(arrowMatch[0]);
  if (leftParsed.error) {
    return { valid: false, error: leftParsed.error, reactants: [], products: [], elements: [], atomTotals: {} };
  }
  const rightParsed = parseSide(arrowMatch[1]);
  if (rightParsed.error) {
    return { valid: false, error: rightParsed.error, reactants: [], products: [], elements: [], atomTotals: {} };
  }

  const leftElements = new Set(leftParsed.items.flatMap((i) => Object.keys(i.counts)));
  const rightElements = new Set(rightParsed.items.flatMap((i) => Object.keys(i.counts)));

  for (const el of leftElements) {
    if (!rightElements.has(el)) {
      return {
        valid: false,
        error: `Element ${el} appears in reactants but not in products.`,
        reactants: [],
        products: [],
        elements: [],
        atomTotals: {},
      };
    }
  }
  for (const el of rightElements) {
    if (!leftElements.has(el)) {
      return {
        valid: false,
        error: `Element ${el} appears in products but not in reactants.`,
        reactants: [],
        products: [],
        elements: [],
        atomTotals: {},
      };
    }
  }

  const elements = [...leftElements];
  const allSpecies = [...leftParsed.items, ...rightParsed.items];
  const nReactants = leftParsed.items.length;
  const nCols = allSpecies.length;
  const nRows = elements.length;

  // Build stoichiometry matrix A (nRows x nCols): positive for reactants, negative for products
  const matrix: Fraction[][] = elements.map((el) =>
    allSpecies.map((sp, idx) => {
      const c = sp.counts[el] ?? 0;
      return makeFrac(idx < nReactants ? c : -c, 1);
    }),
  );

  // Compute RREF of matrix
  let lead = 0;
  const pivotColForRow: number[] = [];
  for (let r = 0; r < nRows && lead < nCols; r++) {
    let i = r;
    while (i < nRows && matrix[i][lead].num === 0) {
      i++;
    }
    if (i === nRows) {
      lead++;
      r--;
      continue;
    }
    // Swap rows i and r
    const temp = matrix[r];
    matrix[r] = matrix[i];
    matrix[i] = temp;

    // Normalize row r so pivot is 1
    const pivotVal = matrix[r][lead];
    for (let j = 0; j < nCols; j++) {
      matrix[r][j] = divFrac(matrix[r][j], pivotVal);
    }

    // Eliminate column `lead` in all other rows
    for (let k = 0; k < nRows; k++) {
      if (k !== r && matrix[k][lead].num !== 0) {
        const factor = matrix[k][lead];
        for (let j = 0; j < nCols; j++) {
          matrix[k][j] = subFrac(matrix[k][j], mulFrac(factor, matrix[r][j]));
        }
      }
    }
    pivotColForRow[r] = lead;
    lead++;
  }

  const pivotCols = new Set(pivotColForRow.filter((c) => c !== undefined));
  const freeCols: number[] = [];
  for (let c = 0; c < nCols; c++) {
    if (!pivotCols.has(c)) freeCols.push(c);
  }

  if (freeCols.length === 0) {
    return {
      valid: false,
      error: "No non-trivial stoichiometric solution exists for this equation.",
      reactants: [],
      products: [],
      elements: [],
      atomTotals: {},
    };
  }

  // Set free variables to 1 and back-substitute pivot variables
  const solution: Fraction[] = Array.from({ length: nCols }, () => makeFrac(0, 1));
  for (const fc of freeCols) {
    solution[fc] = makeFrac(1, 1);
  }

  for (let r = 0; r < pivotColForRow.length; r++) {
    const pCol = pivotColForRow[r];
    if (pCol === undefined) continue;
    let sum = makeFrac(0, 1);
    for (const fc of freeCols) {
      sum = addFrac(sum, mulFrac(matrix[r][fc], solution[fc]));
    }
    solution[pCol] = makeFrac(-sum.num, sum.den);
  }

  // Scale fractions by LCM of denominators to get whole integers
  let commonDen = 1;
  for (const frac of solution) {
    commonDen = lcm(commonDen, frac.den);
  }
  let intCoeffs = solution.map((frac) => Math.round((frac.num * commonDen) / frac.den));

  // If all negative, flip signs
  if (intCoeffs.every((v) => v < 0)) {
    intCoeffs = intCoeffs.map((v) => -v);
  }

  // Reduce by GCD
  const overallGcd = intCoeffs.reduce((acc, v) => gcd(acc, v), intCoeffs[0] || 1);
  intCoeffs = intCoeffs.map((v) => Math.round(v / overallGcd));

  if (intCoeffs.some((v) => v <= 0 || !Number.isFinite(v))) {
    return {
      valid: false,
      error: "Could not find positive integer coefficients. Check that the products can form from these reactants.",
      reactants: [],
      products: [],
      elements: [],
      atomTotals: {},
    };
  }

  const reactants: BalancedSpecies[] = leftParsed.items.map((item, idx) => ({
    formula: item.formula,
    coefficient: intCoeffs[idx],
    counts: item.counts,
  }));

  const products: BalancedSpecies[] = rightParsed.items.map((item, idx) => ({
    formula: item.formula,
    coefficient: intCoeffs[nReactants + idx],
    counts: item.counts,
  }));

  const atomTotals: Record<string, number> = {};
  for (const el of elements) {
    atomTotals[el] = reactants.reduce((sum, sp) => sum + sp.coefficient * (sp.counts[el] ?? 0), 0);
  }

  return {
    valid: true,
    reactants,
    products,
    elements,
    atomTotals,
  };
}
