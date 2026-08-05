import { expect, test } from "@playwright/test";

test("desktop navigation menus are anchored, dismissible, and keyboard friendly", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "desktop navigation uses disclosure menus");
  await page.goto("/?element=carbon");

  const explore = page.getByRole("button", { name: "Explore", exact: true });
  const exploreMenu = page.getByRole("group", { name: "Explore menu" });
  await explore.click();
  await expect(explore).toHaveAttribute("aria-expanded", "true");
  await expect(exploreMenu).toBeVisible();
  await expect(exploreMenu.getByRole("link", { name: /Element explorer/ })).toBeVisible();
  await expect(exploreMenu.getByRole("button", { name: /Periodic table/ })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(explore).toHaveAttribute("aria-expanded", "false");
  await expect(explore).toBeFocused();
  await expect(exploreMenu).toBeHidden();

  const reactions = page.getByRole("button", { name: "Reactions", exact: true });
  await reactions.click();
  await expect(page.getByRole("group", { name: "Reactions menu" })).toBeVisible();
  await page.getByRole("link", { name: "Atomic Atelier home" }).click();
  await expect(reactions).toHaveAttribute("aria-expanded", "false");
});
