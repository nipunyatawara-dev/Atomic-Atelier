import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("atomic-atelier:tour-complete:v1", "true"));
});

test("desktop navigation has direct links and periodic table header action", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "desktop navigation uses main-nav links and header actions");
  await page.goto("/?element=carbon");

  const elementsLink = page.getByRole("link", { name: "Elements", exact: true });
  await expect(elementsLink).toBeVisible();

  const molecules = page.getByRole("link", { name: "Molecules", exact: true });
  await expect(molecules).toBeVisible();

  const trends = page.getByRole("link", { name: "Trends", exact: true });
  await expect(trends).toBeVisible();

  const reactions = page.getByRole("link", { name: "Reactions", exact: true });
  await expect(reactions).toBeVisible();

  const tableAction = page.getByRole("button", { name: "Periodic table", exact: true });
  await expect(tableAction).toBeVisible();
  await tableAction.click();

  const dialog = page.getByRole("dialog", { name: "The periodic table" });
  await expect(dialog).toBeVisible();
  const view3dLink = dialog.getByRole("link", { name: "View 3D Periodic Trends" });
  await expect(view3dLink).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await reactions.click();
  await expect(page).toHaveURL(/\/reactions$/);
});
