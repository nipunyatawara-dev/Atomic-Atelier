"use client";

import { ArrowDown, ArrowUp, Lightbulb, Minus, X } from "lucide-react";
import { elements, formatValue } from "../lib/elements";
import type { ElementRecord } from "../lib/types";

type Metric = {
  label: string;
  unit: string;
  value: (element: ElementRecord) => number | null;
};

const metrics: Metric[] = [
  { label: "Atomic mass", unit: "u", value: (element) => Number(element.atomicMass.replace(/[^\d.]/g, "")) || null },
  { label: "Atomic radius", unit: "pm", value: (element) => element.atomicRadius },
  { label: "Electronegativity", unit: "", value: (element) => element.electronegativity },
  { label: "Ionization energy", unit: "eV", value: (element) => element.ionizationEnergy },
  { label: "Melting point", unit: "K", value: (element) => element.meltingPoint },
];

function trendExplanation(primary: ElementRecord, secondary: ElementRecord) {
  if (primary.period === secondary.period) {
    const left = primary.group !== null && secondary.group !== null && primary.group < secondary.group ? primary : secondary;
    const right = left.atomicNumber === primary.atomicNumber ? secondary : primary;
    return `${left.name} and ${right.name} use the same number of occupied shells. Moving right across period ${primary.period} adds nuclear charge, so the nucleus generally pulls the electron cloud closer. Radius tends to fall while electronegativity and ionization energy rise.`;
  }
  if (primary.group !== null && primary.group === secondary.group) {
    const upper = primary.period < secondary.period ? primary : secondary;
    const lower = upper.atomicNumber === primary.atomicNumber ? secondary : primary;
    return `${lower.name} has ${lower.shells.length - upper.shells.length} more occupied shell${lower.shells.length - upper.shells.length === 1 ? "" : "s"} than ${upper.name}. Added distance and electron shielding generally increase radius and make an outer electron easier to remove down group ${primary.group}.`;
  }
  return `${primary.name} and ${secondary.name} sit in different rows and columns, so more than one periodic effect is changing. Compare shell count first, then nuclear charge and shielding before applying a single trend rule.`;
}

function change(primary: number | null, secondary: number | null) {
  if (primary === null || secondary === null) return { direction: "none" as const, percent: null };
  const difference = secondary - primary;
  if (Math.abs(difference) < Number.EPSILON) return { direction: "same" as const, percent: 0 };
  return {
    direction: difference > 0 ? "up" as const : "down" as const,
    percent: primary === 0 ? null : Math.round(Math.abs((difference / primary) * 100)),
  };
}

export function ComparisonPanel({ primary, secondary, onSelect, onClose }: { primary: ElementRecord; secondary: ElementRecord; onSelect: (element: ElementRecord) => void; onClose: () => void }) {
  return (
    <aside className="comparison-panel" aria-label="Element comparison">
      <button className="comparison-close" onClick={onClose} aria-label="Close comparison"><X size={17} /></button>

      <div className="comparison-heads">
        <div className="compare-head"><span data-category={primary.category}>{primary.atomicNumber}<b>{primary.symbol}</b></span><div><small>Comparing</small><strong>{primary.name}</strong></div></div>
        <i>vs.</i>
        <div className="compare-head"><span data-category={secondary.category}>{secondary.atomicNumber}<b>{secondary.symbol}</b></span><div><small>Reference</small><select value={secondary.atomicNumber} onChange={(event) => onSelect(elements[Number(event.target.value) - 1])} aria-label="Comparison element">{elements.map((element) => <option key={element.atomicNumber} value={element.atomicNumber}>{element.name}</option>)}</select></div></div>
      </div>

      <div className="comparison-metrics">
        {metrics.map((metric) => {
          const primaryValue = metric.value(primary);
          const secondaryValue = metric.value(secondary);
          const movement = change(primaryValue, secondaryValue);
          const max = Math.max(primaryValue ?? 0, secondaryValue ?? 0, 1);
          const DirectionIcon = movement.direction === "up" ? ArrowUp : movement.direction === "down" ? ArrowDown : Minus;
          return (
            <article className="compare-metric" key={metric.label}>
              <header><span>{metric.label}</span><b className={movement.direction}><DirectionIcon />{movement.percent === null ? "—" : `${movement.percent}%`}</b></header>
              <div className="compare-values"><span><i data-element="primary" />{primary.symbol} <b>{formatValue(primaryValue, metric.unit ? ` ${metric.unit}` : "")}</b></span><span>{secondary.symbol} <b>{formatValue(secondaryValue, metric.unit ? ` ${metric.unit}` : "")}</b><i data-element="secondary" /></span></div>
              <div className="compare-bars" aria-label={`${metric.label}: ${primary.name} ${formatValue(primaryValue, metric.unit)}, ${secondary.name} ${formatValue(secondaryValue, metric.unit)}`}>
                <i data-element="primary" style={{ width: `${primaryValue === null ? 0 : Math.max(4, (primaryValue / max) * 100)}%` }} />
                <i data-element="secondary" style={{ width: `${secondaryValue === null ? 0 : Math.max(4, (secondaryValue / max) * 100)}%` }} />
              </div>
            </article>
          );
        })}
      </div>

      <div className="comparison-context">
        <span><small>Shells</small><b>{primary.shells.length} ↔ {secondary.shells.length}</b></span>
        <span><small>Group</small><b>{primary.group ?? "f"} ↔ {secondary.group ?? "f"}</b></span>
        <span><small>State</small><b>{primary.standardState ?? "—"} ↔ {secondary.standardState ?? "—"}</b></span>
      </div>

      <div className="comparison-insight"><Lightbulb /><p><b>Why the trend moves</b>{trendExplanation(primary, secondary)}</p></div>
    </aside>
  );
}
