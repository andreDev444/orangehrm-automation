const fs = require('node:fs/promises');
const path = require('node:path');
const reportGenerator = require('mochawesome-report-generator');
const { enhanceReport } = require('cypress-mochawesome-reporter/lib/enhanceReport');

async function generateHtmlReport() {
  const reportPath = path.resolve('cypress/reports/merged.json');
  const reportDir = path.resolve('cypress/reports/html');
  const screenshotsDir = path.resolve('cypress/screenshots');
  const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));

  enhanceReport(report, { embeddedScreenshots: true, ignoreVideos: true }, screenshotsDir);

  const [htmlPath] = await reportGenerator.create(report, {
    reportDir,
    reportFilename: 'reporte-pruebas',
    embeddedScreenshots: true,
    inlineAssets: true,
    charts: true,
    overwrite: true,
  });

  console.log(`Reporte HTML generado: ${htmlPath}`);
}

generateHtmlReport().catch((error) => {
  console.error('No se pudo generar el reporte HTML:', error);
  process.exitCode = 1;
});
