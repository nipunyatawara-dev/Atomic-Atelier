"use client";

import { useMemo, useState } from "react";
import { Activity, GitCompare, ScatterChart } from "lucide-react";
import { elements } from "../lib/elements";
import { resolveTrend, TREND_PROPERTIES } from "../lib/trends";
import type { ElementRecord, TrendPropertyId } from "../lib/types";

type Props = {
  primaryProperty: TrendPropertyId;
  selectedElementNumber: number | null;
  onSelectElement: (element: ElementRecord) => void;
};

type GraphMode = "continuous" | "period-overlay" | "scatter";

export function TrendsGraph({
  primaryProperty,
  selectedElementNumber,
  onSelectElement,
}: Props) {
  const [graphMode, setGraphMode] = useState<GraphMode>("continuous");
  const [secondaryProperty, setSecondaryProperty] = useState<TrendPropertyId>("atomicRadius");
  const [hoveredPoint, setHoveredPoint] = useState<ElementRecord | null>(null);

  const propA = resolveTrend(primaryProperty);
  const propB = resolveTrend(secondaryProperty);

  // SVG dimensions
  const width = 800;
  const height = 360;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 45;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Continuous Data (Z = 1..118)
  const continuousData = useMemo(() => {
    return elements
      .map((e) => ({
        element: e,
        z: e.atomicNumber,
        val: propA.accessor(e),
      }))
      .filter((d): d is { element: ElementRecord; z: number; val: number } => d.val !== null);
  }, [propA]);

  const maxValA = useMemo(() => {
    return Math.max(...continuousData.map((d) => d.val), propA.max || 1);
  }, [continuousData, propA]);

  const minValA = useMemo(() => {
    return Math.min(...continuousData.map((d) => d.val), propA.min || 0);
  }, [continuousData, propA]);

  // Period Overlays (Periods 2 to 6)
  const periodOverlays = useMemo(() => {
    const periods = [2, 3, 4, 5, 6];
    return periods.map((p) => {
      const pElements = elements
        .filter((e) => e.period === p && e.group !== null)
        .map((e) => ({
          element: e,
          group: e.group!,
          val: propA.accessor(e),
        }))
        .filter((d): d is { element: ElementRecord; group: number; val: number } => d.val !== null)
        .sort((a, b) => a.group - b.group);

      return { period: p, points: pElements };
    });
  }, [propA]);

  // Scatter Correlation Data (Prop A vs Prop B)
  const scatterData = useMemo(() => {
    return elements
      .map((e) => ({
        element: e,
        valA: propA.accessor(e),
        valB: propB.accessor(e),
      }))
      .filter(
        (d): d is { element: ElementRecord; valA: number; valB: number } =>
          d.valA !== null && d.valB !== null,
      );
  }, [propA, propB]);

  const maxValB = useMemo(() => {
    return Math.max(...scatterData.map((d) => d.valB), propB.max || 1);
  }, [scatterData, propB]);

  const minValB = useMemo(() => {
    return Math.min(...scatterData.map((d) => d.valB), propB.min || 0);
  }, [scatterData, propB]);

  // Continuous Waveform Path
  const continuousPath = useMemo(() => {
    if (continuousData.length === 0) return "";
    return continuousData.reduce((path, d, i) => {
      const x = padLeft + ((d.z - 1) / 117) * chartW;
      const y = padTop + chartH - ((d.val - minValA) / (maxValA - minValA || 1)) * chartH;
      return `${path} ${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, "");
  }, [continuousData, minValA, maxValA, chartW, chartH]);

  // Period Dividers
  const periodBoundaries = [
    { z: 2, label: "P1" },
    { z: 10, label: "P2" },
    { z: 18, label: "P3" },
    { z: 36, label: "P4" },
    { z: 54, label: "P5" },
    { z: 86, label: "P6" },
    { z: 118, label: "P7" },
  ];

  const PERIOD_COLORS = ["#0284c7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="trends-graph-container">
      {/* Graph Navigation & Mode Tabs */}
      <div className="graph-controls-row">
        <div className="graph-mode-tabs">
          <button
            type="button"
            className={`graph-tab-btn ${graphMode === "continuous" ? "active" : ""}`}
            onClick={() => setGraphMode("continuous")}
          >
            <Activity size={13} />
            <span>Z = 1 to 118 Waveform</span>
          </button>
          <button
            type="button"
            className={`graph-tab-btn ${graphMode === "period-overlay" ? "active" : ""}`}
            onClick={() => setGraphMode("period-overlay")}
          >
            <GitCompare size={13} />
            <span>Period Overlay</span>
          </button>
          <button
            type="button"
            className={`graph-tab-btn ${graphMode === "scatter" ? "active" : ""}`}
            onClick={() => setGraphMode("scatter")}
          >
            <ScatterChart size={13} />
            <span>Correlation Scatter</span>
          </button>
        </div>

        {graphMode === "scatter" && (
          <div className="scatter-secondary-select">
            <span>vs.</span>
            <select
              value={secondaryProperty}
              onChange={(e) => setSecondaryProperty(e.target.value as TrendPropertyId)}
              aria-label="Select secondary property for correlation"
            >
              {TREND_PROPERTIES.filter((p) => p.id !== primaryProperty).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* SVG Chart Surface */}
      <div className="graph-svg-wrapper">
        <svg viewBox={`0 0 ${width} ${height}`} className="trends-chart-svg">
          <defs>
            <linearGradient id="areaGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2d7773" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2d7773" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padTop + chartH * (1 - pct);
            const val = minValA + (maxValA - minValA) * pct;
            return (
              <g key={`gy-${pct}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + chartW}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeDasharray="4 4"
                />
                <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6b7280">
                  {val > 999 ? Math.round(val) : val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* MODE A: Continuous Waveform */}
          {graphMode === "continuous" && (
            <>
              {/* Period vertical boundary lines */}
              {periodBoundaries.map((b) => {
                const x = padLeft + ((b.z - 1) / 117) * chartW;
                return (
                  <g key={`pb-${b.z}`}>
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={padTop + chartH}
                      stroke="#cbd5e1"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={x - 4}
                      y={padTop + 14}
                      fontSize="9"
                      fill="#94a3b8"
                      textAnchor="end"
                      fontWeight="600"
                    >
                      {b.label}
                    </text>
                  </g>
                );
              })}

              {/* Shaded area */}
              {continuousPath && (
                <path
                  d={`${continuousPath} L ${padLeft + chartW} ${padTop + chartH} L ${padLeft} ${
                    padTop + chartH
                  } Z`}
                  fill="url(#areaGlow)"
                />
              )}

              {/* Main waveform line */}
              {continuousPath && (
                <path
                  d={continuousPath}
                  fill="none"
                  stroke="var(--teal)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data Dots */}
              {continuousData.map((d) => {
                const x = padLeft + ((d.z - 1) / 117) * chartW;
                const y = padTop + chartH - ((d.val - minValA) / (maxValA - minValA || 1)) * chartH;
                const isSelected = selectedElementNumber === d.z;
                const isHovered = hoveredPoint?.atomicNumber === d.z;

                return (
                  <circle
                    key={`dot-${d.z}`}
                    cx={x}
                    cy={y}
                    r={isSelected ? 6 : isHovered ? 5 : 2.8}
                    fill={isSelected ? "#0284c7" : isHovered ? "#38bdf8" : "#2d7773"}
                    stroke="#ffffff"
                    strokeWidth={isSelected || isHovered ? 2 : 1}
                    className="graph-dot"
                    onClick={() => onSelectElement(d.element)}
                    onMouseEnter={() => setHoveredPoint(d.element)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}
            </>
          )}

          {/* MODE B: Period Overlay */}
          {graphMode === "period-overlay" && (
            <>
              {periodOverlays.map((pGroup, pIdx) => {
                const color = PERIOD_COLORS[pIdx % PERIOD_COLORS.length];
                const pathStr = pGroup.points.reduce((path, d, i) => {
                  const x = padLeft + ((d.group - 1) / 17) * chartW;
                  const y = padTop + chartH - ((d.val - minValA) / (maxValA - minValA || 1)) * chartH;
                  return `${path} ${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                }, "");

                return (
                  <g key={`p-overlay-${pGroup.period}`}>
                    <path
                      d={pathStr}
                      fill="none"
                      stroke={color}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      opacity="0.85"
                    />
                    {pGroup.points.map((d) => {
                      const x = padLeft + ((d.group - 1) / 17) * chartW;
                      const y =
                        padTop + chartH - ((d.val - minValA) / (maxValA - minValA || 1)) * chartH;
                      const isSelected = selectedElementNumber === d.element.atomicNumber;
                      const isHovered = hoveredPoint?.atomicNumber === d.element.atomicNumber;

                      return (
                        <circle
                          key={`p-dot-${d.element.atomicNumber}`}
                          cx={x}
                          cy={y}
                          r={isSelected ? 5.5 : isHovered ? 4.5 : 2.5}
                          fill={color}
                          stroke="#ffffff"
                          strokeWidth="1.2"
                          className="graph-dot"
                          onClick={() => onSelectElement(d.element)}
                          onMouseEnter={() => setHoveredPoint(d.element)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </>
          )}

          {/* MODE C: Scatter Correlation */}
          {graphMode === "scatter" && (
            <>
              {scatterData.map((d) => {
                const x = padLeft + ((d.valA - minValA) / (maxValA - minValA || 1)) * chartW;
                const y = padTop + chartH - ((d.valB - minValB) / (maxValB - minValB || 1)) * chartH;
                const isSelected = selectedElementNumber === d.element.atomicNumber;
                const isHovered = hoveredPoint?.atomicNumber === d.element.atomicNumber;

                return (
                  <circle
                    key={`scat-${d.element.atomicNumber}`}
                    cx={x}
                    cy={y}
                    r={isSelected ? 6 : isHovered ? 5 : 3.5}
                    fill={isSelected ? "#0284c7" : isHovered ? "#38bdf8" : "var(--teal)"}
                    stroke="#ffffff"
                    strokeWidth={isSelected || isHovered ? 2 : 1}
                    className="graph-dot"
                    onClick={() => onSelectElement(d.element)}
                    onMouseEnter={() => setHoveredPoint(d.element)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}
            </>
          )}

          {/* X Axis Label */}
          <text
            x={padLeft + chartW / 2}
            y={height - 8}
            textAnchor="middle"
            fontSize="11"
            fill="#6b7280"
            fontWeight="500"
          >
            {graphMode === "continuous"
              ? "Atomic Number (Z = 1 to 118)"
              : graphMode === "period-overlay"
              ? "Periodic Table Group (1 to 18)"
              : `${propA.name} (${propA.unit})`}
          </text>

          {/* Y Axis Label */}
          <text
            x={-height / 2}
            y={16}
            transform="rotate(-90)"
            textAnchor="middle"
            fontSize="11"
            fill="#6b7280"
            fontWeight="500"
          >
            {graphMode === "scatter"
              ? `${propB.name} (${propB.unit})`
              : `${propA.name} (${propA.unit})`}
          </text>
        </svg>

        {/* Period Legend for Mode B */}
        {graphMode === "period-overlay" && (
          <div className="period-legend-bar">
            {periodOverlays.map((p, idx) => (
              <span key={p.period} className="period-legend-pill">
                <i style={{ background: PERIOD_COLORS[idx % PERIOD_COLORS.length] }} />
                Period {p.period}
              </span>
            ))}
          </div>
        )}

        {/* Hover Tooltip Box */}
        {hoveredPoint && (
          <div className="graph-hover-badge">
            <strong>
              {hoveredPoint.name} ({hoveredPoint.symbol}) · Z = {hoveredPoint.atomicNumber}
            </strong>
            <span>
              {propA.shortName}: <b>{propA.format(propA.accessor(hoveredPoint))}</b>
            </span>
            {graphMode === "scatter" && (
              <span>
                {propB.shortName}: <b>{propB.format(propB.accessor(hoveredPoint))}</b>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
