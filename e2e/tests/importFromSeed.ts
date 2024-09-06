import assert from 'assert';
import { ElementHandle, Page } from 'puppeteer';

// @ts-ignore
import { delay } from './utils.ts';

export async function importFromSeed(seedPhrase: string, page: Page) {
  // Ensure navigation to import from seed page
  await page.waitForSelector('#import-link', { timeout: 5_000 });
  await Promise.all([page.waitForNavigation(), page.click('#import-link')]);

  // Assert we're on the right page
  const url = page.url();
  assert(url.endsWith('import-wallet'));

  // Get the form
  await page.waitForSelector('textarea', { timeout: 5_000 });
  const form = await page.$('textarea');
  assert(form, 'Could not find form');

  // Type in the seed phrase
  await form.type(seedPhrase);

  // Wait and then click the submit button
  await delay(3_000);
  const [button] = await page.$x("//button[contains(., 'Continue')]");

  assert(button !== null, 'Could not find the submit button');
  await (button as ElementHandle<Element>).click();

  return page;
}

export async function setPassword(password: string, page: Page) {
  // Get the form
  await page.waitForSelector('article', { timeout: 5_000 });
  const form = await page.$('article');
  assert(form, 'Could not find form');

  // Type in the password
  const passwordInputs = await form.$$('input[type="password"]');
  assert(passwordInputs.length === 2, `Expected 2 password inputs, got ${passwordInputs.length}`);
  for (let i = 0; i < passwordInputs.length; i++) {
    await passwordInputs[i].type(password);
  }

  const approveTerms = (await page.$x("//button[contains(., 'Help us to improve')]"))[0] as ElementHandle<Element>;
  await approveTerms.click();

  // Wait and then click the submit button
  await delay(3_000);
  const [button] = await page.$x("//button[contains(., 'Continue')]");

  assert(button !== null, 'Could not find the submit button');

  await (button as ElementHandle<Element>).click();

  // Wait and then click the submit button
  await delay(3_000);
  const [getStartedButton] = await page.$x("//button[contains(., 'Get started')]");

  assert(getStartedButton !== null, 'Could not find the get started button');

  await Promise.all([await (getStartedButton as ElementHandle<Element>).click(), page.waitForNavigation()]);
  await delay(3_000);

  return page;
}
