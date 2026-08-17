import { elements } from "./elements";
import type {
  ElementRecord,
  QuizQuestion,
  TrendAnomaly,
  TrendPaletteId,
  TrendPropertyDefinition,
  TrendPropertyId,
} from "./types";

export const TREND_PROPERTIES: TrendPropertyDefinition[] = [
  {
    id: "electronegativity",
    name: "Electronegativity",
    shortName: "Electronegativity",
    unit: "Pauling",
    symbol: "χ",
    description:
      "A chemical property that describes the tendency of an atom to attract a shared pair of electrons towards itself in a covalent bond.",
    periodRule:
      "Increases left to right (→) across a period as effective nuclear charge (Z_eff) increases, drawing bonding electrons closer.",
    groupRule:
      "Decreases top to bottom (↓) down a group because valence electrons reside in higher shells with greater core shielding.",
    underlyingPhysics:
      "Effective nuclear charge Z_eff = Z - S increases across periods with no new shielding shells added, exerting stronger coulombic pull (F ∝ Z_eff / r²).",
    min: 0.79,
    max: 3.98,
    scaleType: "linear",
    defaultPalette: "viridis",
    accessor: (e: ElementRecord) => e.electronegativity,
    format: (v: number | null) => (v !== null ? v.toFixed(2) : "Not established"),
  },
  {
    id: "atomicRadius",
    name: "Atomic Radius",
    shortName: "Radius",
    unit: "pm",
    symbol: "r",
    description:
      "The distance from the center of the atomic nucleus to the outermost boundary of the surrounding electron cloud.",
    periodRule:
      "Decreases left to right (→) across a period as higher nuclear charge pulls electron shells closer inward.",
    groupRule:
      "Increases top to bottom (↓) down a group as each new period adds a complete principal quantum electron shell.",
    underlyingPhysics:
      "Coulombic contraction occurs across periods as protons are added without additional shielding. Down groups, principal quantum number n increases, causing expansion (r ∝ n² / Z_eff).",
    min: 31,
    max: 298,
    scaleType: "linear",
    defaultPalette: "spectral",
    accessor: (e: ElementRecord) => e.atomicRadius,
    format: (v: number | null) => (v !== null ? `${v} pm` : "Not established"),
  },
  {
    id: "ionizationEnergy",
    name: "1st Ionization Energy",
    shortName: "Ionization",
    unit: "kJ/mol",
    symbol: "IE₁",
    description:
      "The minimum energy required to remove the most loosely bound valence electron from an isolated neutral gaseous atom.",
    periodRule:
      "Increases left to right (→) across a period as smaller atomic radii and higher Z_eff bind valence electrons more tightly.",
    groupRule:
      "Decreases top to bottom (↓) down a group because valence electrons sit further from the nucleus and experience more core shielding.",
    underlyingPhysics:
      "Coulomb binding energy E ≈ -13.6 × (Z_eff / n)² eV. Significant quantum anomalies occur at subshell transitions (e.g., s² → p¹ and p³ → p⁴).",
    min: 375.7,
    max: 2372.3,
    scaleType: "linear",
    defaultPalette: "magma",
    accessor: (e: ElementRecord) => e.ionizationEnergy,
    format: (v: number | null) => (v !== null ? `${v.toLocaleString()} kJ/mol` : "Not established"),
  },
  {
    id: "electronAffinity",
    name: "Electron Affinity",
    shortName: "Affinity",
    unit: "kJ/mol",
    symbol: "EA",
    description:
      "The energy released when an electron is attached to a neutral gaseous atom to form a negatively charged univalent anion.",
    periodRule:
      "Generally increases (becomes more exothermic) left to right (→) across a period, peaking at the halogens.",
    groupRule:
      "Generally decreases down groups (↓), though Period 3 elements exceed Period 2 elements due to reduced inter-electron repulsion in larger 3p orbitals.",
    underlyingPhysics:
      "Balancing nuclear attraction for the incoming electron against Coulombic repulsion from existing valence electron density.",
    min: -50,
    max: 349,
    scaleType: "linear",
    defaultPalette: "sunset",
    accessor: (e: ElementRecord) => e.electronAffinity,
    format: (v: number | null) => (v !== null ? `${v} kJ/mol` : "Not established"),
  },
  {
    id: "meltingPoint",
    name: "Melting Point",
    shortName: "Melting Pt",
    unit: "K",
    symbol: "Tₘ",
    description:
      "The temperature at which a solid transitions to a liquid at standard atmospheric pressure (1 atm).",
    periodRule:
      "Peaks in the middle of transition metal series and group 14 (Carbon/Tungsten) where bonding orbitals are half-filled.",
    groupRule:
      "Decreases down alkali metals as metallic bonds weaken; increases down halogens and noble gases as London dispersion forces grow.",
    underlyingPhysics:
      "Reflects the cohesive lattice energy. Half-filled bonding bands maximize orbital overlap and bond order.",
    min: 0.95,
    max: 3823,
    scaleType: "linear",
    defaultPalette: "magma",
    accessor: (e: ElementRecord) => e.meltingPoint,
    format: (v: number | null) =>
      v !== null ? `${v.toFixed(1)} K (${(v - 273.15).toFixed(1)} °C)` : "Not established",
  },
  {
    id: "boilingPoint",
    name: "Boiling Point",
    shortName: "Boiling Pt",
    unit: "K",
    symbol: "T_b",
    description:
      "The temperature at which the vapor pressure of a liquid equals the external atmospheric pressure.",
    periodRule:
      "Reaches extremes among central transition metals with high vaporization enthalpies (Tungsten, Rhenium).",
    groupRule:
      "Follows intermolecular and interatomic bonding strength hierarchies across groups.",
    underlyingPhysics:
      "Energy needed to overcome all attractive interatomic or intermolecular forces into the gaseous state.",
    min: 4.22,
    max: 5869,
    scaleType: "linear",
    defaultPalette: "sunset",
    accessor: (e: ElementRecord) => e.boilingPoint,
    format: (v: number | null) =>
      v !== null ? `${v.toFixed(1)} K (${(v - 273.15).toFixed(1)} °C)` : "Not established",
  },
  {
    id: "density",
    name: "Density (STP)",
    shortName: "Density",
    unit: "g/cm³",
    symbol: "ρ",
    description:
      "The mass per unit volume of an element in its standard state at standard temperature and pressure.",
    periodRule:
      "Peaks sharply in the central d-block of Period 6 (Osmium, Iridium) due to the Lanthanide contraction packing high mass into small atomic volumes.",
    groupRule:
      "Increases down most groups as atomic mass increases faster than atomic radius volume.",
    underlyingPhysics:
      "Density ρ = (Z_eff × atomic mass) / (V_cell × N_A). Lanthanide contraction causes massive Period 6 atoms to pack into compact crystal lattices.",
    min: 0.00008988,
    max: 22.59,
    scaleType: "linear",
    defaultPalette: "emerald",
    accessor: (e: ElementRecord) => e.density,
    format: (v: number | null) =>
      v !== null
        ? v < 0.01
          ? `${(v * 1000).toFixed(3)} g/L`
          : `${v.toFixed(2)} g/cm³`
        : "Not established",
  },
  {
    id: "valenceElectrons",
    name: "Valence Electrons",
    shortName: "Valence e⁻",
    unit: "e⁻",
    symbol: "N_v",
    description:
      "The number of electrons located in the outermost shell that can participate in the formation of chemical bonds.",
    periodRule:
      "Increases steadily from 1 to 8 across main group s and p blocks in each period.",
    groupRule:
      "Elements in the same main group share the same valence electron count, governing their chemical reactivity.",
    underlyingPhysics:
      "Electron configuration Aufbau principle filling s, p, d, and f valence subshells.",
    min: 1,
    max: 8,
    scaleType: "linear",
    defaultPalette: "viridis",
    accessor: (e: ElementRecord) => e.valenceElectrons,
    format: (v: number | null) => (v !== null ? `${v} e⁻` : "Variable / d-block"),
  },
  {
    id: "atomicMass",
    name: "Atomic Mass",
    shortName: "Mass",
    unit: "u",
    symbol: "M_a",
    description:
      "The weighted average mass of naturally occurring isotopes of an element, expressed in unified atomic mass units (daltons).",
    periodRule:
      "Increases monotonically across periods as protons and neutrons are added to the nucleus.",
    groupRule:
      "Increases substantially down groups as atomic numbers climb from Period 1 to Period 7.",
    underlyingPhysics:
      "Nuclear binding mass M = Z × m_p + N × m_n - E_bind/c².",
    min: 1.008,
    max: 294,
    scaleType: "linear",
    defaultPalette: "spectral",
    accessor: (e: ElementRecord) => parseFloat(e.atomicMass) || null,
    format: (v: number | null) => (v !== null ? `${v.toFixed(3)} u` : "Unknown"),
  },
];

export const TREND_MAP = new Map(TREND_PROPERTIES.map((p) => [p.id, p]));
export const DEFAULT_TREND = TREND_PROPERTIES[0];

export function resolveTrend(id: string | null | undefined): TrendPropertyDefinition {
  if (!id) return DEFAULT_TREND;
  return TREND_MAP.get(id as TrendPropertyId) ?? DEFAULT_TREND;
}

/* ==========================================================================
   Color Palettes & Interpolation
   ========================================================================== */

export const PALETTES: Record<TrendPaletteId, { name: string; stops: [number, string][] }> = {
  viridis: {
    name: "Viridis (Perceptual)",
    stops: [
      [0.0, "#440154"],
      [0.25, "#3b528b"],
      [0.5, "#21918c"],
      [0.75, "#5ec962"],
      [1.0, "#fde725"],
    ],
  },
  magma: {
    name: "Magma (Thermal)",
    stops: [
      [0.0, "#000004"],
      [0.25, "#51127c"],
      [0.5, "#b73779"],
      [0.75, "#fc8961"],
      [1.0, "#fcfdbf"],
    ],
  },
  spectral: {
    name: "Spectral (Rainbow)",
    stops: [
      [0.0, "#2b83ba"],
      [0.25, "#abdda4"],
      [0.5, "#ffffbf"],
      [0.75, "#fdae61"],
      [1.0, "#d7191c"],
    ],
  },
  sunset: {
    name: "Sunset (Warm Glow)",
    stops: [
      [0.0, "#0c0826"],
      [0.3, "#6b116b"],
      [0.6, "#d64756"],
      [0.85, "#fca266"],
      [1.0, "#feed9c"],
    ],
  },
  emerald: {
    name: "Emerald & Teal (Atelier)",
    stops: [
      [0.0, "#173235"],
      [0.25, "#2d7773"],
      [0.5, "#48a9a6"],
      [0.75, "#8ed6cb"],
      [1.0, "#e8faf6"],
    ],
  },
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getInterpolatedColor(
  normalized: number,
  paletteId: TrendPaletteId = "viridis",
): string {
  const palette = PALETTES[paletteId] ?? PALETTES.viridis;
  const clamped = Math.max(0, Math.min(1, normalized));

  const stops = palette.stops;
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];

    if (clamped >= t0 && clamped <= t1) {
      const localT = (clamped - t0) / (t1 - t0 || 1);
      const [r0, g0, b0] = hexToRgb(c0);
      const [r1, g1, b1] = hexToRgb(c1);

      const r = r0 + (r1 - r0) * localT;
      const g = g0 + (g1 - g0) * localT;
      const b = b0 + (b1 - b0) * localT;
      return rgbToHex(r, g, b);
    }
  }

  return stops[stops.length - 1][1];
}

export function getNormalizedValue(
  value: number | null,
  prop: TrendPropertyDefinition,
): number {
  if (value === null || isNaN(value)) return 0;
  const clamped = Math.max(prop.min, Math.min(prop.max, value));
  return (clamped - prop.min) / (prop.max - prop.min || 1);
}

/* ==========================================================================
   Rankings & Statistics
   ========================================================================== */

export type ElementRankingResult = {
  rank: number;
  totalEstablished: number;
  percentile: number;
  value: number | null;
  highest: { element: ElementRecord; value: number };
  lowest: { element: ElementRecord; value: number };
};

export function getElementRanking(
  propertyId: TrendPropertyId,
  atomicNumber: number,
): ElementRankingResult | null {
  const prop = resolveTrend(propertyId);
  const withValues = elements
    .map((e) => ({ element: e, value: prop.accessor(e) }))
    .filter((item): item is { element: ElementRecord; value: number } => item.value !== null)
    .sort((a, b) => b.value - a.value);

  if (withValues.length === 0) return null;

  const targetIdx = withValues.findIndex((item) => item.element.atomicNumber === atomicNumber);
  const targetItem = withValues[targetIdx];

  const rank = targetIdx >= 0 ? targetIdx + 1 : -1;
  const percentile = targetIdx >= 0
    ? Math.round(((withValues.length - targetIdx) / withValues.length) * 100)
    : 0;

  return {
    rank,
    totalEstablished: withValues.length,
    percentile,
    value: targetItem ? targetItem.value : null,
    highest: withValues[0],
    lowest: withValues[withValues.length - 1],
  };
}

/* ==========================================================================
   Curated Periodic Anomalies Database
   ========================================================================== */

export const TREND_ANOMALIES: TrendAnomaly[] = [
  {
    id: "nitrogen-oxygen-ionization",
    title: "Nitrogen vs. Oxygen Ionization Anomaly",
    subtitle: "Half-filled subshell stability vs. electron pairing repulsion",
    property: "ionizationEnergy",
    elementsInvolved: [7, 8],
    explanation:
      "Although nuclear charge increases from Nitrogen (Z=7) to Oxygen (Z=8), Nitrogen's 1st ionization energy (1,402 kJ/mol) is higher than Oxygen's (1,314 kJ/mol). Nitrogen has a stable half-filled 2p³ configuration with all three electrons in separate orbitals with parallel spins. In Oxygen (2p⁴), two electrons must share the first 2p orbital, introducing inter-electron electrostatic repulsion that makes that fourth electron easier to remove.",
    principle: "Hund's Rule & Electron-Electron Pairing Repulsion",
    keyObservation: "N (1,402 kJ/mol) > O (1,314 kJ/mol)",
  },
  {
    id: "beryllium-boron-ionization",
    title: "Beryllium vs. Boron Subshell Inversion",
    subtitle: "Penetration and shielding between 2s and 2p subshells",
    property: "ionizationEnergy",
    elementsInvolved: [4, 5],
    explanation:
      "Beryllium (Z=4) has a higher 1st ionization energy (899 kJ/mol) than Boron (Z=5, 801 kJ/mol). Beryllium's valence electrons are in the full, lower-energy 2s² orbital which penetrates close to the nucleus. Boron's fifth electron occupies the higher-energy 2p¹ orbital, which is completely shielded by the inner 2s² pair and held less tightly.",
    principle: "Subshell Energy Splitting & Inner-Orbital Shielding",
    keyObservation: "Be (899 kJ/mol) > B (801 kJ/mol)",
  },
  {
    id: "chlorine-fluorine-affinity",
    title: "Chlorine vs. Fluorine Electron Affinity Anomaly",
    subtitle: "Charge density crowding in compact 2p orbitals",
    property: "electronAffinity",
    elementsInvolved: [9, 17],
    explanation:
      "Fluorine is the most electronegative element, yet Chlorine has a higher electron affinity (349 kJ/mol vs. Fluorine's 328 kJ/mol). Fluorine's 2p orbital is exceptionally small and compact, creating intense electron-electron repulsion when an incoming electron is added. Chlorine's 3p orbital is significantly more diffuse, accommodating the extra electron with far less repulsion.",
    principle: "Orbital Volume & Spatial Charge Dispersion",
    keyObservation: "Cl (349 kJ/mol) > F (328 kJ/mol)",
  },
  {
    id: "lanthanide-contraction",
    title: "Lanthanide Contraction: Zirconium & Hafnium",
    subtitle: "Poor 4f electron shielding creates identical atomic radii",
    property: "atomicRadius",
    elementsInvolved: [40, 72],
    explanation:
      "Down a group, atomic radius normally expands dramatically. However, Hafnium (Period 6, Z=72, 159 pm) has almost the exact same atomic radius as Zirconium (Period 5, Z=40, 160 pm). The 14 intervening 4f electrons in the lanthanide series are diffuse and shield nuclear charge poorly, allowing the 32 additional nuclear protons to pull all electron shells inward with immense force.",
    principle: "Lanthanide Contraction & Diffuse f-Orbital Shielding",
    keyObservation: "Zr (160 pm) ≈ Hf (159 pm)",
  },
  {
    id: "transition-melting-peaks",
    title: "Refractory Transition Peaks: Tungsten & Carbon",
    subtitle: "Maximum metallic & covalent bond orders from half-filled bands",
    property: "meltingPoint",
    elementsInvolved: [6, 74],
    explanation:
      "Melting points peak sharply in the middle of transition metal series (Tungsten at 3,695 K) and group 14 (Carbon at 3,823 K). In the middle of the d-block, all five d-orbitals can participate in covalent metallic bonding without filling anti-bonding orbitals. Carbon forms an immense, rigid 3D covalent network (diamond/graphite) with sp³ hybridization.",
    principle: "Band Theory & Maximum Cohesive Bonding Energy",
    keyObservation: "W (3,695 K) and C (3,823 K) are the highest melting elements",
  },
];

/* ==========================================================================
   Trend Master Quiz
   ========================================================================== */

export const TREND_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "trend-q1",
    prompt: "Why does atomic radius decrease as you move from left to right across a period?",
    options: [
      "Effective nuclear charge (Z_eff) increases, pulling electron shells closer",
      "The number of electron shells decreases",
      "Electrons become heavier and fall inward",
      "Nuclear repulsion pushes electrons into the nucleus",
    ],
    answer: 0,
    explanation:
      "Across a period, protons are added to the nucleus while electrons enter the same valence shell. Because inner shielding does not increase, the effective nuclear charge (Z_eff) rises, pulling electron clouds closer.",
  },
  {
    id: "trend-q2",
    prompt: "Why does Nitrogen (Z=7) have a higher 1st ionization energy than Oxygen (Z=8)?",
    options: [
      "Oxygen has fewer protons than Nitrogen",
      "Nitrogen has a stable half-filled 2p³ subshell, while Oxygen has pairing repulsion in 2p⁴",
      "Nitrogen is smaller in atomic radius than Oxygen",
      "Oxygen’s valence electrons are in the 3s orbital",
    ],
    answer: 1,
    explanation:
      "Nitrogen’s three 2p electrons each occupy separate orbitals with parallel spins (half-filled stability). In Oxygen (2p⁴), two electrons pair in the same orbital, creating electrostatic repulsion that lowers the energy needed to remove one.",
  },
  {
    id: "trend-q3",
    prompt: "Which element possesses the highest Pauling electronegativity in the periodic table?",
    options: ["Cesium (Cs)", "Helium (He)", "Fluorine (F)", "Oxygen (O)"],
    answer: 2,
    explanation:
      "Fluorine has a Pauling electronegativity of 3.98, the highest of all elements, due to its high effective nuclear charge and small atomic radius.",
  },
  {
    id: "trend-q4",
    prompt: "Why is Chlorine's electron affinity higher than Fluorine's?",
    options: [
      "Chlorine has more valence shells",
      "Fluorine's compact 2p orbital creates intense electron-electron repulsion",
      "Chlorine has a higher effective nuclear charge",
      "Fluorine cannot form negative ions",
    ],
    answer: 1,
    explanation:
      "Fluorine’s 2p subshell is so small and spatially crowded that electron-electron repulsion partially offsets the nuclear attraction for an added electron. Chlorine's 3p orbital is more diffuse.",
  },
  {
    id: "trend-q5",
    prompt: "What causes Zirconium (Z=40) and Hafnium (Z=72) to have virtually identical atomic radii?",
    options: [
      "Lanthanide contraction caused by poor shielding of 4f electrons",
      "They have the exact same number of electron shells",
      "Relativistic mass expansion of protons",
      "Both are alkali earth metals",
    ],
    answer: 0,
    explanation:
      "The 14 intervening 4f electrons in the Lanthanide series shield nuclear charge poorly. The resulting increase in effective nuclear charge pulls Hafnium's outer shells inward, canceling the expected radius expansion from Period 5 to 6.",
  },
];
