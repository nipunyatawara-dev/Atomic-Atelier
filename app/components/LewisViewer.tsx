"use client";

import { useMemo } from "react";
import type { MoleculeRecord } from "../lib/types";

type Props = {
  molecule: MoleculeRecord;
};

export function LewisViewer({ molecule }: Props) {
  const lewis = molecule.lewis;

  // Calculate SVG bounding box
  const bounds = useMemo(() => {
    if (!lewis.atoms.length) return { minX: 0, minY: 0, width: 200, height: 160 };
    const xs = lewis.atoms.map((a) => a.x);
    const ys = lewis.atoms.map((a) => a.y);
    const minX = Math.min(...xs) - 40;
    const maxX = Math.max(...xs) + 40;
    const minY = Math.min(...ys) - 40;
    const maxY = Math.max(...ys) + 40;
    return {
      minX,
      minY,
      width: Math.max(160, maxX - minX),
      height: Math.max(130, maxY - minY),
    };
  }, [lewis]);

  const atomMap = useMemo(() => new Map(lewis.atoms.map((a) => [a.atomId, a])), [lewis]);

  return (
    <div className="lewis-viewer-container">
      <div className="lewis-header">
        <strong>Lewis Dot Structure</strong>
        <span>Shared bonding pairs & non-bonding lone pairs</span>
      </div>

      <svg
        className="lewis-svg"
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="centralGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8ed6cb" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8ed6cb" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Bonds */}
        <g className="lewis-bonds">
          {lewis.bonds.map((bond, idx) => {
            const a1 = atomMap.get(bond.fromAtomId);
            const a2 = atomMap.get(bond.toAtomId);
            if (!a1 || !a2) return null;

            const dx = a2.x - a1.x;
            const dy = a2.y - a1.y;
            const len = Math.hypot(dx, dy) || 1;
            const px = -dy / len;
            const py = dx / len;

            if (bond.order === 1) {
              return (
                <line
                  key={`b-${idx}`}
                  x1={a1.x}
                  y1={a1.y}
                  x2={a2.x}
                  y2={a2.y}
                  stroke="var(--ink)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              );
            }
            if (bond.order === 2) {
              const offset = 3.5;
              return (
                <g key={`b-${idx}`}>
                  <line
                    x1={a1.x + px * offset}
                    y1={a1.y + py * offset}
                    x2={a2.x + px * offset}
                    y2={a2.y + py * offset}
                    stroke="var(--ink)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1={a1.x - px * offset}
                    y1={a1.y - py * offset}
                    x2={a2.x - px * offset}
                    y2={a2.y - py * offset}
                    stroke="var(--ink)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </g>
              );
            }
            if (bond.order === 3) {
              const offset = 4.5;
              return (
                <g key={`b-${idx}`}>
                  <line
                    x1={a1.x}
                    y1={a1.y}
                    x2={a2.x}
                    y2={a2.y}
                    stroke="var(--ink)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1={a1.x + px * offset}
                    y1={a1.y + py * offset}
                    x2={a2.x + px * offset}
                    y2={a2.y + py * offset}
                    stroke="var(--ink)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <line
                    x1={a1.x - px * offset}
                    y1={a1.y - py * offset}
                    x2={a2.x - px * offset}
                    y2={a2.y - py * offset}
                    stroke="var(--ink)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </g>
              );
            }
            return null;
          })}
        </g>

        {/* Atoms & Lone Pair Dots */}
        <g className="lewis-atoms">
          {lewis.atoms.map((atom) => (
            <g key={atom.atomId} className="lewis-atom-group">
              {/* Background badge for symbol clarity */}
              <circle
                cx={atom.x}
                cy={atom.y}
                r="13"
                fill="var(--paper)"
                stroke="var(--line)"
                strokeWidth="1"
              />

              {/* Element Symbol */}
              <text
                x={atom.x}
                y={atom.y + 4.5}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fontFamily="var(--font-sans)"
                fill="var(--ink)"
              >
                {atom.symbol}
              </text>

              {/* Lone Pair Electron Dots */}
              {atom.lonePairAngles.map((deg, lpIdx) => {
                const rad = (deg * Math.PI) / 180;
                const dist = 18;
                const dotSpread = 3.5;

                const cx = atom.x + Math.cos(rad) * dist;
                const cy = atom.y + Math.sin(rad) * dist;

                const perpX = -Math.sin(rad) * dotSpread;
                const perpY = Math.cos(rad) * dotSpread;

                return (
                  <g key={`lp-${lpIdx}`}>
                    <circle
                      cx={cx + perpX}
                      cy={cy + perpY}
                      r="1.8"
                      fill="#0284c7"
                    />
                    <circle
                      cx={cx - perpX}
                      cy={cy - perpY}
                      r="1.8"
                      fill="#0284c7"
                    />
                  </g>
                );
              })}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
