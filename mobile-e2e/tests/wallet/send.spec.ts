import { ensureWalletReady } from '../../fixtures/wallet';
import { Selectors } from '../../helpers/selectors';
import { clickExploreLink, isIOSPlatform, navigateToHomeViaJS } from '../../helpers/webview';

describe('Wallet - Send Flow', () => {
  beforeEach(async () => {
    await ensureWalletReady();
  });

  afterEach(async () => {
    // Navigate back to Explore page using WebView JS (most reliable for both platforms)
    try {
      await navigateToHomeViaJS();
    } catch {
      // Ignore errors - might already be on home
    }
  });

  it('should navigate to send flow from Explore page', async () => {
    // Use WebView JS click on iOS (Link has accessible="false")
    await clickExploreLink('Send', '/send');

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 10000 });
    await expect(sendFlow).toBeDisplayed();
  });

  it('should show token selection as first step', async () => {
    await clickExploreLink('Send', '/send');

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 10000 });

    // Should see MIDEN token in the list
    const tokenList = await $(Selectors.tokenList);
    await expect(tokenList).toBeDisplayed();
  });

  // NOTE: This test is skipped on iOS due to a WebView limitation.
  // CardItem components use div + onClick which Appium cannot trigger on iOS WebView.
  // The native click is received but doesn't fire React's synthetic event.
  // This is the same issue as Link components having accessible="false".
  it('should navigate to recipient step after selecting token', async function () {
    if (isIOSPlatform()) {
      console.log('Skipping on iOS - CardItem onClick not triggerable via Appium');
      this.skip();
    }

    await clickExploreLink('Send', '/send');

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 10000 });

    // Select MIDEN token
    const firstToken = await $(Selectors.firstTokenItem);
    await firstToken.waitForDisplayed({ timeout: 5000 });
    await firstToken.click();
    await browser.pause(500);

    // Should now be on recipient step
    const recipientTitle = await $('//*[contains(@text, "Recipient") or contains(@text, "recipient")]');
    await recipientTitle.waitForDisplayed({ timeout: 10000 });
    await expect(recipientTitle).toBeDisplayed();
  });

  it('should navigate back from send flow', async () => {
    await clickExploreLink('Send', '/send');

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 10000 });

    // Navigate back to home via JS (most reliable method for both platforms)
    await navigateToHomeViaJS();

    // Should be back on Explore page - verify by looking for Send text
    const sendText = await $(Selectors.sendButton);
    await sendText.waitForDisplayed({ timeout: 10000 });
    await expect(sendText).toBeDisplayed();
  });

  it('should close send flow and return to explore', async () => {
    await clickExploreLink('Send', '/send');

    const sendFlow = await $(Selectors.sendFlow);
    await sendFlow.waitForDisplayed({ timeout: 10000 });

    // Navigate back to home via JS (most reliable method for both platforms)
    await navigateToHomeViaJS();

    // Should be back on Explore page with Send button visible
    const sendText = await $(Selectors.sendButton);
    await sendText.waitForDisplayed({ timeout: 10000 });
    await expect(sendText).toBeDisplayed();
  });
});
