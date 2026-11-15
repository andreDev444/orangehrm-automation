import './commands'
import 'cypress-mochawesome-reporter/register'

afterEach(function () {
  if (!this.currentTest || this.currentTest.state !== 'passed') {
    return;
  }

  const title = this.currentTest.fullTitle().replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
  cy.screenshot(`${title} - ${this.currentTest.state}`, {
    capture: 'runner',
    overwrite: true,
  });
});