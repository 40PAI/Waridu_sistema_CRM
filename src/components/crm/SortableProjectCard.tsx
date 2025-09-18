"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, MapPin, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EventProject } from "@/types/crm";

export interface SortableProjectCardProps {
  project: EventProject;
  onEditClick?: (project: EventProject) => void;
}

const getStatusBadge = (status?: string) => {
  switch (status) {
    case "1º Contato": return "bg-gray-100 text-gray-800";
    case "Orçamento": return "bg-blue-100 text-blue-800";
    case "Negociação": return "bg-yellow-100 text-yellow-800";
    case "Confirmado": return "bg-green-100 text-green-800";
    case "Cancelado": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export function SortableProjectCard({ project, onEditClick }: SortableProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const start = project.startDate ? new Date(project.startDate) : null;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? "opacity-50 rotate-1" : ""}`}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight max-w-[220px] truncate">
            {project.name}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar"
            onClick={(e) => { e.stopPropagation(); onEditClick?.(project); }}
            className="h-7 w-7"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getStatusBadge(project.pipeline_status)}>{project.pipeline_status}</Badge>
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
            {start ? format(start, "dd/MM/yyyy", { locale: ptBR }) : "—"}
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate max-w-[130px]" title={project.location}>{project.location || "—"}</span>
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