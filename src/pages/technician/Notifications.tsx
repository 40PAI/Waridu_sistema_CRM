import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertCircle, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { showError, showSuccess } from "@/utils/toast";

type Notification = {
  id: string;
  title: string;
  description: string;
  type: 'task' | 'event' | 'system' | 'issue';
  read: boolean;
  created_at: string;
};

const getIcon = (type: Notification['type']) => {
  switch (type) {
    case 'task': return <CheckCircle className="h-4 w-4" />;
    case 'event': return <Calendar className="h-4 w-4" />;
    case 'issue': return <AlertCircle className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
  }
};

const getVariant = (type: Notification['type']) => {
  switch (type) {
    case 'task': return 'default';
    case 'event': return 'secondary';
    case 'issue': return 'destructive';
    default: return 'default';
  }
};

const TechnicianNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Carregar notificações do Supabase
  React.useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Formatar notificações
        const formattedNotifications: Notification[] = (data || []).map((notification: any) => ({
          id: notification.id,
          title: notification.title,
          description: notification.description,
          type: notification.type,
          read: notification.read,
          created_at: notification.created_at
        }));
        
        setNotifications(formattedNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        showError("Erro ao carregar as notificações.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      
      showSuccess("Notificação marcada como lida.");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      showError("Erro ao marcar notificação como lida.");
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(notifications.map(n => ({ ...n, read: true })));
      showSuccess("Todas as notificações marcadas como lidas.");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      showError("Erro ao marcar todas as notificações como lidas.");
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando notificações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Notificações</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount} não lidas de {notifications.length} notificações
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          Marcar todas como lidas
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Notificações</CardTitle>
          <CardDescription>
            Mantenha-se atualizado com as últimas informações.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifications.length > 0 ? notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`flex items-start space-x-4 p-4 rounded-lg border ${
                !notification.read ? 'bg-muted' : ''
              }`}
            >
              <div className={`p-2 rounded-full ${getVariant(notification.type) === 'default' ? 'bg-primary' : getVariant(notification.type) === 'secondary' ? 'bg-secondary' : 'bg-destructive'}`}>
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{notification.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notification.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {notification.description}
                </p>
              </div>
              {!notification.read && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => markAsRead(notification.id)}
                >
                  Marcar como lida
                </Button>
              )}
            </div>
          )) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma notificação encontrada.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicianNotifications;