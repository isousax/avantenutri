// NotificationCenter.tsx
import React, { useState, useMemo } from "react";
import {
  useNotifications,
  useMarkNotificationRead,
} from "../../hooks/useNotifications";
import Card from "../ui/Card";
import Button from "../ui/Button";

type GroupMode = "none" | "day" | "type";

type Notification = {
  user_notification_id: string;
  notification_id: string;
  created_at: string;
  type: string;
  title: string;
  message: string;
  read_at?: string | null;
};

type TypedData =
  | {
      notifications?: Notification[];
      total?: number;
      meta?: { lastRead?: string; updateLastRead?: (() => void) | undefined };
    }
  | undefined;

const NotificationCenter: React.FC = () => {
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [groupMode, setGroupMode] = useState<GroupMode>("day");
  const [selectedNotification, setSelectedNotification] = useState<
    string | null
  >(null);
  const pageSize = 10;

  const { data, isLoading, error } = useNotifications(
    showOnlyUnread,
    pageSize,
    currentPage * pageSize
  );
  const { mutate: markAsRead } = useMarkNotificationRead();

  const typedData = data as TypedData;
  const lastRead = typedData?.meta?.lastRead ?? null;

  const notificationsSource = typedData?.notifications;
  const notifications = useMemo(
    () => notificationsSource ?? [],
    [notificationsSource]
  );
  const lastReadDate = useMemo(
    () => (lastRead ? new Date(lastRead) : null),
    [lastRead]
  );

  const grouped = useMemo(() => {
    if (groupMode === "none")
      return { __all__: notifications } as Record<string, typeof notifications>;
    const map: Record<string, typeof notifications> = {};
    for (const n of notifications) {
      let key = "";
      if (groupMode === "day") {
        const d = new Date(n.created_at);
        key = d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } else if (groupMode === "type") {
        key = n.type;
      }
      if (!map[key]) map[key] = [] as typeof notifications;
      map[key].push(n);
    }

    if (groupMode === "day") {
      return Object.fromEntries(
        Object.entries(map).sort((a, b) => {
          const pa = a[0].split("/").reverse().join("-");
          const pb = b[0].split("/").reverse().join("-");
          return pa < pb ? 1 : -1;
        })
      );
    }

    return map;
  }, [notifications, groupMode]);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "info":
        return {
          icon: "💡",
          color: "from-indigo-300 to-sky-400",
          bgColor: "bg-indigo-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-700",
        };
      case "success":
        return {
          icon: "✅",
          color: "from-green-300 to-emerald-400",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-700",
        };
      case "warning":
        return {
          icon: "⚠️",
          color: "from-amber-300 to-orange-400",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          textColor: "text-amber-700",
        };
      case "error":
        return {
          icon: "❌",
          color: "from-red-300 to-rose-400",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-700",
        };
      default:
        return {
          icon: "📄",
          color: "from-gray-300 to-gray-400",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-700",
        };
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach((notification) => {
      if (!notification.read_at) {
        handleMarkAsRead(notification.notification_id);
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Hoje às ${date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (diffDays === 1) {
      return `Ontem às ${date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-white animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Carregando notificações
          </h3>
          <p className="text-gray-600 text-center">
            Estamos buscando suas atualizações mais recentes
          </p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Erro ao carregar
          </h3>
          <p className="text-gray-600 mb-4">
            {error instanceof Error
              ? error.message
              : "Ocorreu um erro ao carregar as notificações"}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 border-0 text-white"
          >
            Tentar Novamente
          </Button>
        </div>
      </Card>
    );
  }

  const totalPages = Math.ceil((typedData?.total ?? 0) / pageSize);
  const unreadCount = notifications.filter(
    (n: Notification) => !n.read_at
  ).length;
  const hasUnread = unreadCount > 0;

  return (
    <Card className="p-4 sm:p-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      {/* Header Modernizado */}
      <div className="flex flex-col gap-4 mb-6 lg:mb-8">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              Notificações
            </h2>
            <div className="flex xs:flex-row items-center gap-2 mt-1">
              <p className="text-gray-600 text-sm">
                {hasUnread ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></span>
                    {unreadCount} não lida{unreadCount > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></span>
                    Todas lidas
                  </span>
                )}
              </p>
              {hasUnread && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors whitespace-nowrap self-start"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Controles - Melhorado para mobile */}
        <div className="flex flex-col xs:flex-row gap-3">
          {/* Agrupar por */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-gray-50 rounded-xl p-3">
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap flex-shrink-0">
              Agrupar por:
            </span>
            <div className="flex flex-wrap gap-1 bg-white rounded-lg p-1 border border-gray-200">
              {[
                { value: "day", label: "Dia", icon: "📅" },
                { value: "type", label: "Tipo", icon: "🏷️" },
                { value: "none", label: "Nenhum", icon: "📋" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGroupMode(option.value as GroupMode)}
                  className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 flex-1 justify-center min-w-0 ${
                    groupMode === option.value
                      ? "bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-xs sm:text-sm">{option.icon}</span>
                  <span className="text-xs sm:text-sm font-bold">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle apenas não lidas */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 flex-shrink-0">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer whitespace-nowrap">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showOnlyUnread}
                  onChange={(e) => {
                    setShowOnlyUnread(e.target.checked);
                    setCurrentPage(0);
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${
                    showOnlyUnread ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      showOnlyUnread
                        ? "transform translate-x-5"
                        : "transform translate-x-1"
                    }`}
                  />
                </div>
              </div>
              <span className="inline">Não lidas</span>
            </label>
          </div>
        </div>
      </div>

      {/* Lista de Notificações */}
      {notifications.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg
              className="w-6 h-6 sm:w-10 sm:h-10 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-5 5V17zm0 0V7a1 1 0 011-1h5m-6 10H7a2 2 0 01-2-2V7a2 2 0 012-2h8m-1 14V7"
              />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
            {showOnlyUnread
              ? "Nenhuma notificação não lida"
              : "Nenhuma notificação"}
          </h3>
          <p className="text-gray-600 text-sm sm:text-base max-w-sm mx-auto px-4">
            {showOnlyUnread
              ? "Parabéns! Você está em dia com todas as suas notificações."
              : "Você não possui notificações no momento. Novas atualizações aparecerão aqui."}
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {Object.entries(grouped).map(([groupKey, list]) => (
            <div key={groupKey} className="space-y-3 sm:space-y-4">
              {groupMode !== "none" && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700 bg-white px-2 sm:px-3 py-1 rounded-full border border-gray-200 shadow-sm whitespace-nowrap flex items-center gap-1 sm:gap-2">
                    {groupMode === "day" ? groupKey : groupKey.toUpperCase()}
                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full">
                      {(list as Notification[]).length}
                    </span>
                  </h4>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                </div>
              )}

              <div className="space-y-2 sm:space-y-3">
                {(list as Notification[]).map((notification: Notification) => {
                  const created = new Date(notification.created_at);
                  const isNewSinceRead = lastReadDate
                    ? created > lastReadDate
                    : true;
                  const typeConfig = getTypeConfig(notification.type);
                  const isExpanded =
                    selectedNotification === notification.user_notification_id;
                  const isUnread = !notification.read_at;

                  return (
                    <div
                      key={notification.user_notification_id}
                      className={`relative p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                        isUnread
                          ? `${typeConfig.bgColor} ${typeConfig.borderColor} shadow-sm`
                          : "bg-white border-gray-200 opacity-90 hover:opacity-100"
                      }`}
                      onClick={() =>
                        setSelectedNotification(
                          isExpanded ? null : notification.user_notification_id
                        )
                      }
                    >
                      {/* Header Compacto */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* Ícone com Badge de Status */}
                        <div className="relative flex-shrink-0">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${typeConfig.color} flex items-center justify-center text-white shadow-sm`}
                          >
                            {typeConfig.icon}
                          </div>
                          {isUnread && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse"></span>
                          )}
                        </div>

                        {/* Conteúdo Principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3
                                  className={`font-semibold text-base sm:text-lg truncate ${
                                    isUnread ? "text-gray-900" : "text-gray-700"
                                  }`}
                                >
                                  {notification.title}
                                </h3>
                                {isNewSinceRead && (
                                  <span className="text-[10px] uppercase tracking-wide bg-gradient-to-r from-green-500 to-emerald-500 text-white px-1.5 py-0.5 rounded-full flex-shrink-0">
                                    NOVO
                                  </span>
                                )}
                              </div>

                              {/* Preview da Mensagem */}
                              <p
                                className={`text-sm text-gray-600 transition-all duration-300 ${
                                  isExpanded ? "line-clamp-4" : "line-clamp-2"
                                }`}
                              >
                                {notification.message}
                              </p>
                            </div>
                          </div>

                          {/* Metadados e Ações */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Data */}
                              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                <svg
                                  className="w-3 h-3 flex-shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {formatDate(notification.created_at)}
                              </span>

                              {/* Indicador de Expansão */}
                              <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                <span>
                                  {isExpanded ? "Recolher" : "Expandir"}
                                </span>
                                <svg
                                  className={`w-3 h-3 transition-transform duration-300 ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            </div>

                            {/* Botão de Marcar como Lida */}
                            {isUnread && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(
                                    notification.notification_id
                                  );
                                }}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-0 text-white text-xs px-3 py-1.5 h-8 flex items-center justify-center transition-all flex-shrink-0"
                              >
                                <span className="inline">Lida</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo Expandido (se necessário) */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Notificação completa
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginação Modernizada */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            Página{" "}
            <span className="font-semibold text-gray-800">
              {currentPage + 1}
            </span>{" "}
            de <span className="font-semibold text-gray-800">{totalPages}</span>{" "}
            •{" "}
            <span className="font-semibold text-gray-800">
              {typedData?.total ?? 0}
            </span>{" "}
            notificações no total
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              variant="secondary"
              className="flex items-center gap-1 sm:gap-2 border border-gray-300 hover:border-gray-400 disabled:opacity-50 text-xs sm:text-sm px-3 py-1.5"
            >
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="hidden xs:inline">Anterior</span>
            </Button>
            <Button
              onClick={() =>
                setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
              }
              disabled={currentPage === totalPages - 1}
              variant="secondary"
              className="flex items-center gap-1 sm:gap-2 border border-gray-300 hover:border-gray-400 disabled:opacity-50 text-xs sm:text-sm px-3 py-1.5"
            >
              <span className="hidden xs:inline">Próxima</span>
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default NotificationCenter;
