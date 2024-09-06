import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import de from '../public/_locales/de/de.json';
import en from '../public/_locales/en/en.json';
import en_GB from '../public/_locales/en_GB/en_GB.json';
import fr from '../public/_locales/fr/fr.json';
import ja from '../public/_locales/ja/ja.json';
import ko from '../public/_locales/ko/ko.json';
import pt from '../public/_locales/pt/pt.json';
import ru from '../public/_locales/ru/ru.json';
import tr from '../public/_locales/tr/tr.json';
import uk from '../public/_locales/uk/uk.json';
import zh_CN from '../public/_locales/zh_CN/zh_CN.json';
import zh_TW from '../public/_locales/zh_TW/zh_TW.json';

i18n
  // .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
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
      fr: {
        translation: fr
      },
      ja: {
        translation: ja
      },
      ko: {
        translation: ko
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
