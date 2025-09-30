import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { showError, showSuccess } from "@/utils/toast";
import { loadAssigneesByEvent, loadEvents, createTask, ProfileOption, EventOption } from "@/utils/taskUtils";
import { useQueryClient } from "@tanstack/react-query";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateTaskDialog = ({ open, onOpenChange, onSuccess }: CreateTaskDialogProps) => {
  const queryClient = useQueryClient();
  
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [assignedTo, setAssignedTo] = React.useState("");
  const [eventId, setEventId] = React.useState<string>("none");
  
  const [assignees, setAssignees] = React.useState<ProfileOption[]>([]);
  const [events, setEvents] = React.useState<EventOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [dataLoading, setDataLoading] = React.useState(false);
  const [assigneesLoading, setAssigneesLoading] = React.useState(false);
  
  const [titleError, setTitleError] = React.useState("");
  const [assignedToError, setAssignedToError] = React.useState("");
  
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const assignedToRef = React.useRef<HTMLButtonElement>(null);
  const loadAssigneesRequestId = React.useRef(0);

  // Load events and initial assignees when dialog opens
  React.useEffect(() => {
    if (open) {
      loadData();
      // Focus on first field
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Reload assignees when event changes
  React.useEffect(() => {
    if (open) {
      loadAssigneesForEvent();
    }
  }, [eventId, open]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const eventsData = await loadEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      showError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setDataLoading(false);
    }
  };

  const loadAssigneesForEvent = async () => {
    // Increment request ID to track the latest request
    const currentRequestId = ++loadAssigneesRequestId.current;
    const targetEventId = eventId;
    
    setAssigneesLoading(true);
    try {
      const eventIdNum = eventId === "none" ? null : Number(eventId);
      const assigneesData = await loadAssigneesByEvent(eventIdNum);
      
      // Only update state if this is still the latest request and event hasn't changed
      if (currentRequestId === loadAssigneesRequestId.current && targetEventId === eventId) {
        setAssignees(assigneesData);
        
        // Reset assigned_to if current selection is not in new list
        if (assignedTo && !assigneesData.find(a => a.id === assignedTo)) {
          setAssignedTo("");
        }
      }
    } catch (error) {
      // Only show error if this is still the latest request
      if (currentRequestId === loadAssigneesRequestId.current) {
        console.error('Error loading assignees:', error);
        showError('Erro ao carregar utilizadores. Tente novamente.');
      }
    } finally {
      // Only clear loading if this is still the latest request
      if (currentRequestId === loadAssigneesRequestId.current) {
        setAssigneesLoading(false);
      }
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setEventId("none");
    setTitleError("");
    setAssignedToError("");
  };

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Validate title (min 3 characters)
    if (!title.trim()) {
      setTitleError("Título é obrigatório.");
      isValid = false;
      titleInputRef.current?.focus();
    } else if (title.trim().length < 3) {
      setTitleError("Título deve ter pelo menos 3 caracteres.");
      isValid = false;
      titleInputRef.current?.focus();
    } else {
      setTitleError("");
    }
    
    // Validate assigned_to
    if (!assignedTo) {
      setAssignedToError("Atribuir a é obrigatório.");
      if (isValid) {
        assignedToRef.current?.focus();
      }
      isValid = false;
    } else {
      setAssignedToError("");
    }
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        assigned_to: assignedTo,
        event_id: eventId === "none" ? null : Number(eventId),
      });

      // Invalidate tasks query to refetch
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      showSuccess("Tarefa criada com sucesso!");
      onOpenChange(false);
      resetForm();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error creating task:', error);
      
      // Specific error handling
      if (error.message === 'SEM_PERMISSAO') {
        showError("Sem permissão para criar a tarefa.");
      } else if (error.message === 'SELECAO_INVALIDA') {
        showError("Seleção inválida. Verifique o utilizador ou evento.");
      } else {
        showError("Não foi possível criar a tarefa. Tenta novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key on title input
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Handle Esc key to close modal
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Tarefa</DialogTitle>
          <DialogDescription>Atribua uma tarefa a um utilizador específico.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-task-title">
                Título da Tarefa *
              </Label>
              <Input
                ref={titleInputRef}
                id="create-task-title"
                placeholder="Ex: Verificar som do evento"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError("");
                }}
                onKeyDown={handleTitleKeyDown}
                disabled={loading || dataLoading}
                aria-invalid={!!titleError}
                aria-describedby={titleError ? "title-error" : undefined}
              />
              {titleError && (
                <p id="title-error" className="text-sm text-red-500">
                  {titleError}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-task-description">Descrição</Label>
              <Textarea
                id="create-task-description"
                placeholder="Detalhes da tarefa..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={loading || dataLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-task-assigned-to">Atribuir a *</Label>
              <Select 
                value={assignedTo} 
                onValueChange={(value) => {
                  setAssignedTo(value);
                  if (assignedToError) setAssignedToError("");
                }}
                disabled={loading || dataLoading || assigneesLoading}
              >
                <SelectTrigger 
                  ref={assignedToRef}
                  id="create-task-assigned-to"
                  aria-invalid={!!assignedToError}
                  aria-describedby={assignedToError ? "assigned-to-error" : undefined}
                >
                  <SelectValue placeholder={
                    assigneesLoading ? "Carregando..." : 
                    assignees.length === 0 ? "Nenhum utilizador disponível" :
                    "Selecione um utilizador"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {assignees.length === 0 && !assigneesLoading && (
                    <SelectItem value="no-options" disabled>
                      {eventId !== "none" ? "Nenhum técnico escalado para este evento" : "Nenhum utilizador disponível"}
                    </SelectItem>
                  )}
                  {assignees.map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id}>
                      {assignee.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignedToError && (
                <p id="assigned-to-error" className="text-sm text-red-500">
                  {assignedToError}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-task-event">Evento Relacionado (Opcional)</Label>
              <Select 
                value={eventId} 
                onValueChange={setEventId}
                disabled={loading || dataLoading}
              >
                <SelectTrigger id="create-task-event">
                  <SelectValue placeholder={dataLoading ? "Carregando..." : "Selecione um evento"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem evento</SelectItem>
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
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={loading || dataLoading || assigneesLoading || assignees.length === 0}
            >
              {loading ? "A criar..." : "Criar Tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};