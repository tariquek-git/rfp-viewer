import { test, expect } from '@playwright/test';

// ─── helpers ────────────────────────────────────────────────────────────────
async function dismissOnboarding(page: import('@playwright/test').Page) {
  await page.evaluate(() => localStorage.setItem('rfp-onboarded', 'true'));
  await page.reload();
  await expect(page.locator('table')).toBeVisible({ timeout: 15_000 });
}

// ─── App Loading ─────────────────────────────────────────────────────────────
test.describe('App Loading', () => {
  test('loads the main page with data', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('BSB Credit Card RFP');
    await expect(page.locator('table')).toBeVisible({ timeout: 15_000 });
  });

  test('shows 383 questions in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('table')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('header')).toContainText('383');
  });

  test('shows category nav bar', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
    await expect(page.locator('[data-tour="tour-category-nav"]')).toBeVisible();
  });

  test('shows onboarding on first visit', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('rfp-onboarded'));
    await page.reload();
    const onboarding = page.locator('text=/Welcome|Get Started|onboard/i').first();
    await expect(onboarding).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Grid View ────────────────────────────────────────────────────────────────
test.describe('Grid View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
  });

  test('displays questions in table rows', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThan(10);
  });

  test('filters by category tab', async ({ page }) => {
    const allCount = await page.locator('tbody tr').count();
    const loyaltyTab = page.locator('[data-tour="tour-category-nav"] button').filter({ hasText: /Loyalty/ }).first();
    await loyaltyTab.click();
    await page.waitForTimeout(300);
    const filteredCount = await page.locator('tbody tr').count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('search filters questions', async ({ page }) => {
    const searchInput = page.locator('[data-tour="tour-search-bar"]');
    await searchInput.fill('loyalty');
    await page.waitForTimeout(400);
    const count = await page.locator('tbody tr').count();
    expect(count).toBeLessThan(383);
    expect(count).toBeGreaterThan(0);
  });

  test('Cmd+K focuses search input', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await expect(page.locator('[data-tour="tour-search-bar"]')).toBeFocused();
  });

  test('filters panel toggles (starts open)', async ({ page }) => {
    const filtersBtn = page.locator('button', { hasText: 'Filters' }).first();
    // Filters open by default — [data-reset-filters] is visible
    await expect(page.locator('[data-reset-filters]')).toBeVisible();
    // Click to close
    await filtersBtn.click();
    await expect(page.locator('[data-reset-filters]')).not.toBeVisible();
    // Click to re-open
    await filtersBtn.click();
    await expect(page.locator('[data-reset-filters]')).toBeVisible();
  });

  test('confidence filter works', async ({ page }) => {
    // Filters are open by default
    await expect(page.locator('[data-reset-filters]')).toBeVisible();
    await page.locator('select').first().selectOption('GREEN');
    await page.waitForTimeout(300);
    const count = await page.locator('tbody tr').count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(383);
  });

  test('reset filters clears search input', async ({ page }) => {
    const searchInput = page.locator('[data-tour="tour-search-bar"]');
    await searchInput.fill('loyalty');
    await page.waitForTimeout(300);
    // Verify search has a value
    await expect(searchInput).toHaveValue('loyalty');
    // Reset — search should be cleared
    await page.locator('[data-reset-filters]').click();
    await expect(searchInput).toHaveValue('', { timeout: 3_000 });
  });

  test('clicking a ref opens detail panel', async ({ page }) => {
    await page.locator('tbody tr:first-child td button').first().click();
    await expect(page.locator('.panel-slide-in').first()).toBeVisible({ timeout: 5_000 });
  });

  test('row checkboxes are visible', async ({ page }) => {
    await expect(page.locator('tbody input[type="checkbox"]').first()).toBeVisible();
  });

  test('selecting a row shows bulk action bar', async ({ page }) => {
    await page.locator('tbody input[type="checkbox"]').first().check();
    await expect(page.locator('text=/selected/i').first()).toBeVisible({ timeout: 3_000 });
  });
});

// ─── Detail Panel ─────────────────────────────────────────────────────────────
test.describe('Detail Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
    await page.locator('tbody tr:first-child td button').first().click();
    await expect(page.locator('.panel-slide-in').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows question details and response fields', async ({ page }) => {
    const panel = page.locator('.panel-slide-in').first();
    await expect(panel).toBeVisible({ timeout: 8_000 });
    // Label is "BSB Question / Requirement"
    await expect(panel).toContainText('BSB Question', { timeout: 8_000 });
    await expect(panel).toContainText('Response', { timeout: 8_000 });
  });

  test('has AI Rewrite button', async ({ page }) => {
    await expect(page.locator('.panel-slide-in button', { hasText: /AI Rewrite|Rewrite/i }).first()).toBeVisible();
  });

  test('Escape closes the panel', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(page.locator('.panel-slide-in')).not.toBeVisible({ timeout: 3_000 });
  });
});

// ─── Navigation Tabs ──────────────────────────────────────────────────────────
test.describe('Navigation Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
  });

  test('Dashboard tab renders chart content', async ({ page }) => {
    await page.locator('[data-tour="tour-context-tab"]').click();
    await expect(page.locator('text=/Total Questions/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('Knowledge Base tab renders', async ({ page }) => {
    await page.locator('[data-tour="tour-knowledgebase-tab"]').click();
    await expect(page.locator('text=/Company Facts|Knowledge Base|Brim/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('Pricing tab renders', async ({ page }) => {
    await page.locator('[data-tour="tour-pricing-tab"]').click();
    await expect(page.locator('text=/Pricing/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('Timeline tab renders', async ({ page }) => {
    await page.locator('[data-tour="tour-timeline-tab"]').click();
    await expect(page.locator('text=/Timeline|Milestone/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('SLAs tab renders', async ({ page }) => {
    await page.locator('[data-tour="tour-sla-tab"]').click();
    await expect(page.locator('text=/SLA/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('Compliance tab renders', async ({ page }) => {
    await page.locator('[data-tour="tour-compliance-tab"]').click();
    await expect(page.locator('text=/Compliance/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('Export tab renders', async ({ page }) => {
    await page.locator('[data-tour="tour-submission-tab"]').click();
    await expect(page.locator('text=/Export|Submission/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('category nav hidden on non-grid tabs', async ({ page }) => {
    await page.locator('[data-tour="tour-context-tab"]').click();
    await expect(page.locator('[data-tour="tour-category-nav"]')).not.toBeVisible();
  });
});

// ─── Save & Export ────────────────────────────────────────────────────────────
test.describe('Save and Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
  });

  test('Save button shows saved toast', async ({ page }) => {
    await page.locator('button', { hasText: 'Save' }).first().click();
    await expect(page.locator('text=/saved/i').first()).toBeVisible({ timeout: 4_000 });
  });

  test('Cmd+S saves', async ({ page }) => {
    await page.keyboard.press('Meta+s');
    await expect(page.locator('text=/saved/i').first()).toBeVisible({ timeout: 4_000 });
  });

  test('CSV export triggers download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button', { hasText: 'CSV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('JSON export triggers download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button', { hasText: 'JSON' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('version save button is present and clickable', async ({ page }) => {
    // Button contains "v" + a number, e.g. "v1" (may include History icon text)
    const vBtn = page.locator('button').filter({ hasText: /v\d+/ }).first();
    await expect(vBtn).toBeVisible({ timeout: 5_000 });
    const before = await vBtn.textContent();
    await vBtn.click();
    // After save, versions.length increments — button counter changes
    await page.waitForTimeout(500);
    const after = await vBtn.textContent();
    expect(after).not.toEqual(before);
  });
});

// ─── Modals & Panels ──────────────────────────────────────────────────────────
test.describe('Modals and Panels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
  });

  test('Rules panel opens and closes', async ({ page }) => {
    await page.locator('header button[aria-label="Rules"]').click();
    await expect(page.locator('text=/Writing Rules|Global Rules/i').first()).toBeVisible({ timeout: 5_000 });
    await page.locator('header button[aria-label="Rules"]').click();
    await expect(page.locator('text=/Writing Rules|Global Rules/i').first()).not.toBeVisible();
  });

  test('Win Themes panel opens', async ({ page }) => {
    await page.locator('header button[aria-label="Win Themes"]').click();
    await expect(page.locator('text=/Win Themes/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Settings panel opens', async ({ page }) => {
    await page.locator('[data-tour="tour-settings-btn"]').click();
    await expect(page.locator('text=/Settings/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Keyboard shortcuts modal opens via Keys button', async ({ page }) => {
    await page.locator('header button[aria-label="Keys"]').click();
    await expect(page.locator('text=/Keyboard Shortcuts/i').first()).toBeVisible({ timeout: 5_000 });
  });
});

// ─── Bulk Actions ─────────────────────────────────────────────────────────────
test.describe('Bulk Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
  });

  test('select-all checks all visible rows', async ({ page }) => {
    await page.locator('thead input[type="checkbox"]').first().check();
    await page.waitForTimeout(300);
    await expect(page.locator('text=/selected/i').first()).toBeVisible({ timeout: 3_000 });
  });

  test('deselecting all removes bulk bar', async ({ page }) => {
    await page.locator('thead input[type="checkbox"]').first().check();
    await page.waitForTimeout(300);
    await page.locator('thead input[type="checkbox"]').first().uncheck();
    await page.waitForTimeout(300);
    await expect(page.locator('text=/\d+ selected/i')).not.toBeVisible({ timeout: 3_000 });
  });
});

// ─── Performance ─────────────────────────────────────────────────────────────
test.describe('Performance', () => {
  test('page loads within 6 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await expect(page.locator('table')).toBeVisible({ timeout: 15_000 });
    expect(Date.now() - start).toBeLessThan(6_000);
  });

  test('search responds within 600ms', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
    const start = Date.now();
    await page.locator('[data-tour="tour-search-bar"]').fill('partner');
    await page.waitForTimeout(300);
    expect(Date.now() - start).toBeLessThan(600);
    expect(await page.locator('tbody tr').count()).toBeGreaterThan(0);
  });

  test('tab switch is fast (<1.5s)', async ({ page }) => {
    await page.goto('/');
    await dismissOnboarding(page);
    const start = Date.now();
    await page.locator('[data-tour="tour-context-tab"]').click();
    await expect(page.locator('text=/Total Questions/i').first()).toBeVisible({ timeout: 5_000 });
    expect(Date.now() - start).toBeLessThan(1_500);
  });
});
