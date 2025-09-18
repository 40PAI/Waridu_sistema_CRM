"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Communication } from "@/hooks/useCommunications";

interface ClientCommunicationsProps {
  communications: Communication[];
  onViewAll?: () => void;
  onAddNew?: () => void;
}

const iconForType = (type: Communication["type"]) => {
  switch (type) {
    case "email":
      return <Mail className="h-4 w-4" />;
    case "call":
      return <Phone className="h-4 w-4" />;
    case "meeting":
      return <Calendar className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
};

export default function ClientCommunications({ communications, onViewAll, onAddNew }: ClientCommunicationsProps) {
  const [filterType, setFilterType] = React.useState<"all" | Communication["type"]>("all");
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    return communications.filter((c) => {
      if (filterType !== "all" && c.type !== filterType) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        (c.subject || "").toLowerCase().includes(s) ||
        (c.notes || "").toLowerCase().includes(s)
      );
    });
  }, [communications, filterType, search]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Histórico de Comunicações</CardTitle>
            <CardDescription>Últimas interações com este cliente.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onAddNew}>Adicionar</Button>
            <Button variant="outline" size="sm" onClick={onViewAll}>Ver Todas</Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-2 items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por assunto ou conteúdo..."
            className="flex-1"
          />
          <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="email">Emails</SelectItem>
              <SelectItem value="call">Chamadas</SelectItem>
              <SelectItem value="meeting">Reuniões</SelectItem>
              <SelectItem value="note">Notas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((comm) => (
              <div key={comm.id} className="p-3 border rounded-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-none">{iconForType(comm.type)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{comm.subject || (comm.notes ? comm.notes.slice(0, 60) : comm.type)}</p>
                        <Badge variant="outline" className="text-[10px]">{comm.type}</Badge>
                      </div>
                      {comm.notes && <p className="text-sm text-muted-foreground truncate">{comm.notes}</p>}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground min-w-[110px] text-right">
                    <div>{format(new Date(comm.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nenhuma comunicação registrada.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}