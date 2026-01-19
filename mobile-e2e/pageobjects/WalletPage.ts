import { Selectors, tokenItemSelector } from '../helpers/selectors';

/**
 * Page Object for the main Wallet screens (Explore, Send, Receive)
 */
class WalletPage {
  // Explore page selectors
  get sendButton() {
    return $(Selectors.sendButton);
  }

  get receiveButton() {
    return $(Selectors.receiveButton);
  }

  get faucetButton() {
    return $(Selectors.faucetButton);
  }

  // Send flow selectors
  get sendFlow() {
    return $(Selectors.sendFlow);
  }

  get recipientInput() {
    return $(Selectors.recipientInput);
  }

  get amountInput() {
    return $(Selectors.amountInput);
  }

  get reviewButton() {
    return $(Selectors.reviewButton);
  }

  get confirmSendButton() {
    return $(Selectors.confirmSendButton);
  }

  // Receive page selectors
  get receivePage() {
    return $(Selectors.receivePage);
  }

  get addressDisplay() {
    return $(Selectors.addressDisplay);
  }

  get uploadButton() {
    return $(Selectors.uploadButton);
  }

  // Common selectors
  get continueButton() {
    return $(Selectors.continueButton);
  }

  get backButton() {
    return $(Selectors.backButton);
  }

  // Navigation actions

  /**
   * Wait for Explore page to be ready
   */
  async waitForExplorePage(): Promise<void> {
    await this.sendButton.waitForDisplayed({ timeout: 30000 });
  }

  /**
   * Navigate to Send flow
   */
  async goToSend(): Promise<void> {
    await this.sendButton.waitForDisplayed({ timeout: 15000 });
    await this.sendButton.click();
    await this.sendFlow.waitForDisplayed({ timeout: 15000 });
  }

  /**
   * Navigate to Receive page
   */
  async goToReceive(): Promise<void> {
    await this.receiveButton.waitForDisplayed({ timeout: 15000 });
    await this.receiveButton.click();
    await this.receivePage.waitForDisplayed({ timeout: 15000 });
  }

  /**
   * Navigate to Faucet
   */
  async goToFaucet(): Promise<void> {
    await this.faucetButton.waitForDisplayed({ timeout: 15000 });
    await this.faucetButton.click();
  }

  /**
   * Go back to previous screen
   */
  async goBack(): Promise<void> {
    await this.backButton.click();
  }

  // Send flow actions

  /**
   * Select a token by index
   */
  async selectToken(index: number = 0): Promise<void> {
    const tokenItem = await $(tokenItemSelector(index));
    await tokenItem.waitForDisplayed({ timeout: 10000 });
    await tokenItem.click();
  }

  /**
   * Enter recipient address
   */
  async enterRecipient(address: string): Promise<void> {
    await this.recipientInput.waitForDisplayed({ timeout: 10000 });
    await this.recipientInput.setValue(address);
  }

  /**
   * Enter amount to send
   */
  async enterAmount(amount: string): Promise<void> {
    await this.amountInput.waitForDisplayed({ timeout: 10000 });
    await this.amountInput.setValue(amount);
  }

  /**
   * Continue in send flow
   */
  async continueSendFlow(): Promise<void> {
    await this.continueButton.click();
  }

  /**
   * Review transaction (after entering details)
   */
  async reviewTransaction(): Promise<void> {
    await this.reviewButton.waitForDisplayed({ timeout: 10000 });
    await this.reviewButton.click();
  }

  /**
   * Confirm and send transaction
   */
  async confirmSend(): Promise<void> {
    await this.confirmSendButton.waitForDisplayed({ timeout: 10000 });
    await this.confirmSendButton.click();
  }

  /**
   * Full send flow
   */
  async sendTokens(tokenIndex: number, recipient: string, amount: string): Promise<void> {
    await this.goToSend();
    await this.selectToken(tokenIndex);
    await this.enterRecipient(recipient);
    await this.continueSendFlow();
    await this.enterAmount(amount);
    await this.continueSendFlow();
    await this.confirmSend();
  }

  // Receive page actions

  /**
   * Get the displayed wallet address
   */
  async getWalletAddress(): Promise<string> {
    await this.addressDisplay.waitForDisplayed({ timeout: 10000 });
    return await this.addressDisplay.getText();
  }

  /**
   * Copy address to clipboard
   */
  async copyAddress(): Promise<void> {
    const copyButton = await $(Selectors.copyAddressButton);
    await copyButton.waitForDisplayed({ timeout: 10000 });
    await copyButton.click();
  }

  /**
   * Click upload button to import notes
   */
  async clickUpload(): Promise<void> {
    await this.uploadButton.waitForDisplayed({ timeout: 10000 });
    await this.uploadButton.click();
  }

  // Verification helpers

  /**
   * Check if on Explore page
   */
  async isOnExplorePage(): Promise<boolean> {
    try {
      return await this.sendButton.isDisplayed();
    } catch {
      return false;
    }
  }

  /**
   * Check if on Send flow
   */
  async isOnSendFlow(): Promise<boolean> {
    try {
      return await this.sendFlow.isDisplayed();
    } catch {
      return false;
    }
  }

  /**
   * Check if on Receive page
   */
  async isOnReceivePage(): Promise<boolean> {
    try {
      return await this.receivePage.isDisplayed();
    } catch {
      return false;
    }
  }
}

export default new WalletPage();
