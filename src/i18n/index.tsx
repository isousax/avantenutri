// ...linha removida: triple-slash reference
import React, { useMemo, useState, useEffect } from 'react';
import type { TranslationKey } from '../types/i18n.d';
import { ptTranslations } from '../locales/pt/translations';
import { enTranslations } from '../locales/en/translations';
import { I18nContext } from './utils';

export type Locale = 'pt' | 'en';

export interface I18nContextValue {
  locale: Locale;
  t: (key: TranslationKey, vars?: Record<string,string|number>) => string;
  setLocale: (l: Locale) => void;
}

const translations: Record<Locale, Record<string,string>> = {
  pt: ptTranslations,
  en: enTranslations
};

export const I18nProvider: React.FC<{ defaultLocale?: Locale; children: React.ReactNode; }>=({defaultLocale='pt', children})=> {
  const [locale, setLocale] = useState<Locale>(()=> {
    const stored = typeof window!=='undefined'? localStorage.getItem('locale'): null;
    return (stored==='pt'|| stored==='en')? stored : defaultLocale;
  });
  useEffect(()=> { try { localStorage.setItem('locale', locale);} catch { /* ignore */ } }, [locale]);
  const value = useMemo(()=> ({
    locale,
    setLocale,
    t: (key: TranslationKey, vars?: Record<string,string|number>) => {
      const dict = translations[locale] || {};
      let phrase = dict[key] || key;
      if (vars) {
        Object.entries(vars).forEach(([k,v])=>{
          phrase = phrase.replace(new RegExp(`{${k}}`, 'g'), String(v));
        });
      }
      return phrase;
    }
  }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
