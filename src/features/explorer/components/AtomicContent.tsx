"use client";

import Link from "next/link";
import {
  ArrowRight,
  Atom,
  Beaker,
  Bookmark,
  Boxes,
  FlaskConical,
  History,
  Layers,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { categoryLabels, formatValue } from "@/features/explorer/lib/elements";
import { formatElectronConfig } from "@/features/reactions/lib/formula";
import type { ElementRecord, MoleculeRecord, ReactionRecord } from "@/types";

export interface AtomicInfoPanelProps {
  element: ElementRecord;
  neighbor: ElementRecord;
  isFavorite: boolean;
  onToggleFavorite: (atomicNumber: number) => void;
  onQuiz: () => void;
  onCompare: (target: ElementRecord) => void;
  relatedMolecule?: MoleculeRecord;
  relatedReaction?: ReactionRecord;
}

export function AtomicInfoPanel({
  element,
  neighbor,
  isFavorite,
  onToggleFavorite,
  onQuiz,
  onCompare,
  relatedMolecule,
  relatedReaction,
}: AtomicInfoPanelProps) {
  return (
    <aside className="info-panel panel">
      <div className="info-kicker">
        <span data-category={element.category} />
        <b>Element {element.atomicNumber}</b>
        <button
          className={isFavorite ? "favorite active" : "favorite"}
          onClick={() => onToggleFavorite(element.atomicNumber)}
          aria-label={
            isFavorite
              ? `Remove ${element.name} from saved elements`
              : `Save ${element.name}`
          }
        >
          <Bookmark size={17} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="info-title">
        <div>
          <h1>{element.name}</h1>
          <em>
            {categoryLabels[element.category]} · {element.block}-block
          </em>
        </div>
        <span data-category={element.category}>
          <small>{element.atomicNumber}</small>
          <b>{element.symbol}</b>
        </span>
      </div>

      <p className="element-intro">
        A {element.categoryLabel.toLowerCase()} with an electron arrangement of{" "}
        <strong>{element.shells.join("–")}</strong>.
      </p>

      <div className="fact-rule" />
      <h2>Atomic profile</h2>
      <dl className="key-facts">
        <div>
          <dt>Atomic mass</dt>
          <dd>{element.atomicMass} u</dd>
        </div>
        <div>
          <dt>Period / group</dt>
          <dd>
            {element.period} / {element.group ?? "f-block"}
          </dd>
        </div>
        <div>
          <dt>Standard state</dt>
          <dd>{element.standardState ?? "Not established"}</dd>
        </div>
        <div>
          <dt>Configuration</dt>
          <dd className="configuration">
            {formatElectronConfig(element.electronConfiguration)}
          </dd>
        </div>
        <div>
          <dt>Electronegativity</dt>
          <dd>{formatValue(element.electronegativity)}</dd>
        </div>
        <div>
          <dt>Ionization energy</dt>
          <dd>{formatValue(element.ionizationEnergy, " eV")}</dd>
        </div>
        <div>
          <dt>Oxidation states</dt>
          <dd>
            {element.oxidationStates.length
              ? element.oxidationStates.join(", ")
              : "Not established"}
          </dd>
        </div>
      </dl>

      <div className="isotope-note">
        <Atom size={16} />
        <p>
          <b>Representative nucleus</b>
          {element.representativeMassNumber
            ? `${element.symbol}-${element.representativeMassNumber}: ${element.atomicNumber} ${
                element.atomicNumber === 1 ? "proton" : "protons"
              } and ${element.neutrons} ${
                element.neutrons === 1 ? "neutron" : "neutrons"
              }.`
            : "No representative isotope is asserted in the visualization."}
        </p>
      </div>

      <div className="discovery-note">
        <History size={15} />
        <p>
          <b>Discovery</b>
          {element.yearDiscovered ?? "Date not established"}
        </p>
      </div>

      <div className="panel-actions">
        <button className="primary-button" onClick={onQuiz}>
          Take the element quiz <ArrowRight size={16} />
        </button>
        <button onClick={() => onCompare(neighbor)}>
          <TrendingUp size={15} /> Compare
        </button>
        {relatedMolecule && (
          <Link
            href={`/molecules?molecule=${relatedMolecule.slug}`}
            title={`Explore ${relatedMolecule.name} in 3D`}
          >
            <Layers size={15} /> {relatedMolecule.formula}
          </Link>
        )}
        <Link
          href={
            relatedReaction
              ? `/reactions?reaction=${relatedReaction.slug}`
              : "/reactions"
          }
        >
          <FlaskConical size={15} /> Reaction
        </Link>
      </div>

      <div className="source-links">
        <span>Sources</span>
        {element.sourceRefs.map((source) => (
          <a key={source.label} href={source.url} target="_blank" rel="noreferrer">
            {source.label}
          </a>
        ))}
      </div>
    </aside>
  );
}

export interface AtomicLearningCardsProps {
  element: ElementRecord;
  neighbor: ElementRecord;
  onQuiz: () => void;
  onCompare: (target: ElementRecord) => void;
  onSaved: () => void;
  onTable: () => void;
  relatedMolecule?: MoleculeRecord;
}

export function AtomicLearningCards({
  element,
  neighbor,
  onQuiz,
  onCompare,
  onSaved,
  onTable,
  relatedMolecule,
}: AtomicLearningCardsProps) {
  return (
    <section
      className="learning-cards"
      aria-label={`${element.name} learning resources`}
    >
      {/* 1. Atomic Structure */}
      <article>
        <header>
          <div>
            <em>Atomic structure</em>
            <h3>{element.shells.join("–")} shell distribution</h3>
          </div>
          <Atom />
        </header>
        <div className="card-visual shell-visual">
          {element.shells.map((count, index) => (
            <i
              key={index}
              style={{
                width: `${52 + index * 20}px`,
                height: `${52 + index * 20}px`,
              }}
            >
              <b>{count}</b>
            </i>
          ))}
          <strong>{element.symbol}</strong>
        </div>
        <button onClick={onQuiz}>
          Test this structure <ArrowRight />
        </button>
      </article>

      {/* 2. Periodic Trend */}
      <article>
        <header>
          <div>
            <em>Periodic trend</em>
            <h3>
              {element.name} vs. {neighbor.name}
            </h3>
          </div>
          <TrendingUp />
        </header>
        <div className="card-visual trend-visual">
          <span>
            <b>{element.symbol}</b>
            <small>{formatValue(element.electronegativity)}</small>
          </span>
          <i>→</i>
          <span>
            <b>{neighbor.symbol}</b>
            <small>{formatValue(neighbor.electronegativity)}</small>
          </span>
        </div>
        <div className="card-actions-split">
          <button onClick={() => onCompare(neighbor)}>
            Compare properties <ArrowRight />
          </button>
          <Link href={`/trends?property=electronegativity&element=${element.slug}`}>
            Open Trends 3D Studio <ArrowRight />
          </Link>
        </div>
      </article>

      {/* 3. Compounds & 3D Shapes */}
      <article>
        <header>
          <div>
            <em>Compounds & 3D Shapes</em>
            <h3>How it combines</h3>
          </div>
          <Boxes />
        </header>
        <p className="resource-copy">{element.compounds}</p>
        {relatedMolecule ? (
          <Link href={`/molecules?molecule=${relatedMolecule.slug}`}>
            Explore {relatedMolecule.name} ({relatedMolecule.formula}) in 3D{" "}
            <ArrowRight />
          </Link>
        ) : (
          <Link href="/molecules">
            Open Molecule Studio <ArrowRight />
          </Link>
        )}
      </article>

      {/* 4. Uses & Occurrence */}
      <article>
        <header>
          <div>
            <em>Uses & occurrence</em>
            <h3>Where it matters</h3>
          </div>
          <Beaker />
        </header>
        <p className="resource-copy">{element.uses}</p>
        <button onClick={onSaved}>
          Save for later <ArrowRight />
        </button>
      </article>

      {/* 5. History */}
      <article>
        <header>
          <div>
            <em>History</em>
            <h3>{element.yearDiscovered ?? "A continuing story"}</h3>
          </div>
          <History />
        </header>
        <p className="resource-copy">{element.history}</p>
        <button onClick={onTable}>
          Place it in the table <ArrowRight />
        </button>
      </article>

      {/* 6. Safety Context */}
      <article>
        <header>
          <div>
            <em>Safety context</em>
            <h3>Form and exposure matter</h3>
          </div>
          <ShieldAlert />
        </header>
        <p className="resource-copy">{element.safety}</p>
        <a href={element.sourceRefs[0].url} target="_blank" rel="noreferrer">
          Open source record <ArrowRight />
        </a>
      </article>
    </section>
  );
}
