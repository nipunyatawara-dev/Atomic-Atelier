import { expect, test, type Page, type TestInfo } from "@playwright/test";

async function stablePage(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    window.localStorage.setItem("atomic-atelier:v1", JSON.stringify({
      version: 1, favorites: [], recentElements: [6], quizScores: {}, completedReactions: [],
      lastElement: 6, lastReaction: "water-synthesis", autoRotate: false,
    }));
  });
});

test("Carbon explorer visual", async ({ page }) => {
  await page.goto("/?element=carbon");
  await stablePage(page);
  await expect(page).toHaveScreenshot("carbon-explorer.png", { fullPage: true, animations: "disabled" });
});

test("heavy synthetic element visual", async ({ page }, testInfo: TestInfo) => {
  test.skip(testInfo.project.name === "mobile", "covered by the mobile Carbon visual");
  await page.goto("/?element=oganesson");
  await stablePage(page);
  await expect(page).toHaveScreenshot("oganesson-explorer.png", { fullPage: true, animations: "disabled" });
});

test("comparison mode visual", async ({ page }, testInfo: TestInfo) => {
  test.skip(testInfo.project.name === "mobile", "comparison behavior is covered functionally on mobile");
  await page.goto("/?element=carbon&compare=oxygen");
  await stablePage(page);
  await expect(page).toHaveScreenshot("carbon-oxygen-comparison.png", { fullPage: true, animations: "disabled" });
});

test("periodic table visual", async ({ page }, testInfo: TestInfo) => {
  test.skip(testInfo.project.name === "mobile", "mobile table behavior is covered functionally");
  await page.goto("/?element=carbon");
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await page.getByRole("group", { name: "Explore menu" }).getByRole("button", { name: /Periodic table/ }).click();
  await stablePage(page);
  await expect(page).toHaveScreenshot("periodic-table.png", { fullPage: true, animations: "disabled" });
});

test("balanced reaction visual", async ({ page }) => {
  await page.goto("/reactions?reaction=water-synthesis");
  await page.getByRole("button", { name: "Hint" }).click();
  await page.getByRole("button", { name: "Hint" }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await stablePage(page);
  await expect(page).toHaveScreenshot("balanced-water-reaction.png", { fullPage: true, animations: "disabled" });
});
