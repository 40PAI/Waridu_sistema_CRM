"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Plus, MoreHorizontal, ArrowLeft } from "lucide-react";
import type { EventProject, PipelineStatus } from "@/types/crm";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";

interface ViewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: EventProject | null;
}

const PIPELINE_STATUSES: PipelineStatus[] = [
  "1º Contato",
  "Orçamento",
  "Negociação",
  "Confirmado",
  "Cancelado",
];

export function ViewProjectDialog({ open, onOpenChange, project }: ViewProjectDialogProps) {
  const { clients } = useClients();
  const { services } = useServices();

  const clientOptions = clients.map(c => ({ value: c.id, label: `${c.name} (${c.email})` }));

  if (!project) return null;

  const clientName = clients.find(c => c.id === project.client_id)?.name || "Cliente não encontrado";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Visualizar Projeto: {project.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Linha 1: Nome do Projeto + Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Projeto</label>
              <Input id="view-project-name" value={project.name} readOnly />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Input id="view-client-id" value={clientName} readOnly />
            </div>
          </div>

          {/* Linha 2: Status + Receita */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={project.pipeline_status} disabled>
                <SelectTrigger id="view-pipeline-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor Estimado (AOA)</label>
              <Input id="view-estimated-value" type="number" value={project.estimated_value || ""} readOnly />
            </div>
          </div>

          {/* Linha 3: Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Início</label>
              <Input id="view-start-date" type="date" value={project.startDate} readOnly />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Fim</label>
              <Input id="view-end-date" type="date" value={project.endDate} readOnly />
            </div>
          </div>

          {/* Linha 4: Local */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Local</label>
            <Input id="view-location" value={project.location} readOnly />
          </div>

          {/* Linha 5: Serviços */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Serviços Contratados</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={project.service_ids?.includes(s.id)}
                    disabled
                  />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Linha 6: Notas */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notas</label>
            <textarea
              id="view-notes"
              rows={3}
              value={project.notes || ""}
              readOnly
              className="w-full p-2 border rounded-md resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}