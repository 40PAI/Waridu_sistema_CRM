"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerticalTimeline, VerticalTimelineElement } from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Client } from "@/hooks/useClients";
import type { Communication } from "@/hooks/useCommunications";

interface ClientDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  communications: Communication[];
}

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ open, onOpenChange, client, communications }) => {
  if (!client) return null;

  const clientCommunications = communications.filter(c => c.client_id === client.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ficha de Cliente: {client.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><strong>Email:</strong> {client.email || "—"}</div>
              <div><strong>Telefone:</strong> {client.phone || "—"}</div>
              <div><strong>NIF:</strong> {client.nif || "—"}</div>
              <div><strong>Endereço:</strong> {client.address || "—"}</div>
              <div><strong>Setor:</strong> {client.sector || "—"}</div>
              <div><strong>Persona:</strong> {client.persona || "—"}</div>
              <div><strong>Ciclo de Vida:</strong> <Badge variant="outline">{client.lifecycle_stage || "Lead"}</Badge></div>
              <div><strong>Tags:</strong> {client.tags?.map(tag => <Badge key={tag} variant="secondary" className="mr-1">{tag}</Badge>) || "—"}</div>
              <div><strong>Observações:</strong> {client.notes || "—"}</div>
            </CardContent>
          </Card>

          {/* Timeline de Comunicações */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Comunicações</CardTitle>
            </CardHeader>
            <CardContent>
              {clientCommunications.length > 0 ? (
                <VerticalTimeline layout="1-column-left" className="vertical-timeline-custom-line">
                  {clientCommunications.map((comm) => (
                    <VerticalTimelineElement
                      key={comm.id}
                      className="vertical-timeline-element--work"
                      date={format(new Date(comm.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      iconStyle={{ background: 'rgb(33, 150, 243)', color: '#fff' }}
                    >
                      <h3 className="vertical-timeline-element-title">{comm.type}</h3>
                      {comm.subject && <h4 className="vertical-timeline-element-subtitle">{comm.subject}</h4>}
                      <p>{comm.notes}</p>
                    </VerticalTimelineElement>
                  ))}
                </VerticalTimeline>
              ) : (
                <p className="text-muted-foreground">Nenhuma comunicação registrada.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailModal;