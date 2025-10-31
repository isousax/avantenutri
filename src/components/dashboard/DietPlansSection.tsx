import React from 'react';
import Button from '../ui/Button';
import { useDietPlans } from '../../hooks/useDietPlans';
import { useI18n } from '../../i18n/utils';
import DietPlanCardInternal from './DietPlanCardInternal';

interface Props {
  limit?: number;
  onNavigateAll?: () => void;
}

const DietPlansSection: React.FC<Props> = ({ limit = 3, onNavigateAll }) => {
  const { plans, loading } = useDietPlans();
  const { locale } = useI18n();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dietas Recentes</h3>
        {onNavigateAll && (
          <Button variant="secondary" onClick={onNavigateAll}>Ver Todas</Button>
        )}
      </div>
      
      <div className="space-y-4">
        {loading && <div className="text-xs text-gray-400">Carregando dietas...</div>}
        {!loading && plans.slice(0, limit).map(p => (
          <DietPlanCardInternal 
            key={p.id} 
            diet={{ ...p, isCurrent: p.status === 'active' }} 
            onView={() => {/* handled externally in future refactor */}} 
            onRevise={() => {}} 
            canEdit={true} // Sempre verdadeiro já que não temos mais sistema de permissões
            locale={locale} 
          />
        ))}
        {!loading && plans.length === 0 && <div className="text-sm text-gray-500">Nenhuma dieta ainda.</div>}
      </div>
    </div>
  );
};

export default DietPlansSection;