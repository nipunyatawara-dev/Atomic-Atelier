import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme} mobile studios`, () => {
    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "mobile", "mobile-specific layouts and touch interaction");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript((mode) => {
        localStorage.setItem("atomic-atelier-theme", mode);
        localStorage.setItem("atomic-atelier:tour-complete:v1", "true");
        localStorage.setItem("atomic-atelier:v1", JSON.stringify({ autoRotate: false }));
      }, theme);
    });

    test("narrow header keeps its picker readable and all utilities accessible", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 740 });
      await page.goto("/?element=carbon");
      const picker = page.getByRole("button", { name: "Elements", exact: true });
      await expect(picker).toBeVisible();
      expect((await picker.boundingBox())!.width).toBeGreaterThanOrEqual(100);
      await page.getByRole("button", { name: "Tools", exact: true }).click();
      const tools = page.getByRole("dialog", { name: "Tools", exact: true });
      await expect(tools.getByRole("button", { name: `Switch to ${theme === "light" ? "dark" : "light"} mode` })).toBeVisible();
      await tools.getByRole("button", { name: "Periodic table", exact: true }).click();
      await expect(page.getByRole("grid", { name: "Periodic table of elements" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Tools", exact: true })).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
      await page.goto("/molecules?molecule=water");
      const controls = page.getByLabel("Molecule viewer tools", { exact: true });
      await expect(controls).toBeVisible();
      const bounds = await controls.boundingBox();
      const navigation = await page.getByRole("navigation", { name: "Mobile navigation" }).boundingBox();
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(navigation!.y);
    });

    test("lesson invitation dismissal persists and the lesson remains discoverable", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Hide lesson invitation" }).click();
      await page.goto("/molecules");
      await expect(page.getByRole("region", { name: "Guided chemistry lesson" })).toHaveCount(0);
      await page.getByRole("button", { name: "Tools", exact: true }).click();
      await page.getByRole("link", { name: "Guided lesson", exact: true }).click();
      await expect(page.getByRole("region", { name: "Carbon guided lesson" })).toBeVisible();
    });

    test("viewers scroll by default and opt into rotation without covering their badges", async ({ page }) => {
      for (const path of ["/?element=carbon", "/molecules?molecule=water", "/reactions?reaction=water-synthesis"]) {
        await page.goto(path);
        const canvas = page.locator("canvas").first();
        await expect(canvas).toHaveCSS("touch-action", "pan-y");
        await page.getByRole("button", { name: "Rotate model", exact: true }).click();
        await expect(canvas).toHaveCSS("touch-action", "none");
        await page.getByRole("button", { name: "Done rotating", exact: true }).click();
        await expect(canvas).toHaveCSS("pointer-events", "none");
        const overlap = await page.evaluate(() => {
          const guard = document.querySelector(".mobile-touch-guard")!.getBoundingClientRect();
          const badges = [...document.querySelectorAll(".viewer-floating-top, .reaction-side, .viewer-view-switcher")];
          return badges.some((badge) => { const rect = badge.getBoundingClientRect(); return rect.left < guard.right && rect.right > guard.left && rect.top < guard.bottom && rect.bottom > guard.top; });
        });
        expect(overlap).toBe(false);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      }
    });

    test("fullscreen keeps the live model and supports its controls", async ({ page }) => {
      await page.goto("/?element=carbon");
      const canvas = page.locator("canvas");
      await canvas.evaluate((element) => element.dataset.modelIdentity = "original");
      await page.getByRole("button", { name: "Fullscreen model", exact: true }).click();
      await expect(page.locator(".viewer-shell")).toHaveClass(/is-expanded/);
      const bounds = await page.locator(".viewer-shell").boundingBox();
      expect(bounds!.width).toBe(390);
      await page.getByRole("button", { name: "More", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "More viewer controls" })).toBeVisible();
      await page.getByRole("button", { name: "Close dialog", exact: true }).click();
      await page.getByRole("button", { name: "Exit fullscreen model", exact: true }).click();
      await expect(page.locator(".viewer-shell")).not.toHaveClass(/is-expanded/);
      await expect(canvas).toHaveAttribute("data-model-identity", "original");
    });

    test("molecule essential controls and advanced settings are reachable", async ({ page }) => {
      await page.goto("/molecules?molecule=water");
      const contrast = await page.locator(".stage-topbar .quiz-action-btn").evaluate((element) => {
        const style = getComputedStyle(element);
        const luminance = (color: string) => {
          const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((value) => {
            const channel = value / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
          });
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        };
        const foreground = luminance(style.color), background = luminance(style.backgroundColor);
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
      expect(contrast).toBeGreaterThanOrEqual(4.5);
      const toolbar = page.getByLabel("Molecule viewer tools", { exact: true });
      await expect(toolbar.getByRole("button", { name: "Lone pairs", exact: true })).toHaveAttribute("aria-pressed", "true");
      await toolbar.getByRole("button", { name: "Net dipole", exact: true }).click();
      await expect(toolbar.getByRole("button", { name: "Net dipole", exact: true })).toHaveAttribute("aria-pressed", "false");
      await toolbar.getByRole("button", { name: "More", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Molecule controls" });
      await dialog.getByLabel("Model representation").selectOption("space-filling");
      await dialog.getByRole("button", { name: "Measure angle", exact: true }).click();
      await expect(page.getByText("Select 3 atoms (0/3)")).toBeVisible();
      await expect(page.locator("canvas")).toHaveCSS("touch-action", "none");
    });

    test("focused trends show actual values and preserve full-table exploration", async ({ page }) => {
      await page.goto("/trends");
      const table = page.getByRole("region", { name: "Focused periodic trends" });
      await expect(table.getByRole("button", { name: /Carbon/ })).toContainText("2.55");
      await table.getByRole("button", { name: /Nitrogen/ }).click();
      await expect(page.locator(".selected-trend-stat-box")).toContainText("3.04");
      await page.getByRole("combobox", { name: "Trend property", exact: true }).selectOption("ionizationEnergy");
      await expect(table.getByRole("button", { name: /Carbon/ })).toContainText("1,086.4 kJ/mol");
      await table.getByRole("combobox", { name: "Trend comparison direction" }).selectOption("group");
      await expect(table.getByRole("button", { name: /Phosphorus/ })).toBeVisible();
      await page.getByRole("combobox", { name: "Trend view", exact: true }).selectOption("elevation-3d");
      await expect(page.locator(".elevation-floating-top")).toBeVisible();
      const legend = await page.locator(".palette-gradient-bar").evaluate((element) => {
        const parent = element.getBoundingClientRect();
        return [...element.querySelectorAll(".gradient-labels span")].every((label) => { const rect = label.getBoundingClientRect(); return rect.left >= parent.left && rect.right <= parent.right; });
      });
      expect(legend).toBe(true);
      await page.getByText("Display settings", { exact: true }).click();
      await expect(page.getByRole("combobox", { name: "Color Palette" })).toBeVisible();
    });

    test("resource pages and collapsed footer groups remain discoverable", async ({ page }) => {
      await page.goto("/?element=carbon");
      await page.getByRole("button", { name: "Show resource 2: Periodic trend", exact: true }).click();
      await expect(page.getByRole("button", { name: "Show resource 2: Periodic trend", exact: true })).toHaveAttribute("aria-current", "page");
      await expect(page.locator(".learning-cards-header-mobile")).toContainText("2 of 6");
      const footer = page.getByRole("contentinfo");
      await expect(footer.locator("details[open]")).toHaveCount(0);
      expect((await footer.boundingBox())!.height).toBeLessThan(650);
      await footer.locator("summary").filter({ hasText: "Data & Standards" }).click();
      await expect(footer.getByRole("link", { name: /PubChem Periodic Table/ })).toBeVisible();
    });
  });
}
