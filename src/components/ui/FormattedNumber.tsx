import React from 'react';
import { useI18n, formatNumber } from '../../i18n';

interface Props {
  value: number | null | undefined;
  fractionDigits?: number;
  placeholder?: string;
  className?: string;
}

const FormattedNumber: React.FC<Props> = ({ value, fractionDigits, placeholder='-', className }) => {
  const { locale } = useI18n();
  if (value == null || isNaN(value)) return <span className={className}>{placeholder}</span>;
  let v = value;
  if (typeof fractionDigits === 'number') {
    const factor = Math.pow(10, fractionDigits);
    v = Math.round(v * factor) / factor;
  }
  return <span className={className}>{formatNumber(v, locale)}</span>;
};

export default FormattedNumber;