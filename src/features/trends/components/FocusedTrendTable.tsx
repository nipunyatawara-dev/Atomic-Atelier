"use client";

import { useEffect, useState } from "react";
import { elements } from "@/features/explorer/lib/elements";
import { getNormalizedValue, resolveTrend } from "../lib/trends";
import type { ElementRecord, TrendPropertyId } from "@/types";

type Props = { propertyId: TrendPropertyId; selected: ElementRecord; onSelect: (element: ElementRecord) => void };

export function FocusedTrendTable({ propertyId, selected, onSelect }: Props) {
  const [axis, setAxis] = useState<"period" | "group">("period");
  const [period, setPeriod] = useState(selected.period);
  const [group, setGroup] = useState(selected.group ?? 1);
  useEffect(() => {
    queueMicrotask(() => { setPeriod(selected.period); if (selected.group !== null) setGroup(selected.group); });
  }, [selected]);
  const property = resolveTrend(propertyId);
  const rows = elements.filter((element) => axis === "period" ? element.period === period : element.group === group);
  return (
    <section className="focused-trend-table" aria-label="Focused periodic trends">
      <div className="focus-controls">
        <label>Compare by<select aria-label="Trend comparison direction" value={axis} onChange={(event) => setAxis(event.target.value as typeof axis)}><option value="period">Period (row)</option><option value="group">Group (column)</option></select></label>
        {axis === "period" ? <label>Period<select aria-label="Focused period" value={period} onChange={(event) => setPeriod(Number(event.target.value))}>{[1,2,3,4,5,6,7].map((value) => <option key={value} value={value}>{value}</option>)}</select></label> : <label>Group<select aria-label="Focused group" value={group} onChange={(event) => setGroup(Number(event.target.value))}>{Array.from({ length: 18 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>}
      </div>
      <h2>{property.name}</h2>
      <details className="focused-trend-rule"><summary>Explain the pattern</summary><p>{axis === "period" ? property.periodRule : property.groupRule}</p></details>
      <div className="focused-trend-rows">{rows.map((element) => {
        const value = property.accessor(element);
        return <button type="button" key={element.atomicNumber} aria-pressed={selected.atomicNumber === element.atomicNumber} onClick={() => onSelect(element)}>
          <span className="focused-symbol">{element.symbol}</span>
          <span className="focused-name">{element.name}<span className="focused-meter" aria-hidden="true"><i style={{ width: `${value === null ? 0 : Math.max(3, getNormalizedValue(value, property) * 100)}%` }} /></span></span>
          <strong>{property.format(value)}</strong>
        </button>;
      })}</div>
      <p className="focus-note">Tap an element for its details below. Values and units match the full-table views.</p>
    </section>
  );
}
