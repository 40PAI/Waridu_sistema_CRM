"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, User, AlertCircle } from "lucide-react";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanTask } from "./KanbanTask";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createPortal } from "react-dom";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  assigned_to: string;
  event_id?: number;
  created_at: string;
  updated_at: string;
  // FUTURE: position?: number; // use to persist ordering
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate: (task: Omit<Task, "id" | "created_at" | "updated_at">) => void;
}

const columns = [
  { id: "todo", title: "A Fazer", color: "bg-gray-100 border-gray-200" },
  { id: "in_progress", title: "Em Andamento", color: "bg-blue-100 border-blue-200" },
  { id: "done", title: "Concluído", color: "bg-green-100 border-green-200" },
] as const;

export function KanbanBoard({ tasks, onTaskUpdate, onTaskCreate }: KanbanBoardProps) {
  // localTasks holds client-side ordering/state for immediate UI feedback.
  // We initialize from props and keep it synced unless user is dragging.
  const [localTasks, setLocalTasks] = React.useState<Task[]>(tasks);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  // Sync incoming tasks prop to localTasks when not dragging (to avoid clobbering user interactions)
  React.useEffect(() => {
    if (!activeTask) {
      setLocalTasks(tasks);
    }
  }, [tasks, activeTask]);

  // Sensors: pointer + keyboard for accessibility
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  // Helpers
  const isColumnId = (id: string) => columns.some((c) => c.id === id);

  const columnByTaskId = (id: string): Task["status"] | null => {
    const t = localTasks.find((tk) => tk.id === id);
    return t ? t.status : null;
  };

  const resolveTargetStatus = (overId: string): Task["status"] | null => {
    // If dropping directly on a column container -> return that column
    if (isColumnId(overId)) {
      return overId as Task["status"];
    }
    // If dropping on a task -> return that task's column/status
    return columnByTaskId(overId);
  };

  // Build grouped columns from localTasks
  const tasksByColumn: Record<string, Task[]> = React.useMemo(() => {
    const grouped: Record<string, Task[]> = { todo: [], in_progress: [], done: [] };
    localTasks.forEach((t) => {
      if (!grouped[t.status]) grouped[t.status] = [];
      grouped[t.status].push(t);
    });
    return grouped;
  }, [localTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = localTasks.find((t) => t.id === String(active.id)) || null;
    setActiveTask(task);
  };

  // IMPORTANT: onDragOver should NOT perform writes. Keep it for ephemeral UI only.
  const handleDragOver = () => {
    // Intentionally empty: we avoid persisting state here to prevent multiple writes.
    // Could set hover visuals/state if desired (not required).
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromStatus = columnByTaskId(activeId);
    const toStatus = resolveTargetStatus(overId);

    if (!fromStatus || !toStatus) {
      return;
    }

    // If moving to a different column -> persist status change (single write)
    if (fromStatus !== toStatus) {
      try {
        // Optimistic UI update: move the task to the end of target column in local state
        setLocalTasks((prev) => {
          const task = prev.find((p) => p.id === activeId);
          if (!task) return prev;
          // remove
          const removed = prev.filter((p) => p.id !== activeId);
          // insert at end of target column
          const idx = (() => {
            // find insertion index: after the last item of toStatus in removed array
            let lastIndex = -1;
            for (let i = 0; i < removed.length; i++) {
              if (removed[i].status === toStatus) lastIndex = i;
            }
            return lastIndex + 1;
          })();
          const newTask = { ...task, status: toStatus };
          const newArr = [...removed.slice(0, idx), newTask, ...removed.slice(idx)];
          return newArr;
        });

        await onTaskUpdate(activeId, { status: toStatus });
        // onTaskUpdate is expected to persist server-side; we call it once here.
      } catch (err) {
        console.error("Error updating task status on drop:", err);
        showError("Erro ao mover tarefa. Tente novamente.");
        // best-effort: refresh local tasks from props (caller should refresh)
        setLocalTasks(tasks);
      }
      return;
    }

    // If same column -> handle reordering only client-side (no server write yet).
    // Compute indices inside that column
    const column = fromStatus;
    const columnTasks = tasksByColumn[column] || [];
    const oldIndex = columnTasks.findIndex((t) => t.id === activeId);

    // Determine new index:
    let newIndex = oldIndex;
    if (isColumnId(overId)) {
      // Dropped on column container -> place at end
      newIndex = columnTasks.length - 1;
    } else {
      // Dropped on another task -> find index of that task
      const overIndex = columnTasks.findIndex((t) => t.id === overId);
      if (overIndex === -1) {
        // target task not in same column (shouldn't happen as we resolved to same column)
        newIndex = columnTasks.length - 1;
      } else {
        newIndex = overIndex;
      }
    }

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      return;
    }

    // Reorder within same column using arrayMove
    setLocalTasks((prev) => {
      // Build prev column-focused array
      const prevColumnTasks = prev.filter((t) => t.status === column);
      const otherTasks = prev.filter((t) => t.status !== column);

      const reordered = arrayMove(prevColumnTasks, oldIndex, newIndex);
      // Reconstruct full tasks array: keep relative order of other tasks unchanged, but insert reordered column tasks in same relative places.
      // Simpler approach: place all reordered column tasks together where the original first column index was.
      // Find first index in prev where status === column
      const firstIdx = prev.findIndex((t) => t.status === column);
      if (firstIdx === -1) {
        return prev;
      }
      const before = prev.slice(0, firstIdx).filter((t) => t.status !== column);
      const after = prev.slice(firstIdx + prevColumnTasks.length).filter((t) => t.status !== column);
      return [...before, ...reordered, ...after];
    });

    // TODO: Persist ordering to server in future by writing a `position` field for tasks.
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quadro Kanban de Tarefas</h2>
          <p className="text-muted-foreground">Arraste e solte as tarefas entre as colunas</p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              tasks={tasksByColumn[column.id] || []}
              onTaskUpdate={onTaskUpdate}
            />
          ))}
        </div>

        {/* DragOverlay rendered in portal to avoid clipping inside containers with overflow */}
        {typeof document !== "undefined"
          ? createPortal(
              <DragOverlay>
                {activeTask ? <KanbanTask task={activeTask} isDragging /> : null}
              </DragOverlay>,
              document.body,
            )
          : null}
      </DndContext>
    </div>
  );
}

export default KanbanBoard;