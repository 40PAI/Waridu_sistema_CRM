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
import { supabase } from "@/integrations/supabase/client";
import usePipelinePhases from "@/hooks/usePipelinePhases";
import { computeRank } from "@/utils/rankUtils";
import { useQueryClient } from "@tanstack/react-query";

interface PipelineKanbanProps {
  projects: EventProject[];
  onUpdateProject?: (p: EventProject) => Promise<void>;
  onEditProject?: (p: EventProject) => void;
  onViewProject?: (p: EventProject) => void;
}

function isColumnId(id: string | null | undefined) {
  return !!id;
}

function getProjectById(list: EventProject[], id: string | number) {
  return list.find(p => String(p.id) === String(id)) || null;
}

export function PipelineKanban({ projects, onUpdateProject, onEditProject, onViewProject }: PipelineKanbanProps) {
  const { phases } = usePipelinePhases();
  const [draggingProject, setDraggingProject] = React.useState<EventProject | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null);
  const [localProjects, setLocalProjects] = React.useState<EventProject[]>(projects);
  const [updating, setUpdating] = React.useState<string | null>(null);
  const qc = useQueryClient();

  React.useEffect(() => setLocalProjects(projects), [projects]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const columns = React.useMemo(() => {
    return phases
      .filter(s => s.active)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(s => ({
        id: s.id,
        title: s.name,
        color: s.color || "#f3f4f6",
      }));
  }, [phases]);

  const projectsByColumn = React.useMemo(() => {
    const grouped: Record<string, EventProject[]> = {};
    columns.forEach(col => (grouped[col.id] = []));
    localProjects.forEach((p) => {
      const phaseId = (p as any).pipeline_phase_id || null;
      if (phaseId && grouped[phaseId]) {
        grouped[phaseId].push(p);
      } else {
        const firstCol = columns[0]?.id;
        if (firstCol) grouped[firstCol].push(p);
      }
    });
    // Sort inside each column by pipeline_rank then updated_at desc
    Object.keys(grouped).forEach(k => {
      grouped[k].sort((a, b) => {
        const ra = (a as any).pipeline_rank ?? 0;
        const rb = (b as any).pipeline_rank ?? 0;
        if (ra !== rb) return Number(ra) - Number(rb);
        const ua = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const ub = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return ub - ua;
      });
    });
    return grouped;
  }, [localProjects, columns]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    const project = getProjectById(localProjects, active.id);
    setDraggingProject(project || null);
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
    setDragOverColumn(pr ? (pr as any).pipeline_phase_id || null : null);
  };

  const calculateNewIndex = (overId: string, columnTasks: EventProject[], activeId: string) => {
    if (isColumnId(overId)) {
      return columnTasks.length;
    }
    const overIndex = columnTasks.findIndex(t => String(t.id) === String(overId));
    if (overIndex === -1) return columnTasks.length;
    return overIndex;
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

    const fromPhaseId = (activeProject as any).pipeline_phase_id || null;
    const toPhaseId = isColumnId(overId) ? overId : (getProjectById(localProjects, overId) as any)?.pipeline_phase_id || columns[0]?.id;

    if (!toPhaseId) return;

    // Determine new rank inside toPhase column
    const columnTasks = projectsByColumn[toPhaseId] || [];
    const newIndex = calculateNewIndex(overId, columnTasks, activeId);

    const leftRank = newIndex > 0 ? columnTasks[newIndex - 1]?.pipeline_rank : null;
    const rightRank = newIndex < columnTasks.length ? columnTasks[newIndex]?.pipeline_rank : null;
    const newRank = Number(computeRank(leftRank ?? null, rightRank ?? null).toString()); // store as number (BIGINT on DB)

    if (fromPhaseId !== toPhaseId) {
      setUpdating(String(activeProject.id));
      const prevLocal = [...localProjects];

      try {
        // optimistic UI
        setLocalProjects(prev => prev.map(p =>
          p.id === activeProject.id ? ({ ...p, pipeline_phase_id: toPhaseId, pipeline_rank: newRank } as any) : p
        ));

        const { error } = await supabase
          .from('events')
          .update({ pipeline_phase_id: toPhaseId, pipeline_rank: newRank })
          .eq('id', activeProject.id);

        if (error) throw error;

        showSuccess("Projeto movido com sucesso!");
        if (onUpdateProject) {
          try { await onUpdateProject({ ...activeProject, pipeline_phase_id: toPhaseId, pipeline_rank: newRank } as EventProject); } catch {}
        }

        qc.invalidateQueries({ queryKey: ['events'] });
      } catch (err: any) {
        console.error("Error updating project stage:", err);
        showError("Erro ao mover projeto. Revertendo.");
        setLocalProjects(prevLocal);
      } finally {
        setUpdating(null);
      }
      return;
    }

    // If same phase, reorder within column (no immediate server write for ordering unless desired)
    // For now, compute newRank and persist single update
    const sameColumnTasks = columnTasks;
    const oldIndex = sameColumnTasks.findIndex(t => String(t.id) === activeId);
    const targetIndex = calculateNewIndex(overId, sameColumnTasks, activeId);

    if (oldIndex === -1 || oldIndex === targetIndex) return;

    // compute rank for new position
    const left = targetIndex > 0 ? sameColumnTasks[targetIndex - 1]?.pipeline_rank : null;
    const right = targetIndex < sameColumnTasks.length ? sameColumnTasks[targetIndex]?.pipeline_rank : null;
    const rankForReorder = Number(computeRank(left ?? null, right ?? null).toString());

    // optimistic reorder
    const prevLocal = [...localProjects];
    const newLocal = localProjects.map(p => ({ ...p }));
    const colIds = newLocal.filter(n => (n as any).pipeline_phase_id === toPhaseId).map(n => n.id);
    // reposition in localProjects
    newLocal.sort((a, b) => {
      const pa = (a as any).pipeline_phase_id ?? "";
      const pb = (b as any).pipeline_phase_id ?? "";
      if (pa !== pb) return pa < pb ? -1 : 1;
      const ra = (a as any).pipeline_rank ?? 0;
      const rb = (b as any).pipeline_rank ?? 0;
      if (ra !== rb) return ra - rb;
      const ua = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const ub = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return ub - ua;
    });

    setLocalProjects(prev => {
      // set active task rank locally
      return prev.map(p => p.id === activeId ? ({ ...p, pipeline_rank: rankForReorder } as any) : p);
    });

    try {
      const { error } = await supabase
        .from('events')
        .update({ pipeline_rank: rankForReorder })
        .eq('id', activeId);

      if (error) throw error;

      qc.invalidateQueries({ queryKey: ['events'] });
      showSuccess("Ordem atualizada.");
    } catch (err: any) {
      console.error("Error updating rank:", err);
      showError("Erro ao salvar ordem. Revertendo.");
      setLocalProjects(prevLocal);
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
                <Badge className="bg-gray-100 text-gray-800">{(draggingProject as any).pipeline_status || "Projeto"}</Badge>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default PipelineKanban;