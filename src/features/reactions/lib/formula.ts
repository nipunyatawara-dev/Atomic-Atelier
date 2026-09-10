import type { SpeciesRecord } from "./types";

export function parseFormula(formula: string) {
  let index = 0;

  function merge(target: Record<string, number>, source: Record<string, number>, multiplier = 1) {
    for (const [symbol, count] of Object.entries(source)) target[symbol] = (target[symbol] ?? 0) + count * multiplier;
  }

  function parseGroup(stop?: string): Record<string, number> {
    const result: Record<string, number> = {};
    while (index < formula.length && formula[index] !== stop) {
      if (formula[index] === "(") {
        index += 1;
        const inner = parseGroup(")");
        if (formula[index] !== ")") throw new Error(`Unclosed group in ${formula}`);
        index += 1;
        const multiplier = readNumber();
        merge(result, inner, multiplier);
        continue;
      }
      const symbol = formula.slice(index).match(/^[A-Z][a-z]?/)?.[0];
      if (!symbol) throw new Error(`Unexpected token in ${formula} at ${index}`);
      index += symbol.length;
      result[symbol] = (result[symbol] ?? 0) + readNumber();
    }
    return result;
  }

  function readNumber() {
    const value = formula.slice(index).match(/^\d+/)?.[0];
    if (!value) return 1;
    index += value.length;
    return Number(value);
  }

  const parsed = parseGroup();
  if (index !== formula.length) throw new Error(`Could not parse ${formula}`);
  return parsed;
}

export function countSide(species: SpeciesRecord[], coefficients: number[]) {
  const total: Record<string, number> = {};
  species.forEach((item, index) => {
    for (const [symbol, count] of Object.entries(item.composition)) {
      total[symbol] = (total[symbol] ?? 0) + count * (coefficients[index] ?? 1);
    }
  });
  return total;
}

export function isBalanced(
  reactants: SpeciesRecord[],
  products: SpeciesRecord[],
  reactantCoefficients: number[],
  productCoefficients: number[],
) {
  const left = countSide(reactants, reactantCoefficients);
  const right = countSide(products, productCoefficients);
  const symbols = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...symbols].every((symbol) => left[symbol] === right[symbol]);
}

const SUBSCRIPT_MAP: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
};

const SUPERSCRIPT_MAP: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
};

export function formatFormulaSubscripts(formula: string): string {
  return formula.replace(/\d+/g, (digits) =>
    digits.split("").map((d) => SUBSCRIPT_MAP[d] ?? d).join(""),
  );
}

export function formatElectronConfig(config: string): string {
  return config.replace(/([spdf])(\d+)/g, (_, orbital, count) => {
    const superCount = count.split("").map((d: string) => SUPERSCRIPT_MAP[d] ?? d).join("");
    return `${orbital}${superCount}`;
  });
}

