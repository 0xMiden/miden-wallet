import { Selectors, seedWordSelector, seedPhraseInputSelector, verifyWordSelector } from '../helpers/selectors';

/**
 * Page Object for the Onboarding screens
 * Provides high-level actions for onboarding flows
 */
class OnboardingPage {
  // Selectors
  get welcomeScreen() {
    return $(Selectors.onboardingWelcome);
  }

  get createWalletButton() {
    return $(Selectors.createWalletButton);
  }

  get importWalletButton() {
    return $(Selectors.importWalletButton);
  }

  get showSeedPhraseButton() {
    return $(Selectors.showSeedPhraseButton);
  }

  get verifySeedPhraseScreen() {
    return $(Selectors.verifySeedPhrase);
  }

  get importSelectType() {
    return $(Selectors.importSelectType);
  }

  get seedPhraseImportOption() {
    return $(Selectors.importSeedPhraseOption);
  }

  get fileImportOption() {
    return $(Selectors.importFromFileOption);
  }

  get passwordInput() {
    return $(Selectors.passwordInput);
  }

  get confirmPasswordInput() {
    return $(Selectors.confirmPasswordInput);
  }

  get continueButton() {
    return $(Selectors.continueButton);
  }

  get getStartedButton() {
    return $(Selectors.getStartedButton);
  }

  // Actions

  /**
   * Wait for welcome screen to be displayed
   */
  async waitForWelcome(): Promise<void> {
    await this.welcomeScreen.waitForDisplayed({ timeout: 30000 });
  }

  /**
   * Start the create wallet flow
   */
  async startCreateWallet(): Promise<void> {
    await this.createWalletButton.waitForDisplayed({ timeout: 15000 });
    await this.createWalletButton.click();
  }

  /**
   * Start the import wallet flow
   */
  async startImportWallet(): Promise<void> {
    await this.importWalletButton.waitForDisplayed({ timeout: 15000 });
    await this.importWalletButton.click();
  }

  /**
   * Select import from seed phrase option
   */
  async selectSeedPhraseImport(): Promise<void> {
    await this.seedPhraseImportOption.waitForDisplayed({ timeout: 15000 });
    await this.seedPhraseImportOption.click();
  }

  /**
   * Show the seed phrase on backup screen
   */
  async showSeedPhrase(): Promise<void> {
    await this.showSeedPhraseButton.waitForDisplayed({ timeout: 15000 });
    await this.showSeedPhraseButton.click();
  }

  /**
   * Get all 12 seed words from the backup screen
   */
  async getSeedWords(): Promise<string[]> {
    const words: string[] = [];
    for (let i = 0; i < 12; i++) {
      const wordElement = await $(seedWordSelector(i));
      await wordElement.waitForDisplayed({ timeout: 5000 });
      const text = await wordElement.getText();
      words.push(text);
    }
    return words;
  }

  /**
   * Enter seed phrase into import form
   */
  async enterSeedPhrase(mnemonic: string): Promise<void> {
    const words = mnemonic.split(' ');
    for (let i = 0; i < words.length; i++) {
      const input = await $(seedPhraseInputSelector(i));
      await input.waitForDisplayed({ timeout: 5000 });
      await input.setValue(words[i]);
    }
  }

  /**
   * Select verification words (first and last)
   */
  async selectVerificationWords(firstWord: string, lastWord: string): Promise<void> {
    await this.verifySeedPhraseScreen.waitForDisplayed({ timeout: 15000 });

    const firstButton = await $(verifyWordSelector(firstWord));
    await firstButton.waitForDisplayed({ timeout: 10000 });
    await firstButton.click();

    const lastButton = await $(verifyWordSelector(lastWord));
    await lastButton.click();
  }

  /**
   * Set the wallet password
   */
  async setPassword(password: string): Promise<void> {
    await this.passwordInput.waitForDisplayed({ timeout: 15000 });
    await this.passwordInput.setValue(password);

    await this.confirmPasswordInput.setValue(password);

    await this.continueButton.click();
  }

  /**
   * Click continue button
   */
  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  /**
   * Complete onboarding by clicking Get Started
   */
  async completeOnboarding(): Promise<void> {
    await this.getStartedButton.waitForDisplayed({ timeout: 30000 });
    await this.getStartedButton.click();
  }

  /**
   * Full flow: Create a new wallet
   */
  async createNewWallet(password: string): Promise<string[]> {
    await this.startCreateWallet();
    await this.showSeedPhrase();

    const words = await this.getSeedWords();

    await this.continue();
    await this.selectVerificationWords(words[0], words[11]);
    await this.continue();
    await this.setPassword(password);
    await this.completeOnboarding();

    return words;
  }

  /**
   * Full flow: Import wallet from seed phrase
   */
  async importFromSeedPhrase(mnemonic: string, password: string): Promise<void> {
    await this.startImportWallet();
    await this.selectSeedPhraseImport();
    await this.enterSeedPhrase(mnemonic);
    await this.continue();
    await this.setPassword(password);
    await this.completeOnboarding();
  }
}

export default new OnboardingPage();
