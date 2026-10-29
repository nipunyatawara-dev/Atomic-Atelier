"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUp,
  Award,
  Info,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { Dialog } from "@/components/common/Dialog";
import {
  AUFBAU_ANOMALIES,
  generateAufbauSimulation,
  generateOrbitalBoxes,
} from "@/features/explorer/lib/aufbau";
import { SUBSHELL_COLORS } from "@/features/explorer/lib/orbitals";
import { formatElectronConfig } from "@/features/reactions/lib/formula";
import type { ElementRecord } from "@/types";

export interface AufbauModalProps {
  element: ElementRecord;
  onClose: () => void;
  onSelectElement?: (atomicNumber: number) => void;
}

type ViewTab = "boxes" | "ladder" | "simulation";

export function AufbauModal({ element, onClose }: AufbauModalProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>("boxes");
  const [simElectrons, setSimElectrons] = useState<number>(element.atomicNumber);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const anomaly = AUFBAU_ANOMALIES[element.atomicNumber];
  const elementSubshells = useMemo(() => generateOrbitalBoxes(element), [element]);
  const simulatedSubshells = useMemo(
    () => generateAufbauSimulation(simElectrons),
    [simElectrons],
  );

  // Auto-play simulation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSimElectrons((prev) => {
        if (prev >= element.atomicNumber) {
          setIsPlaying(false);
          return element.atomicNumber;
        }
        return prev + 1;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [isPlaying, element.atomicNumber]);

  const activeDisplaySubshells = activeTab === "simulation" ? simulatedSubshells : elementSubshells;

  // Calculate total unpaired electrons (determines paramagnetism)
  const unpairedCount = useMemo(() => {
    let count = 0;
    activeDisplaySubshells.forEach((sub) => {
      sub.boxes.forEach((box) => {
        if (box.electrons === 1) count += 1;
      });
    });
    return count;
  }, [activeDisplaySubshells]);

  return (
    <Dialog
      title={`${element.name} (${element.symbol}) · Aufbau & Orbitals`}
      eyebrow="Quantum Electron Configuration & Hund’s Rule"
      onClose={onClose}
      wide
      className="aufbau-dialog"
    >
      {/* View Switcher Tabs */}
      <div className="aufbau-tabs" role="tablist" aria-label="Aufbau presentation modes">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "boxes"}
          className={`aufbau-tab ${activeTab === "boxes" ? "active" : ""}`}
          onClick={() => setActiveTab("boxes")}
        >
          <Zap size={14} />
          <span>Orbital Boxes</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "ladder"}
          className={`aufbau-tab ${activeTab === "ladder" ? "active" : ""}`}
          onClick={() => setActiveTab("ladder")}
        >
          <ArrowUp size={14} />
          <span>Energy Ladder</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "simulation"}
          className={`aufbau-tab ${activeTab === "simulation" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("simulation");
            setSimElectrons(element.atomicNumber);
            setIsPlaying(false);
          }}
        >
          <Play size={14} />
          <span>Hund’s Rule Simulator</span>
        </button>
      </div>

      {/* Anomaly Callout Banner (if applicable) */}
      {anomaly && (
        <div className="aufbau-anomaly-banner" role="alert">
          <Sparkles size={18} className="anomaly-icon" />
          <div className="anomaly-text">
            <strong>Anomalous Ground State Configuration</strong>
            <p>
              Expected via standard Aufbau: <code>{anomaly.expectedConfig}</code> → Observed:{" "}
              <code>{anomaly.actualConfig}</code>.
            </p>
            <p className="anomaly-explanation">{anomaly.reason}</p>
          </div>
        </div>
      )}

      {/* Summary KPI Ribbon */}
      <div className="aufbau-kpi-ribbon">
        <div className="kpi-pill">
          <span>Configuration</span>
          <strong>{formatElectronConfig(element.electronConfiguration)}</strong>
        </div>
        <div className="kpi-pill">
          <span>Electrons</span>
          <strong>{activeTab === "simulation" ? simElectrons : element.atomicNumber} e⁻</strong>
        </div>
        <div className="kpi-pill">
          <span>Unpaired Electrons</span>
          <strong>
            {unpairedCount} {unpairedCount === 1 ? "spin" : "spins"} (
            {unpairedCount > 0 ? "Paramagnetic" : "Diamagnetic"})
          </strong>
        </div>
        <div className="kpi-pill">
          <span>Valence Electrons</span>
          <strong>{element.valenceElectrons ?? "d/f involvement"}</strong>
        </div>
      </div>

      {/* Simulation Controls (Visible in Simulator tab) */}
      {activeTab === "simulation" && (
        <div className="aufbau-sim-controls">
          <div className="sim-slider-row">
            <label htmlFor="electron-slider">
              Electron {simElectrons} of {element.atomicNumber}
            </label>
            <input
              id="electron-slider"
              type="range"
              min={1}
              max={element.atomicNumber}
              value={simElectrons}
              onChange={(e) => {
                setSimElectrons(Number(e.target.value));
                setIsPlaying(false);
              }}
            />
          </div>
          <div className="sim-button-row">
            <button
              type="button"
              className="sim-btn"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? "Pause simulation" : "Play step-by-step filling"}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? "Pause" : "Play filling"}</span>
            </button>
            <button
              type="button"
              className="sim-btn secondary"
              onClick={() => {
                setSimElectrons(1);
                setIsPlaying(false);
              }}
              aria-label="Reset to 1 electron"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
            <button
              type="button"
              className="sim-btn secondary"
              onClick={() => {
                setSimElectrons(element.atomicNumber);
                setIsPlaying(false);
              }}
              aria-label="Jump to ground state"
            >
              <Award size={14} />
              <span>Full ({element.atomicNumber})</span>
            </button>
          </div>
        </div>
      )}

      {/* View 1: Orbital Boxes Grid View */}
      {activeTab === "boxes" && (
        <div className="aufbau-boxes-view">
          <div className="subshell-rows-container">
            {elementSubshells.map((subshell) => (
              <div
                key={subshell.label}
                className="subshell-card"
                style={{
                  "--sub-color": SUBSHELL_COLORS[subshell.type].hex,
                } as React.CSSProperties}
              >
                <div className="subshell-card-header">
                  <div className="subshell-badge">
                    <span className="subshell-label">{subshell.label}</span>
                    <sup className="subshell-count">{subshell.electrons}</sup>
                  </div>
                  <span className="subshell-type-name">
                    {SUBSHELL_COLORS[subshell.type].name.split(" ")[0]}
                  </span>
                  <span className="subshell-occupancy">
                    {subshell.electrons}/{subshell.maxElectrons}
                  </span>
                </div>

                <div className="boxes-track">
                  {subshell.boxes.map((box) => (
                    <div
                      key={box.id}
                      className={`orbital-box ${box.electrons === 2 ? "filled" : box.electrons === 1 ? "half-filled" : "empty"}`}
                      title={`${box.label}: ${box.electrons} electron(s)`}
                    >
                      <div className="box-spins">
                        {box.spins.map((spin, sIdx) => (
                          <span
                            key={sIdx}
                            className={`spin-arrow spin-${spin}`}
                            aria-label={`Spin ${spin}`}
                          >
                            {spin === "up" ? "↑" : "↓"}
                          </span>
                        ))}
                      </div>
                      <small
                        className="box-label"
                        dangerouslySetInnerHTML={{ __html: box.label }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View 2: Energy Level Ladder */}
      {activeTab === "ladder" && (
        <div className="aufbau-ladder-view">
          <p className="ladder-guide-note">
            <Info size={14} /> Subshells are positioned according to the Aufbau (n + l) Madelung
            filling order. Higher rungs represent higher relative energy levels.
          </p>
          <div className="energy-ladder-canvas">
            <div className="ladder-y-axis">
              <span>Higher Energy</span>
              <ArrowUp size={16} />
            </div>
            <div className="ladder-rungs">
              {[...elementSubshells].reverse().map((subshell) => (
                <div
                  key={subshell.label}
                  className="ladder-rung"
                  style={{
                    "--sub-color": SUBSHELL_COLORS[subshell.type].hex,
                  } as React.CSSProperties}
                >
                  <div className="rung-label-col">
                    <b>{subshell.label}</b>
                    <small>{subshell.electrons} e⁻</small>
                  </div>
                  <div className="rung-boxes">
                    {subshell.boxes.map((box) => (
                      <div
                        key={box.id}
                        className={`orbital-box mini ${box.electrons === 2 ? "filled" : box.electrons === 1 ? "half-filled" : "empty"}`}
                      >
                        <div className="box-spins">
                          {box.spins.map((spin, sIdx) => (
                            <span key={sIdx} className={`spin-arrow spin-${spin}`}>
                              {spin === "up" ? "↑" : "↓"}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View 3: Hund's Rule Simulation */}
      {activeTab === "simulation" && (
        <div className="aufbau-boxes-view">
          <p className="simulation-note">
            Watch electrons occupy degenerate orbitals singly with parallel spins (↑)
            before pairing (↓).
          </p>
          <div className="subshell-rows-container">
            {simulatedSubshells.map((subshell) => (
              <div
                key={subshell.label}
                className="subshell-card"
                style={{
                  "--sub-color": SUBSHELL_COLORS[subshell.type].hex,
                } as React.CSSProperties}
              >
                <div className="subshell-card-header">
                  <div className="subshell-badge">
                    <span className="subshell-label">{subshell.label}</span>
                    <sup className="subshell-count">{subshell.electrons}</sup>
                  </div>
                  <span className="subshell-occupancy">
                    {subshell.electrons}/{subshell.maxElectrons}
                  </span>
                </div>

                <div className="boxes-track">
                  {subshell.boxes.map((box) => (
                    <div
                      key={box.id}
                      className={`orbital-box ${box.electrons === 2 ? "filled" : box.electrons === 1 ? "half-filled" : "empty"}`}
                    >
                      <div className="box-spins">
                        {box.spins.map((spin, sIdx) => (
                          <span key={sIdx} className={`spin-arrow spin-${spin}`}>
                            {spin === "up" ? "↑" : "↓"}
                          </span>
                        ))}
                      </div>
                      <small
                        className="box-label"
                        dangerouslySetInnerHTML={{ __html: box.label }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pedagogical Foundations Footer */}
      <div className="aufbau-principles-footer">
        <div className="principle-item">
          <strong>Aufbau Principle</strong>
          <p>Electrons fill lower-energy atomic subshells before entering higher levels.</p>
        </div>
        <div className="principle-item">
          <strong>Hund’s Rule</strong>
          <p>Degenerate orbitals are filled singly with parallel spin before pairing.</p>
        </div>
        <div className="principle-item">
          <strong>Pauli Exclusion</strong>
          <p>No two electrons can share the same 4 quantum numbers; paired spins must oppose.</p>
        </div>
      </div>
    </Dialog>
  );
}
