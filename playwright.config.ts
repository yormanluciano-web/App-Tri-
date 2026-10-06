import { defineConfig, devices } from "@playwright/test";

// Las pruebas E2E corren contra el build de producción (npm run build && npm run preview).
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: 3,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [
    { name: "chromium-movil", use: { ...devices["Pixel 7"], browserName: "chromium" } },
  ],
  webServer: {
    command: "node scripts/preview.mjs",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
