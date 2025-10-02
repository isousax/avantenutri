import React from 'react';
import Button from '../ui/Button';
import CapabilitySection from '../auth/CapabilitySection';
import { CAPABILITIES } from '../../types/capabilities';
import { useDietPlans } from '../../hooks/useDietPlans';
import { usePermissions } from '../../hooks/usePermissions';
import { useI18n } from '../../i18n';
import DietPlanCardInternal from './DietPlanCardInternal';

interface Props {
  limit?: number;
  onNavigateAll?: () => void;
}

const DietPlansSection: React.FC<Props> = ({ limit = 3, onNavigateAll }) => {
  const { plans, loading } = useDietPlans();
  const { can } = usePermissions();
  const { locale } = useI18n();
  const canViewDiets = can(CAPABILITIES.DIETA_VIEW);
  const canEditDiets = can(CAPABILITIES.DIETA_EDIT);
  // React Query já faz o fetch automático; sem efeito manual aqui.

  return (
    <CapabilitySection
      title="Dietas Recentes"
      anyOf={[CAPABILITIES.DIETA_VIEW]}
      toolbar={canViewDiets ? (
        <Button variant="secondary" onClick={() => onNavigateAll && onNavigateAll()}>Ver Todas</Button>
      ) : null}
      loadingFallback={<div className="text-xs text-gray-400">Carregando permissões...</div>}
      reloadingFallback={<div className="text-xs text-gray-400">Atualizando...</div>}
      fallback={<div className="text-sm text-gray-500">Seu plano não permite visualizar dietas.</div>}
    >
      <div className="space-y-4">
        {loading && <div className="text-xs text-gray-400">Carregando dietas...</div>}
        {!loading && plans.slice(0, limit).map(p => (
          <DietPlanCardInternal key={p.id} diet={{ ...p, isCurrent: p.status === 'active' }} onView={()=>{/* handled externally in future refactor */}} onRevise={()=>{}} canEdit={canEditDiets} locale={locale} />
        ))}
        {!loading && plans.length === 0 && <div className="text-sm text-gray-500">Nenhuma dieta ainda.</div>}
      </div>
    </CapabilitySection>
  );
};

export default DietPlansSection;