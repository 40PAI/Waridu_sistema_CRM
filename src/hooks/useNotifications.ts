import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { showError, showSuccess } from "@/utils/toast";
import type { Notification } from "@/types";

export type NotificationType = 'task' | 'event' | 'system' | 'issue' | 'material';

export interface AppNotification extends Notification {}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  const userId = user?.id;

  // Fetch inicial
  const fetchNotifications = React.useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      console.error("Erro ao buscar notificações:", error);
      showError("Erro ao carregar notificações.");
    } else {
      setNotifications((data || []) as AppNotification[]);
    }
    setLoading(false);
  }, [userId]);

  // Realtime subscription
  React.useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    const channel = supabase
      .channel(`notifications-user-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as AppNotification;
            setNotifications(prev => [newNotif, ...prev]);
            showSuccess(newNotif.title || "Nova notificação");
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as AppNotification;
            setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n));
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as AppNotification;
            setNotifications(prev => prev.filter(n => n.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  const unreadCount = React.useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      showError("Erro ao marcar como lida.");
      return;
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      showError("Erro ao marcar todas como lidas.");
      return;
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showSuccess("Todas as notificações marcadas como lidas.");
  };

  const createNotification = async (notification: Omit<AppNotification, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    if (error) {
      console.error("Erro ao criar notificação:", error);
      showError("Erro ao criar notificação.");
      return null;
    }
    return data as AppNotification;
  };

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
  };
}