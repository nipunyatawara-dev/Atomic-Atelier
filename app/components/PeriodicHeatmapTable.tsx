"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowRight, Filter } from "lucide-react";
import { elementGridPosition, elements } from "../lib/elements";
import {
  getElementRanking,
  getInterpolatedColor,
  getNormalizedValue,
  PALETTES,
  resolveTrend,
} from "../lib/trends";
import type { ElementRecord, TrendPaletteId, TrendPropertyId } from "../lib/types";

type Props = {
  selectedProperty: TrendPropertyId;
  paletteId: TrendPaletteId;
  selectedElementNumber: number | null;
  onSelectElement: (element: ElementRecord) => void;
};

type BlockFilter = "all" | "s" | "p" | "d" | "f";

export function PeriodicHeatmapTable({
  selectedProperty,
  paletteId,
  selectedElementNumber,
  onSelectElement,
}: Props) {
  const [blockFilter, setBlockFilter] = useState<BlockFilter>("all");
  const [hoveredElement, setHoveredElement] = useState<ElementRecord | null>(null);

  const currentPropDef = resolveTrend(selectedProperty);

  const filteredElements = useMemo(() => {
    return elements.filter((elem) => {
      if (blockFilter !== "all" && elem.block !== blockFilter) return false;
      return true;
    });
  }, [blockFilter]);

  const activeElementSet = useMemo(() => {
    return new Set(filteredElements.map((e) => e.atomicNumber));
  }, [filteredElements]);

  // Determine text contrast
  const getContrastColor = (normalized: number, pal: TrendPaletteId) => {
    if (pal === "spectral") {
      return normalized > 0.35 && normalized < 0.65 ? "#173235" : "#ffffff";
    }
    if (pal === "magma" || pal === "viridis" || pal === "sunset" || pal === "emerald") {
      return normalized > 0.58 ? "#173235" : "#ffffff";
    }
    return "#ffffff";
  };

  const hoveredRanking = hoveredElement
    ? getElementRanking(selectedProperty, hoveredElement.atomicNumber)
    : null;

  return (
    <div className="heatmap-table-container">
      {/* Top Controls & Directional Summary */}
      <div className="heatmap-top-row">
        <div className="heatmap-trend-vectors">
          <div className="trend-vector period-vector" title={currentPropDef.periodRule}>
            <ArrowRight size={14} className="vector-icon" />
            <span><strong>Period Trend:</strong> {currentPropDef.periodRule.split(" as ")[0]}</span>
          </div>
          <div className="trend-vector group-vector" title={currentPropDef.groupRule}>
            <ArrowDown size={14} className="vector-icon" />
            <span><strong>Group Trend:</strong> {currentPropDef.groupRule.split(" because ")[0].split(" as ")[0]}</span>
          </div>
        </div>

        {/* Block Filter Pills */}
        <div className="block-filter-group">
          <span className="filter-label"><Filter size={12} /> Block:</span>
          {(["all", "s", "p", "d", "f"] as const).map((block) => (
            <button
              key={block}
              type="button"
              className={`block-chip ${blockFilter === block ? "active" : ""}`}
              onClick={() => setBlockFilter(block)}
            >
              {block === "all" ? "All Blocks" : `${block.toUpperCase()}-block`}
            </button>
          ))}
        </div>
      </div>

      {/* 2D Periodic Heatmap Grid */}
      <div className="heatmap-scroll-wrapper">
        <div className="heatmap-grid" role="grid" aria-label="Periodic Trends Heatmap Table">
          <span className="period-label lanthanoid-label">Lanthanoids</span>
          <span className="period-label actinoid-label">Actinoids</span>

          {elements.map((element) => {
            const pos = elementGridPosition(element);
            const val = currentPropDef.accessor(element);
            const normalized = getNormalizedValue(val, currentPropDef);
            const bgColor = val !== null ? getInterpolatedColor(normalized, paletteId) : "#e2e4dc";
            const textColor = val !== null ? getContrastColor(normalized, paletteId) : "#6b7280";
            const isSelected = selectedElementNumber === element.atomicNumber;
            const isHovered = hoveredElement?.atomicNumber === element.atomicNumber;
            const isVisible = activeElementSet.has(element.atomicNumber);

            return (
              <button
                key={element.atomicNumber}
                type="button"
                role="gridcell"
                className={`heatmap-cell ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""} ${
                  isVisible ? "" : "dimmed"
                }`}
                style={{
                  gridColumn: pos.column,
                  gridRow: pos.row,
                  backgroundColor: isVisible ? bgColor : "#f0f1ec",
                  color: isVisible ? textColor : "#9ca3af",
                }}
                onClick={() => onSelectElement(element)}
                onMouseEnter={() => setHoveredElement(element)}
                onMouseLeave={() => setHoveredElement(null)}
                aria-label={`${element.name}, ${currentPropDef.name}: ${currentPropDef.format(val)}`}
              >
                <span className="cell-number">{element.atomicNumber}</span>
                <strong className="cell-symbol">{element.symbol}</strong>
                <small className="cell-value">
                  {val !== null ? (typeof val === "number" && val > 999 ? Math.round(val) : val.toFixed(1)) : "—"}
                </small>
              </button>
            );
          })}
        </div>
      </div>

      {/* Heatmap Footer Legend & Hover Details */}
      <div className="heatmap-footer">
        <div className="footer-legend">
          <span>Low: {currentPropDef.format(currentPropDef.min)}</span>
          <div
            className="legend-bar"
            style={{
              background: `linear-gradient(to right, ${PALETTES[paletteId]?.stops
                .map(([t, c]) => `${c} ${t * 100}%`)
                .join(", ")})`,
            }}
          />
          <span>High: {currentPropDef.format(currentPropDef.max)}</span>
        </div>

        {hoveredElement && hoveredRanking && (
          <div className="heatmap-quick-hover">
            <strong>
              {hoveredElement.name} ({hoveredElement.symbol})
            </strong>
            <span>
              {currentPropDef.shortName}: <b>{currentPropDef.format(hoveredRanking.value)}</b>
            </span>
            <span className="rank-badge">
              Rank: #{hoveredRanking.rank} of {hoveredRanking.totalEstablished} (Top {100 - hoveredRanking.percentile}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
