import React, { useEffect, useState } from 'react';
import Card from '../../../components/ui/Card';
import { SEO } from '../../../components/comum/SEO';
import Skeleton from '../../../components/ui/Skeleton';

interface Stat { key: string; label: string; value: number | null; }

const AdminReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [stats, setStats] = useState<Stat[]>([
    { key:'activeUsers', label:'Usuários Ativos (30d)', value: null },
    { key:'newUsers', label:'Novos Usuários (30d)', value: null },
    { key:'publishedPosts', label:'Posts Publicados (30d)', value: null },
    { key:'consultationsDone', label:'Consultas Realizadas (30d)', value: null },
  ]);

  useEffect(()=> {
    let cancelled = false;
    (async()=> {
      try {
        setLoading(true); setError(null);
        // Placeholder: futuramente substituir por endpoint agregado /api/auth/admin/report?range=30d
        await new Promise(r=> setTimeout(r, 400));
        if(cancelled) return;
        setStats(s => s.map((st,i)=> ({ ...st, value:  i*7 + 12 })));
      } catch(e:any){ if(!cancelled) setError(e.message || 'Erro'); } finally { if(!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <SEO title="Admin | Relatórios" description="Painel de relatórios e tendências" />
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
          <p className="text-xs text-gray-500 mt-1">Visão agregada para suporte a decisões (placeholder inicial).</p>
        </div>
        <div className="flex gap-2">
          {/* Botões futuros: export PDF, alterar range temporal */}
        </div>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map(s => (
          <Card key={s.key} className="p-4 space-y-1">
            <div className="text-[11px] uppercase tracking-wide text-gray-400">{s.label}</div>
            <div className="text-xl font-semibold text-gray-700">
              {loading ? <Skeleton className="h-6 w-16" /> : (s.value ?? '—')}
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-4 text-[11px] text-gray-600 space-y-2">
        <div className="font-medium text-xs">Próximos Passos (roadmap)</div>
        <ul className="list-disc pl-4 space-y-1">
          <li>Seleção de intervalo (7d, 30d, 90d, custom)</li>
          <li>Exportar CSV / PDF</li>
          <li>Gráficos de linha (usuários ativos, consultas)</li>
          <li>Coorte de retenção básica</li>
          <li>Heatmap de horários de consulta</li>
        </ul>
      </Card>
    </div>
  );
};

export default AdminReportsPage;