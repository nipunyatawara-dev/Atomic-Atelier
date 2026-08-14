import payload from "../data/elements.json";
import type { ElementCategory, ElementRecord, QuizQuestion } from "./types";

export const elements = payload.elements as unknown as ElementRecord[];
export const elementByNumber = new Map(elements.map((element) => [element.atomicNumber, element]));
export const elementBySlug = new Map(elements.map((element) => [element.slug, element]));
export const CARBON = elementByNumber.get(6)!;

export const categoryLabels: Record<ElementCategory, string> = {
  "alkali-metal": "Alkali metal",
  "alkaline-earth-metal": "Alkaline earth",
  "transition-metal": "Transition metal",
  "post-transition-metal": "Post-transition",
  metalloid: "Metalloid",
  nonmetal: "Nonmetal",
  halogen: "Halogen",
  "noble-gas": "Noble gas",
  lanthanoid: "Lanthanoid",
  actinoid: "Actinoid",
  unknown: "Other",
};

export const categories = Object.entries(categoryLabels) as [ElementCategory, string][];

export function resolveElement(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return CARBON;
  const bySlug = elementBySlug.get(normalized);
  if (bySlug) return bySlug;
  const parsed = Number(normalized);
  return Number.isInteger(parsed) ? elementByNumber.get(parsed) ?? CARBON : CARBON;
}

export function elementGridPosition(element: ElementRecord) {
  if (element.category === "lanthanoid") {
    return { row: 9, column: element.atomicNumber - 57 + 3 };
  }
  if (element.category === "actinoid") {
    return { row: 10, column: element.atomicNumber - 89 + 3 };
  }
  return { row: element.period + 1, column: element.group ?? 3 };
}

function seededOptions(correct: ElementRecord, pool: ElementRecord[], selector: (item: ElementRecord) => string) {
  const alternatives = pool
    .filter((item) => item.atomicNumber !== correct.atomicNumber)
    .sort((a, b) => Math.abs(a.atomicNumber - correct.atomicNumber) - Math.abs(b.atomicNumber - correct.atomicNumber))
    .slice(0, 3);
  const values = [correct, ...alternatives].map(selector);
  const rotation = correct.atomicNumber % values.length;
  return [...values.slice(rotation), ...values.slice(0, rotation)];
}

export function createElementQuiz(element: ElementRecord): QuizQuestion[] {
  const samePeriod = elements.filter((item) => item.period === element.period);
  const question = (
    id: string,
    prompt: string,
    options: string[],
    correct: string,
    explanation: string,
  ): QuizQuestion => ({ id, prompt, options, answer: options.indexOf(correct), explanation });

  const symbols = seededOptions(element, samePeriod.length >= 4 ? samePeriod : elements, (item) => item.symbol);
  const numbers = seededOptions(element, samePeriod.length >= 4 ? samePeriod : elements, (item) => String(item.atomicNumber));

  // Proximity-based period options (e.g. 5, 7, 4 for period 6)
  const periodCandidates = [1, 2, 3, 4, 5, 6, 7]
    .filter((p) => p !== element.period)
    .sort((a, b) => Math.abs(a - element.period) - Math.abs(b - element.period));
  const periodValues = [element.period, ...periodCandidates.slice(0, 3)].map(String);
  const periodRotation = element.atomicNumber % periodValues.length;
  const periods = [...periodValues.slice(periodRotation), ...periodValues.slice(0, periodRotation)];

  // Proximity-based shell count options
  const shellCount = element.shells.length;
  const shellCandidates = [1, 2, 3, 4, 5, 6, 7]
    .filter((s) => s !== shellCount)
    .sort((a, b) => Math.abs(a - shellCount) - Math.abs(b - shellCount));
  const shellValues = [shellCount, ...shellCandidates.slice(0, 3)].map(String);
  const shellRotation = (element.atomicNumber + 1) % shellValues.length;
  const shells = [...shellValues.slice(shellRotation), ...shellValues.slice(0, shellRotation)];

  // Diverse category distractors varying across atomic numbers
  const otherCategories = categories
    .filter(([value]) => value !== element.category && value !== "unknown")
    .map(([, label]) => label);
  const seededCategoryOffset = element.atomicNumber % otherCategories.length;
  const categoryDistractors = [
    otherCategories[seededCategoryOffset],
    otherCategories[(seededCategoryOffset + 3) % otherCategories.length],
    otherCategories[(seededCategoryOffset + 6) % otherCategories.length],
  ];
  const categoryPool = [element.categoryLabel, ...categoryDistractors];
  const categoryRotation = element.atomicNumber % categoryPool.length;
  const categoriesForQuiz = [...categoryPool.slice(categoryRotation), ...categoryPool.slice(0, categoryRotation)];

  return [
    question("symbol", `What is the symbol for ${element.name}?`, symbols, element.symbol, `${element.name} uses the symbol ${element.symbol}.`),
    question("number", `What is ${element.name}’s atomic number?`, numbers, String(element.atomicNumber), `Atomic number ${element.atomicNumber} means every ${element.name.toLowerCase()} atom has ${element.atomicNumber} protons.`),
    question("period", `Which period contains ${element.name}?`, periods, String(element.period), `${element.name} appears in period ${element.period}.`),
    question("shells", `How many occupied electron shells are shown for ${element.name}?`, shells, String(element.shells.length), `${element.name} has ${element.shells.length} occupied electron shells (${element.shells.join("–")}).`),
    question("category", `How is ${element.name} classified?`, categoriesForQuiz, element.categoryLabel, `${element.name} is classified as ${element.categoryLabel.toLowerCase()}.`),
  ];
}

export function formatValue(value: number | string | null, unit = "") {
  if (value === null || value === "") return "Not established";
  return `${value}${unit}`;
}
