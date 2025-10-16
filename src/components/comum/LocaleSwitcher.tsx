import React from "react";
import { useI18n } from "../../i18n";
import type { Locale } from "../../i18n";

interface LocaleSwitcherProps {
  compact?: boolean;
  className?: string;
  usedIn?: "header" | "footer" | "dashboard";
}

const LocaleSwitcher: React.FC<LocaleSwitcherProps> = ({
  compact,
  className,
  usedIn,
}) => {
  const { locale, setLocale } = useI18n();

  const languages = [
    { value: "pt" as Locale, flag: "🇧🇷", label: "Português", short: "PT" },
    { value: "en" as Locale, flag: "🇺🇸", label: "English", short: "EN" }
  ];

  const currentLang = languages.find((lang) => lang.value === locale);

  const toggleLocale = () => {
    const idx = languages.findIndex((lang) => lang.value === locale);
    const nextIdx = (idx + 1) % languages.length;
    setLocale(languages[nextIdx].value);
  };

  if (usedIn) {
    return (
      <button
        onClick={toggleLocale}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-gray-50 transition-all active:scale-95 ${className}`}
      >
        <span className="text-base">{currentLang?.short}</span>
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      </button>
    );
  }

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-1 ${className}`}
      >
        {languages.map((lang) => (
          <button
            key={lang.value}
            onClick={() => setLocale(lang.value)}
            className={`p-1.5 rounded-md text-sm font-medium transition-all ${
              locale === lang.value
                ? "bg-blue-500 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
            title={lang.label}
          >
            {lang.flag}
          </button>
        ))}
      </div>
    );
  }

  const colsNum = languages.length;

  const gridColsClass = colsNum > 1 ? `grid grid-cols-${colsNum}` : "flex";

  return (
    <div
      className={`${gridColsClass} items-center gap-1 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-1 ${className}`}
    >
      {languages.map((lang) => (
        <button
          key={lang.value}
          onClick={() => setLocale(lang.value)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            locale === lang.value
              ? "bg-blue-500 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <span className="text-base">{lang.flag}</span>
          <span>{lang.short}</span>
        </button>
      ))}
    </div>
  );
};

export default LocaleSwitcher;
