"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ProjectEditDialog } from "./ProjectEditDialog";
import SortableProjectCard from "./SortableProjectCard";
import type { Event } from "@/types";

interface Project {
  id: number;
  name: string;
  client_id?: string;
  pipeline_status: '1º Contato' | 'Orçamento' | 'Negociação' | 'Confirmado';
  service_ids: string[];
  estimated_value?: number;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  tags?: string[];
  follow_ups?: any[];
  notes?: string;
}

interface PipelineKanbanProps {
  projects: Project[];
  onUpdateProject: (updatedProject: Project) => Promise<void>;
  clients?: { id: string; name: string }[];
  services?: { id: string; name: string }[];
}

const columns = [
  { id: '1º Contato', title: '1º Contato', color: 'bg-gray-100 border-gray-200' },
  { id: 'Orçamento', title: 'Orçamento', color: 'bg-blue-100 border-blue-200' },
  { id: 'Negociação', title: 'Negociação', color: 'bg-yellow-100 border-yellow-200' },
  { id: 'Confirmado', title: 'Confirmado', color: 'bg-green-100 border-green-200' },
];

const getStatusBadge = (status: Project['pipeline_status']) => {
  switch (status) {
    case '1º Contato': return 'bg-gray-100 text-gray-800';
    case 'Orçamento': return 'bg-blue-100 text-blue-800';
    case 'Negociação': return 'bg-yellow-100 text-yellow-800';
    case 'Confirmado': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const PipelineKanban = ({ projects, onUpdateProject, clients = [], services = [] }: PipelineKanbanProps) => {
  const [activeProjectId, setActiveProjectId] = React.useState<number | null>(null);
  const [draggingProject, setDraggingProject] = React.useState<Project | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const projectsByColumn = React.useMemo(() => {
    const grouped: Record<string, Project[]> = {
      '1º Contato': [],
      'Orçamento': [],
      'Negociação': [],
      'Confirmado': [],
    };
    projects.forEach(project => {
      if (grouped[project.pipeline_status]) {
        grouped[project.pipeline_status].push(project);
      }
    });
    return grouped;
  }, [projects]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    const project = projects.find(p => p.id === active.id);
    setActiveProjectId(active.id);
    setDraggingProject(project || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as string;

    if (columns.some(col => col.id === overId)) {
      const newStatus = overId as Project['pipeline_status'];
      const project = projects.find(p => p.id === activeId);
      if (project && project.pipeline_status !== newStatus) {
        onUpdateProject({ ...project, pipeline_status: newStatus }).catch(() => {
          console.error("Erro ao atualizar status do projeto.");
        });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProjectId(null);
    setDraggingProject(null);

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as string;

    if (columns.some(col => col.id === overId)) {
      const newStatus = overId as Project['pipeline_status'];
      const project = projects.find(p => p.id === activeId);
      if (project && project.pipeline_status !== newStatus) {
        onUpdateProject({ ...project, pipeline_status: newStatus }).catch(() => {
          console.error("Erro ao atualizar status do projeto.");
        });
      }
    }
  };

  const handleEditClick = (project: Project) => {
    setEditingProject(project);
    setEditDialogOpen(true);
  };

  const handleSaveProject = async (updatedProject: Project) => {
    try {
      await onUpdateProject(updatedProject);
      setEditDialogOpen(false);
      setEditingProject(null);
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Pipeline de Projetos</h2>
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto whitespace-nowrap">
            {columns.map((column) => (
              <Card key={column.id} className={cn("min-h-[600px] flex flex-col inline-block align-top", column.color)} style={{ minWidth: 280 }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    {column.title}
                    <span className="bg-white/80 px-2 py-1 rounded-full text-xs font-semibold">
                      {projectsByColumn[column.id].length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 overflow-y-auto">
                  <SortableContext items={projectsByColumn[column.id].map(p => p.id)} strategy={verticalListSortingStrategy}>
                    {projectsByColumn[column.id].map((project) => (
                      <div key={project.id} id={String(project.id)} className="mb-3">
                        <SortableProjectCard project={project} onEditClick={handleEditClick} />
                      </div>
                    ))}
                  </SortableContext>
                </CardContent>
              </Card>
            ))}
          </div>

          <DragOverlay>
            {draggingProject ? (
              <Card className="shadow-lg p-3 bg-white rounded-md w-64">
                <CardContent>
                  <h3 className="font-semibold text-sm truncate">{draggingProject.name}</h3>
                  <div className="text-xs text-muted-foreground">
                    Início: {format(new Date(draggingProject.startDate), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <Badge className={getStatusBadge(draggingProject.pipeline_status)}>{draggingProject.pipeline_status}</Badge>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <ProjectEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        project={editingProject}
        onSave={handleSaveProject}
        clients={clients}
        services={services}
      />
    </>
  );
};