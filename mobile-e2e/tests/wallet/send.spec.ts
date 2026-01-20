import { waitForAppReady } from '../../fixtures/app';
import { ensureWalletReady } from '../../fixtures/wallet';
import { Selectors } from '../../helpers/selectors';

describe('Wallet - Send Flow', () => {
  beforeEach(async () => {
    await ensureWalletReady();
  });

  afterEach(async () => {
    // Navigate back to Explore page if we're on a different screen
    try {
      const closeButton = await $(Selectors.navCloseButton);
      if (await closeButton.isExisting()) {
        await closeButton.click();
        await browser.pause(500);
      }
    } catch {
      // Already on Explore or close button not found
    }
  });

  it('should navigate to send flow from Explore page', async () => {
    const sendButton = await $(Selectors.sendButton);
    await sendButton.waitForDisplayed({ timeout: 15000 });
    await sendButton.click();

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 15000 });
    await expect(sendFlow).toBeDisplayed();
  });

  it('should show token selection as first step', async () => {
    const sendButton = await $(Selectors.sendButton);
    await sendButton.click();

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 15000 });

    // Should see MIDEN token in the list
    const tokenList = await $(Selectors.tokenList);
    await expect(tokenList).toBeDisplayed();
  });

  it('should navigate to recipient step after selecting token', async () => {
    const sendButton = await $(Selectors.sendButton);
    await sendButton.click();

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 15000 });

    // Select MIDEN token
    const firstToken = await $(Selectors.firstTokenItem);
    await firstToken.waitForDisplayed({ timeout: 10000 });
    await firstToken.click();

    // Should now be on recipient step - look for Recipient title
    const recipientStep = await $(Selectors.recipientInput);
    await recipientStep.waitForDisplayed({ timeout: 10000 });
    await expect(recipientStep).toBeDisplayed();
  });

  it('should navigate back from send flow', async () => {
    const sendButton = await $(Selectors.sendButton);
    await sendButton.click();

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 15000 });

    // Click close button (first step of send flow uses close, not back)
    const closeButton = await $(Selectors.navCloseButton);
    await closeButton.click();

    // Should be back on Explore page
    await sendButton.waitForDisplayed({ timeout: 15000 });
    await expect(sendButton).toBeDisplayed();
  });

  it('should close send flow and return to explore', async () => {
    const sendButton = await $(Selectors.sendButton);
    await sendButton.click();

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 15000 });

    // Close the send flow
    const closeButton = await $(Selectors.navCloseButton);
    await closeButton.click();

    // Should be back on Explore page with Send button visible
    await sendButton.waitForDisplayed({ timeout: 15000 });
    await expect(sendButton).toBeDisplayed();
  });
});
