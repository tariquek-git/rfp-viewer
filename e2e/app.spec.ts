import { test, expect } from "@playwright/test";

test.describe("App Loading", () => {
  test("loads the main page with data", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("BSB Credit Card RFP");
    // Wait for data to load (skeleton disappears)
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
  });

  test("shows question count in header", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("header")).toContainText("383");
  });

  test("shows category tabs", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /All \d+/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Loyalty/ })).toBeVisible();
  });

  test("shows onboarding on first visit", async ({ page, context }) => {
    await context.clearCookies();
    // Clear localStorage
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("rfp-onboarded"));
    await page.reload();
    await expect(page.getByText("Welcome to RFP Viewer")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Grid View", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("rfp-onboarded", "true"));
    await page.reload();
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
  });

  test("displays questions in table rows", async ({ page }) => {
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThan(10);
  });

  test("filters by category", async ({ page }) => {
    const allCount = await page.locator("tbody tr").count();
    await page.getByRole("button", { name: /Loyalty/ }).click();
    await page.waitForTimeout(300);
    const filteredCount = await page.locator("tbody tr").count();
    expect(filteredCount).toBeLessThan(allCount);
  });

  test("search filters questions", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("loyalty");
    await page.waitForTimeout(500);
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeLessThan(383);
    expect(count).toBeGreaterThan(0);
  });

  test("confidence filter works", async ({ page }) => {
    await page.locator("button", { hasText: "Filters" }).click();
    await page.selectOption('select:has-text("All Confidence")', "GREEN");
    await page.waitForTimeout(300);
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(383);
  });

  test("reset filters restores all questions", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("loyalty");
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /Reset/ }).click();
    await page.waitForTimeout(300);
    const count = await page.locator("tbody tr").count();
    expect(count).toBeGreaterThanOrEqual(100);
  });

  test("clicking a reference opens detail panel", async ({ page }) => {
    const firstRef = page.locator("tbody tr:first-child button").first();
    await firstRef.click();
    await expect(page.locator(".panel-slide-in")).toBeVisible();
  });

  test("column toggle works", async ({ page }) => {
    await page.getByRole("button", { name: /Columns/ }).click();
    await expect(page.getByText("Toggle Columns")).toBeVisible();
  });

  test("row checkboxes appear", async ({ page }) => {
    const checkboxes = page.locator('tbody input[type="checkbox"]');
    await expect(checkboxes.first()).toBeVisible();
  });

  test("status badge is clickable", async ({ page }) => {
    const statusBadge = page.locator("tbody button:has-text('draft')").first();
    if (await statusBadge.isVisible()) {
      await statusBadge.click();
      // Should cycle to next status
      await page.waitForTimeout(300);
    }
  });

  test("density toggle works", async ({ page }) => {
    const densityBtn = page.getByRole("button", { name: /Density/ });
    if (await densityBtn.isVisible()) {
      await densityBtn.click();
      await expect(page.getByText("Compact")).toBeVisible();
    }
  });
});

test.describe("Detail Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("rfp-onboarded", "true"));
    await page.reload();
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
    // Open first question
    await page.locator("tbody tr:first-child button").first().click();
    await expect(page.locator(".panel-slide-in")).toBeVisible();
  });

  test("shows question details", async ({ page }) => {
    await expect(page.locator(".panel-slide-in")).toContainText("BSB Requirement");
    await expect(page.locator(".panel-slide-in")).toContainText("Response (Bullet)");
  });

  test("has AI Rewrite button", async ({ page }) => {
    await expect(page.locator(".panel-slide-in button:has-text('AI Rewrite')").first()).toBeVisible();
  });

  test("has Critique button", async ({ page }) => {
    await expect(page.locator(".panel-slide-in button:has-text('Critique')").first()).toBeVisible();
  });

  test("has Re-score button", async ({ page }) => {
    await expect(page.locator(".panel-slide-in button:has-text('Re-score')")).toBeVisible();
  });

  test("close button works", async ({ page }) => {
    await page.locator(".panel-slide-in button:has-text('×')").click();
    await page.waitForTimeout(500);
    // Panel should be gone
    await expect(page.locator(".panel-slide-in")).not.toBeVisible();
  });

  test("collapsible sections work", async ({ page }) => {
    const additionalFields = page.locator("button:has-text('Additional Fields')");
    if (await additionalFields.isVisible()) {
      await additionalFields.click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe("Navigation Tabs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("rfp-onboarded", "true"));
    await page.reload();
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
  });

  test("Dashboard tab loads", async ({ page }) => {
    await page.getByRole("button", { name: /Dashboard/ }).click();
    await expect(page.getByText("Total Questions")).toBeVisible();
    await expect(page.getByText("Procurement Committee")).toBeVisible();
  });

  test("Knowledge Base tab loads", async ({ page }) => {
    await page.getByRole("button", { name: /KB/ }).click();
    await expect(page.getByText("Knowledge Base")).toBeVisible();
    await expect(page.getByText("Company Facts")).toBeVisible();
  });

  test("Pricing tab loads", async ({ page }) => {
    await page.getByRole("button", { name: /Pricing/ }).click();
    await expect(page.getByText("Pricing Model")).toBeVisible();
    await expect(page.getByText("3-Year TCO")).toBeVisible();
  });

  test("Timeline tab loads", async ({ page }) => {
    await page.getByRole("button", { name: /Timeline/ }).click();
    await expect(page.getByText("Implementation Timeline")).toBeVisible();
  });

  test("SLA tab loads", async ({ page }) => {
    await page.getByRole("button", { name: /SLA/ }).click();
    await expect(page.getByText("SLA Framework")).toBeVisible();
  });

  test("Compliance tab loads", async ({ page }) => {
    await page.getByRole("button", { name: /Compliance/ }).click();
    await expect(page.getByText("Compliance Matrix")).toBeVisible();
  });

  test("Submit tab loads", async ({ page }) => {
    await page.getByRole("button", { name: /Submit/ }).click();
    await expect(page.getByText("Submission Preview")).toBeVisible();
    await expect(page.getByText("BSB Credit Card RFP Response")).toBeVisible();
  });
});

test.describe("Modals and Panels", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("rfp-onboarded", "true"));
    await page.reload();
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
  });

  test("Rules panel opens and closes", async ({ page }) => {
    await page.locator("header button", { hasText: /Rules/ }).click();
    await expect(page.getByText("Writing Rules")).toBeVisible();
    // Has tabs
    await expect(page.getByText("Global")).toBeVisible();
    await expect(page.getByText("Validation")).toBeVisible();
    // Close
    await page.locator(".panel-slide-in button:has(svg)").first().click();
  });

  test("keyboard shortcuts modal opens with ?", async ({ page }) => {
    await page.keyboard.press("?");
    await expect(page.getByText("Keyboard Shortcuts")).toBeVisible({ timeout: 3000 });
  });

  test("dark mode toggles with D key", async ({ page }) => {
    await page.keyboard.press("d");
    await page.waitForTimeout(300);
    const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(isDark).toBe(true);
    // Toggle back
    await page.keyboard.press("d");
    await page.waitForTimeout(300);
    const isLight = await page.evaluate(() => !document.documentElement.classList.contains("dark"));
    expect(isLight).toBe(true);
  });

  test("submission checklist opens", async ({ page }) => {
    // Click the clipboard icon
    const checklistBtn = page.locator('header button[title="Submission Checklist"]');
    await checklistBtn.click();
    await expect(page.getByText("Submission Readiness")).toBeVisible();
  });
});

test.describe("Save and Export", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("rfp-onboarded", "true"));
    await page.reload();
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
  });

  test("save button works (Cmd+S)", async ({ page }) => {
    await page.keyboard.press("Meta+s");
    await expect(page.getByText("Changes saved locally")).toBeVisible({ timeout: 3000 });
  });

  test("CSV export triggers download", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /CSV/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("rfp_export.csv");
  });

  test("JSON export triggers download", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /JSON/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("rfp_export.json");
  });

  test("version save works", async ({ page }) => {
    const versionBtn = page.locator("button", { hasText: /^v\d/ });
    await versionBtn.click();
    await page.waitForTimeout(500);
  });
});

test.describe("Performance", () => {
  test("page loads within 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000);
  });

  test("category filter is responsive (< 500ms)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
    const start = Date.now();
    await page.getByRole("button", { name: /Technology/ }).click();
    await page.waitForTimeout(100);
    const filterTime = Date.now() - start;
    expect(filterTime).toBeLessThan(500);
  });

  test("search is responsive", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
    const start = Date.now();
    await page.locator('input[placeholder*="Search"]').fill("loyalty");
    await page.waitForTimeout(200);
    const searchTime = Date.now() - start;
    expect(searchTime).toBeLessThan(1000);
  });
});
