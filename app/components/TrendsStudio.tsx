"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Atom,
  BarChart3,
  Boxes,
  Compass,
  GraduationCap,
  Palette,
  Zap,
} from "lucide-react";
import { AppHeader } from "./AppHeader";
import { PeriodicHeatmapTable } from "./PeriodicHeatmapTable";
import { PeriodicTable } from "./PeriodicTable";
import { QuizModal } from "./QuizModal";
import { SavedModal } from "./SavedModal";
import { TrendsGraph } from "./TrendsGraph";
import { elementByNumber, elements } from "../lib/elements";
import { useProgress } from "../lib/progress";
import {
  getElementRanking,
  PALETTES,
  resolveTrend,
  TREND_ANOMALIES,
  TREND_PROPERTIES,
  TREND_QUIZ_QUESTIONS,
} from "../lib/trends";
import type {
  ElementRecord,
  TrendAnomaly,
  TrendPaletteId,
  TrendPropertyId,
  TrendViewMode,
} from "../lib/types";

const Periodic3DElevation = dynamic(
  () => import("./Periodic3DElevation").then((mod) => mod.Periodic3DElevation),
  { ssr: false },
);

export function TrendsStudio() {
  const router = useRouter();
  const params = useSearchParams();
  const { progress, ready, visitTrend, recordQuiz } = useProgress();

  const [selectedPropertyId, setSelectedPropertyId] = useState<TrendPropertyId>("electronegativity");
  const [paletteId, setPaletteId] = useState<TrendPaletteId>("viridis");
  const [viewMode, setViewMode] = useState<TrendViewMode>("elevation-3d");
  const [selectedElement, setSelectedElement] = useState<ElementRecord>(elements[5]); // Carbon
  const [selectedAnomaly, setSelectedAnomaly] = useState<TrendAnomaly | null>(null);
  const [exaggeration, setExaggeration] = useState(1.0);

  // Modals
  const [quizOpen, setQuizOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);

  // Synchronize URL query params
  useEffect(() => {
    const propParam = params.get("property");
    const elemParam = params.get("element");

    queueMicrotask(() => {
      if (propParam && TREND_PROPERTIES.some((p) => p.id === propParam)) {
        setSelectedPropertyId(propParam as TrendPropertyId);
      }
      if (elemParam) {
        const found = elements.find((e) => e.slug === elemParam.toLowerCase() || String(e.atomicNumber) === elemParam);
        if (found) setSelectedElement(found);
      }
    });
  }, [params]);

  // Track progress
  useEffect(() => {
    if (ready) {
      visitTrend(selectedPropertyId);
    }
  }, [selectedPropertyId, ready, visitTrend]);

  const currentProperty = useMemo(() => resolveTrend(selectedPropertyId), [selectedPropertyId]);

  const ranking = useMemo(() => {
    return getElementRanking(selectedPropertyId, selectedElement.atomicNumber);
  }, [selectedPropertyId, selectedElement]);

  const relevantAnomalies = useMemo(() => {
    return TREND_ANOMALIES.filter((a) => a.property === selectedPropertyId);
  }, [selectedPropertyId]);

  const handleSelectProperty = (id: TrendPropertyId) => {
    setSelectedPropertyId(id);
    const prop = resolveTrend(id);
    setPaletteId(prop.defaultPalette);
    router.replace(`/trends?property=${id}`, { scroll: false });
  };

  const handleSelectAnomaly = (anomaly: TrendAnomaly) => {
    setSelectedAnomaly(anomaly);
    setViewMode("anomalies");
    if (anomaly.elementsInvolved[0]) {
      const firstElem = elementByNumber.get(anomaly.elementsInvolved[0]);
      if (firstElem) setSelectedElement(firstElem);
    }
  };

  return (
    <main className="trends-workspace">
      <AppHeader
        active="trends"
        onTable={() => setTableOpen(true)}
        onSaved={() => setSavedOpen(true)}
      />

      {/* Top Header & Property Tabs */}
      <section className="trends-topbar">
        <div className="trends-heading-block">
          <div className="title-row">
            <h1>Periodic Trends Studio</h1>
            <span className="trends-badge">
              <Activity size={13} />
              118 Elements Dynamic Elevation
            </span>
          </div>
          <p className="trends-subtitle">
            Explore electronegativity, atomic radii, ionization energy, and quantum anomalies in 3D terrain & 2D heatmaps.
          </p>
        </div>

        <div className="trends-actions">
          <button
            type="button"
            className="quiz-action-btn"
            onClick={() => setQuizOpen(true)}
            title="Test your periodic trends intuition"
          >
            <GraduationCap size={15} />
            <span>Trends Quiz</span>
          </button>
        </div>
      </section>

      {/* Property Selector Bar */}
      <div className="property-selector-strip">
        <div className="property-chips-scroll">
          {TREND_PROPERTIES.map((prop) => {
            const isActive = selectedPropertyId === prop.id;
            return (
              <button
                key={prop.id}
                type="button"
                className={`property-tab-chip ${isActive ? "active" : ""}`}
                onClick={() => handleSelectProperty(prop.id)}
              >
                <span className="prop-symbol">{prop.symbol}</span>
                <span className="prop-name">{prop.name}</span>
                <small className="prop-unit">{prop.unit}</small>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="trends-grid">
        {/* Left / Center Viewport Container */}
        <section className="trends-center-stage">
          {/* View Mode Switcher Toolbar */}
          <div className="stage-mode-toolbar">
            <div className="mode-tabs">
              <button
                type="button"
                className={`mode-tab ${viewMode === "elevation-3d" ? "active" : ""}`}
                onClick={() => setViewMode("elevation-3d")}
              >
                <Compass size={14} />
                <span>3D Elevation Matrix</span>
              </button>
              <button
                type="button"
                className={`mode-tab ${viewMode === "heatmap-2d" ? "active" : ""}`}
                onClick={() => setViewMode("heatmap-2d")}
              >
                <BarChart3 size={14} />
                <span>2D Heatmap Table</span>
              </button>
              <button
                type="button"
                className={`mode-tab ${viewMode === "graphs" ? "active" : ""}`}
                onClick={() => setViewMode("graphs")}
              >
                <Activity size={14} />
                <span>Trends Graph Studio</span>
              </button>
              <button
                type="button"
                className={`mode-tab ${viewMode === "anomalies" ? "active" : ""}`}
                onClick={() => setViewMode("anomalies")}
              >
                <AlertTriangle size={14} />
                <span>Anomalies Guide</span>
                {relevantAnomalies.length > 0 && <span className="tab-pill">{relevantAnomalies.length}</span>}
              </button>
            </div>

            {/* Palette Switcher */}
            {(viewMode === "elevation-3d" || viewMode === "heatmap-2d") && (
              <div className="palette-controls">
                <Palette size={13} className="palette-icon" />
                <select
                  value={paletteId}
                  onChange={(e) => setPaletteId(e.target.value as TrendPaletteId)}
                  aria-label="Color Palette"
                  className="palette-select"
                >
                  {Object.entries(PALETTES).map(([key, pal]) => (
                    <option key={key} value={key}>
                      {pal.name}
                    </option>
                  ))}
                </select>

                {viewMode === "elevation-3d" && (
                  <div className="exaggeration-slider" title="3D Height Scale">
                    <small>Scale:</small>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.25"
                      value={exaggeration}
                      onChange={(e) => setExaggeration(parseFloat(e.target.value))}
                      aria-label="Height exaggeration slider"
                    />
                    <small>{exaggeration}x</small>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Viewport Surface */}
          <div className="stage-viewport-shell">
            {viewMode === "elevation-3d" && (
              <Periodic3DElevation
                selectedProperty={selectedPropertyId}
                paletteId={paletteId}
                selectedElementNumber={selectedElement.atomicNumber}
                onSelectElement={setSelectedElement}
                autoRotate={progress.autoRotate}
                exaggeration={exaggeration}
              />
            )}

            {viewMode === "heatmap-2d" && (
              <PeriodicHeatmapTable
                selectedProperty={selectedPropertyId}
                paletteId={paletteId}
                selectedElementNumber={selectedElement.atomicNumber}
                onSelectElement={setSelectedElement}
              />
            )}

            {viewMode === "graphs" && (
              <TrendsGraph
                primaryProperty={selectedPropertyId}
                selectedElementNumber={selectedElement.atomicNumber}
                onSelectElement={setSelectedElement}
              />
            )}

            {viewMode === "anomalies" && (
              <div className="anomalies-workspace">
                <div className="anomalies-header">
                  <AlertTriangle size={18} className="text-amber-500" />
                  <div>
                    <h3>Quantum Exceptions & Periodic Anomalies</h3>
                    <p>Why real chemical behavior breaks simple textbook monotonic trends.</p>
                  </div>
                </div>

                <div className="anomalies-grid">
                  {TREND_ANOMALIES.map((anomaly) => {
                    const isSelected = selectedAnomaly?.id === anomaly.id;
                    const involvedElems = anomaly.elementsInvolved
                      .map((z) => elementByNumber.get(z))
                      .filter(Boolean) as ElementRecord[];

                    return (
                      <article
                        key={anomaly.id}
                        className={`anomaly-card ${isSelected ? "active" : ""}`}
                        onClick={() => setSelectedAnomaly(anomaly)}
                      >
                        <div className="anomaly-card-top">
                          <span className="anomaly-prop-tag">
                            {resolveTrend(anomaly.property).name}
                          </span>
                          <span className="anomaly-key">{anomaly.keyObservation}</span>
                        </div>
                        <h4>{anomaly.title}</h4>
                        <p className="anomaly-principle">
                          <b>Underlying Principle:</b> {anomaly.principle}
                        </p>
                        <p className="anomaly-copy">{anomaly.explanation}</p>

                        <div className="involved-elements-row">
                          <span>Elements:</span>
                          {involvedElems.map((elem) => (
                            <button
                              key={elem.atomicNumber}
                              type="button"
                              className="involved-elem-pill"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedElement(elem);
                              }}
                            >
                              <b>{elem.symbol}</b>
                              <small>Z={elem.atomicNumber}</small>
                            </button>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Inspector Panel */}
        <aside className="trends-inspector">
          {/* Element Profile Card */}
          <div className="inspector-card element-trend-profile">
            <header className="profile-header">
              <div className="elem-badge" data-category={selectedElement.category}>
                <span className="elem-number">{selectedElement.atomicNumber}</span>
                <strong className="elem-symbol">{selectedElement.symbol}</strong>
              </div>
              <div className="elem-title-block">
                <h3>{selectedElement.name}</h3>
                <span className="elem-category-label">
                  {selectedElement.categoryLabel} &middot; Period {selectedElement.period}, Group{" "}
                  {selectedElement.group ?? "—"}
                </span>
              </div>
            </header>

            {/* Selected Property Rank & Value */}
            <div className="selected-trend-stat-box">
              <div className="stat-label-row">
                <span>{currentProperty.name}</span>
                <span className="unit-pill">{currentProperty.unit}</span>
              </div>
              <div className="stat-value-display">
                <strong>{currentProperty.format(currentProperty.accessor(selectedElement))}</strong>
              </div>

              {ranking && (
                <div className="stat-rank-bar">
                  <div className="rank-metric">
                    <small>Rank in Table</small>
                    <b>#{ranking.rank} / {ranking.totalEstablished}</b>
                  </div>
                  <div className="rank-metric">
                    <small>Percentile</small>
                    <b>Top {100 - ranking.percentile}%</b>
                  </div>
                </div>
              )}
            </div>

            {/* Cross-Trend Comparison Stats */}
            <div className="cross-trend-stats">
              <div className="cross-stat-row">
                <span className="cs-label">Electronegativity:</span>
                <b className="cs-val">{selectedElement.electronegativity ?? "—"}</b>
              </div>
              <div className="cross-stat-row">
                <span className="cs-label">Atomic Radius:</span>
                <b className="cs-val">
                  {selectedElement.atomicRadius ? `${selectedElement.atomicRadius} pm` : "—"}
                </b>
              </div>
              <div className="cross-stat-row">
                <span className="cs-label">1st Ionization:</span>
                <b className="cs-val">
                  {selectedElement.ionizationEnergy
                    ? `${selectedElement.ionizationEnergy.toLocaleString()} kJ/mol`
                    : "—"}
                </b>
              </div>
              <div className="cross-stat-row">
                <span className="cs-label">Melting Point:</span>
                <b className="cs-val">
                  {selectedElement.meltingPoint ? `${selectedElement.meltingPoint} K` : "—"}
                </b>
              </div>
            </div>

            {/* Direct Navigation Links */}
            <div className="inspector-actions">
              <Link
                href={`/?element=${selectedElement.slug}`}
                className="inspector-nav-link"
                title={`Open ${selectedElement.name} in Element Explorer`}
              >
                <Atom size={14} />
                <span>Explore Atomic Orbitals</span>
                <ArrowRight size={13} className="link-arrow" />
              </Link>
              <Link
                href="/molecules"
                className="inspector-nav-link secondary"
                title="Explore 3D VSEPR Molecules"
              >
                <Boxes size={14} />
                <span>Molecule Studio</span>
                <ArrowRight size={13} className="link-arrow" />
              </Link>
            </div>
          </div>

          {/* Physics & Trend Explanation Card */}
          <div className="inspector-card trend-physics-card">
            <header className="card-heading">
              <Zap size={16} className="text-teal" />
              <h3>{currentProperty.name} Trend Rules</h3>
            </header>

            <p className="trend-desc">{currentProperty.description}</p>

            <div className="rules-block">
              <div className="rule-item">
                <strong>Across Period (Left → Right):</strong>
                <p>{currentProperty.periodRule}</p>
              </div>
              <div className="rule-item">
                <strong>Down Group (Top → Bottom):</strong>
                <p>{currentProperty.groupRule}</p>
              </div>
            </div>

            <div className="physics-callout">
              <span className="callout-title">Underlying Physical Mechanism:</span>
              <p>{currentProperty.underlyingPhysics}</p>
            </div>

            {relevantAnomalies.length > 0 && (
              <div className="relevant-anomalies-list">
                <span className="anomalies-heading">
                  <AlertTriangle size={13} />
                  Known Quantum Anomalies:
                </span>
                {relevantAnomalies.map((anom) => (
                  <button
                    key={anom.id}
                    type="button"
                    className="anomaly-trigger-chip"
                    onClick={() => handleSelectAnomaly(anom)}
                  >
                    <span>{anom.title}</span>
                    <ArrowRight size={12} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Trend Quiz Modal */}
      {quizOpen && (
        <QuizModal
          title="Periodic Trends Knowledge Challenge"
          questions={TREND_QUIZ_QUESTIONS}
          onClose={() => setQuizOpen(false)}
          onComplete={(score) => recordQuiz("periodic-trends", score)}
        />
      )}

      {/* Periodic Table Modal */}
      {tableOpen && (
        <PeriodicTable
          selected={selectedElement.atomicNumber}
          onClose={() => setTableOpen(false)}
          onSelect={(elem) => {
            setTableOpen(false);
            setSelectedElement(elem);
          }}
        />
      )}

      {/* Saved Modal */}
      {savedOpen && (
        <SavedModal
          progress={progress}
          onClose={() => setSavedOpen(false)}
          onSelectElement={(elem) => {
            setSavedOpen(false);
            setSelectedElement(elem);
          }}
        />
      )}
    </main>
  );
}
