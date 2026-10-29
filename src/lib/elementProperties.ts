import type { ElementRecord, TrendPropertyId } from "@/types";

// The PubChem snapshot stores both energies in eV per atom. Convert once at
// the display boundary. Exact SI constants: https://www.nist.gov/si-redefinition
export const EV_TO_KJ_PER_MOL = 1.602176634e-19 * 6.02214076e23 / 1000;

const numeric = (value: number, digits = 2) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);

export const propertyUnits: Record<TrendPropertyId, string> = {
  atomicMass: "u", atomicRadius: "pm", electronegativity: "Pauling",
  ionizationEnergy: "kJ/mol", electronAffinity: "kJ/mol",
  meltingPoint: "K", boilingPoint: "K", density: "g/cm³", valenceElectrons: "electrons",
};

export function elementPropertyValue(element: ElementRecord, id: TrendPropertyId): number | null {
  if (id === "atomicMass") {
    const mass = Number(element.atomicMass.replace(/[\[\]]/g, ""));
    return Number.isFinite(mass) ? mass : null;
  }
  const value = element[id];
  if (value === null || !Number.isFinite(value)) return null;
  return id === "ionizationEnergy" || id === "electronAffinity" ? value * EV_TO_KJ_PER_MOL : value;
}

/** Formats a value already in display units, including values used by chart axes. */
export function formatPropertyValue(id: TrendPropertyId, value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "Not established";
  if (id === "electronegativity") return value.toFixed(2);
  const digits = id === "ionizationEnergy" || id === "electronAffinity" ? 1 : id === "density" ? 6 : 3;
  return `${numeric(value, digits)} ${propertyUnits[id]}`;
}

export function formatElementProperty(element: ElementRecord, id: TrendPropertyId): string {
  if (id === "atomicMass") return `${element.atomicMass} u`;
  return formatPropertyValue(id, elementPropertyValue(element, id));
}
