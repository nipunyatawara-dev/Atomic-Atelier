"use client";

import Link from "next/link";
import { forwardRef, useEffect, useState } from "react";
import {
  Atom,
  Bookmark,
  Calculator,
  ChevronDown,
  FlaskConical,
  Grid3X3,
  Layers,
  Menu,
  Search,
  TrendingUp,
} from "lucide-react";

import { Dialog } from "./Dialog";
import { CommandPalette } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  active: "explore" | "reactions" | "molecules" | "trends";
  onTable: () => void;
  onSaved: () => void;
  onMolarMass?: () => void;
  mobileContext?: {
    label: string;
    detail: string;
    action: () => void;
    expanded?: boolean;
    controls?: string;
  };
};

export const AppHeader = forwardRef<HTMLButtonElement, Props>(function AppHeader(props, mobileContextRef) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Atomic Atelier: See matter differently">
          <span className="brand-mark" aria-hidden="true"><Atom /></span>
          <span className="brand-copy"><strong>Atomic Atelier</strong><em>See matter differently</em></span>
        </Link>

        <nav className="main-nav" aria-label="Primary navigation">
          <Link className={`nav-link ${props.active === "explore" ? "active" : ""}`} href="/" aria-current={props.active === "explore" ? "page" : undefined}>
            <Atom aria-hidden="true" />
            <span>Elements</span>
          </Link>

          <Link className={`nav-link ${props.active === "molecules" ? "active" : ""}`} href="/molecules" aria-current={props.active === "molecules" ? "page" : undefined}>
            <Layers aria-hidden="true" />
            <span>Molecules</span>
          </Link>

          <Link className={`nav-link ${props.active === "trends" ? "active" : ""}`} href="/trends" aria-current={props.active === "trends" ? "page" : undefined}>
            <TrendingUp aria-hidden="true" />
            <span>Trends</span>
          </Link>

          <Link className={`nav-link ${props.active === "reactions" ? "active" : ""}`} href="/reactions" aria-current={props.active === "reactions" ? "page" : undefined}>
            <FlaskConical aria-hidden="true" />
            <span>Reactions</span>
          </Link>
        </nav>

        {props.mobileContext && (
          <button
            ref={mobileContextRef}
            className="mobile-context-action"
            type="button"
            onClick={props.mobileContext.action}
            aria-label={props.mobileContext.label}
            aria-expanded={props.mobileContext.expanded}
            aria-controls={props.mobileContext.controls}
          >
            <Menu aria-hidden="true" />
            <span><strong>{props.mobileContext.label}</strong><small>{props.mobileContext.detail}</small></span>
            <ChevronDown className="mobile-context-chevron" size={14} aria-hidden="true" />
          </button>
        )}

        <div className="header-actions" aria-label="Quick actions">
          <button
            type="button"
            className="header-action cmd-trigger"
            onClick={() => setCmdOpen(true)}
            aria-label="Quick search command palette"
            title="Search elements, molecules, reactions (⌘K)"
          >
            <Search aria-hidden="true" size={15} />
            <span>Search</span>
            <kbd className="header-kbd">⌘K</kbd>
          </button>
          <ThemeToggle className="header-action theme-action" />
          {props.onMolarMass && (
            <button type="button" className="header-action" onClick={props.onMolarMass} aria-label="Molar mass calculator" title="Molar Mass Calculator">
              <Calculator aria-hidden="true" size={16} />
              <span>Mass</span>
            </button>
          )}
          <button type="button" className="header-action" onClick={props.onTable} aria-label="Periodic table">
            <Grid3X3 aria-hidden="true" />
            <span>Table</span>
          </button>
          <button type="button" className="header-action" onClick={props.onSaved} aria-label="Saved">
            <Bookmark aria-hidden="true" />
            <span>Saved</span>
          </button>
        </div>

        <div className="mobile-utilities" aria-label="Quick actions">
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            aria-label="Quick search command palette"
            title="Quick Search"
          >
            <Search aria-hidden="true" size={16} />
          </button>
          <button type="button" className="mobile-tools-trigger" onClick={() => setToolsOpen(true)} aria-haspopup="dialog">Tools</button>
        </div>
      </header>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <Link className={props.active === "explore" ? "active" : ""} href="/" aria-current={props.active === "explore" ? "page" : undefined}><Atom /><span>Elements</span></Link>
        <Link className={props.active === "molecules" ? "active" : ""} href="/molecules" aria-current={props.active === "molecules" ? "page" : undefined}><Layers /><span>Molecules</span></Link>
        <Link className={props.active === "trends" ? "active" : ""} href="/trends" aria-current={props.active === "trends" ? "page" : undefined}><TrendingUp /><span>Trends</span></Link>
        <Link className={props.active === "reactions" ? "active" : ""} href="/reactions" aria-current={props.active === "reactions" ? "page" : undefined}><FlaskConical /><span>Reactions</span></Link>
      </nav>

      {toolsOpen && <Dialog title="Tools" onClose={() => setToolsOpen(false)} className="tools-dialog">
        <div className="app-tools-grid">
          <ThemeToggle showLabel />
          {props.onMolarMass && <button type="button" onClick={() => { setToolsOpen(false); props.onMolarMass?.(); }}><Calculator size={18} />Molar mass</button>}
          <button type="button" onClick={() => { setToolsOpen(false); props.onTable(); }}><Grid3X3 size={18} />Periodic table</button>
          <button type="button" onClick={() => { setToolsOpen(false); props.onSaved(); }}><Bookmark size={18} />Saved & progress</button>
          <Link href="/?element=carbon&lesson=carbon" onClick={() => setToolsOpen(false)}><Atom size={18} />Guided lesson</Link>
        </div>
      </Dialog>}

      {cmdOpen && (
        <CommandPalette
          onClose={() => setCmdOpen(false)}
          onTable={props.onTable}
          onSaved={props.onSaved}
          onMolarMass={props.onMolarMass}
        />
      )}
    </>
  );
});
