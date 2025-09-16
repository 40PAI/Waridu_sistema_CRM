import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EventProject } from "@/types/crm";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface SortableProjectCardProps {
  project: EventProject;
  onEditClick?: (project: EventProject) => void;
}

export function SortableProjectCard({ project, onEditClick }: SortableProjectCardProps) {
  const date = project.startDate ? format(parseISO(project.startDate), "dd/MM/yyyy", { locale: ptBR }) : "-";

  return (
    <Card className="cursor-grab active:cursor-grabbing">
      <CardHeader>
        <CardTitle className="text-sm font-medium truncate">{project.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{project.client_id ?? "Cliente não definido"}</div>
          <div className="text-sm text-muted-foreground">{date}</div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="text-xs">{project.pipeline_status}</Badge>
          <Button variant="secondary" size="sm" onClick={() => onEditClick?.(project)}>
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}