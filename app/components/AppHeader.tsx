"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Atom,
  Bookmark,
  ChevronDown,
  FlaskConical,
  Grid3X3,
} from "lucide-react";

type Props = {
  active: "explore" | "reactions";
  onTable: () => void;
  onSaved: () => void;
};

const actionItems = (props: Props) => [
  { label: "Periodic table", icon: Grid3X3, action: props.onTable },
  { label: "Saved", icon: Bookmark, action: props.onSaved },
];

export function AppHeader(props: Props) {
  const [exploreOpen, setExploreOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const exploreTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!exploreOpen) return;

    const closeFromOutside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setExploreOpen(false);
    };

    const closeFromEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setExploreOpen(false);
      requestAnimationFrame(() => exploreTriggerRef.current?.focus());
    };

    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [exploreOpen]);

  const toggleMenu = () => setExploreOpen((current) => !current);

  const runAction = (action: () => void) => {
    setExploreOpen(false);
    action();
  };

  const closeWhenFocusLeaves = (event: React.FocusEvent<HTMLElement>) => {
    if (!navRef.current?.contains(event.relatedTarget as Node | null)) setExploreOpen(false);
  };

  return (
    <>
      <header ref={headerRef} className="topbar">
        <Link href="/" className="brand" aria-label="Atomic Atelier home" onClick={() => setExploreOpen(false)}>
          <span className="brand-mark" aria-hidden="true"><Atom /></span>
          <span className="brand-copy"><strong>Atomic Atelier</strong><em>See matter differently</em></span>
        </Link>

        <nav ref={navRef} className="main-nav" aria-label="Primary navigation" onBlur={closeWhenFocusLeaves}>
          <div className="nav-menu">
            <button
              ref={exploreTriggerRef}
              id="explore-menu-trigger"
              className={`nav-trigger ${props.active === "explore" ? "active" : ""}`}
              type="button"
              aria-expanded={exploreOpen}
              aria-controls="explore-menu"
              onClick={toggleMenu}
            >
              <Atom aria-hidden="true" />
              <span>Explore</span>
              <ChevronDown className="nav-chevron" aria-hidden="true" />
            </button>
            <div
              id="explore-menu"
              className="nav-popover"
              role="group"
              aria-label="Explore menu"
              aria-hidden={!exploreOpen}
              data-open={exploreOpen}
            >
              <div className="nav-popover-heading">
                <span>Discover matter</span>
                <small>Choose a way in</small>
              </div>
              <div className="nav-popover-items">
                <Link className={props.active === "explore" ? "current" : ""} href="/" onClick={() => setExploreOpen(false)}>
                  <span className="nav-item-icon"><Atom /></span>
                  <span><strong>Element explorer</strong><small>Inspect all 118 elements in 3D</small></span>
                  <ArrowUpRight className="nav-item-arrow" />
                </Link>
                <button type="button" onClick={() => runAction(props.onTable)}>
                  <span className="nav-item-icon"><Grid3X3 /></span>
                  <span><strong>Periodic table</strong><small>See families and patterns at a glance</small></span>
                  <ArrowUpRight className="nav-item-arrow" />
                </button>
              </div>
            </div>
          </div>

          <Link className={`nav-link ${props.active === "reactions" ? "active" : ""}`} href="/reactions" onClick={() => setExploreOpen(false)}>
            <FlaskConical aria-hidden="true" />
            <span>Reactions</span>
          </Link>
        </nav>

        <div className="header-actions" aria-label="Quick actions">
          <button type="button" className="header-action" onClick={props.onSaved} aria-label="Saved">
            <Bookmark aria-hidden="true" />
            <span>Saved</span>
          </button>
        </div>
      </header>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <Link className={props.active === "explore" ? "active" : ""} href="/"><Atom /><span>Explore</span></Link>
        {actionItems(props).slice(0, 1).map(({ label, icon: Icon, action }) => <button key={label} type="button" onClick={action}><Icon /><span>Table</span></button>)}
        <Link className={props.active === "reactions" ? "active" : ""} href="/reactions"><FlaskConical /><span>React</span></Link>
        {actionItems(props).slice(1).map(({ label, icon: Icon, action }) => <button key={label} type="button" onClick={action}><Icon /><span>{label}</span></button>)}
      </nav>
    </>
  );
}
