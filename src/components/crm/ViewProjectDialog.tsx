"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
              <Label htmlFor="view-project-name">Nome do Projeto</Label>
              <Input id="view-project-name" value={project.name} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="view-client-id">Cliente</Label>
              <Input id="view-client-id" value={clientName} readOnly />
            </div>
          </div>

          {/* Linha 2: Status + Receita */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="view-pipeline-status">Status</Label>
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
              <Label htmlFor="view-estimated-value">Valor Estimado (AOA)</Label>
              <Input id="view-estimated-value" type="number" value={project.estimated_value || ""} readOnly />
            </div>
          </div>

          {/* Linha 3: Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="view-start-date">Data de Início</Label>
              <Input id="view-start-date" type="date" value={project.startDate} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="view-end-date">Data de Fim</Label>
              <Input id="view-end-date" type="date" value={project.endDate} readOnly />
            </div>
          </div>

          {/* Linha 4: Local */}
          <div className="space-y-2">
            <Label htmlFor="view-location">Local</Label>
            <Input id="view-location" value={project.location} readOnly />
          </div>

          {/* Linha 5: Serviços */}
          <div className="space-y-2">
            <Label>Serviços Contratados</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2">
                  <Checkbox checked={project.service_ids?.includes(s.id)} disabled />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Linha 6: Notas */}
          <div className="space-y-2">
            <Label htmlFor="view-notes">Notas</Label>
            <Textarea id="view-notes" rows={3} value={project.notes || ""} readOnly />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}