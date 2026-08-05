"use client";

import { X } from "lucide-react";
import { elements, formatValue } from "../lib/elements";
import type { ElementRecord } from "../lib/types";

const rows: { label: string; value: (element: ElementRecord) => string }[] = [
  { label: "Atomic mass", value: (element) => formatValue(element.atomicMass, " u") },
  { label: "Atomic radius", value: (element) => formatValue(element.atomicRadius, " pm") },
  { label: "Electronegativity", value: (element) => formatValue(element.electronegativity) },
  { label: "Ionization", value: (element) => formatValue(element.ionizationEnergy, " eV") },
  { label: "Outer electrons", value: (element) => formatValue(element.valenceElectrons) },
  { label: "State", value: (element) => element.standardState ?? "Not established" },
];

function trendExplanation(primary: ElementRecord, secondary: ElementRecord) {
  if (primary.period === secondary.period) {
    const left = primary.group !== null && secondary.group !== null && primary.group < secondary.group ? primary.name : secondary.name;
    const right = left === primary.name ? secondary.name : primary.name;
    return `Across period ${primary.period}, atomic radius generally decreases from ${left} toward ${right}, while electronegativity and ionization energy generally increase. Individual values can depart from the broad trend.`;
  }
  if (primary.group !== null && primary.group === secondary.group) {
    const upper = primary.period < secondary.period ? primary.name : secondary.name;
    const lower = upper === primary.name ? secondary.name : primary.name;
    return `Down group ${primary.group}, ${lower} has more occupied shells than ${upper}; radius generally increases while ionization energy generally decreases.`;
  }
  return `${primary.name} sits in period ${primary.period}, group ${primary.group ?? "the f-block"}; ${secondary.name} sits in period ${secondary.period}, group ${secondary.group ?? "the f-block"}. Compare both row and column before applying a periodic trend.`;
}

export function ComparisonPanel({ primary, secondary, onSelect, onClose }: { primary: ElementRecord; secondary: ElementRecord; onSelect: (element: ElementRecord) => void; onClose: () => void }) {
  return (
    <aside className="comparison-panel" aria-label="Element comparison">
      <button className="comparison-close" onClick={onClose} aria-label="Close comparison"><X size={17} /></button>
      <div className="compare-head"><span data-category={primary.category}>{primary.atomicNumber}<b>{primary.symbol}</b></span><div><small>Comparing</small><strong>{primary.name}</strong></div></div>
      <i>vs.</i>
      <div className="compare-head"><span data-category={secondary.category}>{secondary.atomicNumber}<b>{secondary.symbol}</b></span><div><small>Reference</small><select value={secondary.atomicNumber} onChange={(event) => onSelect(elements[Number(event.target.value) - 1])} aria-label="Comparison element">{elements.map((element) => <option key={element.atomicNumber} value={element.atomicNumber}>{element.name}</option>)}</select></div></div>
      <dl>{rows.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value(primary)}</dd><dd>{row.value(secondary)}</dd></div>)}</dl>
      <p>{trendExplanation(primary, secondary)}</p>
    </aside>
  );
}
