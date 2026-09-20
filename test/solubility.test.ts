import { describe, expect, it } from "vitest";
import {
  getSolubility,
  predictDisplacement,
} from "@/features/reactions/lib/solubility";

describe("Solubility rules & Activity series", () => {
  it("confirms Group 1 and Nitrate salts are always soluble", () => {
    expect(getSolubility("Na⁺", "Cl⁻").state).toBe("S");
    expect(getSolubility("K⁺", "CO₃²⁻").state).toBe("S");
    expect(getSolubility("Ag⁺", "NO₃⁻").state).toBe("S");
    expect(getSolubility("Pb²⁺", "NO₃⁻").state).toBe("S");
  });

  it("identifies standard insoluble precipitates and colors", () => {
    // Silver Chloride: Insoluble white precipitate
    const agcl = getSolubility("Ag⁺", "Cl⁻");
    expect(agcl.state).toBe("I");
    expect(agcl.color).toBe("White");

    // Lead Iodide: Golden yellow precipitate
    const pbi2 = getSolubility("Pb²⁺", "I⁻");
    expect(pbi2.state).toBe("I");
    expect(pbi2.color).toBe("Golden Yellow");

    // Copper(II) Hydroxide: Sky blue precipitate
    const cuoh2 = getSolubility("Cu²⁺", "OH⁻");
    expect(cuoh2.state).toBe("I");
    expect(cuoh2.color).toBe("Sky Blue");

    // Barium Sulfate: Insoluble white precipitate
    const baso4 = getSolubility("Ba²⁺", "SO₄²⁻");
    expect(baso4.state).toBe("I");
    expect(baso4.color).toBe("White");
  });

  it("predicts single displacement reactions via Activity Series", () => {
    // Zinc displaces Copper: Zn(s) + CuSO4 -> ZnSO4 + Cu(s)
    const znCu = predictDisplacement("Zn", "Cu");
    expect(znCu).not.toBeNull();
    expect(znCu!.occurs).toBe(true);
    expect(znCu!.voltageDelta).toBeGreaterThan(0);

    // Copper CANNOT displace Zinc: Cu(s) + ZnSO4 -> No reaction
    const cuZn = predictDisplacement("Cu", "Zn");
    expect(cuZn).not.toBeNull();
    expect(cuZn!.occurs).toBe(false);

    // Magnesium displaces Iron
    const mgFe = predictDisplacement("Mg", "Fe");
    expect(mgFe!.occurs).toBe(true);
  });
});
