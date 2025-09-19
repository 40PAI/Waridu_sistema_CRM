"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { usePipelinePhases } from "@/hooks/usePipelinePhases";
import type { EventProject } from "@/types/crm";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: EventProject | null;
  onSave: (updatedProject: EventProject) => Promise<void>;
}

export default function EditProjectDialog({ open, onOpenChange, project, onSave }: EditProjectDialogProps) {
  const { activePhases } = usePipelinePhases();
  const [status, setStatus] = React.useState(project?.pipeline_status || "1º Contato");
  const [notes, setNotes] = React.useState(project?.notes || "");
  const [tags, setTags] = React.useState(project?.tags?.join(", ") || "");
  const [estimatedValue, setEstimatedValue] = React.useState(project?.estimated_value || "");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open && project) {
      setStatus(project.pipeline_status || "1º Contato");
      setNotes(project.notes || "");
      setTags(project.tags?.join(", ") || "");
      setEstimatedValue(String(project.estimated_value || ""));
    }
  }, [open, project]);

  const handleSave = async () => {
    if (!project) return;

    const tagArray = tags.split(",").map(t => t.trim()).filter(Boolean);

    const updatedProject: EventProject = {
      ...project,
      pipeline_status: status,
      notes,
      tags: tagArray,
      estimated_value: Number(estimatedValue) || undefined,
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
            <Select value={status} onValueChange={setStatus}>
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
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="urgente, alto valor, VIP"
            />
            <p className="text-sm text-muted-foreground">Ex: urgente, alto valor</p>
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