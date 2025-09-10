import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertCircle, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Notification = {
  id: string;
  title: string;
  description: string;
  type: 'task' | 'event' | 'system' | 'issue';
  read: boolean;
  createdAt: Date;
};

// Mock data - will be replaced with real data from Supabase
const mockNotifications: Notification[] = [
  { 
    id: "1", 
    title: "Nova tarefa atribuída", 
    description: "Você tem uma nova tarefa para o evento Lançamento do Produto X", 
    type: 'task',
    read: false, 
    createdAt: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
  },
  { 
    id: "2", 
    title: "Evento atualizado", 
    description: "Os horários do evento Imersão de Vendas Q3 foram alterados", 
    type: 'event',
    read: true, 
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
  },
  { 
    id: "3", 
    title: "Problema reportado", 
    description: "Carlos Souza reportou um problema com a configuração de áudio", 
    type: 'issue',
    read: false, 
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
  },
  { 
    id: "4", 
    title: "Tarefa concluída", 
    description: "Sua tarefa 'Verificar equipamentos de áudio' foi marcada como concluída", 
    type: 'task',
    read: true, 
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
  },
];

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
  const [notifications, setNotifications] = React.useState<Notification[]>(mockNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

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
                    {format(notification.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
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