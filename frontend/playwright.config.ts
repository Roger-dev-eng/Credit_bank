import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:1421",
    headless: true,
    channel: "msedge",
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: "node ../scripts/e2e-server.mjs",
    url: "http://127.0.0.1:1421/api/health",
    timeout: 90000,
    reuseExistingServer: false,
  },
  reporter: "list",
  outputDir: "../.dev/playwright",
});
