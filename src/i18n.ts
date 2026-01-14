import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import de from '../public/_locales/de/de.json';
import en from '../public/_locales/en/en.json';
import en_GB from '../public/_locales/en_GB/en_GB.json';
import es from '../public/_locales/es/es.json';
import fr from '../public/_locales/fr/fr.json';
import ja from '../public/_locales/ja/ja.json';
import ko from '../public/_locales/ko/ko.json';
import pl from '../public/_locales/pl/pl.json';
import pt from '../public/_locales/pt/pt.json';
import ru from '../public/_locales/ru/ru.json';
import tr from '../public/_locales/tr/tr.json';
import uk from '../public/_locales/uk/uk.json';
import zh_CN from '../public/_locales/zh_CN/zh_CN.json';
import zh_TW from '../public/_locales/zh_TW/zh_TW.json';

// Read saved locale from localStorage (normalized: en_GB -> en-GB for i18next)
const savedLocale = localStorage.getItem('locale')?.replace('_', '-');

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Use saved locale if available, otherwise let LanguageDetector handle it
    lng: savedLocale || undefined,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
      prefix: '$',
      suffix: '$'
    },
    nonExplicitSupportedLngs: true,
    resources: {
      de: {
        translation: de
      },
      en: {
        translation: en
      },
      'en-GB': {
        translation: en_GB
      },
      es: {
        translation: es
      },
      fr: {
        translation: fr
      },
      ja: {
        translation: ja
      },
      ko: {
        translation: ko
      },
      pl: {
        translation: pl
      },
      pt: {
        translation: pt
      },
      ru: {
        translation: ru
      },
      tr: {
        translation: tr
      },
      uk: {
        translation: uk
      },
      'zh-CN': {
        translation: zh_CN
      },
      'zh-TW': {
        translation: zh_TW
      }
    }
  });

export default i18n;
