import en from './en.json';
import pt from './pt.json';
import es from './es.json';

export const languages = {
  en: 'English',
  pt: 'Português',
  es: 'Español',
};

export const defaultLang = 'en';

export const ui = {
  en,
  pt,
  es,
} as const;
