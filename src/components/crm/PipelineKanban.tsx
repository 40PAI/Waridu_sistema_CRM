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
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ProjectEditDialog } from "./ProjectEditDialog";
import SortableProjectCard from "./SortableProjectCard";
import { showError, showSuccess } from "@/utils/toast";

interface Project {
  id: number;
  name: string;
  client_id?: string;
  pipeline_status: '1º Contato' | 'Orçamento' | 'Negociação' | 'Confirmado' | 'Em andamento' | 'Cancelado' | 'Follow-up';
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
  { id: 'Em andamento', title: 'Em andamento', color: 'bg-green-200 border-green-300' },
  { id: 'Follow-up', title: 'Follow-up', color: 'bg-purple-100 border-purple-200' },
  { id: 'Cancelado', title: 'Cancelado', color: 'bg-red-100 border-red-200' },
];

// 🔹 Componente coluna droppable
function DroppableColumn({
  column,
  children,
  disabled,
}: {
  column: { id: string; title: string; color: string };
  children: React.ReactNode;
  disabled?: boolean;
}) {
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

// 🔹 Função auxiliar: qual coluna está embaixo?
const getOverColumnId = (over: DragOverEvent["over"]) => {
  if (!over) return null;
  if (columns.some(c => c.id === over.id)) return String(over.id);
  return over.data?.current?.sortable?.containerId ?? null;
};

export const PipelineKanban = ({ projects, onUpdateProject, clients = [], services = [] }: PipelineKanbanProps) => {
  const [activeProjectId, setActiveProjectId] = React.useState<number | null>(null);
  const [draggingProject, setDraggingProject] = React.useState<Project | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null);
  const [updating, setUpdating] = React.useState(false);
  const [localProjects, setLocalProjects] = React.useState<Project[]>(projects);

  React.useEffect(() => setLocalProjects(projects), [projects]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Agrupa projetos por coluna
  const projectsByColumn = React.useMemo(() => {
    const grouped: Record<string, Project[]> = {
      '1º Contato': [],
      'Orçamento': [],
      'Negociação': [],
      'Confirmado': [],
      'Em andamento': [],
      'Follow-up': [],
      'Cancelado': [],
    };
    localProjects.forEach(project => {
      if (grouped[project.pipeline_status]) {
        grouped[project.pipeline_status].push(project);
      }
    });
    return grouped;
  }, [localProjects]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    const project = localProjects.find(p => p.id === active.id);
    setActiveProjectId(active.id);
    setDraggingProject(project || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const colId = getOverColumnId(event.over);
    setDragOverColumn(colId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProjectId(null);
    setDraggingProject(null);
    setDragOverColumn(null);

    if (!over || updating) return;

    const targetColumnId = getOverColumnId(over);
    if (!targetColumnId) return;

    const project = localProjects.find(p => p.id === Number(active.id));
    if (!project) return;

    // 🔹 Atualização otimista no UI
    setLocalProjects(prev =>
      prev.map(p =>
        p.id === project.id ? { ...p, pipeline_status: targetColumnId as Project['pipeline_status'] } : p
      )
    );

    try {
      setUpdating(true);
      await onUpdateProject({ ...project, pipeline_status: targetColumnId as Project['pipeline_status'] });
      showSuccess(`Projeto "${project.name}" movido para "${targetColumnId}".`);
    } catch (error) {
      console.error("Erro ao atualizar status do projeto:", error);
      showError("Erro ao atualizar status do projeto. Tente novamente.");
      // 🔹 Rollback se falhar
      setLocalProjects(prev => [...projects]);
    } finally {
      setUpdating(false);
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
      showSuccess("Projeto salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      showError("Erro ao salvar projeto.");
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
          <div
            className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-6 overflow-x-auto whitespace-nowrap px-2"
            style={{ minHeight: 600 }}
          >
            {columns.map((column) => (
              <DroppableColumn
                key={column.id}
                column={column}
                disabled={updating}
              >
                <CardHeader className="pb-3 sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-border">
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    {column.title}
                    <span className="bg-white/80 px-2 py-1 rounded-full text-xs font-semibold">
                      {projectsByColumn[column.id].length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 overflow-y-auto">
                  <SortableContext
                    items={projectsByColumn[column.id].map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {projectsByColumn[column.id].map((project) => (
                      <div key={project.id} id={String(project.id)} className="mb-3">
                        <SortableProjectCard
                          project={project}
                          onEditClick={handleEditClick}
                        />
                      </div>
                    ))}
                  </SortableContext>

                  {projectsByColumn[column.id].length === 0 && dragOverColumn === column.id && (
                    <div className="flex items-center justify-center h-20 border-2 border-dashed border-primary rounded-md text-primary font-medium bg-primary/5">
                      Solte aqui
                    </div>
                  )}
                </CardContent>
              </DroppableColumn>
            ))}
          </div>

          <DragOverlay>
            {draggingProject ? (
              <Card className="shadow-2xl p-3 bg-white rounded-md w-64 border-2 border-primary">
                <CardContent>
                  <h3 className="font-semibold text-sm truncate">{draggingProject.name}</h3>
                  <div className="text-xs text-muted-foreground">
                    Início: {format(new Date(draggingProject.startDate), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <Badge className={cn(
                    draggingProject.pipeline_status === '1º Contato' ? 'bg-gray-100 text-gray-800' :
                    draggingProject.pipeline_status === 'Orçamento' ? 'bg-blue-100 text-blue-800' :
                    draggingProject.pipeline_status === 'Negociação' ? 'bg-yellow-100 text-yellow-800' :
                    draggingProject.pipeline_status === 'Confirmado' ? 'bg-green-100 text-green-800' :
                    draggingProject.pipeline_status === 'Em andamento' ? 'bg-green-200 text-green-900' :
                    draggingProject.pipeline_status === 'Cancelado' ? 'bg-red-100 text-red-800' :
                    'bg-purple-100 text-purple-800'
                  )}>{draggingProject.pipeline_status}</Badge>
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