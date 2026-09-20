import { describe, expect, it } from "vitest";
import {
  AUFBAU_ANOMALIES,
  fillSubshellBoxes,
  generateAufbauSimulation,
  generateOrbitalBoxes,
} from "@/features/explorer/lib/aufbau";
import { elementByNumber } from "@/features/explorer/lib/elements";

describe("Aufbau orbital filling logic", () => {
  it("fills 1s with 2 paired electrons (Pauli principle)", () => {
    const s2 = fillSubshellBoxes("1s", "s", 2, 1, 0);
    expect(s2.boxes).toHaveLength(1);
    expect(s2.boxes[0].electrons).toBe(2);
    expect(s2.boxes[0].spins).toEqual(["up", "down"]);
  });

  it("follows Hund's rule for p-subshell (parallel spins before pairing)", () => {
    // Carbon: 2p² has 2 electrons in separate orbitals with parallel spin 'up'
    const p2 = fillSubshellBoxes("2p", "p", 2, 2, 2);
    expect(p2.boxes).toHaveLength(3);
    expect(p2.boxes[0].spins).toEqual(["up"]);
    expect(p2.boxes[1].spins).toEqual(["up"]);
    expect(p2.boxes[2].spins).toEqual([]);

    // Nitrogen: 2p³ has all 3 orbitals singly occupied (half-filled)
    const p3 = fillSubshellBoxes("2p", "p", 3, 2, 2);
    expect(p3.boxes[0].spins).toEqual(["up"]);
    expect(p3.boxes[1].spins).toEqual(["up"]);
    expect(p3.boxes[2].spins).toEqual(["up"]);

    // Oxygen: 2p⁴ has 1 pair and 2 unpaired
    const p4 = fillSubshellBoxes("2p", "p", 4, 2, 2);
    expect(p4.boxes[0].spins).toEqual(["up", "down"]);
    expect(p4.boxes[1].spins).toEqual(["up"]);
    expect(p4.boxes[2].spins).toEqual(["up"]);
  });

  it("identifies anomalous configuration for Chromium (Z=24)", () => {
    const cr = elementByNumber.get(24)!;
    expect(cr).toBeDefined();
    expect(AUFBAU_ANOMALIES[24]).toBeDefined();
    expect(AUFBAU_ANOMALIES[24].actualConfig).toContain("3d⁵");

    const boxes = generateOrbitalBoxes(cr);
    const s4 = boxes.find((b) => b.label === "4s");
    const d3 = boxes.find((b) => b.label === "3d");
    expect(s4?.electrons).toBe(1);
    expect(d3?.electrons).toBe(5);
  });

  it("identifies anomalous configuration for Copper (Z=29)", () => {
    const cu = elementByNumber.get(29)!;
    expect(cu).toBeDefined();
    expect(AUFBAU_ANOMALIES[29]).toBeDefined();
    expect(AUFBAU_ANOMALIES[29].actualConfig).toContain("3d¹⁰");

    const boxes = generateOrbitalBoxes(cu);
    const s4 = boxes.find((b) => b.label === "4s");
    const d3 = boxes.find((b) => b.label === "3d");
    expect(s4?.electrons).toBe(1);
    expect(d3?.electrons).toBe(10);
  });

  it("simulates progressive Aufbau filling from 1 to 10 electrons", () => {
    const sim1 = generateAufbauSimulation(1);
    expect(sim1[0].electrons).toBe(1);

    const sim10 = generateAufbauSimulation(10);
    const totalOccupied = sim10.reduce((acc, sub) => acc + sub.electrons, 0);
    expect(totalOccupied).toBe(10);
  });
});
