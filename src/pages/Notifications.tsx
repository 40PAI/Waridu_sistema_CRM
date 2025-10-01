import * as React from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const typeLabel: Record<string, string> = {
  task: "Tarefa",
  event: "Evento",
  system: "Sistema",
  issue: "Problema",
  material: "Materiais",
};

export default function NotificationsPage() {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const [typeFilter, setTypeFilter] = React.useState<"all" | "task" | "event" | "system" | "issue" | "material">("all");
  const [readFilter, setReadFilter] = React.useState<"all" | "read" | "unread">("all");
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    return notifications.filter(n => {
      const typeOk = typeFilter === "all" || n.type === typeFilter;
      const readOk = readFilter === "all" || (readFilter === "read" ? n.read : !n.read);
      const s = search.trim().toLowerCase();
      const searchOk = !s || n.title.toLowerCase().includes(s) || (n.description || "").toLowerCase().includes(s);
      return typeOk && readOk && searchOk;
    });
  }, [notifications, typeFilter, readFilter, search]);

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
            Acompanhe atualizações do sistema em tempo real.
          </p>
        </div>
        <Button variant="outline" onClick={markAllAsRead}>
          Marcar todas como lidas
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Notificações</CardTitle>
          <CardDescription>Filtre por tipo, status de leitura e faça buscas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Input placeholder="Buscar por título ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="task">Tarefas</SelectItem>
                <SelectItem value="event">Eventos</SelectItem>
                <SelectItem value="material">Materiais</SelectItem>
                <SelectItem value="issue">Problemas</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
            <Select value={readFilter} onValueChange={(v) => setReadFilter(v as any)}>
              <SelectTrigger><SelectValue placeholder="Leitura" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filtered.length > 0 ? filtered.map(n => (
              <div key={n.id} className={`p-3 border rounded-md ${!n.read ? 'bg-muted/50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      <Badge variant="secondary" className="text-[10px]">{typeLabel[n.type] ?? "Info"}</Badge>
                      {!n.read && <Badge variant="default" className="text-[10px]">novo</Badge>}
                    </div>
                    {n.description && <p className="text-sm text-muted-foreground mt-1">{n.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  {!n.read && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)}>
                      Marcar como lida
                    </Button>
                  )}
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma notificação encontrada.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}