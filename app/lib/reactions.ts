import type { ReactionRecord, SpeciesRecord } from "./types";
import { formatFormulaSubscripts, parseFormula } from "./formula";

function species(formula: string, label: string, state: SpeciesRecord["state"]): SpeciesRecord {
  const composition = parseFormula(formula);
  const representation: SpeciesRecord["representation"] = state === "aq" ? "ions" : state === "s" ? "lattice" : "molecule";
  const atomSymbols = Object.entries(composition).flatMap(([symbol, count]) => Array.from({ length: count }, () => symbol));
  const used = new Map<string, number>();
  const atoms = atomSymbols.map((symbol, index) => {
    const ordinal = (used.get(symbol) ?? 0) + 1;
    used.set(symbol, ordinal);
    if (representation === "lattice") {
      const columns = Math.ceil(Math.sqrt(atomSymbols.length));
      return { id: `${symbol}${ordinal}`, symbol, position: [((index % columns) - (columns - 1) / 2) * .52, (Math.floor(index / columns) - .5) * .46, index % 2 ? .18 : -.18] as [number, number, number] };
    }
    const angle = index * 2.399963;
    const radius = representation === "ions" ? .42 + index * .08 : index === 0 ? 0 : .55 + Math.floor(index / 6) * .2;
    return { id: `${symbol}${ordinal}`, symbol, position: [Math.cos(angle) * radius, Math.sin(angle * 1.7) * .24, Math.sin(angle) * radius] as [number, number, number] };
  });
  const central = atoms.find((atom) => atom.symbol !== "H") ?? atoms[0];
  const bonds = representation === "molecule" && central
    ? atoms.filter((atom) => atom.id !== central.id).map((atom) => ({ from: central.id, to: atom.id, order: 1 as const }))
    : [];
  return { formula, label, state, composition, representation, atoms, bonds };
}

type ReactionDraft = Omit<ReactionRecord, "atomMapping">;

function expandedAtomIds(side: "reactant" | "product", items: SpeciesRecord[], coefficients: number[]) {
  const byElement = new Map<string, string[]>();
  items.forEach((item, speciesIndex) => {
    for (let copy = 0; copy < coefficients[speciesIndex]; copy += 1) {
      item.atoms.forEach((atom) => {
        const ids = byElement.get(atom.symbol) ?? [];
        ids.push(`${side}:${speciesIndex}:${copy}:${atom.id}`);
        byElement.set(atom.symbol, ids);
      });
    }
  });
  return byElement;
}

function withAtomMapping(reaction: ReactionDraft): ReactionRecord {
  const reactants = expandedAtomIds("reactant", reaction.reactants, reaction.coefficients.reactants);
  const products = expandedAtomIds("product", reaction.products, reaction.coefficients.products);
  const atomMapping = [...reactants.entries()].flatMap(([element, fromIds]) =>
    fromIds.map((from, index) => ({ element, from, to: products.get(element)?.[index] ?? "" })),
  );
  if (atomMapping.some((mapping) => !mapping.to)) throw new Error(`Incomplete atom mapping for ${reaction.slug}`);
  return { ...reaction, atomMapping };
}

const reactionDrafts: ReactionDraft[] = [
  {
    slug: "water-synthesis",
    title: "Making water",
    subtitle: "Small molecules, exact proportions",
    type: "Synthesis",
    energy: "Exothermic",
    conditions: "An ignition source can initiate the reaction between the gases.",
    observation: "Water forms as energy is released.",
    safety: "Hydrogen–oxygen mixtures can react explosively. This is a conceptual model, not an experiment guide.",
    reactants: [species("H2", "Hydrogen", "g"), species("O2", "Oxygen", "g")],
    products: [species("H2O", "Water", "l")],
    coefficients: { reactants: [2, 1], products: [2] },
    steps: ["Count hydrogen and oxygen atoms separately.", "Use two hydrogen molecules to supply four H atoms.", "Form two water molecules while conserving every atom."],
    relatedElements: [1, 8],
    question: { prompt: "Why is the coefficient 2 placed before H₂O?", options: ["To conserve four hydrogen atoms", "To create a catalyst", "To change oxygen into hydrogen"], answer: 0, explanation: "Two H₂ molecules contain four H atoms, so two H₂O molecules are required." },
  },
  {
    slug: "hydrogen-peroxide-decomposition",
    title: "Hydrogen peroxide breaks down",
    subtitle: "One compound becomes two simpler substances",
    type: "Decomposition",
    energy: "Exothermic",
    conditions: "Light, heat, or a catalyst can increase the rate.",
    observation: "Oxygen gas is released as bubbles.",
    safety: "Concentrated peroxide is hazardous. The visualization does not describe a laboratory procedure.",
    reactants: [species("H2O2", "Hydrogen peroxide", "aq")],
    products: [species("H2O", "Water", "l"), species("O2", "Oxygen", "g")],
    coefficients: { reactants: [2], products: [2, 1] },
    steps: ["Begin with two peroxide units.", "Keep four oxygen atoms and four hydrogen atoms.", "Rearrange them into two waters and one oxygen molecule."],
    relatedElements: [1, 8],
    question: { prompt: "Which product is seen as bubbles?", options: ["Oxygen", "Hydrogen", "Carbon dioxide"], answer: 0, explanation: "O₂ gas leaves the solution as bubbles." },
  },
  {
    slug: "methane-combustion",
    title: "Methane combustion",
    subtitle: "Fuel, oxygen, and released energy",
    type: "Combustion",
    energy: "Exothermic",
    conditions: "Combustion requires oxygen and an activation source.",
    observation: "Complete combustion produces carbon dioxide, water, heat, and light.",
    safety: "Methane is flammable. This model omits apparatus and operating instructions.",
    reactants: [species("CH4", "Methane", "g"), species("O2", "Oxygen", "g")],
    products: [species("CO2", "Carbon dioxide", "g"), species("H2O", "Water", "g")],
    coefficients: { reactants: [1, 2], products: [1, 2] },
    steps: ["Match one carbon atom with one carbon dioxide molecule.", "Match four hydrogen atoms with two water molecules.", "Two oxygen molecules supply the four oxygen atoms needed."],
    relatedElements: [1, 6, 8],
    question: { prompt: "What makes this combustion complete?", options: ["Enough oxygen is available", "No energy is released", "Carbon atoms disappear"], answer: 0, explanation: "With sufficient oxygen, the carbon forms CO₂ rather than carbon monoxide or soot." },
  },
  {
    slug: "ammonia-synthesis",
    title: "Ammonia synthesis",
    subtitle: "Nitrogen fixation at industrial scale",
    type: "Synthesis",
    energy: "Exothermic",
    conditions: "Industry uses elevated pressure, temperature, and an iron-based catalyst.",
    observation: "Nitrogen and hydrogen establish an equilibrium with ammonia.",
    safety: "Industrial conditions and ammonia are hazardous; this is an explanatory particle model.",
    reactants: [species("N2", "Nitrogen", "g"), species("H2", "Hydrogen", "g")],
    products: [species("NH3", "Ammonia", "g")],
    coefficients: { reactants: [1, 3], products: [2] },
    steps: ["One N₂ molecule provides two nitrogen atoms.", "Three H₂ molecules provide six hydrogen atoms.", "Two NH₃ molecules conserve both totals."],
    relatedElements: [1, 7],
    question: { prompt: "What is the catalyst’s role?", options: ["Increase reaction rate", "Become part of ammonia", "Change the equilibrium equation"], answer: 0, explanation: "A catalyst provides a faster pathway without being consumed." },
  },
  {
    slug: "acid-base-neutralization",
    title: "Acid–base neutralization",
    subtitle: "Hydrogen ions meet hydroxide ions",
    type: "Double displacement",
    energy: "Exothermic",
    conditions: "Dilute aqueous acid and base are represented as ions in water.",
    observation: "The solution warms slightly as water forms.",
    safety: "Acids and bases can be corrosive. No mixing quantities or procedures are provided.",
    reactants: [species("HCl", "Hydrochloric acid", "aq"), species("NaOH", "Sodium hydroxide", "aq")],
    products: [species("NaCl", "Sodium chloride", "aq"), species("H2O", "Water", "l")],
    coefficients: { reactants: [1, 1], products: [1, 1] },
    steps: ["Separate the aqueous substances conceptually into ions.", "H⁺ and OH⁻ form water.", "Na⁺ and Cl⁻ remain as spectator ions in solution."],
    relatedElements: [1, 8, 11, 17],
    question: { prompt: "Which particles directly form water?", options: ["H⁺ and OH⁻", "Na⁺ and Cl⁻", "Na⁺ and OH⁻"], answer: 0, explanation: "The net ionic change is H⁺ + OH⁻ → H₂O." },
  },
  {
    slug: "silver-chloride-precipitation",
    title: "Silver chloride precipitates",
    subtitle: "Dissolved ions form an insoluble solid",
    type: "Precipitation",
    energy: "Energy-coupled",
    conditions: "The ionic compounds are shown dissolved in water.",
    observation: "A white silver chloride solid appears.",
    safety: "Silver compounds require appropriate disposal and handling controls.",
    reactants: [species("AgNO3", "Silver nitrate", "aq"), species("NaCl", "Sodium chloride", "aq")],
    products: [species("AgCl", "Silver chloride", "s"), species("NaNO3", "Sodium nitrate", "aq")],
    coefficients: { reactants: [1, 1], products: [1, 1] },
    steps: ["Dissolved ions begin separated.", "Ag⁺ and Cl⁻ combine into an insoluble lattice.", "Na⁺ and NO₃⁻ remain in solution."],
    relatedElements: [7, 8, 11, 17, 47],
    question: { prompt: "What is the precipitate?", options: ["AgCl", "NaNO₃", "NaCl"], answer: 0, explanation: "Silver chloride is insoluble enough to appear as a solid." },
  },
  {
    slug: "zinc-acid-displacement",
    title: "Zinc displaces hydrogen",
    subtitle: "A metal transfers electrons to hydrogen ions",
    type: "Single displacement",
    energy: "Exothermic",
    conditions: "Zinc is represented in contact with aqueous acid.",
    observation: "Hydrogen bubbles form while zinc enters solution.",
    safety: "Hydrogen is flammable and acids are corrosive. This is not a practical protocol.",
    reactants: [species("Zn", "Zinc", "s"), species("HCl", "Hydrochloric acid", "aq")],
    products: [species("ZnCl2", "Zinc chloride", "aq"), species("H2", "Hydrogen", "g")],
    coefficients: { reactants: [1, 2], products: [1, 1] },
    steps: ["Zinc loses electrons and becomes Zn²⁺.", "Two hydrogen ions gain electrons.", "The hydrogen atoms pair as H₂ while chloride balances the zinc ion."],
    relatedElements: [1, 17, 30],
    question: { prompt: "Which species is oxidized?", options: ["Zinc", "Hydrogen ions", "Chloride ions"], answer: 0, explanation: "Zinc loses electrons, so it is oxidized." },
  },
  {
    slug: "thermite-redox",
    title: "Thermite redox",
    subtitle: "Aluminium removes oxygen from iron oxide",
    type: "Redox",
    energy: "Exothermic",
    conditions: "A large activation energy is required before the reaction proceeds.",
    observation: "Intense heat and molten iron can be produced.",
    safety: "Thermite is extremely hazardous. This conceptual model contains no preparation or ignition instructions.",
    reactants: [species("Fe2O3", "Iron(III) oxide", "s"), species("Al", "Aluminium", "s")],
    products: [species("Al2O3", "Aluminium oxide", "s"), species("Fe", "Iron", "s")],
    coefficients: { reactants: [1, 2], products: [1, 2] },
    steps: ["Track the three oxygen atoms as a group.", "Two aluminium atoms bind those oxygens.", "Two iron atoms are released from the oxide."],
    relatedElements: [8, 13, 26],
    question: { prompt: "What happens to aluminium?", options: ["It is oxidized", "It becomes a catalyst", "It disappears"], answer: 0, explanation: "Aluminium gains oxygen and loses electrons, forming Al₂O₃." },
  },
  {
    slug: "carbonate-acid",
    title: "Carbonate meets acid",
    subtitle: "A gas-forming double displacement",
    type: "Gas evolution",
    energy: "Energy-coupled",
    conditions: "Calcium carbonate is represented in contact with aqueous acid.",
    observation: "Carbon dioxide effervescence is visible.",
    safety: "Acid is corrosive. The model gives no experimental concentrations or quantities.",
    reactants: [species("CaCO3", "Calcium carbonate", "s"), species("HCl", "Hydrochloric acid", "aq")],
    products: [species("CaCl2", "Calcium chloride", "aq"), species("H2O", "Water", "l"), species("CO2", "Carbon dioxide", "g")],
    coefficients: { reactants: [1, 2], products: [1, 1, 1] },
    steps: ["Two acid units provide two H and two Cl atoms.", "Calcium pairs with both chlorides.", "The carbonate becomes water and carbon dioxide."],
    relatedElements: [1, 6, 8, 17, 20],
    question: { prompt: "Which product causes effervescence?", options: ["CO₂", "CaCl₂", "H₂O"], answer: 0, explanation: "Carbon dioxide escapes as bubbles." },
  },
  {
    slug: "magnesium-combustion",
    title: "Magnesium combustion",
    subtitle: "A bright metal–oxygen synthesis",
    type: "Combustion",
    energy: "Exothermic",
    conditions: "The reaction requires strong initial heating.",
    observation: "An intense white light accompanies formation of a white solid.",
    safety: "Burning magnesium is extremely bright and hot. No experimental method is supplied.",
    reactants: [species("Mg", "Magnesium", "s"), species("O2", "Oxygen", "g")],
    products: [species("MgO", "Magnesium oxide", "s")],
    coefficients: { reactants: [2, 1], products: [2] },
    steps: ["Oxygen arrives as O₂.", "Two magnesium atoms each pair with one oxygen atom.", "Two MgO formula units conserve the particles."],
    relatedElements: [8, 12],
    question: { prompt: "Why are two Mg atoms required?", options: ["O₂ contains two oxygen atoms", "Magnesium is a catalyst", "Mass is not conserved"], answer: 0, explanation: "Each MgO unit uses one O atom, so O₂ forms two MgO units." },
  },
  {
    slug: "potassium-chlorate-decomposition",
    title: "Potassium chlorate decomposes",
    subtitle: "A solid releases oxygen",
    type: "Decomposition",
    energy: "Endothermic",
    conditions: "Heating is required; a catalyst can lower the activation barrier.",
    observation: "Oxygen gas forms while potassium chloride remains.",
    safety: "Oxidizing compounds and heating present serious hazards. This is only a particle-counting model.",
    reactants: [species("KClO3", "Potassium chlorate", "s")],
    products: [species("KCl", "Potassium chloride", "s"), species("O2", "Oxygen", "g")],
    coefficients: { reactants: [2], products: [2, 3] },
    steps: ["Two chlorate units provide six oxygen atoms.", "Potassium and chlorine remain paired one-to-one.", "Six oxygen atoms leave as three O₂ molecules."],
    relatedElements: [8, 17, 19],
    question: { prompt: "How many O₂ molecules form from two KClO₃ units?", options: ["3", "2", "6"], answer: 0, explanation: "Six oxygen atoms pair into three oxygen molecules." },
  },
  {
    slug: "cellular-respiration",
    title: "Cellular respiration",
    subtitle: "Cells transfer energy from glucose",
    type: "Biochemical redox",
    energy: "Energy-coupled",
    conditions: "Cells use many enzyme-controlled steps rather than a single event.",
    observation: "The overall accounting produces carbon dioxide and water while energy is captured chemically.",
    safety: "This is a summary equation, not a reaction mechanism or laboratory process.",
    reactants: [species("C6H12O6", "Glucose", "aq"), species("O2", "Oxygen", "g")],
    products: [species("CO2", "Carbon dioxide", "g"), species("H2O", "Water", "l")],
    coefficients: { reactants: [1, 6], products: [6, 6] },
    steps: ["Six carbon atoms become six CO₂ molecules.", "Twelve hydrogen atoms become six H₂O molecules.", "Count oxygen last to verify all eighteen oxygen atoms are conserved."],
    relatedElements: [1, 6, 8],
    question: { prompt: "Why is this equation only an overall summary?", options: ["Cells use many enzyme-controlled steps", "Atoms are not conserved", "Glucose has no bonds"], answer: 0, explanation: "Respiration is a pathway of many coupled reactions." },
  },
];

export const reactions: ReactionRecord[] = reactionDrafts.map(withAtomMapping);

export const reactionBySlug = new Map(reactions.map((reaction) => [reaction.slug, reaction]));
export const DEFAULT_REACTION = reactions[0];

export function resolveReaction(slug: string | null | undefined) {
  return (slug && reactionBySlug.get(slug)) || DEFAULT_REACTION;
}

export function formatEquation(reaction: ReactionRecord, coefficients = reaction.coefficients) {
  const side = (items: SpeciesRecord[], values: number[]) =>
    items
      .map(
        (item, index) =>
          `${values[index] === 1 ? "" : values[index]}${formatFormulaSubscripts(item.formula)}(${item.state})`,
      )
      .join(" + ");
  return `${side(reaction.reactants, coefficients.reactants)} → ${side(reaction.products, coefficients.products)}`;
}
