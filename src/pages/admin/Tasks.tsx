import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CreateTaskDialog } from "@/components/admin/tasks/CreateTaskDialog";
import { EditTaskDialog } from "@/components/admin/tasks/EditTaskDialog";
import { TaskTable } from "@/components/admin/tasks/TaskTable";
import { supabase } from "@/integrations/supabase/client";
import { useEvents } from "@/hooks/useEvents";
import { useEmployees } from "@/hooks/useEmployees";
import { showSuccess, showError } from "@/utils/toast";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  employee?: any;
  eventName?: string;
}

const AdminTasks = () => {
  const [tasks, setTasks] = React.useState<TaskWithEmployee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<TaskStatus | "all">("all");
  const [search, setSearch] = React.useState("");

  const { employees } = useEmployees();
  const { events } = useEvents();

  const eventMap = React.useMemo(() => {
    return (events || []).reduce<Record<number, string>>((acc, event) => { // Safely access events
      acc[event.id] = event.name;
      return acc;
    }, {});
  }, [events]);

  const employeeMap = React.useMemo(() => {
    return employees.reduce<Record<string, any>>((acc, emp) => {
      acc[emp.id] = emp;
      return acc;
    }, {});
  }, [employees]);

  // Filter technicians only for dropdowns
  const technicians = React.useMemo(() => employees.filter(e => e.role === 'Técnico' && e.status === 'Ativo'), [employees]);

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
      setShowEditDialog(false);
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

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <div className="border rounded-md">
          <div className="p-4 border-b">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-4 w-1/5" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </div>
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
          <TaskTable 
            tasks={filteredTasks}
            eventMap={eventMap}
            onEdit={(task) => {
              setEditingTask(task);
              setShowEditDialog(true);
            }}
            onDelete={deleteTask}
          />
        </CardContent>
      </Card>

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchTasks}
      />

      <EditTaskDialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        onUpdate={updateTask}
        technicians={technicians}
        events={events || []} // Safely access events
      />
    </div>
  );
};

export default AdminTasks;