"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { showError, showSuccess } from "@/utils/toast";
import type { EventProject, PipelineStatus } from "@/types/crm";
import { useClients } from "@/hooks/useClients";
import { useEvents } from "@/hooks/useEvents";
import { useServices } from "@/hooks/useServices";

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: EventProject | null;
  onSave: (updatedProject: EventProject) => Promise<void>;
}

const PIPELINE_STATUSES: PipelineStatus[] = [
  "1º Contato",
  "Orçamento",
  "Negociação",
  "Confirmado",
  "Cancelado",
];

export function EditProjectDialog({ open, onOpenChange, project, onSave }: EditProjectDialogProps) {
  const { clients } = useClients();
  const { updateEvent } = useEvents();
  const { services } = useServices();

  const [form, setForm] = React.useState<Partial<EventProject>>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && project) {
      setForm({
        id: project.id,
        name: project.name,
        client_id: project.client_id,
        pipeline_status: project.pipeline_status,
        service_ids: project.service_ids,
        estimated_value: project.estimated_value,
        startDate: project.startDate,
        endDate: project.endDate,
        location: project.location,
        status: project.status,
        tags: project.tags,
        notes: project.notes,
      });
    }
  }, [open, project]);

  const updateField = (key: keyof EventProject, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleService = (id: string) =>
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids?.includes(id)
        ? prev.service_ids.filter((s) => s !== id)
        : [...(prev.service_ids ?? []), id],
    }));

  const submit = async () => {
    if (!form.name?.trim() || !form.client_id || !form.service_ids?.length) {
      showError("Nome, cliente e serviços são obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const updatedProject: EventProject = {
        id: form.id!,
        name: form.name!,
        client_id: form.client_id!,
        pipeline_status: form.pipeline_status!,
        service_ids: form.service_ids!,
        estimated_value: form.estimated_value,
        startDate: form.startDate!,
        endDate: form.endDate!,
        location: form.location!,
        status: form.status!,
        tags: form.tags,
        notes: form.notes,
      };

      await onSave(updatedProject);
      showSuccess("Projeto atualizado com sucesso!");
      onOpenChange(false);
    } catch (error) {
      showError("Erro ao atualizar projeto.");
    } finally {
      setLoading(false);
    }
  };

  const clientOptions = clients.map(c => ({ value: c.id, label: `${c.name} (${c.email})` }));

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Projeto: {project.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Linha 1: Nome do Projeto + Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-name">Nome do Projeto *</Label>
              <Input id="edit-project-name" value={form.name || ""} onChange={(e) => updateField("name", e.target.value)} placeholder="Ex.: Evento BFA – Conferência" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-client-id">Cliente *</Label>
              <Select value={form.client_id || ""} onValueChange={(v) => updateField("client_id", v)}>
                <SelectTrigger id="edit-client-id">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linha 2: Status + Receita */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-pipeline-status">Status *</Label>
              <Select value={form.pipeline_status || ""} onValueChange={(v) => updateField("pipeline_status", v as PipelineStatus)}>
                <SelectTrigger id="edit-pipeline-status">
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
              <Label htmlFor="edit-estimated-value">Valor Estimado (AOA)</Label>
              <Input id="edit-estimated-value" type="number" value={form.estimated_value || ""} onChange={(e) => updateField("estimated_value", Number(e.target.value))} placeholder="0" />
            </div>
          </div>

          {/* Linha 3: Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start-date">Data de Início *</Label>
              <Input id="edit-start-date" type="date" value={form.startDate || ""} onChange={(e) => updateField("startDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end-date">Data de Fim</Label>
              <Input id="edit-end-date" type="date" value={form.endDate || ""} onChange={(e) => updateField("endDate", e.target.value)} />
            </div>
          </div>

          {/* Linha 4: Local */}
          <div className="space-y-2">
            <Label htmlFor="edit-location">Local</Label>
            <Input id="edit-location" value={form.location || ""} onChange={(e) => updateField("location", e.target.value)} placeholder="Ex.: CCTA, Talatona" />
          </div>

          {/* Linha 5: Serviços */}
          <div className="space-y-2">
            <Label>Serviços Contratados *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2">
                  <Checkbox checked={form.service_ids?.includes(s.id)} onCheckedChange={() => toggleService(s.id)} />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Linha 6: Notas */}
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notas</Label>
            <Textarea id="edit-notes" rows={3} value={form.notes || ""} onChange={(e) => updateField("notes", e.target.value)} placeholder="Observações, follow-up, urgências..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}