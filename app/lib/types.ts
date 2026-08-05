export type ElementCategory =
  | "alkali-metal"
  | "alkaline-earth-metal"
  | "transition-metal"
  | "post-transition-metal"
  | "metalloid"
  | "nonmetal"
  | "halogen"
  | "noble-gas"
  | "lanthanoid"
  | "actinoid"
  | "unknown";

export type SourceRef = { label: string; url: string };

export type ElementRecord = {
  atomicNumber: number;
  symbol: string;
  slug: string;
  name: string;
  atomicMass: string;
  representativeMassNumber: number | null;
  neutrons: number | null;
  period: number;
  group: number | null;
  block: "s" | "p" | "d" | "f";
  category: ElementCategory;
  categoryLabel: string;
  standardState: string | null;
  electronConfiguration: string;
  shells: number[];
  valenceElectrons: number | null;
  electronegativity: number | null;
  atomicRadius: number | null;
  ionizationEnergy: number | null;
  electronAffinity: number | null;
  oxidationStates: string[];
  meltingPoint: number | null;
  boilingPoint: number | null;
  density: number | null;
  yearDiscovered: string | null;
  cpkColor: string;
  history: string;
  uses: string;
  compounds: string;
  safety: string;
  sourceRefs: SourceRef[];
};

export type QuizScore = { correct: number; total: number; completedAt: string };

export type ReactionGrade = {
  score: number;
  label: "Mastery" | "Strong" | "Developing" | "Guided";
  attempts: number;
  hints: number;
  completedAt: string;
};

export type ProgressV1 = {
  version: 1;
  favorites: number[];
  recentElements: number[];
  exploredElements: number[];
  quizScores: Record<string, QuizScore>;
  completedReactions: string[];
  reactionGrades: Record<string, ReactionGrade>;
  lastElement: number;
  lastReaction: string;
  autoRotate: boolean;
};

export type SpeciesRecord = {
  formula: string;
  label: string;
  state: "s" | "l" | "g" | "aq";
  composition: Record<string, number>;
  representation: "molecule" | "ions" | "lattice";
  atoms: { id: string; symbol: string; position: [number, number, number] }[];
  bonds: { from: string; to: string; order: 1 | 2 | 3 }[];
};

export type ReactionQuestion = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type ReactionRecord = {
  slug: string;
  title: string;
  subtitle: string;
  type: string;
  energy: "Exothermic" | "Endothermic" | "Energy-coupled";
  conditions: string;
  observation: string;
  safety: string;
  reactants: SpeciesRecord[];
  products: SpeciesRecord[];
  coefficients: { reactants: number[]; products: number[] };
  atomMapping: { element: string; from: string; to: string }[];
  steps: string[];
  relatedElements: number[];
  question: ReactionQuestion;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};
