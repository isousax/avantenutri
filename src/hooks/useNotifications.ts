import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts";
import { API } from "../config/api";

interface Notification {
  user_notification_id: string;
  notification_id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  created_at: string;
  expires_at: string;
  read_at: string | null;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  limit: number;
  offset: number;
}

interface SendNotificationRequest {
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  target_type: "all" | "specific" | "group";
  target_users?: string[];
  target_group?: "active" | "incomplete_questionnaire" | "recent_signups";
  expires_at?: string;
}

export function useNotifications(onlyUnread = false, limit = 20, offset = 0) {
  const { authenticatedFetch, user } = useAuth();

  // Persistência de última leitura global (timestamp ISO)
  const LAST_READ_KEY = "@AvanteNutri:notifications:last_read";
  const lastRead = (() => {
    try {
      return localStorage.getItem(LAST_READ_KEY) || null;
    } catch {
      return null;
    }
  })();

  const updateLastRead = (ts?: string) => {
    try {
      localStorage.setItem(LAST_READ_KEY, ts || new Date().toISOString());
    } catch {
      /* ignore */
    }
  };

  return useQuery({
    queryKey: ["notifications", onlyUnread, limit, offset],
    queryFn: async (): Promise<NotificationsResponse> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (onlyUnread) {
        params.set("unread", "true");
      }

      const response = await authenticatedFetch(
        `${API.NOTIFICATIONS}?${params.toString()}`
      );
      if (response.status === 404) {
        // Backend ainda não implementado / migração incompleta -> retorna vazio em vez de quebrar UI
        return { notifications: [], total: 0, limit, offset };
      }
      if (!response.ok) {
        let detail: string | undefined;
        try {
          const js = await response.json();
          detail = js?.error || js?.message;
        } catch {
          /* ignore */
        }
        throw new Error(
          `Failed to fetch notifications (${response.status})${
            detail ? ": " + detail : ""
          }`
        );
      }

      try {
        return await response.json();
      } catch {
        throw new Error("Resposta inválida do servidor");
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    meta: { lastRead, updateLastRead },
  });
}

export function useMarkNotificationRead() {
  const { authenticatedFetch } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await authenticatedFetch(
        API.notificationRead(notificationId),
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate notifications queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useSendNotification() {
  const { authenticatedFetch } = useAuth();

  return useMutation({
    mutationFn: async (data: SendNotificationRequest) => {
      const response = await authenticatedFetch(API.ADMIN_NOTIFICATIONS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Tratamento específico para diferentes códigos de status
        if (response.status === 500) {
          console.error("Server error sending notification:", response.status);
          throw new Error(
            "Erro interno do servidor. Tente novamente em alguns instantes."
          );
        }

        if (response.status === 400) {
          try {
            const error = await response.json();
            throw new Error(error.error || "Dados da notificação inválidos");
          } catch {
            throw new Error("Dados da notificação inválidos");
          }
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error("Sem permissão para enviar notificações");
        }

        try {
          const error = await response.json();
          throw new Error(
            error.error || `Erro ${response.status}: ${response.statusText}`
          );
        } catch {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
      }

      try {
        return await response.json();
      } catch {
        throw new Error("Resposta inválida do servidor");
      }
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { authenticatedFetch } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await authenticatedFetch(API.NOTIFICATIONS_READ_ALL, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// Prefetch util para antecipar notificações (ex: hover no sino ou menu)
export function prefetchNotifications(
  qc: ReturnType<typeof useQueryClient>,
  fetcher: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
  opts: { onlyUnread?: boolean; limit?: number; offset?: number } = {}
) {
  const { onlyUnread = false, limit = 5, offset = 0 } = opts;
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (onlyUnread) params.set("unread", "true");
  qc.prefetchQuery({
    queryKey: ["notifications", onlyUnread, limit, offset],
    queryFn: async () => {
      const res = await fetcher(`${API.NOTIFICATIONS}?${params.toString()}`);
      if (res.status === 404)
        return {
          notifications: [],
          total: 0,
          limit,
          offset,
        } as NotificationsResponse;
      if (!res.ok) throw new Error("Prefetch notifications failed");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });
}
