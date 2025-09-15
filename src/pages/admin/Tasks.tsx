import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEvents } from "@/hooks/useEvents";
import { Employee } from "@/components/employees/EmployeeDialog";
import { showSuccess, showError } from "@/utils/toast";
import { Plus, Edit, Trash2, Search, Filter } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TaskStatus = 'todo' | 'in_progress' | 'done';

interface Task {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  assigned_to: string;
  event_id?: number;
  created_at: string;
}

interface TaskWithEmployee {
  task: Task;
  employee?: Employee;
  eventName?: string;
}

const AdminTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = React.useState<TaskWithEmployee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<TaskStatus | "all">("all");
  const [search, setSearch] = React.useState("");

  const { employees } = useEmployees();
  const { events } = useEvents();

  const eventMap = React.useMemo(() => {
    return events.reduce<Record<number, string>>((acc, event) => {
      acc[event.id] = event.name;
      return acc;
    }, {});
  }, [events]);

  const employeeMap = React.useMemo(() => {
    return employees.reduce<Record<string, Employee>>((acc, emp) => {
      acc[emp.id] = emp;
      return acc;
    }, {});
  }, [employees]);

  // Fetch tasks
  const fetchTasks = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          done,
          assigned_to,
          event_id,
          created_at,
          employees!assigned_to(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTasks: TaskWithEmployee[] = (data || []).map((taskData: any) => ({
        task: {
          id: taskData.id,
          title: taskData.title,
          description: taskData.description,
          done: taskData.done,
          assigned_to: taskData.assigned_to,
          event_id: taskData.event_id,
          created_at: taskData.created_at,
        },
        employee: taskData.employees,
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      showError("Erro ao carregar tarefas.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Create task
  const createTask = async (taskData: Omit<Task, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          done: false,
          assigned_to: taskData.assigned_to,
          event_id: taskData.event_id,
        })
        .select()
        .single();

      if (error) throw error;

      const newTask: TaskWithEmployee = {
        task: {
          id: data.id,
          title: data.title,
          description: data.description,
          done: data.done,
          assigned_to: data.assigned_to,
          event_id: data.event_id,
          created_at: data.created_at,
        },
        employee: employeeMap[taskData.assigned_to],
      };

      setTasks(prev => [newTask, ...prev]);
      showSuccess("Tarefa criada com sucesso!");
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error creating task:", error);
      showError("Erro ao criar tarefa.");
    }
  };

  // Update task
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(t => 
        t.task.id === taskId ? { ...t, task: { ...t.task, ...updates } } : t
      ));
      showSuccess("Tarefa atualizada com sucesso!");
      setEditingTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
      showError("Erro ao atualizar tarefa.");
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.task.id !== taskId));
      showSuccess("Tarefa removida com sucesso!");
    } catch (error) {
      console.error("Error deleting task:", error);
      showError("Erro ao remover tarefa.");
    }
  };

  const filteredTasks = React.useMemo(() => {
    return tasks.filter(({ task }) => {
      const statusMatch = statusFilter === "all" || (statusFilter === 'done' ? task.done : !task.done);
      const searchMatch = !search || task.title.toLowerCase().includes(search.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [tasks, statusFilter, search]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Table>
          <TableHeader>
            <TableRow>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell><Skeleton className="h-8 w-full" /></TableCell>
              <TableCell><Skeleton className="h-8 w-full" /></TableCell>
              <TableCell><Skeleton className="h-8 w-full" /></TableCell>
              <TableCell><Skeleton className="h-8 w-full" /></TableCell>
              <TableCell><Skeleton className="h-8 w-full" /></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">Gerenciar Tarefas</h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie tarefas para os técnicos da equipe.</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Todas as Tarefas</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar por título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="todo">Pendente</SelectItem>
                <SelectItem value="done">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Atribuída a</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length > 0 ? filteredTasks.map(({ task, employee }) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{task.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={employee?.avatar} />
                        <AvatarFallback>{employee?.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee?.name || "Não atribuída"}</p>
                        <p className="text-xs text-muted-foreground">{employee?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{eventMap[task.event_id] || "Sem evento"}</TableCell>
                  <TableCell>
                    <Badge variant={task.done ? "default" : "secondary"}>
                      {task.done ? "Concluída" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(task.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingTask(task)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => deleteTask(task.id)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    Nenhuma tarefa encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Tarefa</DialogTitle>
            <DialogDescription>Atribua uma tarefa a um técnico específico.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const title = formData.get('task-title') as string;
            const description = formData.get('task-description') as string;
            const assignedTo = formData.get('task-assigned-to') as string;
            const eventId = formData.get('task-event') as string;
            
            if (!title.trim() || !assignedTo) {
              showError("Título e técnico atribuído são obrigatórios.");
              return;
            }

            createTask({
              title: title.trim(),
              description: description.trim() || undefined,
              assigned_to: assignedTo,
              event_id: eventId ? Number(eventId) : undefined,
            });
          }}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Título da Tarefa</Label>
                <Input
                  id="task-title"
                  name="task-title"
                  placeholder="Ex: Verificar som do evento"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Descrição</Label>
                <Textarea
                  id="task-description"
                  name="task-description"
                  placeholder="Detalhes da tarefa..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-assigned-to">Atribuir a</Label>
                <Select name="task-assigned-to">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o técnico" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => e.role === 'Técnico').map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-event">Evento Relacionado (Opcional)</Label>
                <Select name="task-event">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem evento específico</SelectItem>
                    {events.map(event => (
                      <SelectItem key={event.id} value={String(event.id)}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline">Cancelar</Button>
              <Button type="submit">Criar Tarefa</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
            <DialogDescription>Atualize os detalhes da tarefa.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!editingTask) return;
            
            const formData = new FormData(e.currentTarget);
            const title = formData.get('edit-task-title') as string;
            const description = formData.get('edit-task-description') as string;
            const assignedTo = formData.get('edit-task-assigned-to') as string;
            const eventId = formData.get('edit-task-event') as string;
            
            if (!title.trim() || !assignedTo) {
              showError("Título e técnico atribuído são obrigatórios.");
              return;
            }

            updateTask(editingTask.id, {
              title: title.trim(),
              description: description.trim() || undefined,
              assigned_to: assignedTo,
              event_id: eventId ? Number(eventId) : undefined,
            });
          }}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-task-title">Título</Label>
                <Input
                  id="edit-task-title"
                  name="edit-task-title"
                  placeholder="Título da tarefa"
                  defaultValue={editingTask?.title}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-description">Descrição</Label>
                <Textarea
                  id="edit-task-description"
                  name="edit-task-description"
                  placeholder="Detalhes da tarefa..."
                  defaultValue={editingTask?.description}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-assigned-to">Atribuir a</Label>
                <Select name="edit-task-assigned-to" defaultValue={editingTask?.assigned_to}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o técnico" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => e.role === 'Técnico').map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-event">Evento Relacionado (Opcional)</Label>
                <Select name="edit-task-event" defaultValue={editingTask?.event_id?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem evento específico</SelectItem>
                    {events.map(event => (
                      <SelectItem key={event.id} value={String(event.id)}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline">Cancelar</Button>
              <Button type="submit">Atualizar Tarefa</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTasks;