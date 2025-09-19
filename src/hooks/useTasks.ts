import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import type { Task } from "@/types";

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTasks: Task[] = (data || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        done: task.done,
        assigned_to: task.assigned_to,
        event_id: task.event_id,
        created_at: task.created_at,
        updated_at: task.updated_at,
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar tarefas.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          done: taskData.done,
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
      return newTask;
    } catch (error) {
      console.error("Error creating task:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar tarefa.";
      showError(errorMessage);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));
      showSuccess("Tarefa atualizada com sucesso!");
    } catch (error) {
      console.error("Error updating task:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar tarefa.";
      showError(errorMessage);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskId));
      showSuccess("Tarefa removida com sucesso!");
    } catch (error) {
      console.error("Error deleting task:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao remover tarefa.";
      showError(errorMessage);
    }
  };

  const tasksByAssignee = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    tasks.forEach(task => {
      if (!grouped[task.assigned_to]) {
        grouped[task.assigned_to] = [];
      }
      grouped[task.assigned_to].push(task);
    });
    return grouped;
  }, [tasks]);

  const tasksByEvent = useMemo(() => {
    const grouped: Record<number, Task[]> = {};
    tasks.forEach(task => {
      if (task.event_id) {
        if (!grouped[task.event_id]) {
          grouped[task.event_id] = [];
        }
        grouped[task.event_id].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  const pendingTasks = useMemo(() => tasks.filter(task => !task.done), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(task => task.done), [tasks]);

  return {
    tasks,
    loading,
    error,
    tasksByAssignee,
    tasksByEvent,
    pendingTasks,
    completedTasks,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks: fetchTasks,
  };
};