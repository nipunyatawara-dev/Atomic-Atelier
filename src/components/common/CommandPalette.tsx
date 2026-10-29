"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Atom,
  Bookmark,
  Calculator,
  FlaskConical,
  Grid3X3,
  Layers,
  Search,
  TrendingUp,
} from "lucide-react";
import { Dialog } from "./Dialog";
import { categoryLabels, elements } from "@/features/explorer/lib/elements";
import { curatedMolecules } from "@/features/molecules/lib/molecules";
import { reactions } from "@/features/reactions/lib/reactions";
import { TREND_PROPERTIES } from "@/features/trends/lib/trends";

export type CommandItem = {
  id: string;
  group: "Elements" | "Molecules" | "Reactions" | "Trends" | "Tools";
  title: string;
  subtitle: string;
  badge?: string;
  category?: string;
  action: () => void;
};

type Props = {
  onClose: () => void;
  onTable: () => void;
  onSaved: () => void;
  onMolarMass?: () => void;
};

export function CommandPalette({ onClose, onTable, onSaved, onMolarMass }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const allItems = useMemo<CommandItem[]>(() => {
    const toolItems: CommandItem[] = [
      {
        id: "tool:table",
        group: "Tools",
        title: "Open Periodic Table",
        subtitle: "Interactive 118-element matrix with temperature & phase slider",
        badge: "Table",
        action: () => {
          onClose();
          onTable();
        },
      },
      ...(onMolarMass
        ? [
            {
              id: "tool:mass",
              group: "Tools" as const,
              title: "Molar Mass & Stoichiometry Calculator",
              subtitle: "Compute molecular weight and mass composition for any formula",
              badge: "g/mol",
              action: () => {
                onClose();
                onMolarMass();
              },
            },
          ]
        : []),
      {
        id: "tool:saved",
        group: "Tools",
        title: "Your Learning Progress & Saved Items",
        subtitle: "Review bookmarked elements, molecules, and reaction grades",
        badge: "Saved",
        action: () => {
          onClose();
          onSaved();
        },
      },
    ];

    const trendItems: CommandItem[] = TREND_PROPERTIES.map((prop) => ({
      id: `trend:${prop.id}`,
      group: "Trends",
      title: prop.name,
      subtitle: `${prop.description.slice(0, 82)}…`,
      badge: prop.unit || prop.shortName,
      action: () => {
        onClose();
        router.push(`/trends?property=${prop.id}`);
      },
    }));

    const moleculeItems: CommandItem[] = curatedMolecules.map((mol) => ({
      id: `mol:${mol.slug}`,
      group: "Molecules",
      title: `${mol.name} (${mol.formula})`,
      subtitle: `${mol.vsepr.molecularGeometry} · ${mol.vsepr.axeNotation} · ${mol.vsepr.polarity}`,
      badge: mol.formula,
      action: () => {
        onClose();
        router.push(`/molecules?molecule=${mol.slug}`);
      },
    }));

    const reactionItems: CommandItem[] = reactions.map((rxn) => ({
      id: `rxn:${rxn.slug}`,
      group: "Reactions",
      title: rxn.title,
      subtitle: `${rxn.type} · ${rxn.reactants.map((r) => r.formula).join(" + ")} → ${rxn.products.map((p) => p.formula).join(" + ")}`,
      badge: rxn.type,
      action: () => {
        onClose();
        router.push(`/reactions?reaction=${rxn.slug}`);
      },
    }));

    const elementItems: CommandItem[] = elements.map((el) => ({
      id: `el:${el.slug}`,
      group: "Elements",
      title: `${el.name} (${el.symbol})`,
      subtitle: `Z = ${el.atomicNumber} · ${categoryLabels[el.category]} · ${el.electronConfiguration}`,
      badge: `${el.atomicNumber} ${el.symbol}`,
      category: el.category,
      action: () => {
        onClose();
        router.push(`/?element=${el.slug}`);
      },
    }));

    return [...toolItems, ...elementItems, ...moleculeItems, ...reactionItems, ...trendItems];
  }, [onClose, onMolarMass, onSaved, onTable, router]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Curated starter set when empty
      return [
        ...allItems.filter((i) => i.group === "Tools"),
        ...allItems.filter((i) => i.group === "Elements").slice(0, 6),
        ...allItems.filter((i) => i.group === "Molecules").slice(0, 4),
        ...allItems.filter((i) => i.group === "Reactions").slice(0, 3),
        ...allItems.filter((i) => i.group === "Trends").slice(0, 3),
      ];
    }

    return allItems
      .filter((item) => {
        const haystack = `${item.title} ${item.subtitle} ${item.badge ?? ""} ${item.group}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 24);
  }, [allItems, query]);

  const clampedIndex = filteredItems.length > 0 ? Math.min(activeIndex, filteredItems.length - 1) : 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (filteredItems.length ? (prev + 1) % filteredItems.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        filteredItems.length ? (prev - 1 + filteredItems.length) % filteredItems.length : 0,
      );
    } else if (e.key === "Enter" && filteredItems[clampedIndex]) {
      e.preventDefault();
      filteredItems[clampedIndex].action();
    }
  };

  const renderGroupIcon = (group: CommandItem["group"]) => {
    switch (group) {
      case "Elements":
        return <Atom size={15} />;
      case "Molecules":
        return <Layers size={15} />;
      case "Reactions":
        return <FlaskConical size={15} />;
      case "Trends":
        return <TrendingUp size={15} />;
      case "Tools":
        return <Grid3X3 size={15} />;
    }
  };

  return (
    <Dialog
      title="Search Atomic Atelier"
      eyebrow="Quick Jump · Elements, Molecules, Reactions & Tools"
      onClose={onClose}
      className="command-palette-dialog"
    >
      <div className="cmd-palette-search">
        <Search size={17} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search 118 elements, VSEPR molecules (SF6, H2O), reactions, or trends…"
          aria-label="Search elements, molecules, reactions, trends, and tools"
        />
        <kbd className="cmd-kbd">ESC</kbd>
      </div>

      <div className="cmd-palette-results" role="listbox" aria-label="Search results">
        {filteredItems.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={idx === clampedIndex}
            className={`cmd-result-item ${idx === clampedIndex ? "active" : ""}`}
            onMouseEnter={() => setActiveIndex(idx)}
            onClick={item.action}
          >
            <span className="cmd-item-icon" data-category={item.category}>
              {item.group === "Tools" && item.id === "tool:mass" ? (
                <Calculator size={15} />
              ) : item.group === "Tools" && item.id === "tool:saved" ? (
                <Bookmark size={15} />
              ) : (
                renderGroupIcon(item.group)
              )}
            </span>
            <span className="cmd-item-copy">
              <strong>{item.title}</strong>
              <small>{item.subtitle}</small>
            </span>
            <span className="cmd-item-meta">
              {item.badge && <em className="cmd-badge">{item.badge}</em>}
              <ArrowRight size={13} />
            </span>
          </button>
        ))}

        {filteredItems.length === 0 && (
          <div className="cmd-empty">
            <p>No matching elements, molecules, or reactions for &ldquo;{query}&rdquo;.</p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
