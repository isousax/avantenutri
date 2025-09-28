import React from 'react';
import { useI18n } from '../../i18n';
import type { Locale } from '../../i18n';
import type { TranslationKey } from '../../types/i18n';

interface Option {
  value: Locale;
  labelKey: TranslationKey;
  shortKey: TranslationKey;
}

const options: Option[] = [
  { value: 'pt', labelKey: 'nav.language.pt', shortKey: 'nav.language.short.pt' },
  { value: 'en', labelKey: 'nav.language.en', shortKey: 'nav.language.short.en' }
];

interface LocaleSwitcherProps {
  compact?: boolean; // if true, shows short labels (PT / EN)
  className?: string;
}

const LocaleSwitcher: React.FC<LocaleSwitcherProps> = ({ compact, className }) => {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={className || ''}>
      <label className="sr-only" htmlFor="locale-select">{t('nav.language.label')}</label>
      <select
        id="locale-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="bg-transparent border border-gray-300 rounded-md px-2 py-1 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label={t('nav.language.label')}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {t(compact ? opt.shortKey : opt.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LocaleSwitcher;
