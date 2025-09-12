"use client";

import * as React from "react";
import { KanbanBoard, type Task } from "@/components/kanban/KanbanBoard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TechnicianTasksKanban = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch tasks
  const fetchTasks = React.useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTasks: Task[] = (data || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.done ? 'done' : 'todo', // Map existing done field to status
        assigned_to: task.assigned_to,
        event_id: task.event_id,
        created_at: task.created_at,
        updated_at: task.updated_at,
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      showError("Erro ao carregar tarefas.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update task
  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const dbUpdates: any = {};
      
      if (updates.status) {
        dbUpdates.done = updates.status === 'done';
      }
      
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;

      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));

      showSuccess("Tarefa atualizada com sucesso!");
    } catch (error) {
      console.error("Error updating task:", error);
      showError("Erro ao atualizar tarefa.");
    }
  };

  // Create task
  const handleTaskCreate = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          done: taskData.status === 'done',
          assigned_to: taskData.assigned_to,
          event_id: taskData.event_id,
        })
        .select()
        .single();

      if (error) throw error;

      const newTask: Task = {
        ...taskData,
        id: data.id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setTasks(prev => [newTask, ...prev]);
      showSuccess("Tarefa criada com sucesso!");
    } catch (error) {
      console.error("Error creating task:", error);
      showError("Erro ao criar tarefa.");
    }
  };

  // Real-time subscription
  React.useEffect(() => {
    if (!user) return;

    fetchTasks();

    const channel = supabase
      .channel(`tasks-user-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `assigned_to=eq.${user.id}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newTask = payload.new as any;
            const formattedTask: Task = {
              id: newTask.id,
              title: newTask.title,
              description: newTask.description,
              status: newTask.done ? 'done' : 'todo',
              assigned_to: newTask.assigned_to,
              event_id: newTask.event_id,
              created_at: newTask.created_at,
              updated_at: newTask.updated_at,
            };
            setTasks(prev => [formattedTask, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any;
            setTasks(prev => prev.map(task => 
              task.id === updated.id 
                ? { 
                    ...task, 
                    title: updated.title,
                    description: updated.description,
                    status: updated.done ? 'done' : 'todo',
                    updated_at: updated.updated_at
                  } 
                : task
            ));
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as any;
            setTasks(prev => prev.filter(task => task.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTasks]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Quadro Kanban de Tarefas</CardTitle>
          <CardDescription>Visualize e gerencie suas tarefas arrastando entre as colunas.</CardDescription>
        </CardHeader>
        <CardContent>
          <KanbanBoard
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleTaskCreate}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicianTasksKanban;