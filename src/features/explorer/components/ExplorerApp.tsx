"use client";

import dynamic from "next/dynamic";
import gsap from "gsap";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Atom,
  Bookmark,
  Grid3X3,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AppHeader } from "@/components/common/AppHeader";
import { AtomicInfoPanel, AtomicLearningCards } from "./AtomicContent";
import { ComparisonPanel } from "./ComparisonPanel";
import { FirstVisitTour } from "./FirstVisitTour";
import { PeriodicTable } from "./PeriodicTable";
import { QuizModal } from "./QuizModal";
import { SavedModal } from "./SavedModal";
import { AufbauModal } from "./AufbauModal";
import { StudyCardModal } from "./StudyCardModal";
import { MolarMassModal } from "@/features/reactions/components/MolarMassModal";
import { CARBON, categories, categoryLabels, createElementQuiz, elementByNumber, elements, resolveElement } from "@/features/explorer/lib/elements";
import { reactions } from "@/features/reactions/lib/reactions";
import { curatedMolecules } from "@/features/molecules/lib/molecules";
import { useProgress } from "@/hooks/useProgress";
import { useSheetGesture } from "@/hooks/useSheetGesture";
import type { ElementCategory, ElementRecord } from "@/types";

const AtomViewer = dynamic(() => import("./AtomViewer").then((module) => module.AtomViewer), {
  ssr: false,
  loading: () => <section className="viewer-shell viewer-loading"><Atom size={38} /><strong>Arranging the atom…</strong></section>,
});

type ElementFilter = { category: ElementCategory | "all"; block: string; period: string; state: string };

export function ExplorerApp() {
  const router = useRouter();
  const params = useSearchParams();
  const { progress, ready, visitElement, toggleFavorite, recordQuiz, setAutoRotate } = useProgress();
  const [element, setElement] = useState<ElementRecord>(() => resolveElement(params.get("element")));
  const [compareElement, setCompareElement] = useState<ElementRecord>(() => resolveElement(params.get("compare") || "oxygen"));
  const [compareOpen, setCompareOpen] = useState(Boolean(params.get("compare")));
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ElementFilter>({ category: "all", block: "all", period: "all", state: "all" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [mobileLibrary, setMobileLibrary] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [aufbauOpen, setAufbauOpen] = useState(false);
  const [studyCardOpen, setStudyCardOpen] = useState(false);
  const [molarMassOpen, setMolarMassOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const appRef = useRef<HTMLElement>(null);
  const libraryRef = useSheetGesture<HTMLElement>({ isOpen: mobileLibrary, onClose: () => setMobileLibrary(false) });
  const libraryTriggerRef = useRef<HTMLButtonElement>(null);
  const introPlayedRef = useRef(false);
  const introTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const transitionTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const transitionFrameRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const root = appRef.current;
    if (!root || introPlayedRef.current) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try { seen = window.sessionStorage.getItem("atomic-atelier:intro-seen") === "true"; } catch { /* Storage can be blocked. */ }
    if (reducedMotion || seen) { introPlayedRef.current = true; return; }

    introPlayedRef.current = true;
    let completed = false;
    const context = gsap.context(() => {
      const firstElements = [...root.querySelectorAll<HTMLElement>(".element-list > button")].slice(0, 9);
      const introTargets = [...root.querySelectorAll<HTMLElement>(".topbar, .element-library, .viewer-shell, .info-panel, .element-list > button, .learning-cards > article")];
      const timeline = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          gsap.set(introTargets, { clearProps: "opacity,visibility,transform" });
          introTimelineRef.current = null;
          completed = true;
          try { window.sessionStorage.setItem("atomic-atelier:intro-seen", "true"); } catch { /* Storage can be blocked. */ }
        },
      });
      introTimelineRef.current = timeline;
      timeline
        .from(".topbar", { autoAlpha: 0, y: -14, duration: .48 }, 0)
        .from(".viewer-shell", { autoAlpha: 0, scale: .84, z: -150, rotationX: 2.5, duration: .82 }, .1)
        .from(".info-panel", { autoAlpha: 0, x: 30, duration: .64 }, .2)
        .from(".learning-cards > article", { autoAlpha: 0, y: 22, stagger: .045, duration: .5 }, .42);
      if (window.innerWidth > 760) {
        timeline
          .from(".element-library", { autoAlpha: 0, x: -28, rotationY: 4, duration: .62 }, .06)
          .from(firstElements, { autoAlpha: 0, scale: .72, z: -120, rotationX: 10, stagger: .045, duration: .5 }, .24);
      }
    }, root);
    return () => {
      introTimelineRef.current = null;
      context.revert();
      if (!completed) introPlayedRef.current = false;
    };
  }, []);

  useEffect(() => () => {
    transitionTimelineRef.current?.kill();
    if (transitionFrameRef.current !== null) cancelAnimationFrame(transitionFrameRef.current);
  }, []);

  useEffect(() => {
    const requested = params.get("element");
    const requestedCompare = params.get("compare");
    if (requested !== null) {
      const resolved = resolveElement(requested);
      if (resolved.atomicNumber !== element.atomicNumber) {
        setElement(resolved);
      }
    }
    if (requestedCompare !== null) {
      const resolvedCompare = resolveElement(requestedCompare);
      setCompareElement(resolvedCompare);
      setCompareOpen(true);
    }
    const elementInvalid = requested !== null && resolveElement(requested).slug !== requested.trim().toLowerCase();
    const compareInvalid = requestedCompare !== null && resolveElement(requestedCompare).slug !== requestedCompare.trim().toLowerCase();
    if (!elementInvalid && !compareInvalid) return;
    const canonical = new URLSearchParams();
    canonical.set("element", resolveElement(requested).slug);
    if (requestedCompare !== null) canonical.set("compare", resolveElement(requestedCompare).slug);
    router.replace(`/?${canonical.toString()}`, { scroll: false });
  }, [params, router, element.atomicNumber]);

  useEffect(() => {
    if (!ready || params.has("element") || progress.lastElement === 6) return;
    const restored = elementByNumber.get(progress.lastElement);
    if (restored) queueMicrotask(() => setElement(restored));
  }, [ready, progress.lastElement, params]);

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
  }, [mobileLibrary, libraryRef]);

  const filteredElements = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return elements.filter((item) => {
      const searchMatch = !normalized || `${item.name} ${item.symbol} ${item.atomicNumber}`.toLowerCase().includes(normalized);
      const categoryMatch = filters.category === "all" || item.category === filters.category;
      const blockMatch = filters.block === "all" || item.block === filters.block;
      const periodMatch = filters.period === "all" || item.period === Number(filters.period);
      const stateMatch = filters.state === "all" || item.standardState?.toLowerCase().includes(filters.state);
      return searchMatch && categoryMatch && blockMatch && periodMatch && stateMatch;
    });
  }, [query, filters]);

  const selectElement = (next: ElementRecord) => {
    setMobileLibrary(false);
    if (next.atomicNumber === element.atomicNumber) return;
    introTimelineRef.current?.progress(1).kill();
    introTimelineRef.current = null;
    const commitSelection = () => {
      setElement(next);
      visitElement(next.atomicNumber);
      const search = new URLSearchParams();
      search.set("element", next.slug);
      if (compareOpen) search.set("compare", compareElement.slug);
      router.replace(`/?${search.toString()}`, { scroll: false });
    };
    const root = appRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const viewer = root?.querySelector<HTMLElement>(".viewer-shell");
    const info = root?.querySelector<HTMLElement>(".info-panel");
    const cards = root ? [...root.querySelectorAll<HTMLElement>(".learning-cards > article")] : [];
    if (reducedMotion || !viewer || !info) { commitSelection(); return; }

    transitionTimelineRef.current?.kill();
    if (transitionFrameRef.current !== null) cancelAnimationFrame(transitionFrameRef.current);
    gsap.killTweensOf([viewer, info, ...cards]);
    setTransitioning(true);
    transitionTimelineRef.current = gsap.timeline({
      onComplete: () => {
        commitSelection();
        transitionFrameRef.current = requestAnimationFrame(() => {
          const activeTile = root?.querySelector<HTMLElement>(`.element-list > button[data-element-number="${next.atomicNumber}"]`);
          const incoming = gsap.timeline({ onComplete: () => setTransitioning(false) });
          transitionTimelineRef.current = incoming;
          incoming
            .fromTo(viewer, { autoAlpha: 0, scale: .9, z: -80, rotationY: -2 }, { autoAlpha: 1, scale: 1, z: 0, rotationY: 0, duration: .52, ease: "power3.out", clearProps: "opacity,visibility,transform" }, 0)
            .fromTo(info, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: .46, ease: "power3.out", clearProps: "opacity,visibility,transform" }, .04)
            .fromTo(cards, { autoAlpha: .25, y: 10 }, { autoAlpha: 1, y: 0, stagger: .025, duration: .36, ease: "power2.out", clearProps: "opacity,visibility,transform" }, .1);
          if (activeTile) incoming.fromTo(activeTile, { scale: .94, x: -5 }, { scale: 1, x: 0, duration: .38, ease: "back.out(2)", clearProps: "transform" }, .08);
        });
      },
    })
      .to(viewer, { autoAlpha: 0, scale: 1.035, z: 45, duration: .18, ease: "power2.in" }, 0)
      .to(info, { autoAlpha: 0, x: 16, duration: .16, ease: "power2.in" }, 0)
      .to(cards, { autoAlpha: .25, y: 5, duration: .14, stagger: .008, ease: "power2.in" }, 0);
  };

  const changeCompare = (next: ElementRecord) => {
    setCompareElement(next);
    setCompareOpen(true);
    router.replace(`/?element=${element.slug}&compare=${next.slug}`, { scroll: false });
  };

  const closeCompare = () => {
    setCompareOpen(false);
    router.replace(`/?element=${element.slug}`, { scroll: false });
  };

  const relatedReaction = reactions.find((reaction) => reaction.relatedElements.includes(element.atomicNumber));
  const relatedMolecule = curatedMolecules.find((mol) => mol.relatedElements.includes(element.atomicNumber));
  const neighbor = elementByNumber.get(element.atomicNumber === 118 ? 117 : element.atomicNumber + 1) ?? CARBON;
  const filtersActive = Object.values(filters).some((value) => value !== "all");

  return (
    <main ref={appRef} className={`app-shell ${transitioning ? "element-transitioning" : ""}`} aria-busy={transitioning}>
      <AppHeader
        ref={libraryTriggerRef}
        active="explore"
        onTable={() => setTableOpen(true)}
        onSaved={() => setSavedOpen(true)}
        onMolarMass={() => setMolarMassOpen(true)}
        mobileContext={{
          label: "Elements",
          detail: `${element.symbol} · ${element.name}`,
          action: () => setMobileLibrary(true),
          expanded: mobileLibrary,
          controls: "element-library",
        }}
      />

      <div className="workspace">
        <aside id="element-library" ref={libraryRef} className={`element-library panel ${mobileLibrary ? "open" : ""}`} role={mobileLibrary ? "dialog" : undefined} aria-modal={mobileLibrary ? "true" : undefined} aria-label="Element library">
          <div className="panel-heading"><span>Element library</span><button className="mobile-close" onClick={() => setMobileLibrary(false)} aria-label="Close element library"><X size={17} /></button><button className={filtersActive ? "active" : ""} onClick={() => setFilterOpen((value) => !value)} aria-label="Filter elements"><SlidersHorizontal size={17} /></button></div>
          <search className="library-search-wrapper"><label className="library-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, symbol, number…" aria-label="Search elements by name, symbol, or atomic number" name="element-search" /></label></search>
          {filterOpen && <div className="filter-panel">
            <select aria-label="Element category" value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value as ElementFilter["category"] }))}><option value="all">All categories</option>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <select aria-label="Electron block" value={filters.block} onChange={(event) => setFilters((current) => ({ ...current, block: event.target.value }))}><option value="all">All blocks</option>{["s", "p", "d", "f"].map((block) => <option value={block} key={block}>{block}-block</option>)}</select>
            <select aria-label="Period" value={filters.period} onChange={(event) => setFilters((current) => ({ ...current, period: event.target.value }))}><option value="all">All periods</option>{[1,2,3,4,5,6,7].map((period) => <option value={period} key={period}>Period {period}</option>)}</select>
            <select aria-label="Standard state" value={filters.state} onChange={(event) => setFilters((current) => ({ ...current, state: event.target.value }))}><option value="all">All states</option><option value="solid">Solid</option><option value="liquid">Liquid</option><option value="gas">Gas</option></select>
            <button onClick={() => setFilters({ category: "all", block: "all", period: "all", state: "all" })}>Clear filters</button>
          </div>}
          <div className="element-count"><span>{filteredElements.length} elements</span><i>{query || filtersActive ? "filtered" : "complete table"}</i></div>
          <div className="element-list">
            {filteredElements.map((item) => <button key={item.atomicNumber} data-element-number={item.atomicNumber} data-category={item.category} className={item.atomicNumber === element.atomicNumber ? "active" : ""} onClick={() => selectElement(item)} disabled={transitioning}>
              <span className="mini-tile"><small>{item.atomicNumber}</small><b>{item.symbol}</b></span><span><strong>{item.name}</strong><small>{categoryLabels[item.category]} · {item.standardState ?? "Unknown state"}</small></span>{progress.favorites.includes(item.atomicNumber) && <Bookmark className="favorite" size={13} fill="currentColor" />}
            </button>)}
            {!filteredElements.length && <div className="no-results"><Search /><strong>No elements found</strong><button onClick={() => { setQuery(""); setFilters({ category: "all", block: "all", period: "all", state: "all" }); }}>Reset search</button></div>}
          </div>
          <button className="view-table" onClick={() => setTableOpen(true)}><Grid3X3 size={15} /> View periodic table <ArrowRight size={14} /></button>
        </aside>

        <AtomViewer element={element} autoRotate={progress.autoRotate} onAutoRotate={setAutoRotate} compareActive={compareOpen} onCompare={() => compareOpen ? closeCompare() : changeCompare(neighbor)} />

        <AtomicInfoPanel
          element={element}
          neighbor={neighbor}
          isFavorite={progress.favorites.includes(element.atomicNumber)}
          onToggleFavorite={toggleFavorite}
          onQuiz={() => setQuizOpen(true)}
          onCompare={changeCompare}
          onAufbau={() => setAufbauOpen(true)}
          onStudyCard={() => setStudyCardOpen(true)}
          onMolarMass={() => setMolarMassOpen(true)}
          relatedMolecule={relatedMolecule}
          relatedReaction={relatedReaction}
        />
      </div>

      {compareOpen && <ComparisonPanel primary={element} secondary={compareElement} onSelect={changeCompare} onClose={closeCompare} />}

      <AtomicLearningCards
        element={element}
        neighbor={neighbor}
        onQuiz={() => setQuizOpen(true)}
        onCompare={changeCompare}
        onSaved={() => setSavedOpen(true)}
        onTable={() => setTableOpen(true)}
        onAufbau={() => setAufbauOpen(true)}
        onStudyCard={() => setStudyCardOpen(true)}
        relatedMolecule={relatedMolecule}
      />

      {mobileLibrary && <button className="drawer-backdrop" onClick={() => setMobileLibrary(false)} aria-label="Close element library" />}
      {tableOpen && <PeriodicTable selected={element.atomicNumber} onSelect={selectElement} onClose={() => setTableOpen(false)} />}
      {quizOpen && <QuizModal title={`${element.name} quick quiz`} questions={createElementQuiz(element)} onClose={() => setQuizOpen(false)} onComplete={(score) => recordQuiz(`element:${element.atomicNumber}`, score)} />}
      {savedOpen && <SavedModal progress={progress} onClose={() => setSavedOpen(false)} onElement={selectElement} />}
      {aufbauOpen && (
        <AufbauModal
          element={element}
          onClose={() => setAufbauOpen(false)}
          onSelectElement={(num) => {
            const el = elementByNumber.get(num);
            if (el) selectElement(el);
          }}
        />
      )}
      {studyCardOpen && (
        <StudyCardModal element={element} onClose={() => setStudyCardOpen(false)} />
      )}
      {molarMassOpen && (
        <MolarMassModal
          initialFormula={element.symbol}
          onClose={() => setMolarMassOpen(false)}
          onSelectElement={(num) => {
            const el = elementByNumber.get(num);
            if (el) selectElement(el);
          }}
        />
      )}
      <FirstVisitTour />
    </main>
  );
}
