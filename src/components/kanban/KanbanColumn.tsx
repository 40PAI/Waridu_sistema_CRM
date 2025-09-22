"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanTask } from "./KanbanTask";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Task } from "./KanbanBoard";

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export function KanbanColumn({ id, title, color, tasks, onTaskUpdate }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <Card className={`min-h-[400px] ${color} ${isOver ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          {title}
          <span className="bg-white/80 px-2 py-1 rounded-full text-xs font-semibold">
            {tasks.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div ref={setNodeRef} className="min-h-[300px]">
          {/* SortableContext gets the ids of items in this column */}
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <KanbanTask key={task.id} task={task} onUpdate={onTaskUpdate} />
            ))}
          </SortableContext>
        </div>
      </CardContent>
    </Card>
  );
}