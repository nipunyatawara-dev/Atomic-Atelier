import { expect, test } from "@playwright/test";

test("explorer synchronizes selection, comparison, and saved progress", async ({ page }) => {
  await page.goto("/?element=carbon");
  await expect(page.getByRole("heading", { name: "Carbon", exact: true })).toBeVisible();
  if ((page.viewportSize()?.width ?? 1200) <= 760) await page.getByRole("button", { name: "Elements", exact: true }).click();
  await page.getByPlaceholder("Name, symbol, number…").fill("oxygen");
  await page.getByRole("button", { name: /Oxygen Nonmetal/i }).click();
  await expect(page).toHaveURL(/element=oxygen/);
  await expect(page.getByRole("heading", { name: "Oxygen", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save Oxygen" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Remove Oxygen from saved elements" })).toBeVisible();
});

test("periodic table supports keyboard navigation and escape", async ({ page }) => {
  await page.goto("/");
  const mobile = (page.viewportSize()?.width ?? 1200) <= 760;
  if (mobile) {
    await page.getByRole("button", { name: "Table", exact: true }).click();
  } else {
    await page.getByRole("button", { name: "Explore", exact: true }).click();
    await page.getByRole("group", { name: "Explore menu" }).getByRole("button", { name: /Periodic table/ }).click();
  }
  const grid = page.getByRole("grid", { name: "Periodic table of elements" });
  const bounds = await grid.boundingBox();
  const viewport = page.viewportSize();
  expect(bounds).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport!.height + 1);
  const carbon = page.getByRole("gridcell", { name: /Carbon, C, atomic number 6/ });
  await carbon.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("gridcell", { name: /Nitrogen, N, atomic number 7/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("reaction animation remains gated until balanced", async ({ page }) => {
  await page.goto("/reactions?reaction=water-synthesis");
  const animate = page.getByRole("button", { name: "Animate" });
  await expect(animate).toBeDisabled();
  await page.getByRole("button", { name: "Hint" }).click();
  await page.getByRole("button", { name: "Hint" }).click();
  await expect(animate).toBeEnabled();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByText(/Every atom is conserved/)).toBeVisible();
  await animate.click();
  await expect(page.getByText("products", { exact: true })).toBeVisible();
});

test("invalid query values canonicalize safely", async ({ page }) => {
  await page.goto("/?element=1");
  await expect(page).toHaveURL(/element=hydrogen/);
  await page.goto("/?element=999");
  await expect(page).toHaveURL(/element=carbon/);
  await expect(page.getByRole("heading", { name: "Carbon", exact: true })).toBeVisible();
  await page.goto("/reactions?reaction=not-real");
  await expect(page).toHaveURL(/reaction=water-synthesis/);
  await page.goto("/?element=oxygen&compare=not-real");
  await expect(page).toHaveURL(/element=oxygen&compare=carbon/);
});

test("the atom canvas accepts keyboard rotation controls", async ({ page }) => {
  await page.goto("/?element=carbon");
  const canvas = page.getByLabel(/Interactive simplified atomic model/);
  await canvas.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("+");
  await expect(canvas).toBeFocused();
});

test("structure guide presents particle details without canvas hotspots", async ({ page }) => {
  await page.goto("/?element=lithium");
  await expect(page.getByRole("button", { name: /Learn about the/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Structure guide" }).click();
  await page.getByRole("tab", { name: "Electron" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("3 electrons make the neutral atom electrically balanced.");
  await page.getByRole("button", { name: "Close structure guide" }).click();
  await expect(page.getByRole("tabpanel")).toHaveCount(0);
});

test("element changes use a staged transition", async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem("atomic-atelier:intro-seen", "true"));
  await page.goto("/?element=carbon");
  if ((page.viewportSize()?.width ?? 1200) <= 760) await page.getByRole("button", { name: "Elements", exact: true }).click();
  await page.getByPlaceholder("Name, symbol, number…").fill("nitrogen");
  await page.getByRole("button", { name: /Nitrogen Nonmetal/i }).click();
  expect(new URL(page.url()).searchParams.get("element")).toBe("carbon");
  await expect(page).toHaveURL(/element=nitrogen/);
  await expect(page.getByRole("heading", { name: "Nitrogen", exact: true })).toBeVisible();
  await expect(page.locator("main.app-shell")).toHaveAttribute("aria-busy", "false");
});

test("first-visit choreography completes once per session", async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.removeItem("atomic-atelier:intro-seen"));
  await page.goto("/?element=carbon");
  await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem("atomic-atelier:intro-seen"))).toBe("true");
  await expect(page.locator(".viewer-shell")).toHaveCSS("opacity", "1");
});

test("mobile element drawer manages focus and Escape", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only drawer behavior");
  await page.goto("/?element=carbon");
  const trigger = page.getByRole("button", { name: "Elements", exact: true });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Element library" })).toBeVisible();
  await expect(page.getByPlaceholder("Name, symbol, number…")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Element library" })).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("primary routes render without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?element=carbon");
  await expect(page.getByRole("heading", { name: "Carbon", exact: true })).toBeVisible();
  await page.goto("/reactions?reaction=water-synthesis");
  await expect(page.getByRole("heading", { name: "Making water", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("publishes browser icons and social preview metadata", async ({ page }) => {
  await page.goto("/?element=carbon");
  const favicon = page.locator('link[rel="icon"][href*="favicon.ico"]');
  await expect(favicon).toHaveCount(1);
  const faviconResponse = await page.request.get((await favicon.getAttribute("href"))!);
  expect(faviconResponse.status()).toBe(200);
  expect(faviconResponse.headers()["content-type"]).toContain("image/x-icon");
  await expect(page.locator('link[rel="icon"][href*="icon.png"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"][href*="apple-icon.png"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /atomic-atelier-share\.png/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
});

test("mobile explorer sustains the release frame-rate floor", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile performance smoke test");
  await page.goto("/?element=oganesson");
  await expect(page.getByRole("heading", { name: "Oganesson", exact: true })).toBeVisible();
  const fps = await page.evaluate(() => new Promise<number>((resolve) => {
    let frames = 0;
    const started = performance.now();
    const tick = (now: number) => {
      frames += 1;
      if (now - started >= 1000) resolve((frames * 1000) / (now - started));
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }));
  expect(fps).toBeGreaterThanOrEqual(30);
});

test("offers a semantic atom model when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { configurable: true, value: () => null });
  });
  await page.goto("/?element=carbon");
  await expect(page.getByRole("img", { name: /Simplified shell diagram for Carbon/ })).toBeVisible();
});
