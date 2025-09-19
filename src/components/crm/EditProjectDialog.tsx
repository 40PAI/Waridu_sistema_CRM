"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePipelinePhases } from "@/hooks/usePipelinePhases";
import type { EventProject } from "@/types/crm";
import { showError, showSuccess } from "@/utils/toast";

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: EventProject | null;
  onSave: (updatedProject: EventProject) => Promise<void>;
}

export default function EditProjectDialog({ open, onOpenChange, project, onSave }: EditProjectDialogProps) {
  const { activePhases } = usePipelinePhases();
  const [status, setStatus] = React.useState<string>(project?.pipeline_status || "1º Contato");
  const [notes, setNotes] = React.useState(project?.notes || "");
  const [estimatedValue, setEstimatedValue] = React.useState<string>(project?.estimated_value ? String(project.estimated_value) : "");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open && project) {
      setStatus(project.pipeline_status || "1º Contato");
      setNotes(project.notes || "");
      setEstimatedValue(project.estimated_value ? String(project.estimated_value) : "");
    }
  }, [open, project]);

  const handleSave = async () => {
    if (!project) return;

    const updatedProject: EventProject = {
      ...project,
      pipeline_status: status,
      notes,
      estimated_value: estimatedValue ? Number(estimatedValue) : undefined,
    };

    setSaving(true);
    try {
      await onSave(updatedProject);
      showSuccess("Projeto atualizado!");
      onOpenChange(false);
    } catch (error) {
      showError("Erro ao atualizar projeto.");
    } finally {
      setSaving(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Projeto: {project.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activePhases.map(phase => (
                  <SelectItem key={phase.name} value={phase.name}>
                    {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimated-value">Valor Estimado (AOA)</Label>
            <Input
              id="estimated-value"
              type="number"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              placeholder="Ex: 500000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre o projeto..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}