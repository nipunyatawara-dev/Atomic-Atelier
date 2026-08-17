import { describe, expect, it } from "vitest";
import {
  getElementRanking,
  getInterpolatedColor,
  getNormalizedValue,
  PALETTES,
  resolveTrend,
  TREND_ANOMALIES,
  TREND_PROPERTIES,
  TREND_QUIZ_QUESTIONS,
} from "../app/lib/trends";
import { elements } from "../app/lib/elements";

describe("Periodic Trends Engine", () => {
  it("defines all 9 core periodic trend properties with valid metadata", () => {
    expect(TREND_PROPERTIES.length).toBe(9);
    for (const prop of TREND_PROPERTIES) {
      expect(prop.id).toBeTruthy();
      expect(prop.name).toBeTruthy();
      expect(prop.unit).toBeTruthy();
      expect(prop.min).toBeLessThan(prop.max);
      expect(typeof prop.accessor).toBe("function");
      expect(typeof prop.format).toBe("function");
    }
  });

  it("calculates accurate element rankings and identifies known extrema", () => {
    // Fluorine (Z=9) should have highest Pauling electronegativity
    const fRanking = getElementRanking("electronegativity", 9);
    expect(fRanking).not.toBeNull();
    expect(fRanking?.highest.element.symbol).toBe("F");
    expect(fRanking?.rank).toBe(1);

    // Helium (Z=2) should have highest 1st Ionization Energy
    const heRanking = getElementRanking("ionizationEnergy", 2);
    expect(heRanking).not.toBeNull();
    expect(heRanking?.highest.element.symbol).toBe("He");
    expect(heRanking?.rank).toBe(1);

    // Francium (Z=87) or Cesium (Z=55) should have largest atomic radius
    const csRanking = getElementRanking("atomicRadius", 55);
    expect(csRanking).not.toBeNull();
    expect(["Fr", "Cs"]).toContain(csRanking?.highest.element.symbol);
  });

  it("normalizes values and interpolates color ramps across palettes", () => {
    const enProp = resolveTrend("electronegativity");
    expect(getNormalizedValue(enProp.min, enProp)).toBeCloseTo(0.0, 2);
    expect(getNormalizedValue(enProp.max, enProp)).toBeCloseTo(1.0, 2);
    expect(getNormalizedValue(2.5, enProp)).toBeGreaterThan(0);
    expect(getNormalizedValue(2.5, enProp)).toBeLessThan(1);

    // Test color interpolation
    const viridisMin = getInterpolatedColor(0.0, "viridis");
    const viridisMax = getInterpolatedColor(1.0, "viridis");
    expect(viridisMin).toBe(PALETTES.viridis.stops[0][1]);
    expect(viridisMax).toBe(PALETTES.viridis.stops[PALETTES.viridis.stops.length - 1][1]);

    const spectralMid = getInterpolatedColor(0.5, "spectral");
    expect(spectralMid).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("maintains quantum anomalies database with valid element references", () => {
    expect(TREND_ANOMALIES.length).toBeGreaterThanOrEqual(5);
    for (const anom of TREND_ANOMALIES) {
      expect(anom.id).toBeTruthy();
      expect(anom.title).toBeTruthy();
      expect(anom.elementsInvolved.length).toBeGreaterThanOrEqual(2);
      for (const z of anom.elementsInvolved) {
        expect(elements.some((e) => e.atomicNumber === z)).toBe(true);
      }
    }
  });

  it("provides valid and answerable quiz questions for Trends Master Challenge", () => {
    expect(TREND_QUIZ_QUESTIONS.length).toBe(5);
    for (const q of TREND_QUIZ_QUESTIONS) {
      expect(q.prompt).toBeTruthy();
      expect(q.options.length).toBe(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(4);
      expect(q.explanation).toBeTruthy();
    }
  });
});
