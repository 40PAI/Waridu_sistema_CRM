"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCommunications } from "@/hooks/useCommunications";
import { useAuth } from "@/contexts/AuthContext";
import type { Event } from "@/types";
import { showError, showSuccess } from "@/utils/toast";

type CommunicationType = "email" | "call" | "meeting" | "note";

interface ProjectEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Event;
  onSave?: (p: Event) => Promise<void> | void;
}

export const ProjectEditDialog: React.FC<ProjectEditDialogProps> = ({ open, onOpenChange, project, onSave }) => {
  const { createCommunication } = useCommunications();
  const { user } = useAuth();

  const [type, setType] = React.useState<CommunicationType>("note");
  const [subject, setSubject] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setType("note");
      setSubject("");
      setNotes("");
    }
  }, [open, project]);

  const handleAddCommunication = async () => {
    if (!notes.trim()) {
      showError("Descreva a comunicação antes de adicionar.");
      return;
    }

    try {
      await createCommunication({
        client_id: project.client_id ?? undefined,
        project_id: project.id,
        type,
        subject: subject || undefined,
        notes,
        user_id: user?.id ?? "",
        date: new Date().toISOString(),
      });
      showSuccess("Comunicação registrada.");
      setType("note");
      setSubject("");
      setNotes("");
    } catch (err) {
      console.error("Failed to create communication", err);
      showError("Falha ao registrar comunicação.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Projeto: {project?.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <div>
            <Label>Registrar Comunicação</Label>
            <div className="grid gap-2 md:grid-cols-3">
              <Select value={type} onValueChange={(v) => setType(v as CommunicationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Chamada</SelectItem>
                  <SelectItem value="meeting">Reunião</SelectItem>
                  <SelectItem value="note">Nota</SelectItem>
                </SelectContent>
              </Select>

              <Input placeholder="Assunto (opcional)" value={subject} onChange={(e) => setSubject(e.target.value)} />

              <Button onClick={handleAddCommunication}>Adicionar</Button>
            </div>
          </div>

          <div>
            <Label>Detalhes</Label>
            <Textarea placeholder="Detalhes da comunicação..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectEditDialog;