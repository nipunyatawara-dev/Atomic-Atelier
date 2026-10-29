import { describe, expect, it } from "vitest";
import { CARBON, elements } from "@/features/explorer/lib/elements";
import { elementPropertyValue, formatElementProperty, formatPropertyValue } from "@/lib/elementProperties";
import { resolveTrend, getNormalizedValue } from "@/features/trends/lib/trends";
import { generateElementStudyCardSvg } from "@/features/explorer/lib/studyCardExport";

describe("scientific units across studios", () => {
  it("converts source eV values into molar energy for displays and chart scales", () => {
    const energy = resolveTrend("ionizationEnergy");
    const value = energy.accessor(CARBON)!;
    expect(value).toBeCloseTo(1086.425, 3);
    expect(energy.format(value)).toBe("1,086.4 kJ/mol");
    expect(getNormalizedValue(value, energy)).toBeGreaterThan(0.2);
    expect(getNormalizedValue(value, energy)).toBeLessThan(0.6);
    const chlorine = elements[16];
    expect(elementPropertyValue(chlorine, "electronAffinity")).toBeCloseTo(348.99, 1);
    expect(CARBON.ionizationEnergy).toBe(11.26);
  });

  it("keeps exported study cards and trend values identical", () => {
    const text = formatElementProperty(CARBON, "ionizationEnergy");
    expect(generateElementStudyCardSvg(CARBON)).toContain(text);
    const property = resolveTrend("ionizationEnergy");
    expect(property.format(property.accessor(CARBON))).toBe(text);
  });

  it("preserves zero, unknown values, and bracketed masses", () => {
    expect(formatPropertyValue("electronAffinity", 0)).toBe("0 kJ/mol");
    expect(formatPropertyValue("ionizationEnergy", null)).toBe("Not established");
    expect(formatPropertyValue("ionizationEnergy", NaN)).toBe("Not established");
    expect(elementPropertyValue({ ...CARBON, electronAffinity: 0 }, "electronAffinity")).toBe(0);
    expect(formatElementProperty(elements[117], "atomicMass")).toBe("[294] u");
  });
});
