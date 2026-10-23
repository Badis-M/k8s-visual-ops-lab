import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:8787", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "bun run preview:worker",
    url: "http://127.0.0.1:8787",
    reuseExistingServer: !process.env["CI"],
    timeout: 60_000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
});
