import assert from 'assert';
import { Page } from 'puppeteer';

import { delay } from './utils.js';

export async function verifyPrivateKey(password: string, expectedPrivateKey: string, page: Page) {
  const keyType = 'private key';
  return await verifyKey(password, expectedPrivateKey, page, 'settings/reveal-private-key', keyType);
}

export async function verifyViewKey(password: string, expectedViewKey: string, page: Page) {
  const keyType = 'view key';
  return await verifyKey(password, expectedViewKey, page, 'settings/reveal-view-key', keyType);
}

async function verifyKey(password: string, expectedKey: string, page: Page, path: string, keyType: string) {
  // Ensure navigation to reveal password page
  const url = page.url();
  await page.goto(url + path);

  // Get the form
  await page.waitForSelector('form', { timeout: 5_000 });
  const form = await page.$('form');
  assert(form, `Could not find ${keyType} form`);

  // Type in the seed phrase
  const inputElement = await form.$('input');
  assert(inputElement, `Could not find input element for ${keyType}`);
  await inputElement.type(password);

  // Wait and then click the submit button
  await delay(3_000);
  const buttons = await form.$$('button');
  const button = buttons[buttons.length - 1];
  assert(button !== null, `Could not find the reveal ${keyType} submit button`);
  await button.click();

  // Find the text area element
  await delay(5_000);
  const revealKeyElement = await page.$('textarea');
  assert(revealKeyElement, `Could not find reveal ${keyType} element`);

  // Get the value of the text area element
  const key = await revealKeyElement.getProperty('value');
  assert(key, 'Could not get key');
  const keyValue = await key.jsonValue();
  assert(keyValue === expectedKey, `Expected ${keyType} ${expectedKey}, got ${keyValue}`);

  // Return to Explore page
  await page.goto(url);

  return page;
}
