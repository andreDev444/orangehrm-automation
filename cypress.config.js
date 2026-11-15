const { defineConfig } = require("cypress");

module.exports = defineConfig({
  video: true,
  screenshotOnRunFailure: true,
  reporter: "cypress-mochawesome-reporter",
  reporterOptions: {
    reportDir: "cypress/reports/json",
    reportFilename: "reporte-pruebas",
    overwrite: false,
    saveJson: true,
    embeddedScreenshots: true,
    inlineAssets: true,
    charts: true,
    removeJsonsFolderAfterMerge: false,
  },
  e2e: {
    baseUrl: "https://opensource-demo.orangehrmlive.com",
    setupNodeEvents(on) {
      require("cypress-mochawesome-reporter/plugin")(on);
    },
  },
});