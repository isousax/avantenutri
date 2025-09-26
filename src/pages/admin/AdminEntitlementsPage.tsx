import React from 'react';
import Card from '../../components/ui/Card';
import PermissionGate from '../../components/auth/PermissionGate';
import { CAPABILITIES } from '../../types/capabilities';
import { usePermissions } from '../../hooks/usePermissions';

// Demonstration page for current (scaffold) entitlements system.
// Shows how PermissionGate works and lists the resolved capabilities (currently empty).

const sampleBlocks = [
  { title: 'Montar Dieta', code: CAPABILITIES.DIETA_EDIT },
  { title: 'Registrar Água', code: CAPABILITIES.AGUA_LOG },
  { title: 'Agendar Consulta', code: CAPABILITIES.CONSULTA_AGENDAR },
  { title: 'Chat Nutri', code: CAPABILITIES.CHAT_NUTRI },
];

const AdminEntitlementsPage: React.FC = () => {
  const { capabilities, loading, error } = usePermissions();
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Entitlements / Capabilities (Preview)</h1>
      <p className="text-sm text-gray-600 max-w-2xl">Esta página demonstra o scaffolding de capabilities. No futuro será populado a partir de planos / permissões. Atualmente a API retorna lista vazia.</p>
      <Card className="p-4 space-y-3">
        <h2 className="font-medium">Estado Atual</h2>
        {loading && <div className="text-sm text-gray-500">Carregando...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && !error && (
          <>
            <div className="text-sm">Capabilities resolvidas: {capabilities.length === 0 ? <span className="italic text-gray-500">(vazio)</span> : capabilities.join(', ')}</div>
            <div className="text-xs text-gray-500">(Simularemos bloqueios abaixo usando <code>PermissionGate</code>)</div>
          </>
        )}
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        {sampleBlocks.map(b => (
          <Card key={b.code} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{b.title}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">{b.code}</span>
            </div>
            <PermissionGate anyOf={[b.code]} fallback={<div className="text-xs text-red-500">Sem acesso (capability não presente)</div>}>
              <div className="text-xs text-green-600">Acesso concedido (capability ativa)</div>
            </PermissionGate>
          </Card>
        ))}
      </div>
      <Card className="p-4 space-y-2">
        <h2 className="font-medium text-sm">Como usar</h2>
        <pre className="text-xs bg-gray-900 text-green-200 p-3 rounded overflow-x-auto">
{`import PermissionGate from '.../PermissionGate';
import { CAPABILITIES } from '.../capabilities';

<PermissionGate anyOf={[CAPABILITIES.DIETA_EDIT]} fallback={<span>Bloqueado</span>}>
  <BotaoMontarDieta />
</PermissionGate>`}
        </pre>
        <p className="text-xs text-gray-500">Quando o sistema de planos estiver ativo, essa página poderá listar planos, overrides e limites.</p>
      </Card>
    </div>
  );
};

export default AdminEntitlementsPage;
