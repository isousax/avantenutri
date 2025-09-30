import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts';
import { API } from '../config/api';

interface Notification {
  user_notification_id: string;
  notification_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
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
  type: 'info' | 'warning' | 'success' | 'error';
  target_type: 'all' | 'specific' | 'group';
  target_users?: string[];
  target_group?: 'active' | 'incomplete_questionnaire' | 'recent_signups';
  expires_at?: string;
}

export function useNotifications(onlyUnread = false, limit = 20, offset = 0) {
  const { authenticatedFetch, user } = useAuth();

  return useQuery({
    queryKey: ['notifications', onlyUnread, limit, offset],
    queryFn: async (): Promise<NotificationsResponse> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      if (onlyUnread) {
        params.set('unread', 'true');
      }

      const response = await authenticatedFetch(`${API.NOTIFICATIONS}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json();
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMarkNotificationRead() {
  const { authenticatedFetch } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await authenticatedFetch(API.notificationRead(notificationId), {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate notifications queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useSendNotification() {
  const { authenticatedFetch } = useAuth();

  return useMutation({
    mutationFn: async (data: SendNotificationRequest) => {
      const response = await authenticatedFetch(API.ADMIN_NOTIFICATIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send notification');
      }
      
      return response.json();
    },
  });
}