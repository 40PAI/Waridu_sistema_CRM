"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { VerticalTimeline, VerticalTimelineElement } from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Client } from "@/hooks/useClients";
import type { Communication } from "@/hooks/useCommunications";
import { Search, Filter } from "lucide-react";

interface ClientDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  communications: Communication[];
}

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ open, onOpenChange, client, communications }) => {
  const [filterType, setFilterType] = React.useState<string>("all");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [groupByThread, setGroupByThread] = React.useState(false);

  if (!client) return null;

  const filteredCommunications = communications.filter(comm => {
    const matchesType = filterType === "all" || comm.type === filterType;
    const matchesSearch = !searchTerm || 
      comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const groupedCommunications = React.useMemo(() => {
    if (!groupByThread) return filteredCommunications;
    const groups: Record<string, Communication[]> = {};
    filteredCommunications.forEach(comm => {
      const threadKey = comm.provider_meta?.threadId || comm.id;
      if (!groups[threadKey]) groups[threadKey] = [];
      groups[threadKey].push(comm);
    });
    return Object.values(groups).flat();
  }, [filteredCommunications, groupByThread]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ficha de Cliente: {client.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-1">Email</h4>
              <p className="text-sm">{client.email || "—"}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Telefone</h4>
              <p className="text-sm">{client.phone || "—"}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">NIF</h4>
              <p className="text-sm">{client.nif || "—"}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Endereço</h4>
              <p className="text-sm">{client.address || "—"}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Setor</h4>
              <p className="text-sm">{client.sector || "—"}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Persona</h4>
              <p className="text-sm">{client.persona || "—"}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Ciclo de Vida</h4>
              <Badge variant="outline">{client.lifecycle_stage || "Lead"}</Badge>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {client.tags?.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                )) || "—"}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Observações</h4>
              <p className="text-sm">{client.notes || "—"}</p>
            </div>
          </div>

          {/* Timeline de Comunicações */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Buscar por assunto ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGroupByThread(!groupByThread)}
              >
                {groupByThread ? "Desagrupar" : "Agrupar por Thread"}
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {groupedCommunications.length > 0 ? (
                <VerticalTimeline layout="1-column-left" className="vertical-timeline-custom-line">
                  {groupedCommunications.map((comm) => (
                    <VerticalTimelineElement
                      key={comm.id}
                      className="vertical-timeline-element--work"
                      date={format(new Date(comm.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      iconStyle={{ background: 'rgb(33, 150, 243)', color: '#fff' }}
                    >
                      <h3 className="vertical-timeline-element-title">{comm.type}</h3>
                      {comm.subject && <h4 className="vertical-timeline-element-subtitle">{comm.subject}</h4>}
                      <p>{comm.notes}</p>
                      {comm.provider_meta?.threadId && (
                        <Badge variant="outline" className="mt-2">Thread: {comm.provider_meta.threadId}</Badge>
                      )}
                    </VerticalTimelineElement>
                  ))}
                </VerticalTimeline>
              ) : (
                <p className="text-muted-foreground">Nenhuma comunicação encontrada.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailModal;