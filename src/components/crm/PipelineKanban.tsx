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
import type { EventProject } from "@/types/crm";
import usePipelineStages from "@/hooks/usePipelineStages";
import { useQueryClient } from "@tanstack/react-query";
import { moveEventRPC } from "@/services/kanbanService";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PipelineKanbanProps {
  projects: EventProject[];
  onUpdateProject?: (p: EventProject) => Promise<void>;
  onEditProject?: (p: EventProject) => void;
  onViewProject?: (p: EventProject) => void;
  onCreateProjectInColumn: (phaseId: string) => void; // New prop for column-specific creation
}

function isColumnId(id: string | null | undefined, columns: any[]) {
  return columns.some(col => col.id === id);
}

function getProjectById(list: EventProject[], id: string | number) {
  return list.find(p => String(p.id) === String(id)) || null;
}

export function PipelineKanban({ projects, onUpdateProject, onEditProject, onViewProject, onCreateProjectInColumn }: PipelineKanbanProps) {
  const { stages } = usePipelineStages();
  const [draggingProject, setDraggingProject] = React.useState<EventProject | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null);
  const [updating, setUpdating] = React.useState<string | null>(null);
  const qc = useQueryClient();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const columns = React.useMemo(() => {
    return stages
      .filter(s => s.is_active)
      .sort((a, b) => a.order - b.order)
      .map(s => ({
        id: s.id,
        title: s.name,
        color: s.color || "#f3f4f6",
      }));
  }, [stages]);

  const projectsByColumn = React.useMemo(() => {
    const grouped: Record<string, EventProject[]> = {};
    columns.forEach(col => (grouped[col.id] = []));
    
    projects.forEach((p) => {
      // Use pipeline_phase_id as the primary source of truth
      const phaseId = p.pipeline_phase_id || null;
      if (phaseId && grouped[phaseId]) {
        grouped[phaseId].push(p);
      } else {
        // Fallback: try to match by pipeline_status to phase name
        const matchingStage = stages.find(s => s.name === p.pipeline_status);
        if (matchingStage && grouped[matchingStage.id]) {
          grouped[matchingStage.id].push(p);
        } else {
          // Last resort: put in first column
          const firstCol = columns[0]?.id;
          if (firstCol) grouped[firstCol].push(p);
        }
      }
    });

    // Sort each column by pipeline_rank, then updated_at (server ordering)
    Object.keys(grouped).forEach(colId => {
      grouped[colId].sort((a, b) => {
        const aRank = a.pipeline_rank ?? 0;
        const bRank = b.pipeline_rank ?? 0;
        if (aRank !== bRank) return aRank - bRank;
        
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bTime - aTime; // newer first
      });
    });

    return grouped;
  }, [projects, columns, stages]);

  const getColumnItems = React.useCallback((phaseId: string) => {
    return (projectsByColumn[phaseId] || []).map(p => ({ id: p.id }));
  }, [projectsByColumn]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    const project = getProjectById(projects, active.id);
    setDraggingProject(project || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) {
      setDragOverColumn(null);
      return;
    }
    if (isColumnId(overId, columns)) {
      setDragOverColumn(overId);
      return;
    }
    const pr = getProjectById(projects, overId);
    setDragOverColumn(pr ? pr.pipeline_phase_id || null : null);
  };

  const calculateNeighbors = (overId: string, targetPhaseId: string, activeId: string) => {
    const columnItems = projectsByColumn[targetPhaseId] || [];
    
    // Filter out the active item from the columnItems to get correct neighbors
    const filteredColumnItems = columnItems.filter(item => String(item.id) !== activeId);

    if (isColumnId(overId, columns)) {
      // Dropped on column container -> place at end
      const lastItem = filteredColumnItems[filteredColumnItems.length - 1];
      return {
        beforeId: lastItem ? lastItem.id : null,
        afterId: null,
      };
    } else {
      // Dropped on another task -> find neighbors
      const overIndex = filteredColumnItems.findIndex(t => String(t.id) === overId);
      if (overIndex === -1) {
        // Target not found, place at end
        const lastItem = filteredColumnItems[filteredColumnItems.length - 1];
        return {
          beforeId: lastItem ? lastItem.id : null,
          afterId: null,
        };
      }
      
      // Insert before the target item
      const beforeId = overIndex > 0 ? filteredColumnItems[overIndex - 1].id : null;
      const afterId = filteredColumnItems[overIndex].id;
      
      return { beforeId, afterId };
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingProject(null);
    setDragOverColumn(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeProject = getProjectById(projects, activeId);
    if (!activeProject) return;

    const fromPhaseId = activeProject.pipeline_phase_id || null;
    const toPhaseId = isColumnId(overId, columns) 
      ? overId 
      : (getProjectById(projects, overId)?.pipeline_phase_id || columns[0]?.id);

    if (!toPhaseId) return;

    // Only proceed if moving to a different phase or different position
    if (fromPhaseId !== toPhaseId || (fromPhaseId === toPhaseId && active.id !== over.id)) {
      setUpdating(String(activeProject.id));

      try {
        // Calculate neighbors in target column
        const { beforeId, afterId } = calculateNeighbors(overId, toPhaseId, activeId);

        // Call RPC to move event with server-side rank calculation
        await moveEventRPC({
          eventId: activeProject.id,
          targetPhaseId: toPhaseId,
          beforeId,
          afterId,
        });

        showSuccess("Projeto movido com sucesso!");
        
        // Invalidate cache to refetch ordered data from server
        await qc.invalidateQueries({ queryKey: ['events'] });

        if (onUpdateProject) {
          try {
            await onUpdateProject({ 
              ...activeProject, 
              pipeline_phase_id: toPhaseId
            } as EventProject);
          } catch {
            // ignore parent callback errors
          }
        }
      } catch (err: any) {
        console.error("Error moving project:", err);
        showError("Erro ao mover projeto. Tente novamente.");
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
              <CardHeader className="pb-3 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur z-10 border-b border-border">
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4" 
                  onClick={() => onCreateProjectInColumn(column.id)}
                >
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Projeto
                </Button>
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
                <Badge className="bg-gray-100 text-gray-800">{draggingProject.pipeline_status || "Projeto"}</Badge>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default PipelineKanban;