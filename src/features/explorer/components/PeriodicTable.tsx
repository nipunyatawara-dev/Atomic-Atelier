"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Boxes, Flame, MoveHorizontal, Search } from "lucide-react";
import { Dialog } from "@/components/common/Dialog";
import { categories, categoryLabels, elementByNumber, elementGridPosition, elements } from "@/features/explorer/lib/elements";
import type { ElementCategory, ElementRecord } from "@/types";

export type PhaseState = "Solid" | "Liquid" | "Gas" | "Unknown";

export function elementPhaseAtTemperature(element: ElementRecord, kelvin: number): PhaseState {
  // Special case: Helium at 1 atm remains liquid down to 0 K unless pressurized,
  // and Carbon sublimes around 3823 K.
  if (element.boilingPoint !== null && kelvin >= element.boilingPoint) {
    return "Gas";
  }
  if (element.meltingPoint !== null) {
    return kelvin >= element.meltingPoint ? "Liquid" : "Solid";
  }
  if (kelvin === 298 && element.standardState) {
    if (element.standardState === "Solid" || element.standardState === "Liquid" || element.standardState === "Gas") {
      return element.standardState;
    }
  }
  if (element.standardState === "Gas" && kelvin > 100) return "Gas";
  return "Unknown";
}

const TEMP_PRESETS = [
  { label: "Abs Zero", kelvin: 0 },
  { label: "Room (25°C)", kelvin: 298 },
  { label: "Lava", kelvin: 1400 },
  { label: "Iron Melt", kelvin: 1811 },
  { label: "Tungsten", kelvin: 3695 },
  { label: "Sun Surface", kelvin: 5778 },
];

export function PeriodicTable({ selected, onSelect, onClose }: { selected: number; onSelect: (element: ElementRecord) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ElementCategory | "all">("all");
  const [tempOpen, setTempOpen] = useState(false);
  const [temperatureK, setTemperatureK] = useState<number>(298);
  const [phaseFilter, setPhaseFilter] = useState<PhaseState | "all">("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const phaseByElement = useMemo(() => {
    const map = new Map<number, PhaseState>();
    for (const el of elements) {
      map.set(el.atomicNumber, elementPhaseAtTemperature(el, temperatureK));
    }
    return map;
  }, [temperatureK]);

  const phaseCounts = useMemo(() => {
    const counts = { Solid: 0, Liquid: 0, Gas: 0, Unknown: 0 };
    for (const phase of phaseByElement.values()) {
      counts[phase] += 1;
    }
    return counts;
  }, [phaseByElement]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return new Set(elements.filter((element) => {
      const matchesQuery = !normalized || `${element.name} ${element.symbol} ${element.atomicNumber}`.toLowerCase().includes(normalized);
      const matchesCat = category === "all" || element.category === category;
      const elPhase = phaseByElement.get(element.atomicNumber) ?? "Unknown";
      const matchesPhase = phaseFilter === "all" || elPhase === phaseFilter;
      return matchesQuery && matchesCat && matchesPhase;
    }).map((element) => element.atomicNumber));
  }, [query, category, phaseByElement, phaseFilter]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return;
    const cell = scroller.querySelector<HTMLElement>(`[data-element-number="${selected}"]`);
    if (!cell) return;
    scroller.scrollLeft = Math.max(0, cell.offsetLeft - (scroller.clientWidth - cell.offsetWidth) / 2);
  }, [selected]);

  const scrollToGroupRange = (targetElementNumber: number, alignStart = false) => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    if (alignStart) {
      scroller.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    const cell = scroller.querySelector<HTMLElement>(`[data-element-number="${targetElementNumber}"]`);
    if (!cell) return;
    const nextLeft = Math.max(0, cell.offsetLeft - 24);
    scroller.scrollTo({ left: nextLeft, behavior: "smooth" });
  };

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

  const celsius = Math.round(temperatureK - 273.15);

  return (
    <Dialog title="The periodic table" eyebrow="118 ways to build matter" onClose={onClose} wide className="periodic-dialog">
      <div className="table-controls">
        <search className="table-search-wrapper"><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, symbol, or number" aria-label="Search periodic table by name, symbol, or number" name="table-search" /></label></search>
        <select value={category} onChange={(event) => setCategory(event.target.value as ElementCategory | "all")} aria-label="Filter by category">
          <option value="all">All categories</option>
          {categories.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
        <button
          type="button"
          className={`temp-toggle-btn ${tempOpen || temperatureK !== 298 || phaseFilter !== "all" ? "active" : ""}`}
          onClick={() => setTempOpen((v) => !v)}
          aria-expanded={tempOpen}
          title="Simulate phase transitions across temperature (0 K – 6,000 K)"
        >
          <Flame size={14} />
          <span>{temperatureK} K ({celsius >= 0 ? `+${celsius}` : celsius}°C)</span>
        </button>
        <Link href="/trends" className="periodic-3d-link" onClick={onClose} aria-label="View 3D Periodic Trends">
          <Boxes size={15} />
          <span>View in 3D / Trends</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {tempOpen && (
        <div className="temperature-scrubber-bar" role="region" aria-label="Temperature and phase state simulator">
          <div className="temp-slider-row">
            <label htmlFor="periodic-temp-slider" className="temp-readout">
              <strong>{temperatureK} K</strong>
              <span>({celsius}°C)</span>
            </label>
            <input
              id="periodic-temp-slider"
              type="range"
              min={0}
              max={6000}
              step={10}
              value={temperatureK}
              onChange={(e) => setTemperatureK(Number(e.target.value))}
              aria-label="Temperature in Kelvin"
            />
            <div className="temp-presets">
              {TEMP_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={temperatureK === preset.kelvin ? "active" : ""}
                  onClick={() => setTemperatureK(preset.kelvin)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div className="phase-filter-pills" role="group" aria-label="Filter by physical phase at current temperature">
            <button
              type="button"
              className={phaseFilter === "all" ? "active" : ""}
              onClick={() => setPhaseFilter("all")}
            >
              All phases
            </button>
            <button
              type="button"
              className={`phase-pill solid ${phaseFilter === "Solid" ? "active" : ""}`}
              onClick={() => setPhaseFilter(phaseFilter === "Solid" ? "all" : "Solid")}
            >
              <i>S</i> Solid ({phaseCounts.Solid})
            </button>
            <button
              type="button"
              className={`phase-pill liquid ${phaseFilter === "Liquid" ? "active" : ""}`}
              onClick={() => setPhaseFilter(phaseFilter === "Liquid" ? "all" : "Liquid")}
            >
              <i>L</i> Liquid ({phaseCounts.Liquid})
            </button>
            <button
              type="button"
              className={`phase-pill gas ${phaseFilter === "Gas" ? "active" : ""}`}
              onClick={() => setPhaseFilter(phaseFilter === "Gas" ? "all" : "Gas")}
            >
              <i>G</i> Gas ({phaseCounts.Gas})
            </button>
          </div>
        </div>
      )}

      <div className="periodic-mobile-bar">
        <p className="periodic-scroll-hint" id="periodic-scroll-hint"><MoveHorizontal size={14} /> Swipe sideways to explore all 18 groups</p>
        <div className="periodic-mobile-jumps" role="group" aria-label="Quick jump to periodic table groups">
          <button type="button" onClick={() => scrollToGroupRange(1, true)}>Groups 1–2</button>
          <button type="button" onClick={() => scrollToGroupRange(21)}>3–12 d-Block</button>
          <button type="button" onClick={() => scrollToGroupRange(5)}>13–18 p-Block</button>
          <button type="button" onClick={() => scrollToGroupRange(selected)}>Selected</button>
        </div>
      </div>

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
            const phase = phaseByElement.get(element.atomicNumber) ?? "Unknown";
            return (
              <button
                key={element.atomicNumber}
                role="gridcell"
                data-element-number={element.atomicNumber}
                data-category={element.category}
                data-phase={phase.toLowerCase()}
                className={`${selected === element.atomicNumber ? "selected" : ""} ${matches ? "" : "muted"}`}
                style={{ gridColumn: position.column, gridRow: position.row }}
                onKeyDown={(event) => onGridKey(event, element.atomicNumber)}
                onClick={() => { onSelect(element); onClose(); }}
                aria-label={`${element.name}, ${element.symbol}, atomic number ${element.atomicNumber}, ${categoryLabels[element.category]}`}
              >
                <small>
                  {element.atomicNumber}
                  {(tempOpen || temperatureK !== 298) && phase !== "Unknown" && (
                    <em className={`tile-phase-tag phase-${phase.toLowerCase()}`}>{phase[0]}</em>
                  )}
                </small>
                <b>{element.symbol}</b>
                <span>{element.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="category-legend">{categories.filter(([value]) => value !== "unknown").map(([value, label]) => <button key={value} className={category === value ? "active" : ""} onClick={() => setCategory(category === value ? "all" : value)}><i data-category={value} />{label}</button>)}</div>
    </Dialog>
  );
}
