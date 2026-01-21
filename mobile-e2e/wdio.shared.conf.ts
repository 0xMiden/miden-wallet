import type { Options } from '@wdio/types';

export const config: Partial<Options.Testrunner> = {
  runner: 'local',

  specs: ['./tests/**/*.spec.ts'],
  exclude: [],

  maxInstances: 1,

  logLevel: 'warn',
  bail: 0,

  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 120000 // 2 minutes - wallet import/creation should complete within this
  },

  // Hooks
  beforeSession: async () => {
    // Setup before each test session
  },

  afterTest: async (test, _context, { passed }) => {
    if (!passed) {
      // Take screenshot on failure
      await browser.saveScreenshot(`./mobile-e2e/screenshots/${test.title.replace(/\s+/g, '_')}.png`);
    }
  }
};
