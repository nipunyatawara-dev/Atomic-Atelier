import { mkdir, writeFile } from "node:fs/promises";

const TABLE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON";
const VIEW_URL = (atomicNumber) =>
  `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/element/${atomicNumber}/JSON`;
const OUTPUT = new URL("../app/data/elements.json", import.meta.url);
const IUPAC_TABLE_URL = "https://iupac.org/what-we-do/periodic-table-of-elements/";
const NIST_TABLE_URL = "https://www.nist.gov/publications/periodic-table-elements";
const CIAAW_RADIOACTIVE_URL = "https://ciaaw.org/radioactive-elements.htm";

// Curated from CIAAW's authoritative radioactive-elements table. Where that
// evaluation reports two candidates, the entry with the longer stated
// half-life is used. These mass numbers are never inferred from atomic mass.
const radioactiveRepresentativeMass = {
  43: 97, 61: 145, 84: 209, 85: 210, 86: 222, 87: 223, 88: 226, 89: 227,
  91: 231, 93: 237, 94: 244, 95: 243, 96: 247, 97: 247, 98: 251, 99: 252,
  100: 257, 101: 258, 102: 259, 103: 266, 104: 267, 105: 268, 106: 269,
  107: 270, 108: 269, 109: 277, 110: 281, 111: 282, 112: 285, 113: 286,
  114: 290, 115: 290, 116: 293, 117: 294, 118: 294,
};

const nobleGasShells = {
  He: [2],
  Ne: [2, 8],
  Ar: [2, 8, 8],
  Kr: [2, 8, 18, 8],
  Xe: [2, 8, 18, 18, 8],
  Rn: [2, 8, 18, 32, 18, 8],
  Og: [2, 8, 18, 32, 32, 18, 8],
};

const categoryMap = {
  "Alkali metal": "alkali-metal",
  "Alkaline earth metal": "alkaline-earth-metal",
  "Transition metal": "transition-metal",
  "Post-transition metal": "post-transition-metal",
  Metalloid: "metalloid",
  Nonmetal: "nonmetal",
  Halogen: "halogen",
  "Noble gas": "noble-gas",
  Lanthanide: "lanthanoid",
  Lanthanoid: "lanthanoid",
  Actinide: "actinoid",
  Actinoid: "actinoid",
};

function periodFor(z) {
  if (z <= 2) return 1;
  if (z <= 10) return 2;
  if (z <= 18) return 3;
  if (z <= 36) return 4;
  if (z <= 54) return 5;
  if (z <= 86) return 6;
  return 7;
}

function groupFor(z) {
  if (z === 1) return 1;
  if (z === 2) return 18;
  const shortPeriods = {
    3: 1, 4: 2, 5: 13, 6: 14, 7: 15, 8: 16, 9: 17, 10: 18,
    11: 1, 12: 2, 13: 13, 14: 14, 15: 15, 16: 16, 17: 17, 18: 18,
  };
  if (shortPeriods[z]) return shortPeriods[z];
  if (z >= 19 && z <= 36) return z - 18;
  if (z >= 37 && z <= 54) return z - 36;
  if (z === 55 || z === 87) return 1;
  if (z === 56 || z === 88) return 2;
  if (z === 57 || z === 89) return 3;
  if ((z >= 58 && z <= 71) || (z >= 90 && z <= 103)) return null;
  if (z >= 72 && z <= 86) return z - 68;
  if (z >= 104 && z <= 118) return z - 100;
  return null;
}

function blockFor(z, group, category) {
  if (category === "lanthanoid" || category === "actinoid") return "f";
  if (z === 2 || group === 1 || group === 2) return "s";
  if (group && group >= 3 && group <= 12) return "d";
  return "p";
}

function shellsFromConfiguration(configuration) {
  const shells = Array(7).fill(0);
  const core = configuration.match(/\[([A-Za-z]{1,2})\]/)?.[1];
  if (core && nobleGasShells[core]) {
    nobleGasShells[core].forEach((value, index) => (shells[index] = value));
  }
  const expanded = configuration
    .replace(/\[[A-Za-z]{1,2}\]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replaceAll(" ", "");
  for (const match of expanded.matchAll(/([1-7])[spdfg](\d+?)(?=[1-7][spdfg]|$)/g)) {
    shells[Number(match[1]) - 1] += Number(match[2]);
  }
  while (shells.at(-1) === 0) shells.pop();
  return shells;
}

function findHeading(value, heading) {
  if (!value || typeof value !== "object") return null;
  if (value.TOCHeading === heading) return value;
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findHeading(item, heading);
        if (found) return found;
      }
    } else if (child && typeof child === "object") {
      const found = findHeading(child, heading);
      if (found) return found;
    }
  }
  return null;
}

function stringsFrom(section) {
  const strings = [];
  const walk = (value) => {
    if (!value || typeof value !== "object") return;
    if (typeof value.String === "string" && value.String.trim()) strings.push(value.String.trim());
    for (const child of Object.values(value)) {
      if (Array.isArray(child)) child.forEach(walk);
      else if (child && typeof child === "object") walk(child);
    }
  };
  walk(section);
  return [...new Set(strings)];
}

function readableSummary(section, fallback, max = 280) {
  const candidates = stringsFrom(section).filter(
    (value) => value.length > 35 && !value.startsWith("See more information"),
  );
  const selected = candidates[0] ?? fallback;
  return selected.length > max ? `${selected.slice(0, max - 1).trim()}…` : selected;
}

function representativeMass(view, z) {
  const section = findHeading(view, "Isotope Mass and Abundance");
  if (section?.Information) {
    const groups = new Map();
    for (const info of section.Information) {
      const ref = info.ReferenceNumber ?? 0;
      const values = info.Value?.StringWithMarkup?.map((item) => item.String.trim()) ?? [];
      const group = groups.get(ref) ?? {};
      if (info.Name === "Isotope") group.isotopes = values;
      if (info.Name?.startsWith("Abundance")) group.abundances = values;
      groups.set(ref, group);
    }
    for (const group of groups.values()) {
      if (!group.isotopes?.length || !group.abundances?.length) continue;
      let best = null;
      group.isotopes.forEach((isotope, index) => {
        const abundanceText = group.abundances[index] ?? "";
        const numbers = [...abundanceText.matchAll(/0?\.\d+/g)].map((match) => Number(match[0]));
        const abundance = numbers.length ? Math.max(...numbers) : -1;
        const mass = Number(isotope.match(/\d+/)?.[0]);
        if (mass >= z && (!best || abundance > best.abundance)) best = { mass, abundance };
      });
      if (best?.abundance >= 0) return best.mass;
    }
  }
  return radioactiveRepresentativeMass[z] ?? null;
}

function safetyFor(category, z) {
  if (z >= 84) return "Radioactive element. Study and handling require specialist facilities and strict controls.";
  if (category === "alkali-metal") return "Reactive metal. Hazards depend on its form; some forms react strongly with water.";
  if (category === "halogen") return "Many elemental halogens are reactive and harmful to inhale or touch.";
  if (category === "noble-gas") return "Low chemical reactivity does not remove pressure, cryogenic, or oxygen-displacement hazards.";
  return "Hazards depend strongly on chemical form, dose, and exposure. Consult an appropriate safety data sheet.";
}

async function fetchJson(url, attempts = 4) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": "Chemistry-Atelier-data-sync/1.0" } });
    if (response.ok) return response.json();
    if (attempt === attempts) throw new Error(`${response.status} while fetching ${url}`);
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
}

async function mapLimit(items, limit, mapper) {
  const results = Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

const payload = await fetchJson(TABLE_URL);
const columns = payload.Table.Columns.Column;
const rows = payload.Table.Row.map(({ Cell }) => Object.fromEntries(columns.map((column, index) => [column, Cell[index] ?? ""])));

const elements = await mapLimit(rows, 4, async (row) => {
  const atomicNumber = Number(row.AtomicNumber);
  const view = await fetchJson(VIEW_URL(atomicNumber));
  const category = categoryMap[row.GroupBlock] ?? "unknown";
  const group = groupFor(atomicNumber);
  const shells = shellsFromConfiguration(row.ElectronConfiguration);
  if (shells.reduce((sum, value) => sum + value, 0) !== atomicNumber) {
    throw new Error(`Electron configuration did not sum to Z=${atomicNumber}: ${row.ElectronConfiguration}`);
  }
  const history = readableSummary(findHeading(view, "History"), `${row.Name} is part of period ${periodFor(atomicNumber)} of the periodic table.`);
  const uses = readableSummary(findHeading(view, "Uses"), `Uses vary with the chemical form and purity of ${row.Name.toLowerCase()}.`);
  const compounds = readableSummary(findHeading(view, "Compounds"), `${row.Name} forms compounds according to its available oxidation states.`);
  const representativeMassNumber = representativeMass(view, atomicNumber);
  return {
    atomicNumber,
    symbol: row.Symbol,
    slug: row.Name.toLowerCase().replaceAll(" ", "-"),
    name: row.Name,
    atomicMass: radioactiveRepresentativeMass[atomicNumber] ? `[${radioactiveRepresentativeMass[atomicNumber]}]` : row.AtomicMass,
    representativeMassNumber,
    neutrons: representativeMassNumber === null ? null : representativeMassNumber - atomicNumber,
    period: periodFor(atomicNumber),
    group,
    block: blockFor(atomicNumber, group, category),
    category,
    categoryLabel: row.GroupBlock || "Unknown",
    standardState: row.StandardState || null,
    electronConfiguration: row.ElectronConfiguration,
    shells,
    valenceElectrons: ["transition-metal", "lanthanoid", "actinoid"].includes(category) ? null : shells.at(-1) ?? null,
    electronegativity: row.Electronegativity ? Number(row.Electronegativity) : null,
    atomicRadius: row.AtomicRadius ? Number(row.AtomicRadius) : null,
    ionizationEnergy: row.IonizationEnergy ? Number(row.IonizationEnergy) : null,
    electronAffinity: row.ElectronAffinity ? Number(row.ElectronAffinity) : null,
    oxidationStates: row.OxidationStates ? row.OxidationStates.split(",").map((value) => value.trim()) : [],
    meltingPoint: row.MeltingPoint ? Number(row.MeltingPoint) : null,
    boilingPoint: row.BoilingPoint ? Number(row.BoilingPoint) : null,
    density: row.Density ? Number(row.Density) : null,
    yearDiscovered: row.YearDiscovered || null,
    cpkColor: row.CPKHexColor ? `#${row.CPKHexColor}` : "#8b8fa6",
    history,
    uses,
    compounds,
    safety: safetyFor(category, atomicNumber),
    sourceRefs: [
      { label: "PubChem", url: `https://pubchem.ncbi.nlm.nih.gov/element/${atomicNumber}` },
      { label: "IUPAC", url: IUPAC_TABLE_URL },
      { label: "NIST", url: NIST_TABLE_URL },
    ],
  };
});

await mkdir(new URL("../app/data/", import.meta.url), { recursive: true });
await writeFile(
  OUTPUT,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), source: TABLE_URL, validationSources: [IUPAC_TABLE_URL, NIST_TABLE_URL, CIAAW_RADIOACTIVE_URL], elements }, null, 2)}\n`,
  "utf8",
);
console.log(`Wrote ${elements.length} elements to ${OUTPUT.pathname}`);
