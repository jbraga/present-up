import * as Localization from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  'pt-BR': { translation: ptBR },
  pt: { translation: ptBR }, // Fallback for general Portuguese
};

// Get the device language
const deviceLanguage = Localization.getLocales()[0]?.languageTag || 'en';

// eslint-disable-next-line import/no-named-as-default-member
i18next.use(initReactI18next).init({
  resources,
  lng: deviceLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values to prevent XSS
  },
  compatibilityJSON: 'v4', // Required for React Native
});

export default i18next;
