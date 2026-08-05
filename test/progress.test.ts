import { describe, expect, it } from "vitest";
import { defaultProgress, sanitizeProgress } from "../app/lib/progress";

describe("progress recovery", () => {
  it("recovers from missing or malformed records", () => {
    expect(sanitizeProgress(null)).toEqual(defaultProgress);
    expect(sanitizeProgress("broken")).toEqual(defaultProgress);
  });

  it("migrates unknown versions into a bounded v1 record", () => {
    const progress = sanitizeProgress({
      version: 99,
      favorites: [6, 6, 8, 999, "Na"],
      recentElements: [118, 117, 116, 115, 114, 113, 112, 111, 110],
      completedReactions: ["water-synthesis", "water-synthesis", 3],
      reactionGrades: {
        "water-synthesis": { score: 85, label: "Strong", attempts: 1, hints: 1, completedAt: "2026-08-05T00:00:00.000Z" },
        broken: { score: 999 },
      },
      lastElement: -2,
      lastReaction: 4,
      autoRotate: "yes",
    });
    expect(progress.version).toBe(1);
    expect(progress.favorites).toEqual([6, 8]);
    expect(progress.recentElements).toHaveLength(8);
    expect(progress.completedReactions).toEqual(["water-synthesis"]);
    expect(progress.exploredElements).toEqual([6, 118, 117, 116, 115, 114, 113, 112, 111]);
    expect(progress.reactionGrades["water-synthesis"]?.score).toBe(85);
    expect(progress.reactionGrades.broken).toBeUndefined();
    expect(progress.lastElement).toBe(6);
    expect(progress.lastReaction).toBe("water-synthesis");
    expect(progress.autoRotate).toBe(true);
  });
});
