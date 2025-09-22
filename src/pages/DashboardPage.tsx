import React, { useState } from 'react';
import { useAuth } from '../contexts';
import Button from '../components/Button';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import NotificationBell from '../components/NotificationBell';
import Progress from '../components/Progress';
import { RoleRoute } from '../components/RoleRoute';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<'dietas' | 'perfil' | 'suporte'>('dietas');
  
  // Exemplo de notificações - substituir por dados reais
  const notifications = [
    {
      id: '1',
      title: 'Nova Dieta Disponível',
      message: 'Sua dieta foi atualizada. Confira as mudanças!',
      time: 'Há 1 hora',
      read: false,
    },
    {
      id: '2',
      title: 'Lembrete de Consulta',
      message: 'Você tem uma consulta marcada para amanhã às 14h',
      time: 'Há 2 horas',
      read: true,
    },
  ];

  const handleNotificationClick = (id: string) => {
    console.log(`Notification ${id} clicked`);
    // Implementar lógica de marcar como lida
  };

  return (
    <RoleRoute role="paciente">
      <div className="min-h-screen flex bg-brand-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md p-6 hidden md:flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <img src="/logo.svg" alt="Avante Nutris" className="h-8 w-auto mb-2" />
              <p className="text-sm text-gray-500">Bem-vindo(a),</p>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            </div>
            <nav className="flex flex-col gap-4">
              <Button variant={tab === 'dietas' ? 'primary' : 'secondary'} className="w-full text-left" onClick={() => setTab('dietas')}>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Minhas Dietas
                </div>
              </Button>
              <Button variant={tab === 'perfil' ? 'primary' : 'secondary'} className="w-full text-left" onClick={() => setTab('perfil')}>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Perfil
                </div>
              </Button>
              <Button variant={tab === 'suporte' ? 'primary' : 'secondary'} className="w-full text-left" onClick={() => setTab('suporte')}>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Suporte
                </div>
              </Button>
            </nav>
          </div>
          <Button variant="secondary" className="w-full mt-8" onClick={logout}>
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </div>
          </Button>
        </aside>
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-brand-700">
              {tab === 'dietas' && 'Minhas Dietas'}
              {tab === 'perfil' && 'Meu Perfil'}
              {tab === 'suporte' && 'Suporte'}
            </h1>
            <div className="flex items-center space-x-4">
              <NotificationBell
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
              />
              <div className="relative">
                <img
                  src={user?.photoUrl || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=22c55e&color=fff`}
                  alt={user?.name}
                  className="h-8 w-8 rounded-full"
                />
              </div>
            </div>
          </div>

          {tab === 'dietas' && (
            <>
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <StatsCard
                  title="Dias de Dieta"
                  value="15"
                  trend={{ value: 12, isPositive: true }}
                  icon={
                    <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                />
                <StatsCard
                  title="Peso Atual"
                  value="72.5 kg"
                  trend={{ value: 2.3, isPositive: false }}
                  description="Meta: 70kg"
                  icon={
                    <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  }
                />
                <StatsCard
                  title="Calorias Diárias"
                  value="1850 kcal"
                  description="Meta: 2000 kcal"
                  icon={
                    <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                />
              </div>

              {/* Progress Tracking */}
              <Card className="mb-6">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Progresso dos Objetivos</h2>
                  <div className="space-y-4">
                    <Progress current={72.5} target={70} label="Meta de Peso" unit="kg" />
                    <Progress current={1850} target={2000} label="Meta de Calorias" unit=" kcal" />
                    <Progress current={7} target={8} label="Copos de Água" unit="" />
                  </div>
                </div>
              </Card>

              {/* Latest Diets */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-white overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Dieta Atual</h3>
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-brand-100 text-brand-800 rounded-full">Ativa</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Enviada em: 01/09/2025</p>
                      <p className="text-sm text-gray-500">Válida até: 01/10/2025</p>
                      <div className="flex items-center mt-4 space-x-2">
                        <Button className="flex-1">Ver Detalhes</Button>
                        <Button variant="secondary" className="flex items-center">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Dieta Anterior</h3>
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Arquivada</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Período: 01/08/2025 - 31/08/2025</p>
                      <p className="text-sm text-gray-500">Resultados: -2kg</p>
                      <div className="flex items-center mt-4 space-x-2">
                        <Button variant="secondary" className="flex-1">Ver Histórico</Button>
                        <Button variant="secondary" className="flex items-center">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}

          {tab === 'perfil' && (
            <div className="max-w-2xl">
              <Card className="overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-6">
                    <img
                      src={user?.photoUrl || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=22c55e&color=fff`}
                      alt={user?.name}
                      className="h-20 w-20 rounded-full"
                    />
                    <div className="ml-4">
                      <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                      <p className="text-gray-500">{user?.email}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Pessoais</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nome</label>
                        <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500" value={user?.name || ''} readOnly />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">E-mail</label>
                        <input type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500" value={user?.email || ''} readOnly />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Telefone</label>
                        <input type="tel" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500" value={user?.phone || ''} readOnly />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                        <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500" value={user?.birthDate || ''} readOnly />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button>Editar Perfil</Button>
                    <Button variant="secondary" className="ml-3">Alterar Senha</Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
          {tab === 'suporte' && (
            <>
              <h1 className="text-2xl font-bold text-green-700 mb-4">Suporte</h1>
              <Card>
                <p className="text-gray-700 mb-2">Precisa de ajuda? Envie sua dúvida para <a href="mailto:support@nutri.com" className="text-green-600 underline">support@nutri.com</a></p>
              </Card>
            </>
          )}
        </main>
      </div>
    </RoleRoute>
  );
};

export default DashboardPage;
