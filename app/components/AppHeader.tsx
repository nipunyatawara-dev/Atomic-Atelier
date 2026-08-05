"use client";

import Link from "next/link";
import { Atom, Bookmark, FlaskConical, Grid3X3 } from "lucide-react";

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
  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand"><strong>Chemistry Atelier</strong><em>See matter differently</em></Link>
        <nav className="main-nav" aria-label="Primary navigation">
          <Link className={props.active === "explore" ? "active" : ""} href="/"><Atom size={17} /> Explore</Link>
          <button onClick={props.onTable}><Grid3X3 size={17} /> Periodic table</button>
          <Link className={props.active === "reactions" ? "active" : ""} href="/reactions"><FlaskConical size={17} /> Reactions</Link>
          <button onClick={props.onSaved}><Bookmark size={17} /> Saved</button>
        </nav>
      </header>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <Link className={props.active === "explore" ? "active" : ""} href="/"><Atom /><span>Explore</span></Link>
        {actionItems(props).slice(0, 1).map(({ label, icon: Icon, action }) => <button key={label} onClick={action}><Icon /><span>Table</span></button>)}
        <Link className={props.active === "reactions" ? "active" : ""} href="/reactions"><FlaskConical /><span>React</span></Link>
        {actionItems(props).slice(1).map(({ label, icon: Icon, action }) => <button key={label} onClick={action}><Icon /><span>{label}</span></button>)}
      </nav>
    </>
  );
}
