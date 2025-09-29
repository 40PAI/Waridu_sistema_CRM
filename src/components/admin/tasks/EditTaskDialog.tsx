import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { showError } from "@/utils/toast";
import { useAutoId } from "@/hooks/useAutoId";

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any | null;
  onUpdate: (taskId: string, updates: any) => void;
  technicians: any[];
  events: any[];
}

export const EditTaskDialog = ({ open, onOpenChange, task, onUpdate, technicians, events }: EditTaskDialogProps) => {
  // Generate unique IDs for form fields
  const getId = useAutoId('edit-task-dialog');
  
  // Ref for first field focus
  const firstFieldRef = React.useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [assignedTo, setAssignedTo] = React.useState("");
  const [eventId, setEventId] = React.useState("none");

  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setAssignedTo(task.assigned_to);
      setEventId(task.event_id ? String(task.event_id) : "none");
      
      // Focus first field for accessibility when dialog opens
      if (open) {
        setTimeout(() => {
          firstFieldRef.current?.focus();
        }, 100);
      }
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !title.trim() || !assignedTo) {
      showError("Título e técnico atribuído são obrigatórios.");
      return;
    }

    onUpdate(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      assigned_to: assignedTo,
      event_id: eventId === "none" ? undefined : Number(eventId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={getId('title')}
        aria-describedby={getId('description')}
      >
        <DialogHeader>
          <DialogTitle id={getId('title')}>Editar Tarefa</DialogTitle>
          <DialogDescription id={getId('description')}>Atualize os detalhes da tarefa.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor={getId('title-input')}>Título</Label>
            <Input
              id={getId('title-input')}
              name="title"
              autoComplete="off"
              placeholder="Título da tarefa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              ref={firstFieldRef}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={getId('description-input')}>Descrição</Label>
            <Textarea
              id={getId('description-input')}
              name="description"
              autoComplete="off"
              placeholder="Detalhes da tarefa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={getId('assigned-to')} id={getId('assigned-to-label')}>Atribuir a Técnico *</Label>
            <Select 
              value={assignedTo} 
              onValueChange={setAssignedTo}
            >
              <SelectTrigger 
                id={getId('assigned-to')}
                aria-labelledby={getId('assigned-to-label')}
              >
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
            <Label htmlFor={getId('event')} id={getId('event-label')}>Evento Relacionado (Opcional)</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger 
                id={getId('event')}
                aria-labelledby={getId('event-label')}
              >
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
          <Button 
            type="button" 
            onClick={handleSubmit}
          >
            Atualizar Tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};