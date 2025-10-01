import React, { useState, useMemo } from 'react';
import { useNotifications, useMarkNotificationRead } from '../../hooks/useNotifications';
import Card from '../ui/Card';
import Button from '../ui/Button';

const NotificationCenter: React.FC = () => {
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  const { data, isLoading, error } = useNotifications(showOnlyUnread, pageSize, currentPage * pageSize);
  // meta armazenada no query: lastRead timestamp e função de update
  const lastRead = (data as any)?.meta?.lastRead as string | null | undefined;
  const updateLastRead = (data as any)?.meta?.updateLastRead as (ts?: string)=>void | undefined;
  const [groupMode, setGroupMode] = useState<'none' | 'day' | 'type'>('day');
  const { mutate: markAsRead } = useMarkNotificationRead();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return '📄';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-50 border-blue-200';
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-gray-600">Carregando notificações...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          Erro ao carregar notificações: {error.message}
        </div>
      </Card>
    );
  }

  const notifications = data?.notifications || [];

  const lastReadDate = useMemo(() => lastRead ? new Date(lastRead) : null, [lastRead]);

  const grouped = useMemo(() => {
    if (groupMode === 'none') return { '__all__': notifications } as Record<string, typeof notifications>;
    const map: Record<string, typeof notifications> = {};
    for (const n of notifications) {
      let key = '';
      if (groupMode === 'day') {
        const d = new Date(n.created_at);
        key = d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
      } else if (groupMode === 'type') {
        key = n.type;
      }
      (map[key] ||= []).push(n);
    }
    // Ordenar grupos por data desc (quando day) ou manter inserção
    if (groupMode === 'day') {
      return Object.fromEntries(
        Object.entries(map).sort((a,b) => {
          const pa = a[0].split('/').reverse().join('-');
          const pb = b[0].split('/').reverse().join('-');
          return pa < pb ? 1 : -1;
        })
      );
    }
    return map;
  }, [notifications, groupMode]);
  const totalPages = Math.ceil((data?.total || 0) / pageSize);
  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5V17zm0 0V7a1 1 0 011-1h5m-6 10H7a2 2 0 01-2-2V7a2 2 0 012-2h8m-1 14V7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Notificações</h2>
            <p className="text-sm text-gray-600">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Agrupar:</span>
            <select
              value={groupMode}
              onChange={e => setGroupMode(e.target.value as any)}
              className="text-sm border rounded px-2 py-1 bg-white"
            >
              <option value="none">Nenhum</option>
              <option value="day">Por dia</option>
              <option value="type">Por tipo</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlyUnread}
              onChange={(e) => {
                setShowOnlyUnread(e.target.checked);
                setCurrentPage(0);
              }}
              className="rounded"
            />
            Apenas não lidas
          </label>
          <button
            onClick={() => updateLastRead?.()}
            className="text-xs px-3 py-1 border rounded hover:bg-gray-100 transition-colors"
          >Marcar ponto de leitura</button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5V17zm0 0V7a1 1 0 011-1h5m-6 10H7a2 2 0 01-2-2V7a2 2 0 012-2h8m-1 14V7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {showOnlyUnread ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
          </h3>
          <p className="text-gray-600">
            {showOnlyUnread 
              ? 'Todas as suas notificações foram lidas.' 
              : 'Você não possui notificações no momento.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([groupKey, list]) => (
            <div key={groupKey} className="space-y-3">
              {groupMode !== 'none' && (
                <h4 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                  <span>{groupMode === 'day' ? groupKey : groupKey.toUpperCase()}</span>
                  <span className="text-[10px] font-normal text-gray-400">{list.length} item{list.length>1?'s':''}</span>
                </h4>
              )}
              {list.map(notification => {
                const created = new Date(notification.created_at);
                const isNewSinceRead = lastReadDate ? created > lastReadDate : true;
                return (
                  <div
                    key={notification.user_notification_id}
                    className={`p-4 rounded-lg border-2 transition-all relative ${
                      notification.read_at
                        ? 'bg-gray-50 border-gray-200 opacity-75'
                        : `${getTypeColor(notification.type)} shadow-sm`
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-lg">{getTypeIcon(notification.type)}</span>
                          <h3 className="font-semibold text-gray-900 truncate max-w-[60%]">
                            {notification.title}
                          </h3>
                          {!notification.read_at && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                          )}
                          {isNewSinceRead && (
                            <span className="text-[10px] uppercase tracking-wide bg-green-600 text-white px-2 py-0.5 rounded-full animate-pulse">NOVO</span>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm mb-2 whitespace-pre-wrap">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      {!notification.read_at && (
                        <Button
                          onClick={() => handleMarkAsRead(notification.notification_id)}
                          variant="secondary"
                          className="text-xs px-3 py-1 flex-shrink-0"
                        >
                          Marcar como lida
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Página {currentPage + 1} de {totalPages} ({data?.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              variant="secondary"
            >
              Anterior
            </Button>
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              variant="secondary"
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default NotificationCenter;