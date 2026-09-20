"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Calculator,
  Hash,
  Layers,
  Percent,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Dialog } from "@/components/common/Dialog";
import {
  calculateMolarMass,
  FORMULA_PRESETS,
  gramsToMoles,
  molesToGrams,
  molesToParticles,
} from "@/features/reactions/lib/molarMass";
import { formatFormulaSubscripts } from "@/features/reactions/lib/formula";

export interface MolarMassModalProps {
  initialFormula?: string;
  onClose: () => void;
  onSelectElement?: (atomicNumber: number) => void;
}

export function MolarMassModal({
  initialFormula = "H2O",
  onClose,
  onSelectElement,
}: MolarMassModalProps) {
  const [formulaInput, setFormulaInput] = useState<string>(initialFormula);
  const [calcGrams, setCalcGrams] = useState<string>("100");
  const [calcMoles, setCalcMoles] = useState<string>("1");
  const [activeUnit, setActiveUnit] = useState<"grams" | "moles">("grams");

  const result = useMemo(() => {
    return calculateMolarMass(formulaInput);
  }, [formulaInput]);

  // Derived stoichiometric conversions
  const conversion = useMemo(() => {
    if (!result) return null;
    const M = result.molarMass;

    if (activeUnit === "grams") {
      const g = parseFloat(calcGrams) || 0;
      const n = gramsToMoles(g, M);
      const particles = molesToParticles(n);
      return { grams: g, moles: n, particles };
    } else {
      const n = parseFloat(calcMoles) || 0;
      const g = molesToGrams(n, M);
      const particles = molesToParticles(n);
      return { grams: g, moles: n, particles };
    }
  }, [result, activeUnit, calcGrams, calcMoles]);

  return (
    <Dialog
      title="Molar Mass & Stoichiometry Calculator"
      eyebrow="Quantitative Formula Analysis"
      onClose={onClose}
      wide
      className="molar-mass-dialog"
    >
      {/* Preset Chips */}
      <div className="molar-presets-row" aria-label="Preset chemical formulas">
        <span>Presets:</span>
        <div className="preset-chips">
          {FORMULA_PRESETS.map((preset) => (
            <button
              key={preset.formula}
              type="button"
              className={`preset-chip ${formulaInput === preset.formula ? "active" : ""}`}
              onClick={() => {
                setFormulaInput(preset.formula);
              }}
              title={`${preset.name} (${preset.category})`}
            >
              <b>{preset.name}</b>
              <small>{formatFormulaSubscripts(preset.formula)}</small>
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="molar-input-container">
        <label htmlFor="formula-input">
          <Calculator size={16} /> Enter chemical formula (supports polyatomics & hydrates)
        </label>
        <div className="formula-input-wrapper">
          <input
            id="formula-input"
            type="text"
            value={formulaInput}
            onChange={(e) => setFormulaInput(e.target.value)}
            placeholder="e.g. Ca3(PO4)2, C6H12O6, CuSO4·5H2O…"
            autoComplete="off"
            spellCheck={false}
          />
          {result && (
            <button
              type="button"
              className="formula-clear"
              onClick={() => setFormulaInput("")}
              aria-label="Clear formula"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {result ? (
        <div className="molar-results-layout">
          {/* Main Total Callout */}
          <div className="molar-total-card">
            <div className="total-header">
              <span>Formatted Formula</span>
              <strong>{formatFormulaSubscripts(result.cleanFormula)}</strong>
            </div>
            <div className="total-mass-display">
              <span className="mass-number">{result.molarMass.toFixed(3)}</span>
              <span className="mass-unit">g/mol</span>
            </div>
            <div className="total-atoms-badge">
              <Hash size={13} />
              <span>{result.totalAtoms} total atoms per formula unit</span>
            </div>
          </div>

          {/* Mass Percentage Stacked Bar */}
          <div className="mass-stacked-bar-section">
            <div className="section-label">
              <Percent size={14} /> Mass Percentage Composition
            </div>
            <div className="mass-stacked-bar" role="progressbar" aria-label="Element mass percentages">
              {result.breakdown.map((item) => (
                <div
                  key={item.symbol}
                  className="bar-segment"
                  style={{
                    width: `${Math.max(item.percentage, 2)}%`,
                    backgroundColor: item.cpkColor || "#64748b",
                  }}
                  title={`${item.name} (${item.symbol}): ${item.percentage.toFixed(2)}%`}
                />
              ))}
            </div>
          </div>

          {/* Elements Breakdown Table */}
          <div className="molar-breakdown-table-container">
            <table className="molar-breakdown-table">
              <thead>
                <tr>
                  <th>Element</th>
                  <th>Atoms</th>
                  <th>Atomic Mass</th>
                  <th>Subtotal</th>
                  <th>Mass %</th>
                  {onSelectElement && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {result.breakdown.map((item) => (
                  <tr key={item.symbol}>
                    <td>
                      <span className="table-el-pill">
                        <span
                          className="el-color-dot"
                          style={{ backgroundColor: item.cpkColor || "#94a3b8" }}
                        />
                        <b>{item.symbol}</b>
                        <span>{item.name}</span>
                      </span>
                    </td>
                    <td>× {item.count}</td>
                    <td>{item.atomicMass.toFixed(3)} u</td>
                    <td>{item.totalMass.toFixed(3)} g/mol</td>
                    <td>
                      <div className="percent-cell">
                        <strong>{item.percentage.toFixed(1)}%</strong>
                        <div className="mini-progress">
                          <div
                            className="mini-fill"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: item.cpkColor || "#38bdf8",
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    {onSelectElement && (
                      <td>
                        <button
                          type="button"
                          className="table-inspect-btn"
                          onClick={() => {
                            onClose();
                            onSelectElement(item.atomicNumber);
                          }}
                          aria-label={`Inspect ${item.name} in 3D`}
                        >
                          <span>Inspect</span>
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stoichiometry Mass <-> Moles Converter */}
          <div className="stoich-converter-card">
            <div className="converter-header">
              <Sparkles size={16} />
              <h4>Mole ↔ Mass Quantitative Converter</h4>
            </div>
            <div className="converter-grid">
              <div className="converter-input-group">
                <label htmlFor="input-grams">Mass (grams)</label>
                <input
                  id="input-grams"
                  type="number"
                  min="0"
                  step="any"
                  value={calcGrams}
                  onChange={(e) => {
                    setCalcGrams(e.target.value);
                    setActiveUnit("grams");
                  }}
                  onFocus={() => setActiveUnit("grams")}
                />
              </div>

              <div className="converter-input-group">
                <label htmlFor="input-moles">Amount (moles)</label>
                <input
                  id="input-moles"
                  type="number"
                  min="0"
                  step="any"
                  value={calcMoles}
                  onChange={(e) => {
                    setCalcMoles(e.target.value);
                    setActiveUnit("moles");
                  }}
                  onFocus={() => setActiveUnit("moles")}
                />
              </div>
            </div>

            {conversion && (
              <div className="converter-readout">
                <div className="readout-item">
                  <span>Calculated Amount:</span>
                  <b>
                    {activeUnit === "grams"
                      ? `${conversion.moles.toFixed(4)} mol`
                      : `${conversion.grams.toFixed(3)} g`}
                  </b>
                </div>
                <div className="readout-item">
                  <span>Particles (Atoms/Molecules):</span>
                  <b>{conversion.particles.toExponential(4)}</b>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="molar-empty-state">
          <Layers size={32} />
          <p>
            {formulaInput.trim()
              ? `Could not parse "${formulaInput}". Check element symbols (e.g. "Ca" not "CA").`
              : "Type a chemical formula above or pick a preset to calculate molar mass."}
          </p>
        </div>
      )}
    </Dialog>
  );
}
