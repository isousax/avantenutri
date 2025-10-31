import React from 'react';
import { useI18n } from '../../../i18n/utils';
import { SEO } from '../../../components/comum/SEO';
import Card from '../../../components/ui/Card';

const AdminPlansPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="p-4 sm:p-6 space-y-6">
  <SEO title={t('admin.dashboard.seo.title')} description={t('admin.dashboard.seo.desc')} />
      <h1 className="text-2xl font-semibold tracking-tight">Planos (Descontinuado)</h1>
      <Card className="p-6 space-y-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          O sistema de planos foi desativado e substituído por créditos de consulta. Esta página permanecerá temporariamente apenas como referência histórica e será removida em uma limpeza futura.
        </p>
        <ul className="list-disc ml-5 text-xs text-gray-600 space-y-1">
          <li>Todos os upgrades/downgrades foram congelados.</li>
          <li>Pagamentos agora geram créditos de tipos específicos (avaliação ou reavaliação).</li>
          <li>Capabilities e limits não são mais aplicados.</li>
        </ul>
        <div className="pt-2">
          <a href="/admin" className="inline-flex items-center gap-2 text-green-700 hover:underline text-sm font-medium">Voltar ao Dashboard</a>
        </div>
      </Card>
    </div>
  );
};

export default AdminPlansPage;
