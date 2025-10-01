import React, { useState } from 'react';
import { useNotifications, useMarkNotificationRead } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

const NotificationBellReal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  // Buscar apenas notificações não lidas para o badge
  const { data: unreadData } = useNotifications(true, 10, 0);
  // Buscar as últimas notificações para o dropdown (lidas e não lidas)
  const { data: recentData, isLoading } = useNotifications(false, 5, 0);
  
  const { mutate: markAsRead } = useMarkNotificationRead();

  const unreadCount = unreadData?.total || 0;
  const recentNotifications = recentData?.notifications || [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return '📄';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Marcar como lida se não foi lida
    if (!notification.read_at) {
      markAsRead(notification.notification_id);
    }
    
    // Fechar dropdown
    setIsOpen(false);
    
    // Aqui você pode adicionar lógica para navegar baseado no tipo de notificação
    // Por exemplo:
    // if (notification.type === 'diet') navigate('/dietas');
    // if (notification.type === 'appointment') navigate('/consultas');
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notificacoes');
  };

  return (
    <div className="relative">
      <button
        className="relative p-2 text-gray-600 hover:text-green-600 focus:outline-none transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Ver notificações"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-gray-500">
                    {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Carregando...</p>
                </div>
              ) : recentNotifications.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Nenhuma notificação</p>
                </div>
              ) : (
                recentNotifications.map((notification) => (
                  <button
                    key={notification.user_notification_id}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 transition-colors ${
                      !notification.read_at ? 'bg-green-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-sm">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                      {!notification.read_at && (
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            {recentNotifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                <button
                  onClick={handleViewAll}
                  className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                >
                  Ver todas as notificações
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBellReal;