import { Suspense } from "react";
import type { Metadata } from "next";
import { TrendsStudio } from "../components/TrendsStudio";

export const metadata: Metadata = {
  title: "Periodic Trends Heatmap & 3D Elevation Studio | Atomic Atelier",
  description:
    "Explore electronegativity, atomic radius, ionization energy, electron affinity, and quantum anomalies across all 118 elements in 3D elevation terrains and 2D heatmaps.",
  keywords: [
    "periodic trends",
    "electronegativity",
    "atomic radius",
    "ionization energy",
    "electron affinity",
    "periodic table 3d",
    "effective nuclear charge",
    "chemistry visualization",
  ],
  openGraph: {
    title: "Periodic Trends Heatmap & 3D Elevation Studio | Atomic Atelier",
    description:
      "Explore periodic trends in 3D elevation terrains, 2D heatmaps, and correlation waveforms.",
  },
};

export default function TrendsPage() {
  return (
    <Suspense
      fallback={
        <main className="trends-workspace">
          <div className="empty-search-state" style={{ minHeight: "80vh", justifyContent: "center" }}>
            <p>Loading Periodic Trends Studio...</p>
          </div>
        </main>
      }
    >
      <TrendsStudio />
    </Suspense>
  );
}
