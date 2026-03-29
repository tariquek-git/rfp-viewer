/**
 * Global auth setup — logs in once, saves storage state so all tests
 * start already authenticated.
 */
import { test as setup } from '@playwright/test';
import { STORAGE_STATE } from '../playwright.config';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[type="password"]').fill('brim2026');
  await page.locator('button[type="submit"]').click();
  // Wait for redirect to the main app
  await page.waitForURL('/', { timeout: 10_000 });
  await page.context().storageState({ path: STORAGE_STATE });
});
