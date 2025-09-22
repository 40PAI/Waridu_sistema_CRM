"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createPortal } from "react-dom";
import { DroppableColumn } from "./DroppableColumn";
import { SortableProjectCard } from "./SortableProjectCard";
import type { EventProject } from "@/types/crm";
import { supabase } from "@/integrations/supabase/client";
import usePipelineStages from "@/hooks/usePipelineStages";

interface PipelineKanbanProps {
  projects: EventProject[];
  onUpdateProject?: (p: EventProject) => Promise<void>;
  onEditProject?: (p: EventProject) => void;
  onViewProject?: (p: EventProject) => void;
}

export function PipelineKanban({ projects, onUpdateProject, onEditProject, onViewProject }: PipelineKanbanProps) {
  const { stages, loading: stagesLoading } = usePipelineStages();

  // Build columns from stages (only active)
  const columns = React.useMemo(() => {
    return (stages || [])
      .filter((s) => s.is_active)
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        id: s.id,
        title: s.name,
        color: s.color ?? "#e5e7eb",
      }));
  }, [stages]);

  // Helper: map projects by their stage
  const projectsByColumn = React.useMemo(() => {
    const grouped: Record<string, EventProject[]> = {};
    columns.forEach((col) => (grouped[col.id] = []));
    projects.forEach((p) => {
      const stageId = (p as any).pipeline_stage_id || (p as any).pipeline_stage_id === undefined
        ? undefined
        : (p as any).pipeline_stage_id;
      if (stageId && grouped[stageId]) {
        grouped[stageId].push(p);
      } else {
        // fallback: se não houver mapeamento, usa a primeira coluna como default
        const firstCol = columns[0]?.id;
        if (firstCol) grouped[firstCol].push(p);
      }
    });
    return grouped;
  }, [projects, columns]);

  // Drag handlers
  const [draggingProject, setDraggingProject] = React.useState<EventProject | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null);
  const [updating, setUpdating] = React.useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: DragEndEvent) => {
    const { active } = event;
    const proj = projects.find((p) => String(p.id) === String(active.id)) || null;
    setDraggingProject(proj);
  };

  const handleDragOver = (event: DragEndEvent) => {
    // observa o alvo para efeitos visuais; não persiste aqui
    const overId = event?.over?.id ? String(event.over.id) : null;
    if (!overId) {
      setDragOverColumn(null);
      return;
    }
    if (columns.find((c) => c.id === overId)) {
      setDragOverColumn(overId);
    } else {
      const proj = projects.find((p) => String(p.id) === overId);
      setDragOverColumn(proj?.pipeline_stage_id ?? null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingProject(null);
    setDragOverColumn(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeProject = projects.find((p) => String(p.id) === activeId);
    if (!activeProject) return;

    const fromStageId = (activeProject as any).pipeline_stage_id || null;
    const toStageId = columns.find((c) => c.id === overId)
      ? overId
      : (projects.find((p) => String(p.id) === overId) as any)?.pipeline_stage_id ?? columns[0]?.id;

    if (!toStageId) return;

    if (fromStageId !== toStageId) {
      setUpdating(String(activeProject.id));
      try {
        // UI otimista
        const updated = { ...activeProject, pipeline_stage_id: toStageId } as EventProject;
        // atualiza na UI
        const next = projects.map((p) =>
          p.id === activeProject.id ? updated : p
        );
        // aplicar no state local
        // @ts-ignore
        // we store a temporary local array no estado para refletir na tela rapidamente
        //; mas a partir daqui persistimos no backend
        // @ts-ignore
        // setLocalProjects(next);
        // Persistir
        const payload = {
          id: activeProject.id,
          pipeline_stage_id: toStageId,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from("events").update(payload).eq("id", activeProject.id);
        if (error) throw error;

        // refresh
        if (onUpdateProject) {
          await onUpdateProject(updated);
        }
        // opcional: informar sucesso
        showSuccess("Projeto movido com sucesso!");
      } catch (err: any) {
        console.error("Erro ao mover projeto entre fases:", err);
        showError("Erro ao mover projeto. Revertendo.");
        // fallback simples: recarregar os dados necessários
        // Neste caso, apenas sinalizaremos que falhou; o chamador pode refazer refresh
      } finally {
        setUpdating(null);
      }
    }
  };

  if (stagesLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Carregando fases do pipeline...</CardTitle></CardHeader>
        <CardContent>Carregando...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto">
          {columns.map((column) => (
            <DroppableColumn key={column.id} column={column}>
              <CardHeader className="pb-3 sticky top-0 bg-white/80 z-10 border-b">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  {column.title}
                  <span className="bg-white/80 px-2 py-1 rounded-full text-xs font-semibold">
                    {projectsByColumn[column.id]?.length ?? 0}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SortableContext items={(projectsByColumn[column.id] || []).map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  {(projectsByColumn[column.id] || []).map((project) => (
                    <div key={project.id} id={String(project.id)} className="mb-3">
                      <SortableProjectCard
                        project={project}
                        onEditClick={onEditProject}
                        onViewClick={onViewProject}
                      />
                    </div>
                  ))}
                </SortableContext>

                {(projectsByColumn[column.id] || []).length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Sem projetos aqui
                  </div>
                )}
              </CardContent>
            </DroppableColumn>
          ))}
        </div>

        {draggingProject && (
          createPortal(
            <DragOverlay>
              <SortableProjectCard project={draggingProject} />
            </DragOverlay>,
            typeof document !== "undefined" ? document.body : document
          )
        )}
      </DndContext>
    </div>
  );
}