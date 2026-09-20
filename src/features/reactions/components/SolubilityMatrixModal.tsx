"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Beaker,
  CheckCircle2,
  Flame,
  Zap,
} from "lucide-react";
import { Dialog } from "@/components/common/Dialog";
import {
  ACTIVITY_SERIES,
  ANIONS,
  CATIONS,
  getSolubility,
  predictDisplacement,
  SOLUBILITY_RULES,
  type SolubilityCell,
} from "@/features/reactions/lib/solubility";

export interface SolubilityMatrixModalProps {
  onClose: () => void;
  onSelectElement?: (atomicNumber: number) => void;
}

type TabType = "matrix" | "activity";

export function SolubilityMatrixModal({ onClose }: SolubilityMatrixModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("matrix");
  const [selectedCell, setSelectedCell] = useState<SolubilityCell | null>(() =>
    getSolubility("Ag⁺", "Cl⁻"),
  );
  const [cationFilter, setCationFilter] = useState<string>("all");
  const [anionFilter, setAnionFilter] = useState<string>("all");

  // Activity Series state
  const [metalA, setMetalA] = useState<string>("Zn");
  const [metalB, setMetalB] = useState<string>("Cu");

  const filteredCations = useMemo(() => {
    if (cationFilter === "all") return CATIONS;
    return CATIONS.filter((c) => c.formula === cationFilter);
  }, [cationFilter]);

  const filteredAnions = useMemo(() => {
    if (anionFilter === "all") return ANIONS;
    return ANIONS.filter((a) => a.formula === anionFilter);
  }, [anionFilter]);

  const displacement = useMemo(() => {
    return predictDisplacement(metalA, metalB);
  }, [metalA, metalB]);

  return (
    <Dialog
      title="Aqueous Solubility & Activity Series Matrix"
      eyebrow="Precipitates & Single Displacement Dynamics"
      onClose={onClose}
      wide
      className="solubility-dialog"
    >
      {/* Mode Switcher Tabs */}
      <div className="solubility-tabs" role="tablist" aria-label="Solubility and Activity modes">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "matrix"}
          className={`solubility-tab ${activeTab === "matrix" ? "active" : ""}`}
          onClick={() => setActiveTab("matrix")}
        >
          <Beaker size={14} />
          <span>Precipitation & Solubility Matrix</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "activity"}
          className={`solubility-tab ${activeTab === "activity" ? "active" : ""}`}
          onClick={() => setActiveTab("activity")}
        >
          <Zap size={14} />
          <span>Activity Series & Displacement Predictor</span>
        </button>
      </div>

      {activeTab === "matrix" ? (
        <div className="solubility-view-content">
          {/* Filter Bar */}
          <div className="solubility-filter-bar">
            <div className="filter-item">
              <label htmlFor="cation-select">Filter Cation:</label>
              <select
                id="cation-select"
                value={cationFilter}
                onChange={(e) => setCationFilter(e.target.value)}
              >
                <option value="all">All Cations ({CATIONS.length})</option>
                {CATIONS.map((c) => (
                  <option key={c.formula} value={c.formula}>
                    {c.formula} ({c.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label htmlFor="anion-select">Filter Anion:</label>
              <select
                id="anion-select"
                value={anionFilter}
                onChange={(e) => setAnionFilter(e.target.value)}
              >
                <option value="all">All Anions ({ANIONS.length})</option>
                {ANIONS.map((a) => (
                  <option key={a.formula} value={a.formula}>
                    {a.formula} ({a.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="solubility-legend-pills">
              <span className="legend-pill state-s">
                <b>S</b> Soluble
              </span>
              <span className="legend-pill state-i">
                <b>I</b> Insoluble Precipitate
              </span>
              <span className="legend-pill state-ss">
                <b>sS</b> Slightly Soluble
              </span>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="solubility-grid-container">
            <table className="solubility-table">
              <thead>
                <tr>
                  <th className="corner-th">Cation \ Anion</th>
                  {filteredAnions.map((an) => (
                    <th key={an.formula} title={an.name}>
                      <b>{an.formula}</b>
                      <small>{an.name}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCations.map((cat) => (
                  <tr key={cat.formula}>
                    <th className="row-cation-th" title={cat.name}>
                      <b>{cat.formula}</b>
                      <small>{cat.name}</small>
                    </th>
                    {filteredAnions.map((an) => {
                      const cell = getSolubility(cat.formula, an.formula);
                      const isSelected =
                        selectedCell?.cation === cat.formula && selectedCell?.anion === an.formula;

                      return (
                        <td key={an.formula} className="cell-td">
                          <button
                            type="button"
                            className={`solubility-cell-btn state-${cell.state.toLowerCase()} ${isSelected ? "selected" : ""}`}
                            onClick={() => setSelectedCell(cell)}
                            title={`${cat.formula} + ${an.formula} → ${cell.state === "S" ? "Soluble" : "Precipitate"}`}
                          >
                            <span>{cell.state}</span>
                            {cell.color && <i className="precip-dot" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selected Cell Inspector */}
          {selectedCell && (
            <div className="solubility-detail-banner">
              <div className="detail-status-pill">
                <span className={`status-badge state-${selectedCell.state.toLowerCase()}`}>
                  {selectedCell.state === "S"
                    ? "Soluble (Aqueous)"
                    : selectedCell.state === "I"
                      ? "Insoluble (Precipitate)"
                      : "Slightly Soluble"}
                </span>
                <strong>
                  {selectedCell.cation} + {selectedCell.anion} → {selectedCell.compoundFormula}
                </strong>
              </div>
              <p className="detail-notes">
                {selectedCell.notes ||
                  (selectedCell.state === "S"
                    ? "Ions remain fully hydrated and dispersed in aqueous solution (no precipitation)."
                    : "Forms an insoluble solid ionic lattice that precipitates out of solution.")}
              </p>
            </div>
          )}

          {/* Rules Summary Accordion / Grid */}
          <div className="solubility-rules-summary">
            <h4>Fundamental Solubility Guidelines</h4>
            <div className="rules-cards-grid">
              {SOLUBILITY_RULES.map((rule) => (
                <div key={rule.title} className={`rule-card rule-${rule.type}`}>
                  <strong>{rule.title}</strong>
                  <p>{rule.rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Activity Series */
        <div className="activity-view-content">
          <p className="activity-intro-text">
            The metal activity series ranks elements by their tendency to lose electrons (oxidation).
            A metal can only displace another metal or hydrogen from solution if it is{" "}
            <strong>higher</strong> in the series.
          </p>

          {/* Displacement Reaction Simulator */}
          <div className="displacement-simulator-card">
            <h4>
              <Flame size={16} /> Single Displacement Reaction Tester
            </h4>
            <div className="displacement-inputs-row">
              <div className="disp-group">
                <label htmlFor="metal-a-select">Solid Metal (A):</label>
                <select
                  id="metal-a-select"
                  value={metalA}
                  onChange={(e) => setMetalA(e.target.value)}
                >
                  {ACTIVITY_SERIES.map((m) => (
                    <option key={m.symbol} value={m.symbol}>
                      {m.name} ({m.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <span className="plus-sign">+</span>

              <div className="disp-group">
                <label htmlFor="metal-b-select">Aqueous Salt Solution (B²⁺):</label>
                <select
                  id="metal-b-select"
                  value={metalB}
                  onChange={(e) => setMetalB(e.target.value)}
                >
                  {ACTIVITY_SERIES.map((m) => (
                    <option key={m.symbol} value={m.symbol}>
                      {m.name} ({m.symbol}) Solution
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {displacement ? (
              <div
                className={`displacement-result-box ${displacement.occurs ? "success" : "neutral"}`}
              >
                <div className="result-header">
                  {displacement.occurs ? (
                    <CheckCircle2 size={18} className="result-icon ok" />
                  ) : (
                    <AlertCircle size={18} className="result-icon no" />
                  )}
                  <strong>
                    {displacement.occurs ? "Reaction Spontaneous!" : "No Reaction Occurs"}
                  </strong>
                </div>
                <div className="result-equation">
                  <code>{displacement.equation}</code>
                </div>
                <p className="result-explanation">{displacement.explanation}</p>
              </div>
            ) : (
              <p className="pick-different">Select two different metals to test displacement.</p>
            )}
          </div>

          {/* Activity Series Ladder */}
          <div className="activity-ladder-section">
            <h4>Reactivity Ranking (Most Active → Noble Metals)</h4>
            <div className="activity-ladder-track">
              {ACTIVITY_SERIES.map((metal, idx) => (
                <div
                  key={metal.symbol}
                  className={`ladder-metal-node ${metal.symbol === metalA ? "active-a" : ""} ${metal.symbol === metalB ? "active-b" : ""}`}
                >
                  <span className="ladder-rank">#{idx + 1}</span>
                  <strong className="ladder-sym">{metal.symbol}</strong>
                  <span className="ladder-name">{metal.name}</span>
                  <small className="ladder-potential">
                    {metal.standardPotential > 0 ? `+${metal.standardPotential.toFixed(2)}` : metal.standardPotential.toFixed(2)}{" "}
                    V
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
