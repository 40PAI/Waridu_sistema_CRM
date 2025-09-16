import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PipelineStatus } from "@/types/crm";

interface DroppableColumnProps {
  column: { id: PipelineStatus; title: string; color: string };
  children: React.ReactNode;
  disabled?: boolean;
}

export function DroppableColumn({ column, children, disabled }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "min-h-[600px] flex flex-col transition-all duration-200",
        column.color,
        isOver ? "ring-4 ring-primary shadow-2xl scale-105 bg-primary/10" : "",
        disabled ? "opacity-50 pointer-events-none" : ""
      )}
      style={{ minWidth: 280 }}
    >
      {children}
    </Card>
  );
}