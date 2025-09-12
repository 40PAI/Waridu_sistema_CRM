import * as React from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const typeLabel: Record<string, string> = {
  task: "Tarefa",
  event: "Evento",
  system: "Sistema",
  issue: "Problema",
  material: "Materiais",
};

export default function NotificationsBell() {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const latest = notifications.slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] leading-none rounded-full">
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Notificações</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={markAllAsRead} disabled={unreadCount === 0}>
              Marcar todas como lidas
            </Button>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link to="/notifications">Ver todas</Link>
            </Button>
          </div>
        </div>
        <div className="space-y-2 max-h-64 overflow-auto">
          {latest.length > 0 ? latest.map(n => (
            <div key={n.id} className="border rounded p-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">{n.title}</p>
                {!n.read && <Badge variant="secondary" className="text-[10px]">novo</Badge>}
              </div>
              {n.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.description}</p>}
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{typeLabel[n.type] ?? "Info"}</span>
                <span>{new Date(n.created_at).toLocaleString("pt-BR")}</span>
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">Sem notificações recentes.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}