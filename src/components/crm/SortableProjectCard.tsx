"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, MapPin, Pencil, Eye, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EventProject } from "@/types/crm";

export interface SortableProjectCardProps {
  project: EventProject;
  onEditClick?: (project: EventProject) => void;
  onViewProject?: (project: EventProject) => void;
  isDragging?: boolean;
}

export function SortableProjectCard({ project, onEditClick, onViewProject, isDragging }: SortableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewProject?.(project);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditClick?.(project);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border hover:shadow-md transition-all ${isDragging || isSortableDragging ? 'opacity-50 rotate-1' : ''}`}
    >
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* Header with drag handle and actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Drag handle only: attach listeners here */}
              <button
                className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-muted"
                aria-label="Arrastar"
                {...attributes}
                {...listeners}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </button>
              <h3 className="font-medium text-sm leading-tight">{project.name}</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleView}
                className="h-7 w-7 p-0"
                aria-label={`Ver ${project.name}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-7 w-7 p-0"
                aria-label={`Editar ${project.name}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Optional notes */}
          {project.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {project.notes}
            </p>
          )}

          {/* Footer info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(project.startDate), "dd/MM", { locale: ptBR })}
            </div>
            <div className="flex items-center gap-1 max-w-[130px]">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{project.location || "—"}</span>
            </div>
            {typeof project.estimated_value === "number" && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                AOA {project.estimated_value.toLocaleString("pt-AO")}
              </div>
            )}
          </div>

          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant={tag === "urgente" ? "destructive" : "secondary"} className="text-[10px]">
                  {tag}
                </Badge>
              ))}
              {project.tags.length > 3 && (
                <Badge variant="outline" className="text-[10px]">+{project.tags.length - 3}</Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}