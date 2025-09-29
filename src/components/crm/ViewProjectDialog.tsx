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
import { useAutoId } from "@/hooks/useAutoId";
import { Label } from "@/components/ui/label";

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
  
  // Generate unique IDs for form fields
  const getId = useAutoId('view-project-dialog');

  const clientOptions = clients.map(c => ({ value: c.id, label: `${c.name} (${c.email})` }));

  if (!project) return null;

  const clientName = clients.find(c => c.id === project.client_id)?.name || "Cliente não encontrado";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={getId('title')}
      >
        <DialogHeader>
          <DialogTitle id={getId('title')}>Visualizar Projeto: {project.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Linha 1: Nome do Projeto + Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={getId('project-name')} className="text-sm font-medium">Nome do Projeto</Label>
              <Input id={getId('project-name')} name="projectName" value={project.name} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor={getId('client-id')} className="text-sm font-medium">Cliente</Label>
              <Input id={getId('client-id')} name="clientId" value={clientName} readOnly />
            </div>
          </div>

          {/* Linha 2: Status + Receita */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={getId('pipeline-status')} id={getId('pipeline-status-label')} className="text-sm font-medium">Status</Label>
              <Select value={project.pipeline_status} disabled>
                <SelectTrigger 
                  id={getId('pipeline-status')}
                  aria-labelledby={getId('pipeline-status-label')}
                >
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
              <Label htmlFor={getId('estimated-value')} className="text-sm font-medium">Valor Estimado (AOA)</Label>
              <Input id={getId('estimated-value')} name="estimatedValue" type="number" value={project.estimated_value || ""} readOnly />
            </div>
          </div>

          {/* Linha 3: Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={getId('start-date')} className="text-sm font-medium">Data de Início</Label>
              <Input id={getId('start-date')} name="startDate" type="date" value={project.startDate} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor={getId('end-date')} className="text-sm font-medium">Data de Fim</Label>
              <Input id={getId('end-date')} name="endDate" type="date" value={project.endDate} readOnly />
            </div>
          </div>

          {/* Linha 4: Local */}
          <div className="space-y-2">
            <Label htmlFor={getId('location')} className="text-sm font-medium">Local</Label>
            <Input id={getId('location')} name="location" value={project.location} readOnly />
          </div>

          {/* Linha 5: Serviços */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Serviços Contratados</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {services.map((s) => (
                <Label key={s.id} htmlFor={getId(`service-${s.id}`)} className="flex items-center gap-2">
                  <input
                    id={getId(`service-${s.id}`)}
                    name="services"
                    type="checkbox"
                    checked={project.service_ids?.includes(s.id)}
                    disabled
                    aria-label={`Serviço ${s.name} ${project.service_ids?.includes(s.id) ? 'selecionado' : 'não selecionado'}`}
                  />
                  <span className="text-sm">{s.name}</span>
                </Label>
              ))}
            </div>
          </div>

          {/* Linha 6: Notas */}
          <div className="space-y-2">
            <Label htmlFor={getId('notes')} className="text-sm font-medium">Notas</Label>
            <textarea
              id={getId('notes')}
              name="notes"
              rows={3}
              value={project.notes || ""}
              readOnly
              className="w-full p-2 border rounded-md resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}