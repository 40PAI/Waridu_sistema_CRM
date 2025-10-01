import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useEvents } from "@/hooks/useEvents";
import { useEmployees } from "@/hooks/useEmployees";
import { Employee } from "@/components/employees/EmployeeDialog";
import { ArrowLeft } from "lucide-react";

const CreateTask = () => {
  const navigate = useNavigate();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [assignedTo, setAssignedTo] = React.useState("");
  const [eventId, setEventId] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const { events } = useEvents();
  const { employees } = useEmployees();

  // Filter technicians only
  const technicians = React.useMemo(() => employees.filter(e => e.role === 'Técnico' && e.status === 'Ativo'), [employees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedTo) {
      showError("Título e técnico atribuído são obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          done: false,
          assigned_to: assignedTo,
          event_id: eventId ? Number(eventId) : null,
        })
        .select()
        .single();

      if (error) throw error;

      showSuccess("Tarefa criada e atribuída com sucesso!");
      navigate("/admin/tasks", { replace: true });
    } catch (error) {
      console.error("Error creating task:", error);
      showError("Erro ao criar tarefa. Verifique as permissões e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/admin/tasks")} className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Voltar para Tarefas
      </Button>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Criar Nova Tarefa</CardTitle>
          <CardDescription>Atribua uma tarefa a um técnico para o evento.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Título da Tarefa *</Label>
              <Input
                id="task-title"
                placeholder="Ex: Verificar som do evento"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Descrição</Label>
              <Textarea
                id="task-description"
                placeholder="Detalhes da tarefa (opcional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-assigned-to">Atribuir a Técnico *</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo} required>
                <SelectTrigger>
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
              <Label htmlFor="task-event">Evento Relacionado (Opcional)</Label>
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem evento específico</SelectItem>
                  {(events || []).map((event) => ( // Safely access events
                    <SelectItem key={event.id} value={String(event.id)}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando..." : "Criar Tarefa"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTask;