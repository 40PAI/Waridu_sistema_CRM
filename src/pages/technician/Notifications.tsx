import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

const getIcon = (type: 'task' | 'event' | 'system' | 'issue' | 'material') => {
  switch (type) {
    case 'task': return <CheckCircle className="h-4 w-4" />;
    case 'event': return <Calendar className="h-4 w-4" />;
    case 'issue': return <AlertCircle className="h-4 w-4" />;
    case 'material': return <Bell className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
  }
};

const TechnicianNotifications = () => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

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
            Mantenha-se atualizado com as últimas informações em tempo real.
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
              <div className="p-2 rounded-full bg-secondary">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{notification.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString("pt-BR")}
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