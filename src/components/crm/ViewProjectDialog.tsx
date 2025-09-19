"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { EventProject } from "@/types/crm";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";

interface ViewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: EventProject | null;
}

export default function ViewProjectDialog({ open, onOpenChange, project }: ViewProjectDialogProps) {
  const { clients } = useClients();
  const { services } = useServices();

  const clientName = clients.find(c => c.id === project?.client_id)?.name || "Não definido";
  const serviceNames = (project?.service_ids || []).map(id => services.find(s => s.id === id)?.name || id).join(", ");

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Projeto: {project.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Cliente</Label>
              <p className="text-sm">{clientName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Badge variant="outline">{project.pipeline_status}</Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Valor Estimado</Label>
              <p className="text-sm">AOA {project.estimated_value?.toLocaleString("pt-AO") || "Não definido"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Data de Início</Label>
              <p className="text-sm">{project.startDate}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Data de Fim</Label>
              <p className="text-sm">{project.endDate || "Não definida"}</p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium">Serviços</Label>
              <p className="text-sm">{serviceNames || "Nenhum serviço"}</p>
            </div>
            {project.tags && project.tags.length > 0 && (
              <div className="md:col-span-2">
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {project.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="md:col-span-2">
              <Label className="text-sm font-medium">Notas</Label>
              <p className="text-sm">{project.notes || "Nenhuma nota"}</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}