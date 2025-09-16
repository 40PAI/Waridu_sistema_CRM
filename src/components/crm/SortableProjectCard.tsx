"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type PipelineStatus = '1º Contato' | 'Orçamento' | 'Negociação' | 'Confirmado';

interface ProjectCardData {
  id: number;
  name: string;
  startDate: string;
  pipeline_status?: PipelineStatus;
  tags?: string[];
}

interface SortableProjectCardProps {
  project: ProjectCardData;
  onEditClick?: (project: ProjectCardData) => void;
}

const statusBadgeClass = (status?: PipelineStatus) => {
  switch (status) {
    case "1º Contato":
      return "bg-gray-100 text-gray-800";
    case "Orçamento":
      return "bg-blue-100 text-blue-800";
    case "Negociação":
      return "bg-yellow-100 text-yellow-800";
    case "Confirmado":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function SortableProjectCard({ project, onEditClick }: SortableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease, opacity 150ms ease",
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? "opacity-70" : "opacity-100"} transition-shadow`}
      {...attributes}
      {...listeners}
    >
      <Card className="bg-white rounded-md shadow-sm hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <div className="min-w-0">
              <div className="truncate" title={project.name}>{project.name}</div>
              {project.startDate && (
                <div className="text-xs text-muted-foreground">
                  {format(parseISO(project.startDate), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Badge className={statusBadgeClass(project.pipeline_status)}>{project.pipeline_status || "—"}</Badge>
              <button
                aria-label={`Editar ${project.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick?.(project);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.map((t: string) => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}