"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Plus, MoreHorizontal, ArrowLeft } from "lucide-react";
import type { Client } from "@/hooks/useClients";
import { useClients } from "@/hooks/useClients";
import { useCommunications } from "@/hooks/useCommunications";
import QuickActions from "@/components/crm/QuickActions";
import GmailIntegration from "@/components/crm/GmailIntegration";
import ClientHeader from "@/components/crm/ClientHeader";
import ClientMetrics from "@/components/crm/ClientMetrics";
import ClientInfoCard from "@/components/crm/ClientInfoCard";
import ClientProjectsList from "@/components/crm/ClientProjectsList";
import ClientCommunications from "@/components/crm/ClientCommunications";
import { useServices } from "@/hooks/useServices";

interface ClientDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  communications: any[];
}

const ClientDetailModal = ({ open, onOpenChange, client, communications }: ClientDetailModalProps) => {
  // Note: keeping component behavior, but adjust rendering for service_ids
  const { services } = useServices();

  const serviceNameById = React.useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [services]);

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Ficha de Cliente: {client.name}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: basic info */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <p className="text-sm">{client.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-sm">{client.email || "—"}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Telefone</label>
                <p className="text-sm">{client.phone || "—"}</p>
              </div>

              <div>
                <label className="text-sm font-medium">NIF</label>
                <p className="text-sm">{client.nif || "—"}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Setor</label>
                <p className="text-sm">{client.sector || "—"}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Persona</label>
                <p className="text-sm">{client.persona || "—"}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Ciclo de Vida</label>
                <p className="text-sm">{client.lifecycle_stage || "Lead"}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Tags / Serviços de Interesse</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {client.service_ids && client.service_ids.length > 0 ? (
                    client.service_ids.map((sid) => (
                      <Badge key={sid} variant="secondary" className="text-xs">
                        {serviceNameById[sid] || sid}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Observações</label>
                <p className="text-sm">{client.notes || "—"}</p>
              </div>
            </div>
          </div>

          {/* Right column: communications/timeline & quick actions */}
          <div className="space-y-6">
            <GmailIntegration />
            <ClientCommunications communications={communications} onViewAll={() => {}} onAddNew={() => {}} />
            <QuickActions client={client} onAddCommunication={() => {}} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailModal;