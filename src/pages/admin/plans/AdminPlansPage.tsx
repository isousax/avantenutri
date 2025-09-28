import React, { useEffect, useState, useMemo } from 'react';
import { API } from '../../../config/api';
import { useAuth } from '../../../contexts';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useI18n } from '../../../i18n';
import { SEO } from '../../../components/comum/SEO';
import Skeleton from '../../../components/ui/Skeleton';

interface Plan {
  id: string;
  name: string;
  price_cents: number;
  interval?: string | null;
  active?: boolean;
  deprecated?: boolean;
  display_order?: number;
  capabilities?: string[];
  limits?: Record<string, number | null>;
}

const currencyFmt = (locale: string, cents: number) => new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { style: 'currency', currency: 'BRL' }).format(cents / 100);

const AdminPlansPage: React.FC = () => {
  const { authenticatedFetch } = useAuth();
  const { locale, t } = useI18n();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true); setError(null);
      const r = await authenticatedFetch(API.PLANS, { method: 'GET', autoLogout: true });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      setPlans(data.plans || []);
    } catch (e: any) { setError(e.message || 'Erro'); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const sorted = useMemo(() => plans.slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)), [plans]);

  return (
    <div className="p-6 space-y-6">
      <SEO title={t('admin.plans.seo.title')} description={t('admin.plans.seo.desc')} />
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planos</h1>
          <p className="text-xs text-gray-500 mt-1">Gerencie catálogo de planos, capabilities e limites.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" disabled={loading} onClick={() => load()}>Recarregar</Button>
          <Button type="button" disabled className="opacity-60 cursor-not-allowed">+ Novo (futuro)</Button>
        </div>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton lines={4} /></Card>
          ))}
        </div>
      )}
      {!loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map(p => {
            const isExpanded = expanded === p.id;
            return (
              <Card key={p.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                      {p.name}
                      {p.id === 'free' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">FREE</span>}
                      {p.deprecated && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-300 text-gray-700">DEPRECATED</span>}
                    </h2>
                    <div className="text-sm font-mono">id: <span className="select-all">{p.id}</span></div>
                    <div className="text-sm">Preço: {currencyFmt(locale, p.price_cents)} {p.interval && <span className="text-xs text-gray-500">/ {p.interval}</span>}</div>
                    <div className="text-xs text-gray-600 flex flex-wrap gap-2">
                      <span>Status: {p.active === false ? 'inativo' : 'ativo'}</span>
                      {typeof p.display_order === 'number' && <span>ordem: {p.display_order}</span>}
                      <span>caps: {p.capabilities?.length || 0}</span>
                      <span>limits: {p.limits ? Object.keys(p.limits).length : 0}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <button onClick={() => setExpanded(e => e === p.id ? null : p.id)} className="text-xs text-blue-600 hover:underline">{isExpanded ? 'Fechar' : 'Detalhes'}</button>
                    <button disabled className="text-xs text-gray-400 cursor-not-allowed">Editar (futuro)</button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <h3 className="font-medium text-sm mb-1">Capabilities</h3>
                      {p.capabilities && p.capabilities.length > 0 ? (
                        <ul className="flex flex-wrap gap-1">
                          {p.capabilities.map(c => <li key={c} className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">{c}</li>)}
                        </ul>
                      ) : <p className="text-xs text-slate-500">Nenhuma capability.</p>}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm mb-1">Limits</h3>
                      {p.limits && Object.keys(p.limits).length > 0 ? (
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="text-slate-600 border-b"><th className="text-left py-1">Limite</th><th className="text-left py-1">Valor</th></tr>
                          </thead>
                          <tbody>
                            {Object.entries(p.limits).map(([k, v]) => (
                              <tr key={k} className="odd:bg-slate-50">
                                <td className="pr-2 font-mono">{k}</td>
                                <td>{v == null ? '∞' : v}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : <p className="text-xs text-slate-500">Nenhum limite.</p>}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <p className="text-[11px] text-gray-500">Futuro: edição, criação, ordenação drag-and-drop, versionamento de plano, simulação de downgrade/upgrade, clonagem. (Quando houver métricas por plano, podemos reutilizar UsageBar para mostrar consumo médio/percentis).</p>
    </div>
  );
};

export default AdminPlansPage;
