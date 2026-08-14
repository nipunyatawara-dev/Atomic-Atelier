"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MoveHorizontal, Search } from "lucide-react";
import { Dialog } from "./Dialog";
import { categories, categoryLabels, elementByNumber, elementGridPosition, elements } from "../lib/elements";
import type { ElementCategory, ElementRecord } from "../lib/types";

export function PeriodicTable({ selected, onSelect, onClose }: { selected: number; onSelect: (element: ElementRecord) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ElementCategory | "all">("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return new Set(elements.filter((element) => {
      const matchesQuery = !normalized || `${element.name} ${element.symbol} ${element.atomicNumber}`.toLowerCase().includes(normalized);
      return matchesQuery && (category === "all" || element.category === category);
    }).map((element) => element.atomicNumber));
  }, [query, category]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return;
    const cell = scroller.querySelector<HTMLElement>(`[data-element-number="${selected}"]`);
    if (!cell) return;
    scroller.scrollLeft = Math.max(0, cell.offsetLeft - (scroller.clientWidth - cell.offsetWidth) / 2);
  }, [selected]);

  const onGridKey = (event: React.KeyboardEvent, atomicNumber: number) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const current = elementByNumber.get(atomicNumber)!;
    const position = elementGridPosition(current);
    const horizontal = event.key === "ArrowRight" || event.key === "ArrowLeft";
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const candidates = elements
      .map((element) => ({ element, position: elementGridPosition(element) }))
      .filter((candidate) => horizontal
        ? candidate.position.row === position.row && (candidate.position.column - position.column) * direction > 0
        : candidate.position.column === position.column && (candidate.position.row - position.row) * direction > 0)
      .sort((a, b) => horizontal
        ? Math.abs(a.position.column - position.column) - Math.abs(b.position.column - position.column)
        : Math.abs(a.position.row - position.row) - Math.abs(b.position.row - position.row));
    const next = candidates[0]?.element.atomicNumber;
    if (next) event.currentTarget.closest('[role="grid"]')?.querySelector<HTMLElement>(`[data-element-number="${next}"]`)?.focus();
  };

  return (
    <Dialog title="The periodic table" eyebrow="118 ways to build matter" onClose={onClose} wide className="periodic-dialog">
      <div className="table-controls">
        <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, symbol, or number" /></label>
        <select value={category} onChange={(event) => setCategory(event.target.value as ElementCategory | "all")} aria-label="Filter by category">
          <option value="all">All categories</option>
          {categories.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
      </div>
      <p className="periodic-scroll-hint" id="periodic-scroll-hint"><MoveHorizontal size={14} /> Swipe sideways to explore all 18 groups</p>
      <div className="periodic-scroll" ref={scrollRef}>
        <div className="periodic-grid" role="grid" aria-label="Periodic table of elements" aria-describedby="periodic-scroll-hint">
          <span className="period-label lanthanoid-label">Lanthanoids</span><span className="period-label actinoid-label">Actinoids</span>
          <button
            type="button"
            className="fblock-anchor-marker"
            style={{ gridColumn: 3, gridRow: 7 }}
            onClick={() => setCategory(category === "lanthanoid" ? "all" : "lanthanoid")}
            aria-label="Lanthanoids series 57 to 71"
          >
            <small>57–71</small>
            <b>La–Lu</b>
            <span>Lanthanoids</span>
          </button>
          <button
            type="button"
            className="fblock-anchor-marker"
            style={{ gridColumn: 3, gridRow: 8 }}
            onClick={() => setCategory(category === "actinoid" ? "all" : "actinoid")}
            aria-label="Actinoids series 89 to 103"
          >
            <small>89–103</small>
            <b>Ac–Lr</b>
            <span>Actinoids</span>
          </button>
          {elements.map((element) => {
            const position = elementGridPosition(element);
            const matches = visible.has(element.atomicNumber);
            return (
              <button
                key={element.atomicNumber}
                role="gridcell"
                data-element-number={element.atomicNumber}
                data-category={element.category}
                className={`${selected === element.atomicNumber ? "selected" : ""} ${matches ? "" : "muted"}`}
                style={{ gridColumn: position.column, gridRow: position.row }}
                onKeyDown={(event) => onGridKey(event, element.atomicNumber)}
                onClick={() => { onSelect(element); onClose(); }}
                aria-label={`${element.name}, ${element.symbol}, atomic number ${element.atomicNumber}, ${categoryLabels[element.category]}`}
              >
                <small>{element.atomicNumber}</small><b>{element.symbol}</b><span>{element.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="category-legend">{categories.filter(([value]) => value !== "unknown").map(([value, label]) => <button key={value} className={category === value ? "active" : ""} onClick={() => setCategory(category === value ? "all" : value)}><i data-category={value} />{label}</button>)}</div>
    </Dialog>
  );
}
