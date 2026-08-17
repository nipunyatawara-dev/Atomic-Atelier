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
  exploredMolecules?: string[];
  favoriteMolecules?: string[];
  lastMolecule?: string;
  exploredTrends?: string[];
  lastTrend?: string;
};

export type TrendPropertyId =
  | "electronegativity"
  | "atomicRadius"
  | "ionizationEnergy"
  | "electronAffinity"
  | "meltingPoint"
  | "boilingPoint"
  | "density"
  | "valenceElectrons"
  | "atomicMass";

export type TrendPaletteId = "viridis" | "magma" | "spectral" | "sunset" | "emerald";

export type TrendViewMode = "elevation-3d" | "heatmap-2d" | "graphs" | "anomalies";

export type TrendAnomaly = {
  id: string;
  title: string;
  subtitle: string;
  property: TrendPropertyId;
  elementsInvolved: number[];
  explanation: string;
  principle: string;
  keyObservation: string;
};

export type TrendPropertyDefinition = {
  id: TrendPropertyId;
  name: string;
  shortName: string;
  unit: string;
  symbol: string;
  description: string;
  periodRule: string;
  groupRule: string;
  underlyingPhysics: string;
  min: number;
  max: number;
  scaleType: "linear" | "log";
  defaultPalette: TrendPaletteId;
  accessor: (e: ElementRecord) => number | null;
  format: (val: number | null) => string;
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

export type MoleculeCategory =
  | "vsepr-essential"
  | "inorganic"
  | "organic"
  | "biomolecule"
  | "atmospheric"
  | "custom";

export type VseprElectronGeometry =
  | "Linear"
  | "Trigonal Planar"
  | "Tetrahedral"
  | "Trigonal Bipyramidal"
  | "Octahedral";

export type VseprMolecularGeometry =
  | "Linear"
  | "Bent (120°)"
  | "Bent (104.5°)"
  | "Trigonal Planar"
  | "Trigonal Pyramidal"
  | "T-shaped"
  | "Tetrahedral"
  | "Seesaw"
  | "Square Planar"
  | "Trigonal Bipyramidal"
  | "Square Pyramidal"
  | "Octahedral";

export type VseprInfo = {
  axeNotation: string;
  stericNumber: number;
  bondingPairs: number;
  lonePairs: number;
  electronGeometry: VseprElectronGeometry;
  molecularGeometry: VseprMolecularGeometry;
  idealBondAngle: string;
  predictedBondAngle: string;
  hybridization: string;
  polarity: "Polar" | "Non-polar";
  dipoleMomentDebye: number;
  dipoleVector: [number, number, number];
};

export type LonePairRecord = {
  id: string;
  centralAtomId: string;
  position: [number, number, number];
};

export type LewisDotGroup = {
  atomId: string;
  symbol: string;
  x: number;
  y: number;
  lonePairAngles: number[];
};

export type LewisBond = {
  fromAtomId: string;
  toAtomId: string;
  order: 1 | 2 | 3;
};

export type LewisStructure = {
  atoms: LewisDotGroup[];
  bonds: LewisBond[];
};

export type MoleculeAtom = {
  id: string;
  symbol: string;
  atomicNumber: number;
  position: [number, number, number];
  formalCharge?: number;
  isCentral?: boolean;
};

export type MoleculeBond = {
  from: string;
  to: string;
  order: 1 | 2 | 3;
};

export type MoleculeRecord = {
  slug: string;
  name: string;
  iupacName: string;
  formula: string;
  category: MoleculeCategory;
  categoryLabel: string;
  description: string;
  molarMass: number;
  standardState: "gas" | "liquid" | "solid";
  meltingPoint?: number | null;
  boilingPoint?: number | null;
  density?: string | null;
  vsepr: VseprInfo;
  atoms: MoleculeAtom[];
  bonds: MoleculeBond[];
  lonePairs: LonePairRecord[];
  lewis: LewisStructure;
  applications: string;
  safety: string;
  relatedElements: number[];
};

