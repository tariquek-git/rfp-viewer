import { test, expect } from "@playwright/test";

test.describe("App Loading", () => {
  test("loads the main page with data", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("BSB Credit Card RFP");
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
  });

  test("shows question count in header", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("header")).toContainText("383");
  });

  test("shows category tabs with counts", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
    // Category tabs are buttons containing text like "All 383"
    const allTab = page.locator("button", { hasText: "All" }).first();
    await expect(allTab).toBeVisible();
  });

  test("shows onboarding on first visit", async ({ page }) => {
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

  test("filters by category tab", async ({ page }) => {
    const allCount = await page.locator("tbody tr").count();
    // Click a category tab in the category bar (not in the grid)
    const loyaltyTab = page.locator("button", { hasText: /^Loyalty/ }).first();
    await loyaltyTab.click();
    await page.waitForTimeout(300);
    const filteredCount = await page.locator("tbody tr").count();
    expect(filteredCount).toBeLessThan(allCount);
  });

  test("search filters questions", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("loyalty");
    await page.waitForTimeout(500);
    const count = await page.locator("tbody tr").count();
    expect(count).toBeLessThan(383);
    expect(count).toBeGreaterThan(0);
  });

  test("confidence filter works", async ({ page }) => {
    // Filters should already be visible by default
    const select = page.locator("select").first();
    await select.selectOption("GREEN");
    await page.waitForTimeout(300);
    const count = await page.locator("tbody tr").count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(383);
  });

  test("reset filters restores all questions", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("loyalty");
    await page.waitForTimeout(300);
    await page.locator("button", { hasText: "Reset" }).click();
    await page.waitForTimeout(300);
    const count = await page.locator("tbody tr").count();
    expect(count).toBeGreaterThanOrEqual(100);
  });

  test("clicking a reference opens detail panel", async ({ page }) => {
    const firstRef = page.locator("tbody tr:first-child button").first();
    await firstRef.click();
    await expect(page.locator(".panel-slide-in")).toBeVisible();
  });

  test("column toggle dropdown opens", async ({ page }) => {
    await page.locator("button", { hasText: "Columns" }).click();
    await expect(page.getByText("Toggle Columns")).toBeVisible();
  });

  test("row checkboxes appear", async ({ page }) => {
    const checkboxes = page.locator('tbody input[type="checkbox"]');
    await expect(checkboxes.first()).toBeVisible();
  });
});

test.describe("Detail Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("rfp-onboarded", "true"));
    await page.reload();
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
    await page.locator("tbody tr:first-child button").first().click();
    await expect(page.locator(".panel-slide-in")).toBeVisible();
  });

  test("shows question details", async ({ page }) => {
    await expect(page.locator(".panel-slide-in")).toContainText("BSB Requirement");
    await expect(page.locator(".panel-slide-in")).toContainText("Response (Bullet)");
  });

  test("has AI Rewrite button", async ({ page }) => {
    await expect(page.locator(".panel-slide-in button", { hasText: "AI Rewrite" }).first()).toBeVisible();
  });

  test("has Critique button", async ({ page }) => {
    await expect(page.locator(".panel-slide-in button", { hasText: "Critique" }).first()).toBeVisible();
  });

  test("close button works", async ({ page }) => {
    await page.locator(".panel-slide-in button", { hasText: "×" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator(".panel-slide-in")).not.toBeVisible();
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
    await page.locator("header button", { hasText: "Dashboard" }).click();
    await expect(page.getByText("Total Questions")).toBeVisible({ timeout: 5000 });
  });

  test("Knowledge Base tab loads", async ({ page }) => {
    await page.locator("header button", { hasText: "KB" }).click();
    await expect(page.getByText("Company Facts")).toBeVisible({ timeout: 5000 });
  });

  test("Pricing tab loads", async ({ page }) => {
    await page.locator("header button", { hasText: "Pricing" }).click();
    await expect(page.getByText("Pricing Model")).toBeVisible({ timeout: 5000 });
  });

  test("Timeline tab loads", async ({ page }) => {
    await page.locator("header button", { hasText: "Timeline" }).click();
    await expect(page.getByText("Implementation Timeline")).toBeVisible({ timeout: 5000 });
  });

  test("SLA tab loads", async ({ page }) => {
    await page.locator("header button", { hasText: "SLA" }).click();
    await expect(page.getByText("SLA Framework")).toBeVisible({ timeout: 5000 });
  });

  test("Compliance tab loads", async ({ page }) => {
    await page.locator("header button", { hasText: "Compliance" }).click();
    await expect(page.getByText("Compliance Matrix")).toBeVisible({ timeout: 5000 });
  });

  test("Submit tab loads", async ({ page }) => {
    await page.locator("header button", { hasText: "Submit" }).click();
    await expect(page.getByText("Submission Preview")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Modals and Panels", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("rfp-onboarded", "true"));
    await page.reload();
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
  });

  test("Rules panel opens", async ({ page }) => {
    // The Rules button is in the header with a BookOpen icon
    const rulesBtn = page.locator("header button").filter({ hasText: /Rules/ }).first();
    if (await rulesBtn.isVisible()) {
      await rulesBtn.click();
      await expect(page.getByText("Writing Rules")).toBeVisible({ timeout: 5000 });
    }
  });

  test("keyboard shortcuts modal opens with ?", async ({ page }) => {
    // Click somewhere non-input first
    await page.locator("h1").click();
    await page.keyboard.press("?");
    await expect(page.getByText("Keyboard Shortcuts")).toBeVisible({ timeout: 3000 });
  });

  test("submission checklist opens", async ({ page }) => {
    await page.locator('header button[title="Submission Checklist"]').click();
    await expect(page.getByText("Submission Readiness")).toBeVisible({ timeout: 5000 });
  });

  test("win themes panel opens", async ({ page }) => {
    await page.locator('header button[title="Win Themes"]').click();
    await expect(page.getByText("Win Themes")).toBeVisible({ timeout: 5000 });
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
    await page.locator("button", { hasText: "CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("rfp_export.csv");
  });

  test("JSON export triggers download", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.locator("button", { hasText: "JSON" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("rfp_export.json");
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

  test("search filter is responsive (< 1000ms)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
    const beforeCount = await page.locator("tbody tr").count();
    const start = Date.now();
    await page.locator('input[placeholder*="Search"]').fill("partner");
    await page.waitForTimeout(300);
    const filterTime = Date.now() - start;
    expect(filterTime).toBeLessThan(1000);
    const afterCount = await page.locator("tbody tr").count();
    expect(afterCount).toBeLessThan(beforeCount);
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
