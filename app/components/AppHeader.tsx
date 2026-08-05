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

type MenuName = "explore" | "reactions";

const actionItems = (props: Props) => [
  { label: "Periodic table", icon: Grid3X3, action: props.onTable },
  { label: "Saved", icon: Bookmark, action: props.onSaved },
];

export function AppHeader(props: Props) {
  const [openMenu, setOpenMenu] = useState<MenuName | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const exploreTriggerRef = useRef<HTMLButtonElement>(null);
  const reactionsTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!openMenu) return;

    const closeFromOutside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };

    const closeFromEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const trigger = openMenu === "explore" ? exploreTriggerRef.current : reactionsTriggerRef.current;
      setOpenMenu(null);
      requestAnimationFrame(() => trigger?.focus());
    };

    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [openMenu]);

  const toggleMenu = (menu: MenuName) => {
    setOpenMenu((current) => (current === menu ? null : menu));
  };

  const runAction = (action: () => void) => {
    setOpenMenu(null);
    action();
  };

  const closeWhenFocusLeaves = (event: React.FocusEvent<HTMLElement>) => {
    if (!navRef.current?.contains(event.relatedTarget as Node | null)) setOpenMenu(null);
  };

  return (
    <>
      <header ref={headerRef} className="topbar">
        <Link href="/" className="brand" aria-label="Atomic Atelier home" onClick={() => setOpenMenu(null)}>
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
              aria-expanded={openMenu === "explore"}
              aria-controls="explore-menu"
              onClick={() => toggleMenu("explore")}
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
              aria-hidden={openMenu !== "explore"}
              data-open={openMenu === "explore"}
            >
              <div className="nav-popover-heading">
                <span>Discover matter</span>
                <small>Choose a way in</small>
              </div>
              <div className="nav-popover-items">
                <Link className={props.active === "explore" ? "current" : ""} href="/" onClick={() => setOpenMenu(null)}>
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

          <div className="nav-menu">
            <button
              ref={reactionsTriggerRef}
              id="reactions-menu-trigger"
              className={`nav-trigger ${props.active === "reactions" ? "active" : ""}`}
              type="button"
              aria-expanded={openMenu === "reactions"}
              aria-controls="reactions-menu"
              onClick={() => toggleMenu("reactions")}
            >
              <FlaskConical aria-hidden="true" />
              <span>Reactions</span>
              <ChevronDown className="nav-chevron" aria-hidden="true" />
            </button>
            <div
              id="reactions-menu"
              className="nav-popover"
              role="group"
              aria-label="Reactions menu"
              aria-hidden={openMenu !== "reactions"}
              data-open={openMenu === "reactions"}
            >
              <div className="nav-popover-heading">
                <span>Practice & progress</span>
                <small>Turn concepts into intuition</small>
              </div>
              <div className="nav-popover-items">
                <Link className={props.active === "reactions" ? "current" : ""} href="/reactions" onClick={() => setOpenMenu(null)}>
                  <span className="nav-item-icon"><FlaskConical /></span>
                  <span><strong>Reaction lab</strong><small>Balance equations and animate atoms</small></span>
                  <ArrowUpRight className="nav-item-arrow" />
                </Link>
                <button type="button" onClick={() => runAction(props.onSaved)}>
                  <span className="nav-item-icon"><Bookmark /></span>
                  <span><strong>Saved collection</strong><small>Return to the elements you kept</small></span>
                  <ArrowUpRight className="nav-item-arrow" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="header-actions" aria-label="Quick actions">
          <button type="button" className="header-action" onClick={props.onTable} aria-label="Periodic table">
            <Grid3X3 aria-hidden="true" />
            <span>Table</span>
          </button>
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
