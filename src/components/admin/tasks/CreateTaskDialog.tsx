import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { showError } from "@/utils/toast";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (taskData: { title: string; description?: string; assigned_to: string; event_id?: number }) => void;
  technicians: any[];
  events: any[];
}

export const CreateTaskDialog = ({ open, onOpenChange, onCreate, technicians, events }: CreateTaskDialogProps) => {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [assignedTo, setAssignedTo] = React.useState("");
  const [eventId, setEventId] = React.useState("none");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setEventId("none");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedTo) {
      showError("Título e técnico atribuído são obrigatórios.");
      return;
    }

    onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      assigned_to: assignedTo,
      event_id: eventId === "none" ? undefined : Number(eventId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Tarefa</DialogTitle>
          <DialogDescription>Atribua uma tarefa a um técnico específico.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-task-title">Título da Tarefa</Label>
              <Input
                id="create-task-title"
                placeholder="Ex: Verificar som do evento"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-task-description">Descrição</Label>
              <Textarea
                id="create-task-description"
                placeholder="Detalhes da tarefa..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-task-assigned-to">Atribuir a</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo} required>
                <SelectTrigger id="create-task-assigned-to">
                  <SelectValue placeholder="Selecione um técnico ativo" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name} ({tech.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-task-event">Evento Relacionado (Opcional)</Label>
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger id="create-task-event">
                  <SelectValue placeholder="Selecione um evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem evento específico</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={String(event.id)}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Criar Tarefa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};