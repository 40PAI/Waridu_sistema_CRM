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
import { showError, showSuccess } from "@/utils/toast";
import { DroppableColumn } from "./DroppableColumn";
import { SortableProjectCard } from "./SortableProjectCard";
import type { EventProject, PipelineStatus } from "@/types/crm";
import { supabase } from "@/integrations/supabase/client";
import usePipelineStages from "@/hooks/usePipelineStages";

interface PipelineKanbanProps {
  projects: EventProject[];
  onUpdateProject?: (p: EventProject) => Promise<void>;
  onEditProject?: (p: EventProject) => void;
  onViewProject?: (p: EventProject) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function isColumnId(id: string | null | undefined) {
  if (!id) return false;
  return true; // Since columns are now stage IDs
}

function getProjectById(list: EventProject[], id: string | number) {
  return list.find(p => String(p.id) === String(id)) || null;
}

export function PipelineKanban({ projects, onUpdateProject, onEditProject, onViewProject }: PipelineKanbanProps) {
  const { stages } = usePipelineStages();
  const [draggingProject, setDraggingProject] = React.useState<EventProject | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null);
  const [localProjects, setLocalProjects] = React.useState<EventProject[]>(projects);
  const [updating, setUpdating] = React.useState<string | null>(null);

  React.useEffect(() => setLocalProjects(projects), [projects]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const columns = React.useMemo(() => {
    return stages
      .filter(s => s.is_active)
      .sort((a, b) => a.order - b.order)
      .map(s => ({
        id: s.id,
        title: s.name,
        color: "#e5e7eb", // Default color
      }));
  }, [stages]);

  const projectsByColumn = React.useMemo(() => {
    const grouped: Record<string, EventProject[]> = {};
    columns.forEach(col => grouped[col.id] = []);
    
    localProjects.forEach((p) => {
      const stageId = p.pipeline_stage_id || stages.find(s => s.name === p.pipeline_status)?.id;
      if (stageId && grouped[stageId]) {
        grouped[stageId].push(p);
      } else {
        // Fallback to first column if no match
        const firstCol = columns[0]?.id;
        if (firstCol) grouped[firstCol].push(p);
      }
    });
    return grouped;
  }, [localProjects, stages, columns]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    const project = getProjectById(localProjects, active.id);
    setDraggingProject(project);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) {
      setDragOverColumn(null);
      return;
    }
    if (isColumnId(overId)) {
      setDragOverColumn(overId);
      return;
    }
    const pr = getProjectById(localProjects, overId);
    setDragOverColumn(pr ? pr.pipeline_stage_id || null : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingProject(null);
    setDragOverColumn(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeProject = getProjectById(localProjects, activeId);
    if (!activeProject) return;

    const fromStageId = activeProject.pipeline_stage_id;
    const toStageId = isColumnId(overId) ? overId : (getProjectById(localProjects, overId)?.pipeline_stage_id || columns[0]?.id);

    if (!toStageId) return;

    // If moving to a different stage -> persist change
    if (fromStageId !== toStageId) {
      setUpdating(String(activeProject.id));
      try {
        // Optimistic UI update
        setLocalProjects(prev => prev.map(p => 
          p.id === activeProject.id ? { ...p, pipeline_stage_id: toStageId } : p
        ));

        // Persist to Supabase
        const { error } = await supabase
          .from('events')
          .update({ pipeline_stage_id: toStageId, updated_at: new Date().toISOString() })
          .eq('id', activeProject.id);

        if (error) throw error;

        showSuccess("Projeto movido com sucesso!");
      } catch (err: any) {
        console.error("Error updating project stage:", err);
        showError("Erro ao mover projeto. Revertendo...");
        setLocalProjects(projects); // Revert
      } finally {
        setUpdating(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto px-2" style={{ minHeight: 600 }}>
          {columns.map((column) => (
            <DroppableColumn key={column.id} column={column}>
              <CardHeader className="pb-3 sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-border">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  {column.title}
                  <span className="bg-white/80 px-2 py-1 rounded-full text-xs font-semibold">
                    {projectsByColumn[column.id].length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 overflow-y-auto">
                <SortableContext items={projectsByColumn[column.id].map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  {projectsByColumn[column.id].map((project) => (
                    <div key={project.id} id={String(project.id)} className="mb-3">
                      <SortableProjectCard
                        project={project}
                        onEditClick={onEditProject}
                        onViewClick={onViewProject}
                      />
                      {updating === String(project.id) && (
                        <div className="text-xs text-muted-foreground mt-1">Atualizando...</div>
                      )}
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
                  Início: {draggingProject.startDate ? format(new Date(draggingProject.startDate), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                </div>
                <Badge className="bg-gray-100 text-gray-800">{draggingProject.pipeline_status}</Badge>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}