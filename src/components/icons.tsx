// Centralização de ícones (lucide-react) para facilitar tree-shaking e futura troca
// Em um único ponto podemos aplicar fallback ou lazy loading se necessário.
import React from 'react';
import {
  ArrowLeft,
  Plus,
  Minus,
  Target,
  Trophy,
  TrendingUp,
  Calendar,
  ChevronDown,
  Droplets,
  Edit3,
  BarChart3,
  History,
  GlassWater,
  Settings,
  Check,
  Inbox,
  X,
  Zap,
} from 'lucide-react';

export {
  ArrowLeft,
  Plus,
  Minus,
  Target,
  Trophy,
  TrendingUp,
  Calendar,
  ChevronDown,
  Droplets,
  Edit3,
  BarChart3,
  History,
  GlassWater,
  Settings,
  Check,
  Inbox,
  X,
  Zap,
};

// Wrapper utilitário opcional para padronizar tamanho
export const IconWrap: React.FC<{ children: React.ReactNode; size?: number; className?: string }> = ({ children, size = 18, className = '' }) => {
  if (React.isValidElement(children)) return React.cloneElement(children as any, { size, className });
  return <span className={className}>{children}</span>;
};
