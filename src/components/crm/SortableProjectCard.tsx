import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EventProject } from "@/types/crm";

interface SortableProjectCardProps {
  project: EventProject;
  onEditClick?: (project: EventProject) => void;
}

const getStatusBadge = (status: EventProject['pipeline_status']) => {
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

export function SortableProjectCard({ project, onEditClick }: SortableProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    data: { type: "project", columnId: project.pipeline_status },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="border hover:shadow-md cursor-grab active:cursor-grabbing">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm truncate" title={project.name}>
              {project.name}
            </h3>
            <Badge className={getStatusBadge(project.pipeline_status)}>{project.pipeline_status}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Início: {format(new Date(project.startDate), "dd/MM/yyyy", { locale: ptBR })}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="xs" onClick={() => onEditClick?.(project)}>
              Editar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}