import React from 'react';
import { useQuestionnaireAnalytics } from '../../hooks/useQuestionnaireAnalytics';
import Card from '../ui/Card';

const QuestionnaireAnalyticsDashboard: React.FC = () => {
  const { data: analytics, isLoading, error } = useQuestionnaireAnalytics();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-gray-600">Carregando analytics...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          Erro ao carregar analytics: {error.message}
        </div>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'infantil': return 'Nutrição Infantil';
      case 'gestante': return 'Nutrição na Gestação';
      case 'adulto': return 'Nutrição Adulto/Idoso';
      case 'esportiva': return 'Nutrição Esportiva';
      default: return category;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Total de Usuários</h3>
              <p className="text-2xl font-bold text-blue-700">{analytics.overview.total_users}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">Questionários Completos</h3>
              <p className="text-2xl font-bold text-green-700">{analytics.overview.completed_questionnaires}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-purple-50 border-purple-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-900">Taxa de Completude</h3>
              <p className="text-2xl font-bold text-purple-700">{analytics.overview.completion_rate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Categories Distribution */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Distribuição por Categoria</h3>
        <div className="space-y-3">
          {analytics.categories.map((category) => {
            const percentage = analytics.overview.completed_questionnaires > 0 
              ? ((category.count / analytics.overview.completed_questionnaires) * 100).toFixed(1)
              : '0';
            
            return (
              <div key={category.categoria} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {getCategoryLabel(category.categoria)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {category.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Atividade Recente (Últimos 30 dias)</h3>
        {analytics.recent_activity.length > 0 ? (
          <div className="space-y-2">
            {analytics.recent_activity.slice(0, 10).map((activity) => (
              <div key={activity.date} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm text-gray-600">
                  {new Date(activity.date).toLocaleDateString('pt-BR')}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {activity.count} questionário{activity.count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Nenhuma atividade recente</p>
        )}
      </Card>

      {/* Monthly Trends */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Tendência Mensal</h3>
        {analytics.monthly_trends.length > 0 ? (
          <div className="space-y-2">
            {analytics.monthly_trends.slice(0, 12).map((trend) => {
              const [year, month] = trend.month.split('-');
              const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
              
              return (
                <div key={trend.month} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm text-gray-600 capitalize">{monthName}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {trend.count} questionário{trend.count !== 1 ? 's' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Nenhum dado mensal disponível</p>
        )}
      </Card>
    </div>
  );
};

export default QuestionnaireAnalyticsDashboard;