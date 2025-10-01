"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, MapPin, Pencil, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EventProject } from "@/types/crm";

export interface SortableProjectCardProps {
  project: EventProject;
  onEditClick?: (project: EventProject) => void;
  onViewClick?: (project: EventProject) => void;
}

const getStatusBadgeClass = (status?: string) => {
  switch (status) {
    case "1º Contato":
      return "bg-gray-100 text-gray-800";
    case "Orçamento":
      return "bg-blue-100 text-blue-800";
    case "Negociação":
      return "bg-yellow-100 text-yellow-800";
    case "Confirmado":
      return "bg-green-100 text-green-800";
    case "Cancelado":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * SortableProjectCard
 *
 * Small, focused component used inside the Kanban. Keeps markup minimal and accessible.
 */
export function SortableProjectCard({ project, onEditClick, onViewClick }: SortableProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const startDateText = project.startDate ? format(new Date(project.startDate), "dd/MM/yyyy", { locale: ptBR }) : "—";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? "opacity-60" : ""}`}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight max-w-[180px] truncate" title={project.name}>
            {project.name}
          </h3>

          <div className="flex gap-1 items-center">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Ver ${project.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onViewClick?.(project);
              }}
              className="h-7 w-7"
            >
              <Eye className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar ${project.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onEditClick?.(project);
              }}
              className="h-7 w-7"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getStatusBadgeClass(project.pipeline_status)}>{project.pipeline_status}</Badge>
          {typeof project.estimated_value === "number" && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              AOA {project.estimated_value.toLocaleString("pt-AO")}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {startDateText}
          </div>
          <div className="flex items-center gap-1 max-w-[130px]">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{project.location || "—"}</span>
          </div>
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
      </CardContent>
    </Card>
  );
}