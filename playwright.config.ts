import { defineConfig, devices } from "@playwright/test";
import path from "path";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3002";
export const STORAGE_STATE = path.join(__dirname, "e2e/.auth-state.json");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // 1. Auth setup runs first, saves storage state
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    // 2. All tests run authenticated
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: STORAGE_STATE,
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev -- -p 3002",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 45_000,
  },
});
