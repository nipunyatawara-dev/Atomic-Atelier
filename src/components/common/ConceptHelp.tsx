"use client";

import { useState } from "react";
import { Dialog } from "./Dialog";

export const concepts = {
  electronegativity: { label: "Electronegativity", copy: "How strongly an atom attracts shared electrons in a bond. A larger Pauling value means a stronger pull." },
  ionization: { label: "Ionization energy", copy: "Energy needed to remove an electron from an isolated gaseous atom. A larger value means the electron is harder to remove. All energy values here use kJ/mol." },
  aufbau: { label: "Aufbau principle", copy: "A model for building electron configurations: fill lower-energy orbitals first. Some elements have exceptions; the diagram uses the element’s recorded configuration." },
  valence: { label: "Valence electrons", copy: "Electrons involved in bonding. The shell viewer highlights the outermost occupied shell; transition metals can also use electrons from inner subshells." },
  vsepr: { label: "VSEPR", copy: "Valence-shell electron-pair repulsion: bonding regions and lone pairs spread apart around a central atom. Their arrangement helps predict molecular shape." },
  dipole: { label: "Net dipole", copy: "The combined direction of a molecule’s bond polarities. Opposing pulls can cancel in a symmetric molecule such as CO₂, even when its bonds are polar." },
} as const;

export function ConceptHelp({ concept }: { concept: keyof typeof concepts }) {
  const [open, setOpen] = useState(false);
  const { label, copy } = concepts[concept];
  return (
    <span className="concept-help">
      <button type="button" aria-haspopup="dialog" aria-label={`Explain ${label}`} onClick={() => setOpen(true)}>?</button>
      {open && <Dialog title={label} className="concept-dialog" onClose={() => setOpen(false)}><p>{copy}</p></Dialog>}
    </span>
  );
}
