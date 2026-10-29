"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { Dialog } from "@/components/common/Dialog";
import { balanceChemicalEquation } from "@/features/reactions/lib/equationBalancer";
import { formatFormulaSubscripts } from "@/features/reactions/lib/formula";

const EQUATION_PRESETS = [
  { label: "Iron Rusting", eq: "Fe + O2 -> Fe2O3" },
  { label: "Ethane Combustion", eq: "C2H6 + O2 -> CO2 + H2O" },
  { label: "Glucose Respiration", eq: "C6H12O6 + O2 -> CO2 + H2O" },
  { label: "Thermite", eq: "Al + Fe2O3 -> Al2O3 + Fe" },
  { label: "Permanganate Redox", eq: "KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2" },
  { label: "Neutralization", eq: "Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O" },
];

export function CustomEquationModal({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState("Fe + O2 -> Fe2O3");
  const result = useMemo(() => balanceChemicalEquation(input), [input]);

  return (
    <Dialog
      title="Custom Equation Balancer"
      eyebrow="Algebraic Stoichiometry & Matrix Solver"
      onClose={onClose}
      wide
      className="custom-equation-dialog"
    >
      <div className="custom-eq-body">
        <p className="custom-eq-intro">
          Type any unbalanced chemical equation using <code>+</code> and <code>-&gt;</code>. Supports parentheses (such as <code>Ca(OH)2</code>) and multi-species redox equations.
        </p>

        <div className="custom-eq-input-group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Fe + O2 -> Fe2O3"
            aria-label="Unbalanced chemical equation"
            className="custom-eq-input"
          />
        </div>

        <div className="custom-eq-presets">
          <span>Presets:</span>
          {EQUATION_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={input === p.eq ? "active" : ""}
              onClick={() => setInput(p.eq)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {!result.valid ? (
          <div className="custom-eq-error" role="alert">
            <AlertCircle size={16} />
            <span>{result.error}</span>
          </div>
        ) : (
          <div className="custom-eq-solution" aria-live="polite">
            <div className="solution-banner">
              <div className="solution-header">
                <CheckCircle2 size={15} />
                <span>Balanced Stoichiometric Equation</span>
              </div>
              <div className="solution-equation">
                {result.reactants.map((r, i) => (
                  <span key={`r-${r.formula}-${i}`} className="eq-term">
                    {i > 0 && <i className="eq-plus">+</i>}
                    <b className="eq-coeff">{r.coefficient}</b>
                    <strong className="eq-formula">{formatFormulaSubscripts(r.formula)}</strong>
                  </span>
                ))}
                <span className="eq-arrow">→</span>
                {result.products.map((p, i) => (
                  <span key={`p-${p.formula}-${i}`} className="eq-term">
                    {i > 0 && <i className="eq-plus">+</i>}
                    <b className="eq-coeff">{p.coefficient}</b>
                    <strong className="eq-formula">{formatFormulaSubscripts(p.formula)}</strong>
                  </span>
                ))}
              </div>
            </div>

            <div className="conservation-ledger">
              <h4>
                <Sparkles size={13} /> Conservation of Mass Verification
              </h4>
              <div className="conservation-grid">
                {result.elements.map((el) => (
                  <div key={el} className="conservation-card">
                    <span className="cons-sym">{el}</span>
                    <div className="cons-detail">
                      <strong>{result.atomTotals[el]} atoms conserved</strong>
                      <small>
                        Reactants:{" "}
                        {result.reactants
                          .filter((r) => r.counts[el])
                          .map((r) => `${r.coefficient}×${r.counts[el]}`)
                          .join(" + ")}{" "}
                        = Products:{" "}
                        {result.products
                          .filter((p) => p.counts[el])
                          .map((p) => `${p.coefficient}×${p.counts[el]}`)
                          .join(" + ")}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
