import { Suspense } from "react";
import { Atom } from "lucide-react";
import { MoleculeStudio } from "../components/MoleculeStudio";

export const metadata = {
  title: "3D Molecule Builder & VSEPR Studio",
  description: "Explore 3D molecular geometries, electron pair repulsion (VSEPR), Lewis bonding structures, and dipole moments with interactive models.",
};

export default function MoleculesPage() {
  return (
    <Suspense
      fallback={
        <main className="route-loading">
          <Atom size={36} className="animate-spin" />
          <strong>Preparing Molecule Studio…</strong>
        </main>
      }
    >
      <MoleculeStudio />
    </Suspense>
  );
}
