"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Atom,
  Bookmark,
  Compass,
  Eye,
  GraduationCap,
  Layers,
  Minus,
  Orbit,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { AppHeader } from "./AppHeader";
import { LewisViewer } from "./LewisViewer";
import { PeriodicTable } from "./PeriodicTable";
import { QuizModal } from "./QuizModal";
import { SavedModal } from "./SavedModal";
import type { MoleculeRenderMode } from "./MoleculeViewer";
import {
  buildCustomVseprMolecule,
  curatedMolecules,
  MOLECULE_CATEGORIES,
  resolveMolecule,
  VSEPR_QUIZ_QUESTIONS,
} from "../lib/molecules";
import { elementByNumber } from "../lib/elements";
import { useProgress } from "../lib/progress";
import type { MoleculeAtom, MoleculeRecord } from "../lib/types";

const MoleculeViewer = dynamic(
  () => import("./MoleculeViewer").then((mod) => mod.MoleculeViewer),
  {
    ssr: false,
    loading: () => (
      <div className="viewer-shell viewer-loading">
        <Atom size={36} className="animate-spin" />
        <strong>Assembling 3D Molecular Lattice…</strong>
      </div>
    ),
  },
);

const BUILDER_CENTRAL_ELEMENTS = ["C", "N", "O", "S", "P", "B", "Be", "Xe", "Si", "Cl", "Br", "I"];
const BUILDER_LIGAND_ELEMENTS = ["H", "F", "Cl", "Br", "I", "O", "N", "C"];

export function MoleculeStudio() {
  const router = useRouter();
  const params = useSearchParams();
  const { progress, ready, visitMolecule, toggleFavoriteMolecule, recordQuiz, setAutoRotate } = useProgress();

  const [currentMolecule, setCurrentMolecule] = useState<MoleculeRecord>(() =>
    resolveMolecule(params.get("molecule")),
  );
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Viewer options
  const [renderMode, setRenderMode] = useState<MoleculeRenderMode>("ball-and-stick");
  const [showLonePairs, setShowLonePairs] = useState(true);
  const [showDipole, setShowDipole] = useState(true);
  const [measureMode, setMeasureMode] = useState(false);
  const [measuredAngle, setMeasuredAngle] = useState<{ angle: number | null; atoms: MoleculeAtom[] }>({
    angle: null,
    atoms: [],
  });

  const handleAngleMeasured = useCallback((angle: number | null, atoms: MoleculeAtom[]) => {
    setMeasuredAngle((prev) => {
      if (
        prev.angle === angle &&
        prev.atoms.length === atoms.length &&
        prev.atoms.every((a, i) => a.id === atoms[i]?.id)
      ) {
        return prev;
      }
      return { angle, atoms };
    });
  }, []);

  // Modals & Navigation
  const [builderOpen, setBuilderOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [mobileLibrary, setMobileLibrary] = useState(false);
  const libraryRef = useRef<HTMLElement>(null);
  const libraryTriggerRef = useRef<HTMLButtonElement>(null);

  // Custom Builder State
  const [builderCentral, setBuilderCentral] = useState("C");
  const [builderLigands, setBuilderLigands] = useState<{ symbol: string; bondOrder: 1 | 2 | 3 }[]>([
    { symbol: "H", bondOrder: 1 },
    { symbol: "H", bondOrder: 1 },
    { symbol: "H", bondOrder: 1 },
    { symbol: "H", bondOrder: 1 },
  ]);
  const [builderLonePairs, setBuilderLonePairs] = useState(0);

  // Synchronize URL params
  useEffect(() => {
    const requested = params.get("molecule");
    if (requested) {
      const resolved = resolveMolecule(requested);
      if (resolved.slug !== requested) {
        router.replace(`/molecules?molecule=${resolved.slug}`, { scroll: false });
      } else if (resolved.slug !== currentMolecule.slug) {
        queueMicrotask(() => {
          setCurrentMolecule(resolved);
        });
      }
    }
  }, [params, router, currentMolecule.slug]);

  // Track progress
  useEffect(() => {
    if (ready && currentMolecule) {
      visitMolecule(currentMolecule.slug);
    }
  }, [currentMolecule, ready, visitMolecule]);

  useEffect(() => {
    if (!mobileLibrary) return;
    const previous = document.activeElement as HTMLElement | null;
    const trigger = libraryTriggerRef.current;
    libraryRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileLibrary(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      (previous ?? trigger)?.focus();
    };
  }, [mobileLibrary]);

  const chooseMolecule = (mol: MoleculeRecord) => {
    setCurrentMolecule(mol);
    setMeasureMode(false);
    setMeasuredAngle({ angle: null, atoms: [] });
    setMobileLibrary(false);
    router.replace(`/molecules?molecule=${mol.slug}`, { scroll: false });
  };

  const filteredMolecules = useMemo(() => {
    return curatedMolecules.filter((m) => {
      const matchesCategory = activeCategory === "all" || m.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.formula.toLowerCase().includes(q) ||
        m.iupacName.toLowerCase().includes(q) ||
        m.vsepr.molecularGeometry.toLowerCase().includes(q) ||
        m.vsepr.axeNotation.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const isFavorite = (progress.favoriteMolecules ?? []).includes(currentMolecule.slug);

  // Custom Builder Apply
  const applyCustomMolecule = () => {
    const custom = buildCustomVseprMolecule(builderCentral, builderLigands, builderLonePairs);
    setCurrentMolecule(custom);
    setBuilderOpen(false);
  };

  const addBuilderLigand = (symbol = "H") => {
    if (builderLigands.length < 6) {
      setBuilderLigands([...builderLigands, { symbol, bondOrder: 1 }]);
    }
  };

  const removeBuilderLigand = (index: number) => {
    if (builderLigands.length > 1) {
      setBuilderLigands(builderLigands.filter((_, i) => i !== index));
    }
  };

  const updateBuilderBondOrder = (index: number, delta: number) => {
    setBuilderLigands(
      builderLigands.map((lig, i) => {
        if (i !== index) return lig;
        const nextOrder = Math.max(1, Math.min(3, lig.bondOrder + delta)) as 1 | 2 | 3;
        return { ...lig, bondOrder: nextOrder };
      }),
    );
  };

  return (
    <main className="app-shell molecule-workspace">
      <AppHeader
        ref={libraryTriggerRef}
        active="molecules"
        onTable={() => setTableOpen(true)}
        onSaved={() => setSavedOpen(true)}
        mobileContext={{
          label: "Molecules",
          detail: currentMolecule.name,
          action: () => setMobileLibrary(true),
          expanded: mobileLibrary,
          controls: "molecule-library-panel",
        }}
      />

      <div className="molecule-grid">
        {/* Left Sidebar: Molecule Library */}
        <aside
          id="molecule-library-panel"
          ref={libraryRef}
          className={`molecule-library ${mobileLibrary ? "mobile-open" : ""}`}
          role={mobileLibrary ? "dialog" : undefined}
          aria-modal={mobileLibrary ? "true" : undefined}
          aria-label="Molecule library"
        >
          <div className="library-header">
            <div className="library-title-row">
              <Layers size={18} />
              <h2>Molecules & VSEPR</h2>
            </div>
            <button
              type="button"
              className="builder-trigger-btn"
              onClick={() => setBuilderOpen(true)}
            >
              <Wrench size={14} />
              <span>Custom Builder</span>
            </button>
            <button
              type="button"
              className="molecule-library-close"
              onClick={() => setMobileLibrary(false)}
              aria-label="Close molecule library"
            >
              <X size={17} />
            </button>
          </div>

          {/* Search Box */}
          <div className="library-search">
            <Search size={14} />
            <input
              type="search"
              placeholder="Search formula, shape, name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search molecules"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="category-filter-chips" role="tablist">
            {MOLECULE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat.id}
                className={`filter-chip ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Molecule List */}
          <div className="molecule-list">
            {filteredMolecules.map((mol) => {
              const active = currentMolecule.slug === mol.slug;
              return (
                <button
                  key={mol.slug}
                  type="button"
                  className={`molecule-list-item ${active ? "active" : ""}`}
                  onClick={() => chooseMolecule(mol)}
                >
                  <div className="item-formula">{mol.formula}</div>
                  <div className="item-details">
                    <strong>{mol.name}</strong>
                    <div className="item-meta">
                      <span className="axe-tag">{mol.vsepr.axeNotation}</span>
                      <span className="geom-tag">{mol.vsepr.molecularGeometry}</span>
                    </div>
                  </div>
                  {active && <ArrowRight size={14} className="active-arrow" />}
                </button>
              );
            })}
            {filteredMolecules.length === 0 && (
              <div className="empty-search-state">
                <Search size={24} />
                <p>No molecules matched &ldquo;{searchQuery}&rdquo;</p>
                <button
                  type="button"
                  className="reset-search-btn"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Center: 3D Stage & Visualizer Controls */}
        <section className="molecule-center-stage">
          <div className="stage-topbar">
            <div className="molecule-title-block">
              <div className="title-row">
                <h1>{currentMolecule.name}</h1>
                <button
                  type="button"
                  className={`fav-btn ${isFavorite ? "favorited" : ""}`}
                  onClick={() => toggleFavoriteMolecule(currentMolecule.slug)}
                  title={isFavorite ? "Remove from saved" : "Save molecule"}
                  aria-label={isFavorite ? "Remove from saved" : "Save molecule"}
                >
                  <Bookmark size={17} />
                </button>
              </div>
              <p className="molecule-iupac">{currentMolecule.iupacName} &middot; {currentMolecule.categoryLabel}</p>
            </div>

            <div className="stage-actions">
              <button
                type="button"
                className="quiz-action-btn"
                onClick={() => setQuizOpen(true)}
              >
                <GraduationCap size={15} />
                <span>VSEPR Quiz</span>
              </button>
            </div>
          </div>

          {/* 3D Canvas Stage */}
          <div className="stage-canvas-container">
            <MoleculeViewer
              molecule={currentMolecule}
              renderMode={renderMode}
              showLonePairs={showLonePairs}
              showDipole={showDipole}
              measureMode={measureMode}
              autoRotate={progress.autoRotate}
              onAngleMeasured={handleAngleMeasured}
            />

            {/* Display Controls Toolbar */}
            <div className="viewer-toolbar">
              <div className="toolbar-group">
                <span className="toolbar-label">Model:</span>
                <button
                  type="button"
                  className={`toolbar-btn ${renderMode === "ball-and-stick" ? "active" : ""}`}
                  onClick={() => setRenderMode("ball-and-stick")}
                >
                  Ball & Stick
                </button>
                <button
                  type="button"
                  className={`toolbar-btn ${renderMode === "space-filling" ? "active" : ""}`}
                  onClick={() => setRenderMode("space-filling")}
                >
                  Space-Filling
                </button>
                <button
                  type="button"
                  className={`toolbar-btn ${renderMode === "wireframe" ? "active" : ""}`}
                  onClick={() => setRenderMode("wireframe")}
                >
                  Wireframe
                </button>
              </div>

              <div className="toolbar-separator" />

              <div className="toolbar-group">
                <button
                  type="button"
                  className={`toolbar-toggle-btn ${showLonePairs ? "active" : ""}`}
                  onClick={() => setShowLonePairs((v) => !v)}
                  title="Toggle Lone Pair Electron Clouds"
                >
                  <Eye size={14} />
                  <span>Lone Pairs</span>
                </button>

                <button
                  type="button"
                  className={`toolbar-toggle-btn ${showDipole ? "active" : ""}`}
                  onClick={() => setShowDipole((v) => !v)}
                  title="Toggle 3D Net Dipole Moment Vector"
                >
                  <Zap size={14} />
                  <span>Net Dipole</span>
                </button>

                <button
                  type="button"
                  className={`toolbar-toggle-btn ${measureMode ? "active" : ""}`}
                  onClick={() => {
                    setMeasureMode((v) => !v);
                    setMeasuredAngle({ angle: null, atoms: [] });
                  }}
                  title="Measure bond angles between 3 atoms"
                >
                  <Compass size={14} />
                  <span>Measure Angle</span>
                </button>

                <button
                  type="button"
                  className={`toolbar-toggle-btn ${progress.autoRotate ? "active" : ""}`}
                  onClick={() => setAutoRotate(!progress.autoRotate)}
                  title="Toggle auto-rotation"
                >
                  <Orbit size={14} />
                  <span>Auto-rotate</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Measured Angle Banner */}
          {measureMode && measuredAngle.angle !== null && (
            <div className="measured-angle-banner">
              <Compass size={16} />
              <span>
                Measured Angle &ang; {measuredAngle.atoms.map((a) => a.id).join("–")} ={" "}
                <strong>{measuredAngle.angle}&deg;</strong>
              </span>
            </div>
          )}
        </section>

        {/* Right Sidebar: Chemistry & VSEPR Inspector */}
        <aside className="molecule-inspector">
          {/* VSEPR & Geometry Specs Card */}
          <div className="inspector-card vsepr-specs">
            <div className="card-heading">
              <Compass size={16} />
              <h3>VSEPR & Geometry</h3>
              <span className="axe-badge">{currentMolecule.vsepr.axeNotation}</span>
            </div>

            <dl className="specs-list">
              <div className="spec-row">
                <dt>Steric Number</dt>
                <dd>{currentMolecule.vsepr.stericNumber} ({currentMolecule.vsepr.bondingPairs} bonds, {currentMolecule.vsepr.lonePairs} lone pairs)</dd>
              </div>
              <div className="spec-row">
                <dt>Electron Geometry</dt>
                <dd><strong>{currentMolecule.vsepr.electronGeometry}</strong></dd>
              </div>
              <div className="spec-row">
                <dt>Molecular Shape</dt>
                <dd className="highlight-dd"><strong>{currentMolecule.vsepr.molecularGeometry}</strong></dd>
              </div>
              <div className="spec-row">
                <dt>Bond Angles</dt>
                <dd>{currentMolecule.vsepr.predictedBondAngle} (Ideal: {currentMolecule.vsepr.idealBondAngle})</dd>
              </div>
              <div className="spec-row">
                <dt>Central Hybridization</dt>
                <dd><span className="hybrid-tag">{currentMolecule.vsepr.hybridization}</span></dd>
              </div>
              <div className="spec-row">
                <dt>Net Polarity</dt>
                <dd>
                  <span className={`polarity-pill ${currentMolecule.vsepr.polarity.toLowerCase()}`}>
                    {currentMolecule.vsepr.polarity}
                    {currentMolecule.vsepr.dipoleMomentDebye > 0 && ` (${currentMolecule.vsepr.dipoleMomentDebye} D)`}
                  </span>
                </dd>
              </div>
            </dl>

            <p className="vsepr-explanation">{currentMolecule.description}</p>
          </div>

          {/* 2D Lewis Structure Diagram */}
          <div className="inspector-card lewis-card">
            <LewisViewer molecule={currentMolecule} />
          </div>

          {/* Properties & Context */}
          <div className="inspector-card properties-card">
            <div className="card-heading">
              <Atom size={16} />
              <h3>Properties & Context</h3>
            </div>

            <dl className="specs-list">
              <div className="spec-row">
                <dt>Molar Mass</dt>
                <dd>{currentMolecule.molarMass} g/mol</dd>
              </div>
              <div className="spec-row">
                <dt>Standard State</dt>
                <dd className="capitalize">{currentMolecule.standardState}</dd>
              </div>
              {currentMolecule.meltingPoint && (
                <div className="spec-row">
                  <dt>Melting Point</dt>
                  <dd>{currentMolecule.meltingPoint} K ({(currentMolecule.meltingPoint - 273.15).toFixed(1)} &deg;C)</dd>
                </div>
              )}
              {currentMolecule.boilingPoint && (
                <div className="spec-row">
                  <dt>Boiling Point</dt>
                  <dd>{currentMolecule.boilingPoint} K ({(currentMolecule.boilingPoint - 273.15).toFixed(1)} &deg;C)</dd>
                </div>
              )}
            </dl>

            <div className="context-section">
              <h4>Applications</h4>
              <p>{currentMolecule.applications}</p>
            </div>

            <div className="context-section">
              <h4>Safety & Handling</h4>
              <p>{currentMolecule.safety}</p>
            </div>

            <div className="related-elements-row">
              <span className="related-label">Constituent Elements:</span>
              <div className="related-chips">
                {currentMolecule.relatedElements.map((z) => {
                  const elem = elementByNumber.get(z);
                  if (!elem) return null;
                  return (
                    <Link
                      key={z}
                      href={`/?element=${elem.slug}`}
                      className="related-chip"
                      title={`Inspect ${elem.name} in Element Explorer`}
                    >
                      <span className="chip-symbol">{elem.symbol}</span>
                      <span className="chip-name">{elem.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {mobileLibrary && <button className="drawer-backdrop" onClick={() => setMobileLibrary(false)} aria-label="Close molecule library" />}

      {/* Custom VSEPR Builder Modal */}
      {builderOpen && (
        <div className="modal-backdrop" onClick={() => setBuilderOpen(false)}>
          <div className="builder-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Wrench size={20} />
                <h2>Custom VSEPR Molecule Builder</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setBuilderOpen(false)}
                aria-label="Close builder"
              >
                <X size={18} />
              </button>
            </div>

            <div className="builder-body">
              <p className="builder-intro">
                Assemble custom compounds by selecting a central atom, attaching bonded ligands with single/double/triple bonds, and adding non-bonding lone pairs. The 3D geometry dynamically calculates via VSEPR theory.
              </p>

              {/* Central Atom Selection */}
              <div className="builder-section">
                <label className="section-label">1. Central Atom</label>
                <div className="element-picker-grid">
                  {BUILDER_CENTRAL_ELEMENTS.map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      className={`elem-select-btn ${builderCentral === sym ? "selected" : ""}`}
                      onClick={() => setBuilderCentral(sym)}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ligands Configuration */}
              <div className="builder-section">
                <div className="section-header-row">
                  <label className="section-label">2. Bonded Atoms ({builderLigands.length})</label>
                  {builderLigands.length < 6 && (
                    <button
                      type="button"
                      className="add-ligand-btn"
                      onClick={() => addBuilderLigand("H")}
                    >
                      <Plus size={13} />
                      <span>Add Ligand</span>
                    </button>
                  )}
                </div>

                <div className="ligand-rows">
                  {builderLigands.map((lig, idx) => (
                    <div key={idx} className="ligand-row">
                      <span className="ligand-index">#{idx + 1}</span>
                      <select
                        value={lig.symbol}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBuilderLigands(
                            builderLigands.map((l, i) => (i === idx ? { ...l, symbol: val } : l)),
                          );
                        }}
                        className="ligand-elem-select"
                        aria-label={`Ligand ${idx + 1} Element`}
                      >
                        {BUILDER_LIGAND_ELEMENTS.map((sym) => (
                          <option key={sym} value={sym}>
                            {sym}
                          </option>
                        ))}
                      </select>

                      <div className="bond-order-controls">
                        <span className="order-label">Bond:</span>
                        <div className="order-stepper">
                          <button
                            type="button"
                            onClick={() => updateBuilderBondOrder(idx, -1)}
                            disabled={lig.bondOrder <= 1}
                            aria-label="Decrease bond order"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="order-val">
                            {lig.bondOrder === 1 ? "Single (1)" : lig.bondOrder === 2 ? "Double (2)" : "Triple (3)"}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateBuilderBondOrder(idx, 1)}
                            disabled={lig.bondOrder >= 3}
                            aria-label="Increase bond order"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>

                      {builderLigands.length > 1 && (
                        <button
                          type="button"
                          className="remove-ligand-btn"
                          onClick={() => removeBuilderLigand(idx)}
                          aria-label={`Remove ligand ${idx + 1}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Lone Pairs Stepper */}
              <div className="builder-section">
                <label className="section-label">3. Central Lone Pairs</label>
                <div className="lone-pairs-stepper">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setBuilderLonePairs((v) => Math.max(0, v - 1))}
                    disabled={builderLonePairs <= 0}
                    aria-label="Decrease lone pairs"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="stepper-val">{builderLonePairs} pair{builderLonePairs !== 1 ? "s" : ""}</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setBuilderLonePairs((v) => Math.min(3, v + 1))}
                    disabled={builderLonePairs >= 3}
                    aria-label="Increase lone pairs"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setBuilderOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={applyCustomMolecule}
              >
                <span>Render in 3D Stage</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VSEPR Quiz Modal */}
      {quizOpen && (
        <QuizModal
          title="VSEPR & Molecular Geometry Quiz"
          questions={VSEPR_QUIZ_QUESTIONS}
          onClose={() => setQuizOpen(false)}
          onComplete={(score) => recordQuiz("vsepr-geometry", score)}
        />
      )}

      {/* Periodic Table Modal */}
      {tableOpen && (
        <PeriodicTable
          selected={currentMolecule.relatedElements[0] ?? 6}
          onClose={() => setTableOpen(false)}
          onSelect={(elem) => {
            setTableOpen(false);
            router.push(`/?element=${elem.slug}`);
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
            router.push(`/?element=${elem.slug}`);
          }}
        />
      )}
    </main>
  );
}
