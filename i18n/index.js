import es from './es.js';
import en from './en.js';

const translations = { es, en };
let currentLang = 'es';

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = lang;
    }
    return true;
  }
  return false;
}

export function getLanguage() {
  return currentLang;
}

export function t(key, fallback = '') {
  const parts = key.split('.');
  let val = translations[currentLang];
  for (const p of parts) {
    if (val && val[p] !== undefined) {
      val = val[p];
    } else {
      let fallbackVal = translations['es'];
      for (const fp of parts) {
        if (fallbackVal && fallbackVal[fp] !== undefined) {
          fallbackVal = fallbackVal[fp];
        } else {
          fallbackVal = null;
          break;
        }
      }
      return fallbackVal !== null ? fallbackVal : (fallback || key);
    }
  }
  return val;
}

export default { t, setLanguage, getLanguage, translations };
