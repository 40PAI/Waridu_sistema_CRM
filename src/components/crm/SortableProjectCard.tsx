"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type PipelineStatus = '1º Contato' | 'Orçamento' | 'Negociação' | 'Confirmado';

interface ProjectCardData {
  id: number;
  name: string;
  startDate: string;
  endDate?: string;
  pipeline_status?: PipelineStatus;
  tags?: string[];
  location?: string;
  status?: string;
  description?: string;
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

  const [dialogOpen, setDialogOpen] = React.useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease, opacity 150ms ease",
    zIndex: isDragging ? 50 : undefined,
  };

  const handleOpenDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDialogOpen(true);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`cursor-grab active:cursor-grabbing ${isDragging ? "opacity-70" : "opacity-100"} transition-shadow`}
        {...attributes}
        {...listeners}
      >
        <Card className="bg-white rounded-md shadow-sm hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex flex-col">
                <div className="truncate font-semibold text-sm" title={project.name}>
                  {project.name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {project.startDate && (
                    <>
                      {format(parseISO(project.startDate), "dd/MM/yyyy", { locale: ptBR })}
                      {project.endDate && project.endDate !== project.startDate ? ` - ${format(parseISO(project.endDate), "dd/MM/yyyy", { locale: ptBR })}` : ""}
                    </>
                  )}
                </div>
                {project.location && (
                  <div className="text-xs text-muted-foreground mt-1 truncate" title={project.location}>
                    {project.location}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <Badge className={statusBadgeClass(project.pipeline_status)}>{project.pipeline_status || "—"}</Badge>
                <button
                  aria-label={`Detalhes de ${project.name}`}
                  onClick={handleOpenDialog}
                  className="text-muted-foreground hover:text-foreground p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  type="button"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-w-full">
          <DialogHeader>
            <DialogTitle>Detalhes do Projeto</DialogTitle>
            <DialogDescription>
              Informações detalhadas do projeto selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <strong>Nome:</strong> {project.name}
            </div>
            <div>
              <strong>Período:</strong> {project.startDate} {project.endDate && project.endDate !== project.startDate ? `- ${project.endDate}` : ""}
            </div>
            {project.location && (
              <div>
                <strong>Localização:</strong> {project.location}
              </div>
            )}
            {project.status && (
              <div>
                <strong>Status:</strong> {project.status}
              </div>
            )}
            {project.description && (
              <div>
                <strong>Descrição:</strong> {project.description}
              </div>
            )}
            {project.tags && project.tags.length > 0 && (
              <div>
                <strong>Tags:</strong> {project.tags.join(", ")}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}