import React, { useState, useEffect, useRef } from 'react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

const HIGHLIGHT_MS = 5000; // tempo que novos itens ficam em destaque
const BADGE_PULSE_MS = 4000; // duração da animação de pulse no badge

const NotificationBellReal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  
  const { data: unreadData } = useNotifications(true, 10, 0);
  const { data: recentData, isLoading, error } = useNotifications(false, 5, 0);
  const { mutate: markAsRead } = useMarkNotificationRead();
  const { mutate: markAll, isPending: markingAll } = useMarkAllNotificationsRead();

  const unreadCount = unreadData?.total || 0;
  const recentNotifications = recentData?.notifications || [];

  const prevUnreadRef = useRef<number>(unreadCount);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const pulseTimeoutRef = useRef<number | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  // Detecta aumento de não lidas -> pulse badge
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setPulse(true);
      if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = window.setTimeout(() => setPulse(false), BADGE_PULSE_MS) as unknown as number;
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  // Detecta novas notificações pelo ID (para highlight)
  useEffect(() => {
    const currentIds = new Set(recentNotifications.map(n => n.user_notification_id));
    const newlyArrived: string[] = [];
    for (const id of currentIds) {
      if (!prevIdsRef.current.has(id)) newlyArrived.push(id);
    }
    if (newlyArrived.length) {
      setHighlightIds(prev => new Set([...Array.from(prev), ...newlyArrived]));
      if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightIds(new Set());
      }, HIGHLIGHT_MS) as unknown as number;
    }
    prevIdsRef.current = currentIds;
  }, [recentNotifications]);

  useEffect(() => () => {
    if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
    if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current);
  }, []);

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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="px-4 py-6 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Carregando...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="px-4 py-6 text-center">
          <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-red-500 text-lg">!</span>
          </div>
          <p className="text-sm text-red-600 font-medium">Falha ao carregar notificações</p>
          <p className="text-xs text-gray-500 mt-1">{(error as Error).message}</p>
          <button
            onClick={() => window.dispatchEvent(new Event('focus'))}
            className="mt-3 inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    if (recentNotifications.length === 0) {
      return (
        <div className="px-4 py-6 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Nenhuma notificação</p>
        </div>
      );
    }
    return (
      <> {/* lista */}
        {recentNotifications.map((notification) => {
          const isNew = highlightIds.has(notification.user_notification_id) && !notification.read_at;
          return (
            <button
              key={notification.user_notification_id}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 transition-colors relative group ${
                !notification.read_at ? 'bg-green-50' : ''
              } ${isNew ? 'ring-1 ring-green-400/60 animate-[pulse_1.5s_ease-in-out_3]' : ''}`}
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
                    <div className={`h-2 w-2 rounded-full ${isNew ? 'bg-green-600 animate-ping' : 'bg-green-500'}`}></div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </>
    );
  };

  return (
    <div className="relative">
      <button
        className={`relative p-2 text-gray-600 hover:text-green-600 focus:outline-none transition-colors ${pulse ? 'animate-pulse' : ''}`}
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
          <span className={`absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs text-white flex items-center justify-center font-medium transition-all ${
            pulse ? 'bg-green-600 scale-110 shadow-lg' : 'bg-red-500'
          }`}>
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
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs text-gray-500">
                      {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    disabled={markingAll}
                    onClick={() => markAll()}
                    className="text-xs inline-flex items-center px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {markingAll ? '...' : 'Marcar todas'}
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {renderContent()}
            </div>

            {/* Footer */}
            {recentNotifications.length > 0 && !error && (
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