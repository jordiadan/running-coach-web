import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "onboarding.spec.ts",
  workers: 1,
  timeout: 60_000,
  reporter: "list",
  outputDir: "../.design-experiment/onboarding/results",
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    video: process.env.RECORD_MOTION ? { mode: "on", size: { width: 1440, height: 1000 } } : "off",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
  },
});
