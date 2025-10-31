import type { Locale } from './index';
import { createContext, useContext } from 'react';

import type { I18nContextValue } from './index';
export const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function useI18n() {
  const ctx = useContext(I18nContext);
  if(!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function formatNumber(num: number, locale: Locale){
  return new Intl.NumberFormat(locale === 'pt'? 'pt-BR':'en-US').format(num);
}

export function formatDate(date: Date | string | number, locale: Locale, opts?: Intl.DateTimeFormatOptions){
  const d = date instanceof Date? date : new Date(date);
  return new Intl.DateTimeFormat(locale==='pt'?'pt-BR':'en-US', opts || { dateStyle: 'short'}).format(d);
}
