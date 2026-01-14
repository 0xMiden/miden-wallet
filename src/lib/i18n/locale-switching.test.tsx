import React from 'react';

import i18n from 'i18next';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next';

// Test component that displays translated text
const TestComponent: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div>
      <span data-testid="settings">{t('settings')}</span>
      <span data-testid="cancel">{t('cancel')}</span>
    </div>
  );
};

describe('i18n locale switching', () => {
  let testRoot: ReturnType<typeof createRoot> | null = null;
  let testContainer: HTMLDivElement | null = null;
  let testI18n: typeof i18n;

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
  });

  beforeEach(() => {
    // Create a fresh i18n instance for each test
    testI18n = i18n.createInstance();
  });

  afterEach(async () => {
    if (testRoot) {
      await act(async () => {
        testRoot!.unmount();
      });
      testRoot = null;
    }
    if (testContainer) {
      testContainer.remove();
      testContainer = null;
    }
  });

  it('displays English text when locale is set to English', async () => {
    await testI18n.use(initReactI18next).init({
      lng: 'en',
      fallbackLng: 'en',
      resources: {
        en: {
          translation: {
            settings: 'Settings',
            cancel: 'Cancel'
          }
        },
        de: {
          translation: {
            settings: 'Einstellungen',
            cancel: 'Abbrechen'
          }
        }
      }
    });

    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    await act(async () => {
      testRoot!.render(
        <I18nextProvider i18n={testI18n}>
          <TestComponent />
        </I18nextProvider>
      );
    });

    expect(testContainer.querySelector('[data-testid="settings"]')?.textContent).toBe('Settings');
    expect(testContainer.querySelector('[data-testid="cancel"]')?.textContent).toBe('Cancel');
  });

  it('displays German text when locale is set to German', async () => {
    await testI18n.use(initReactI18next).init({
      lng: 'de',
      fallbackLng: 'en',
      resources: {
        en: {
          translation: {
            settings: 'Settings',
            cancel: 'Cancel'
          }
        },
        de: {
          translation: {
            settings: 'Einstellungen',
            cancel: 'Abbrechen'
          }
        }
      }
    });

    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    await act(async () => {
      testRoot!.render(
        <I18nextProvider i18n={testI18n}>
          <TestComponent />
        </I18nextProvider>
      );
    });

    expect(testContainer.querySelector('[data-testid="settings"]')?.textContent).toBe('Einstellungen');
    expect(testContainer.querySelector('[data-testid="cancel"]')?.textContent).toBe('Abbrechen');
  });

  it('displays Japanese text when locale is set to Japanese', async () => {
    await testI18n.use(initReactI18next).init({
      lng: 'ja',
      fallbackLng: 'en',
      resources: {
        en: {
          translation: {
            settings: 'Settings',
            cancel: 'Cancel'
          }
        },
        ja: {
          translation: {
            settings: '設定',
            cancel: 'キャンセル'
          }
        }
      }
    });

    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    await act(async () => {
      testRoot!.render(
        <I18nextProvider i18n={testI18n}>
          <TestComponent />
        </I18nextProvider>
      );
    });

    expect(testContainer.querySelector('[data-testid="settings"]')?.textContent).toBe('設定');
    expect(testContainer.querySelector('[data-testid="cancel"]')?.textContent).toBe('キャンセル');
  });

  it('falls back to English when locale has missing translation', async () => {
    await testI18n.use(initReactI18next).init({
      lng: 'de',
      fallbackLng: 'en',
      resources: {
        en: {
          translation: {
            settings: 'Settings',
            cancel: 'Cancel'
          }
        },
        de: {
          translation: {
            // 'settings' is missing, should fall back to English
            cancel: 'Abbrechen'
          }
        }
      }
    });

    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    await act(async () => {
      testRoot!.render(
        <I18nextProvider i18n={testI18n}>
          <TestComponent />
        </I18nextProvider>
      );
    });

    // 'settings' falls back to English, 'cancel' uses German
    expect(testContainer.querySelector('[data-testid="settings"]')?.textContent).toBe('Settings');
    expect(testContainer.querySelector('[data-testid="cancel"]')?.textContent).toBe('Abbrechen');
  });

  it('updates displayed text when language is changed dynamically', async () => {
    await testI18n.use(initReactI18next).init({
      lng: 'en',
      fallbackLng: 'en',
      resources: {
        en: {
          translation: {
            settings: 'Settings',
            cancel: 'Cancel'
          }
        },
        de: {
          translation: {
            settings: 'Einstellungen',
            cancel: 'Abbrechen'
          }
        }
      }
    });

    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    await act(async () => {
      testRoot!.render(
        <I18nextProvider i18n={testI18n}>
          <TestComponent />
        </I18nextProvider>
      );
    });

    // Initially English
    expect(testContainer.querySelector('[data-testid="settings"]')?.textContent).toBe('Settings');

    // Change language to German
    await act(async () => {
      await testI18n.changeLanguage('de');
    });

    // Should now display German
    expect(testContainer.querySelector('[data-testid="settings"]')?.textContent).toBe('Einstellungen');
    expect(testContainer.querySelector('[data-testid="cancel"]')?.textContent).toBe('Abbrechen');
  });

  it('falls back to English for unknown locale', async () => {
    await testI18n.use(initReactI18next).init({
      lng: 'unknown-locale',
      fallbackLng: 'en',
      resources: {
        en: {
          translation: {
            settings: 'Settings',
            cancel: 'Cancel'
          }
        }
      }
    });

    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    await act(async () => {
      testRoot!.render(
        <I18nextProvider i18n={testI18n}>
          <TestComponent />
        </I18nextProvider>
      );
    });

    // Should fall back to English
    expect(testContainer.querySelector('[data-testid="settings"]')?.textContent).toBe('Settings');
    expect(testContainer.querySelector('[data-testid="cancel"]')?.textContent).toBe('Cancel');
  });
});
