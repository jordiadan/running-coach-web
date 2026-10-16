import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "onboarding.spec.ts",
  workers: 1,
  timeout: 60_000,
  reporter: "list",
  outputDir: "../.design-experiment/onboarding/results",
  use: { baseURL: "http://127.0.0.1:5173", headless: true },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
  },
});
