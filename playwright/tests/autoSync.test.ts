import { expect } from '@playwright/test';

import { Sync } from 'lib/miden/front/autoSync';

import { test } from '../fixtures/mockWebClient';

test('auto syncs state via MockWebClient', async ({ mockWebClient, page }) => {
  await page.evaluate(async () => {
    const AutoSync = new Sync();
    const mockState = {
      status: 2,
      accounts: [],
      networks: [],
      settings: null,
      currentAccount: null,
      ownMnemonic: null
    };

    AutoSync.updateState(mockState);

    const syncSummary = await mockWebClient.syncState();
    const blockNum = syncSummary.blockNum();

    expect(blockNum).toBeGreaterThanOrEqual(0);
  });
});
