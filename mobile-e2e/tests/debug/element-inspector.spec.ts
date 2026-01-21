/**
 * Debug test to inspect element hierarchy
 * Run with: yarn test:e2e:ios --spec mobile-e2e/tests/debug/element-inspector.spec.ts
 */

import { waitForAppReady } from '../../fixtures/app';
import { Selectors } from '../../helpers/selectors';

describe('Debug - Element Inspector', () => {
  it('should inspect elements on welcome screen', async () => {
    await waitForAppReady();

    // Get page source to see element hierarchy
    const pageSource = await driver.getPageSource();
    console.log('=== PAGE SOURCE (first 5000 chars) ===');
    console.log(pageSource.substring(0, 5000));
    console.log('=== END PAGE SOURCE ===');

    // Try to find buttons
    const buttons = await $$('//XCUIElementTypeButton');
    console.log(`Found ${buttons.length} buttons`);
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const label = await buttons[i].getAttribute('label');
      console.log(`  Button ${i}: label="${label}"`);
    }

    // Try to find text fields
    const textFields = await $$('//XCUIElementTypeTextField');
    console.log(`Found ${textFields.length} text fields`);
    for (let i = 0; i < Math.min(textFields.length, 10); i++) {
      const label = await textFields[i].getAttribute('label');
      const value = await textFields[i].getAttribute('value');
      console.log(`  TextField ${i}: label="${label}", value="${value}"`);
    }

    // Try to find secure text fields
    const secureFields = await $$('//XCUIElementTypeSecureTextField');
    console.log(`Found ${secureFields.length} secure text fields`);

    // Try to find static text
    const staticTexts = await $$('//XCUIElementTypeStaticText');
    console.log(`Found ${staticTexts.length} static text elements`);
    for (let i = 0; i < Math.min(staticTexts.length, 20); i++) {
      const label = await staticTexts[i].getAttribute('label');
      console.log(`  StaticText ${i}: label="${label}"`);
    }

    // Now click "I already have a wallet" and inspect seed phrase screen
    const importButton = await $(Selectors.importWalletButton);
    await importButton.waitForDisplayed({ timeout: 10000 });
    await importButton.click();

    await browser.pause(1000);

    // Click Import with Seed Phrase
    const seedOption = await $(Selectors.importSeedPhraseOption);
    await seedOption.waitForDisplayed({ timeout: 10000 });
    await seedOption.click();

    await browser.pause(1000);

    // Now inspect elements on seed phrase input screen
    console.log('\n=== SEED PHRASE SCREEN ===');

    const textFields2 = await $$('//XCUIElementTypeTextField');
    console.log(`Found ${textFields2.length} text fields on seed phrase screen`);
    for (let i = 0; i < Math.min(textFields2.length, 15); i++) {
      const label = await textFields2[i].getAttribute('label');
      const value = await textFields2[i].getAttribute('value');
      const name = await textFields2[i].getAttribute('name');
      console.log(`  TextField ${i}: label="${label}", value="${value}", name="${name}"`);
    }

    // Get page source again
    const pageSource2 = await driver.getPageSource();
    console.log('=== PAGE SOURCE SEED SCREEN (first 8000 chars) ===');
    console.log(pageSource2.substring(0, 8000));
    console.log('=== END PAGE SOURCE ===');
  });
});
