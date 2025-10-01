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

interface ClientDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  communications: any[];
  onCreateProject?: (clientId: string) => void;
}

const ClientDetailModal = ({ open, onOpenChange, client, communications, onCreateProject }: ClientDetailModalProps) => {

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Ficha de Cliente: {client.name}</span>
            <div className="flex gap-2">
              {onCreateProject && (
                <Button size="sm" onClick={() => onCreateProject(client.id)}>
                  + Novo Projeto
                </Button>
              )}
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
                <label className="text-sm font-medium">Empresa</label>
                <p className="text-sm">{client.company || "—"}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Setor</label>
                <p className="text-sm">{client.sector || "—"}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Função na Empresa</label>
                <p className="text-sm">{client.position || "—"}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Ciclo de Vida</label>
                <p className="text-sm">{client.lifecycle_stage || "Lead"}</p>
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