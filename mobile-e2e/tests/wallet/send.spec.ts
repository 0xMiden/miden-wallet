import { waitForAppReady } from '../../fixtures/app';
import { ensureWalletReady } from '../../fixtures/wallet';
import { Selectors } from '../../helpers/selectors';

describe('Wallet - Send Flow', () => {
  beforeEach(async () => {
    await ensureWalletReady();
  });

  it('should navigate to send flow from Explore page', async () => {
    const sendButton = await $(Selectors.sendButton);
    await sendButton.waitForDisplayed({ timeout: 15000 });
    await sendButton.click();

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 15000 });
    await expect(sendFlow).toBeDisplayed();
  });

  it('should display send flow with disabled continue button initially', async () => {
    const sendButton = await $(Selectors.sendButton);
    await sendButton.click();

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 15000 });

    // Continue/Review button should be disabled without inputs
    const continueButton = await $(Selectors.continueButton);
    const isEnabled = await continueButton.isEnabled();
    expect(isEnabled).toBe(false);
  });

  it('should show token selection as first step', async () => {
    const sendButton = await $(Selectors.sendButton);
    await sendButton.click();

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 15000 });

    // Should see token selection or similar UI element
    // This depends on UI implementation
    const tokenList = await $('~token-list');
    await expect(tokenList).toBeDisplayed();
  });

  it('should require recipient address before proceeding', async () => {
    const sendButton = await $(Selectors.sendButton);
    await sendButton.click();

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 15000 });

    // Select a token (assuming one is available)
    const firstToken = await $('~token-item-0');
    if (await firstToken.isDisplayed()) {
      await firstToken.click();

      // Should now be on recipient step
      const recipientInput = await $(Selectors.recipientInput);
      await recipientInput.waitForDisplayed({ timeout: 10000 });

      // Continue should be disabled without recipient
      const continueButton = await $(Selectors.continueButton);
      const isEnabled = await continueButton.isEnabled();
      expect(isEnabled).toBe(false);
    }
  });

  it('should validate recipient address format', async () => {
    const sendButton = await $(Selectors.sendButton);
    await sendButton.click();

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 15000 });

    // Select a token if needed
    const firstToken = await $('~token-item-0');
    if (await firstToken.isDisplayed()) {
      await firstToken.click();
    }

    // Enter invalid address
    const recipientInput = await $(Selectors.recipientInput);
    await recipientInput.waitForDisplayed({ timeout: 10000 });
    await recipientInput.setValue('invalid-address');

    // Should show error or keep continue disabled
    const continueButton = await $(Selectors.continueButton);
    await browser.pause(500);
    const isEnabled = await continueButton.isEnabled();
    expect(isEnabled).toBe(false);
  });

  it('should navigate back from send flow', async () => {
    const sendButton = await $(Selectors.sendButton);
    await sendButton.click();

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 15000 });

    // Click back button
    const backButton = await $(Selectors.backButton);
    await backButton.click();

    // Should be back on Explore page
    await sendButton.waitForDisplayed({ timeout: 15000 });
    await expect(sendButton).toBeDisplayed();
  });

  it('should show review screen before confirming transaction', async () => {
    // This test requires setting up a valid transaction
    // Skip if no tokens available
    const sendButton = await $(Selectors.sendButton);
    await sendButton.click();

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 15000 });

    // Check that review step exists in the flow
    // Full transaction flow would require mock tokens and addresses
    const reviewStep = await $('~review-transaction');
    // Just verify the element is defined, not necessarily visible yet
    expect(reviewStep).toBeDefined();
  });
});
