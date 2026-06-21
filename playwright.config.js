const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: {
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true
  }
});
