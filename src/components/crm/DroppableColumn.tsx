import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DroppableColumnProps {
  column: { id: string; title: string; color?: string };
  children: React.ReactNode;
  disabled?: boolean;
}

export function DroppableColumn({ column, children, disabled }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ 
    id: column.id,
    data: {
      columnId: column.id,
      type: 'column'
    }
  });

  const bgColor = column.color || "#f3f4f6"; // fallback gray-100
  const style: React.CSSProperties = {
    backgroundColor: bgColor,
  };

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "min-h-[600px] flex flex-col transition-all duration-200 border",
        isOver ? "ring-4 ring-primary shadow-2xl scale-[1.01]" : "",
        disabled ? "opacity-50 pointer-events-none" : ""
      )}
      style={style}
    >
      {children}
    </Card>
  );
}