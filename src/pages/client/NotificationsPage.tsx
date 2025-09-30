import React from 'react';
import { SEO } from '../../components/comum/SEO';
import NotificationCenter from '../../components/notifications/NotificationCenter';

const NotificationsPage: React.FC = () => {
  return (
    <>
      <SEO 
        title="Notificações | Avante Nutri"
        description="Visualize suas notificações e atualizações importantes"
      />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Central de Notificações</h1>
            <p className="text-gray-600 mt-2">
              Mantenha-se atualizado com as últimas informações e avisos importantes
            </p>
          </div>
          
          <NotificationCenter />
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;