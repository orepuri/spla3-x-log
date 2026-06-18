const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5190",
    trace: "on-first-retry",
    viewport: { width: 1180, height: 820 },
  },
  webServer: {
    command: "node server.js",
    env: {
      HOST: "127.0.0.1",
      PORT: "5190",
    },
    reuseExistingServer: !process.env.CI,
    url: "http://127.0.0.1:5190/api/health",
  },
});
