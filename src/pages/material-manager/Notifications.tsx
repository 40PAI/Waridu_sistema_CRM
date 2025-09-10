import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertCircle, Calendar, Archive } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { showError, showSuccess } from "@/utils/toast";

type Notification = {
  id: string;
  title: string;
  description: string | null;
  type: 'task' | 'event' | 'system' | 'material';
  read: boolean;
  created_at: string;
};

const getIcon = (type: Notification['type']) => {
  switch (type) {
    case 'task': return <CheckCircle className="h-4 w-4" />;
    case 'event': return <Calendar className="h-4 w-4" />;
    case 'material': return <Archive className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
  }
};

const getVariant = (type: Notification['type']) => {
  switch (type) {
    case 'event': return 'secondary';
    default: return 'default';
  }
};

const MaterialManagerNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setNotifications((data || []) as Notification[]);
      } catch {
        showError("Erro ao carregar as notificações.");
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) return showError("Erro ao marcar notificação como lida.");
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    showSuccess("Notificação marcada como lida.");
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read).length;
    if (!unread) return;
    const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user?.id).eq("read", false);
    if (error) return showError("Erro ao marcar todas como lidas.");
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    showSuccess("Todas as notificações marcadas como lidas.");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return <div className="flex items-center justify-center h-full"><p>Carregando notificações...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Notificações</h1>
          <p className="text-sm text-muted-foreground">{unreadCount} não lidas de {notifications.length} notificações</p>
        </div>
        <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>Marcar todas como lidas</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Notificações</CardTitle>
          <CardDescription>Mantenha-se atualizado com as últimas informações.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifications.length ? notifications.map((n) => (
            <div key={n.id} className={`flex items-start space-x-4 p-4 rounded-lg border ${!n.read ? "bg-muted" : ""}`}>
              <div className={`p-2 rounded-full ${getVariant(n.type) === "default" ? "bg-primary" : "bg-secondary"}`}>{getIcon(n.type)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{n.title}</h3>
                  <span className="text-xs text-muted-foreground">{format(new Date(n.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
                {n.description && <p className="text-sm text-muted-foreground">{n.description}</p>}
              </div>
              {!n.read && <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)}>Marcar como lida</Button>}
            </div>
          )) : <p className="text-sm text-muted-foreground text-center py-4">Nenhuma notificação encontrada.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialManagerNotifications;