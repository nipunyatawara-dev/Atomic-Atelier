import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("atomic-atelier:tour-complete:v1", "true");
    sessionStorage.setItem("atomic-atelier:intro-seen", "true");
  });
});

test("a guided lesson connects observation, comparison, trends, and molecular prediction", async ({ page }) => {
  await page.goto("/?element=carbon");
  await page.getByRole("link", { name: "Start guided lesson" }).click();
  const lesson = page.getByRole("region", { name: "Carbon guided lesson" });
  await lesson.getByRole("button", { name: "Highlight outer electrons" }).click();
  await lesson.getByRole("link", { name: "Compare with Nitrogen" }).click();
  await expect(page).toHaveURL(/compare=nitrogen/);
  await expect(page.getByRole("complementary", { name: "Element comparison" })).toContainText("3.04");
  await lesson.getByRole("link", { name: "See the periodic pattern" }).click();
  await expect(page).toHaveURL(/trends.*element=nitrogen/);
  await lesson.getByRole("link", { name: "Explore Carbon Dioxide" }).click();
  await expect(page.getByRole("heading", { name: "Carbon Dioxide", exact: true })).toBeVisible();
  await lesson.getByRole("link", { name: "Make a prediction" }).click();
  await lesson.getByRole("button", { name: "Polar: every molecule with polar bonds is polar" }).click();
  await expect(lesson.getByRole("status")).toHaveText(/Try again/);
  await expect(lesson.getByRole("button", { name: "Finish lesson" })).toHaveCount(0);
  await lesson.getByRole("button", { name: "Non-polar: its opposing bond dipoles cancel" }).click();
  await lesson.getByRole("button", { name: "Finish lesson" }).click();
  await expect(page.getByText("Lesson complete. Keep exploring.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "Review lesson" })).toBeVisible();
});

test("lesson progress resumes from another studio and can be left", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("atomic-atelier:carbon-lesson:v1", "3"));
  await page.goto("/reactions");
  const lesson = page.getByRole("region", { name: "Carbon guided lesson" });
  await expect(lesson).toContainText("Activity 4 of 5");
  await lesson.getByRole("link", { name: "Open this activity" }).click();
  await expect(page).toHaveURL(/molecules\?molecule=carbon-dioxide/);
  await lesson.getByRole("button", { name: "Leave lesson" }).click();
  await expect(lesson).toHaveCount(0);
  await expect(page).not.toHaveURL(/lesson=/);
});

test("energy values agree between element facts, comparison, and trends", async ({ page }) => {
  await page.goto("/?element=carbon&compare=nitrogen");
  await expect(page.locator(".key-facts")).toContainText("1,086.4 kJ/mol");
  await expect(page.getByRole("complementary", { name: "Element comparison" })).toContainText("1,086.4 kJ/mol");
  await page.goto("/trends?property=ionizationEnergy&element=carbon");
  await expect(page.locator(".selected-trend-stat-box")).toContainText("1,086.4 kJ/mol");
  await expect(page.locator(".cross-trend-stats")).toContainText("1,086.4 kJ/mol");
});

test("secondary study tools and explanations are available by keyboard", async ({ page }) => {
  await page.goto("/?element=carbon");
  await page.locator(".more-study-tools > summary").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Orbital filling (Aufbau)", exact: true })).toBeVisible();
  const help = page.getByLabel("Explain Electronegativity", { exact: true });
  await help.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Electronegativity", exact: true })).toContainText("How strongly an atom attracts shared electrons");
});

test("mobile essentials fit and advanced controls open a focused dialog", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "touch layout");
  await page.goto("/?element=carbon");
  await expect(page.locator(".mobile-element-summary")).toBeInViewport();
  const switcher = await page.locator(".viewer-view-switcher").boundingBox();
  const touch = await page.locator(".viewer-shell .mobile-touch-guard").boundingBox();
  expect(switcher!.y + switcher!.height).toBeLessThanOrEqual(touch!.y);
  const trigger = page.getByRole("button", { name: "More", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "More viewer controls" });
  await expect(dialog.getByRole("button", { name: "Ion & Isotope Lab" })).toBeVisible();
  await dialog.getByRole("button", { name: "Explain Valence electrons" }).click();
  const explanation = page.getByRole("dialog", { name: "Valence electrons", exact: true });
  await expect(explanation).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(explanation).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("button", { name: "Ion & Isotope Lab" }).click();
  await expect(page.getByRole("complementary", { name: "Ion and Isotope Builder" })).toBeVisible();
});
