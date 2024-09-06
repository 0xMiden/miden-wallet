import React, { Suspense, useEffect } from 'react';
import type { Preview } from '@storybook/react';
import { I18nextProvider } from 'react-i18next';
import { setConsoleOptions } from '@storybook/addon-console';
import { withConsole } from '@storybook/addon-console';
import i18n from '../src/i18n';
import '../src/main.css';

// Wrap your stories in the I18nextProvider component

const panelExclude = setConsoleOptions({}).panelExclude;
setConsoleOptions({
  panelExclude: [...panelExclude, /deprecated/]
});

const withI18next = (Story, context) => {
  const { locale } = context.globals;

  // When the locale global changes
  // Set the new locale in i18n
  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale]);
  return (
    // This catches the suspense from components not yet ready (still loading translations)
    // Alternative: set useSuspense to false on i18next.options.react when initializing i18next
    <Suspense fallback={<div>loading translations...</div>}>
      <I18nextProvider i18n={i18n}>
        <Story />
      </I18nextProvider>
    </Suspense>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    viewport: {
      viewports: {
        extension: {
          name: 'Extension',
          styles: {
            width: '360px',
            height: '600px'
          }
        }
      }
    }
  },
  globalTypes: {
    locale: {
      name: 'Locale',
      description: 'Internationalization locale',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'de', title: 'Deutsch' },
          { value: 'en-gb', title: 'English (UK)' },
          { value: 'fr', title: 'Français' },
          { value: 'ja', title: '日本語' },
          { value: 'ko', title: '한국어' },
          { value: 'pt', title: 'Português' },
          { value: 'ru', title: 'Русский' },
          { value: 'tr', title: 'Türkçe' },
          { value: 'uk', title: 'Українська' },
          { value: 'zh_CN', title: '简体中文' },
          { value: 'zh_TW', title: '繁體中文' }
        ],
        showName: true
      }
    }
  },
  decorators: [withI18next, (storyFn, context) => withConsole()(storyFn)(context)]
};

export default preview;
