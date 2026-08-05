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
