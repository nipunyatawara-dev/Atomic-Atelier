import { describe, expect, it } from "vitest";
import { generateNucleusPositions } from "../app/components/AtomViewer";
import { elements } from "../app/lib/elements";

describe("generateNucleusPositions", () => {
  it("returns exactly total number of positions", () => {
    [1, 2, 3, 4, 12, 56, 118, 238, 294].forEach((total) => {
      const positions = generateNucleusPositions(total, 0.15, 42);
      expect(positions).toHaveLength(total);
    });
  });

  it("places single nucleon at origin for Hydrogen", () => {
    const positions = generateNucleusPositions(1, 0.215, 1);
    expect(positions).toHaveLength(1);
    expect(positions[0].length()).toBe(0);
  });

  it("generates touching, compact clusters with minimal inter-nucleon space", () => {
    const particleSize = 0.16;
    const total = 12; // Carbon nucleus
    const positions = generateNucleusPositions(total, particleSize, 6);

    // Check that every nucleon has a neighbor within touching distance
    positions.forEach((p1, i) => {
      let minDistance = Infinity;
      positions.forEach((p2, j) => {
        if (i === j) return;
        const d = p1.distanceTo(p2);
        if (d < minDistance) minDistance = d;
      });
      // Neighbor should be snug (around 1.8 * particleSize) and not detached
      expect(minDistance).toBeLessThanOrEqual(particleSize * 2.1);
    });
  });

  it("keeps nucleus radius compact across all 118 elements without colliding with inner shell (r=1.48)", () => {
    for (const element of elements) {
      const neutronCount = element.neutrons ?? 0;
      const total = Math.max(1, element.atomicNumber + neutronCount);
      const particleSize = Math.max(0.108, Math.min(0.215, 0.245 - Math.log10(total + 1) * 0.052));
      const positions = generateNucleusPositions(total, particleSize, element.atomicNumber);

      let maxClusterRadius = particleSize;
      positions.forEach((pos) => {
        const d = pos.length() + particleSize;
        if (d > maxClusterRadius) maxClusterRadius = d;
      });

      // Cluster outer radius should be well below innermost electron shell (1.48)
      expect(maxClusterRadius).toBeLessThan(1.2);
    }
  });
});
