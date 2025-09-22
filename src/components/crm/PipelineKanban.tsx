"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { handleReorder } from "@/lib/pipeline/reorder";
import { eventsService } from "@/services/eventsService";
import { createPortal } from "react-dom";
import { DroppableColumn } from "./DroppableColumn";
import { SortableProjectCard } from "./SortableProjectCard";

const columns = [
  { id: "1º Contato", title: "1º Contato", color: "bg-gray-100 border-gray-200" },
  { id: "Orçamento", title: "Orçamento", color: "bg-blue-100 border-blue-200" },
  { id: "Negociação", title: "Negociação", color: "bg-yellow-100 border-yellow-200" },
  { id: "Confirmado", title: "Confirmado", color: "bg-green-100 border-green-200" },
  { id: "Cancelado", title: "Cancelado", color: "bg-red-100 border-red-200" },
] as const;

export function PipelineKanban({ projects, onUpdateProject, onEditProject, onViewProject }: any) {
  const [draggingProject, setDraggingProject] = React.useState<any | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null);
  const [localProjects, setLocalProjects] = React.useState<any[]>(projects);
  const [updating, setUpdating] = React.useState<string | null>(null);

  React.useEffect(() => setLocalProjects(projects), [projects]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const isColumnId = (id: string) => columns.some((c) => c.id === id);
  const columnByProjectId = (id: string) => localProjects.find((p) => p.id === id)?.pipeline_status ?? null;
  const resolveTargetStatus = (overId: string) => {
    if (isColumnId(overId)) return overId;
    return columnByProjectId(overId);
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    const proj = localProjects.find((p) => String(p.id) === String(active.id)) || null;
    setDraggingProject(proj);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const colId = resolveTargetStatus(String(event.over?.id ?? ""));
    setDragOverColumn(colId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingProject(null);
    setDragOverColumn(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Optimistic UI update: modify localProjects immediately to reflect change in UI
    const fromStatus = columnByProjectId(activeId);
    const toStatus = resolveTargetStatus(overId);
    if (!fromStatus || !toStatus) return;

    // Build column arrays
    const fromList = localProjects.filter((t) => t.pipeline_status === fromStatus).sort((a,b)=> (Number(a.pipeline_position)||0)-(Number(b.pipeline_position)||0));
    const toList = localProjects.filter((t) => t.pipeline_status === toStatus).sort((a,b)=> (Number(a.pipeline_position)||0)-(Number(b.pipeline_position)||0));

    const oldIndex = fromList.findIndex((t) => String(t.id) === activeId);
    const overIndex = isColumnId(overId) ? -1 : toList.findIndex((t) => String(t.id) === overId);
    const newIndex = overIndex === -1 ? toList.length : overIndex;

    // Apply optimistic change locally
    setLocalProjects((prev) => {
      const copy = prev.slice();
      // remove active
      const activeItemIndex = copy.findIndex((c) => String(c.id) === activeId);
      if (activeItemIndex === -1) return prev;
      const [item] = copy.splice(activeItemIndex, 1);
      item.pipeline_status = toStatus;
      // compute insertion index in copy
      // find insertion index as index of first item in copy with pipeline_status === toStatus at position newIndex
      const currentTo = copy.filter(c => c.pipeline_status === toStatus);
      let insertAt = copy.findIndex((c) => c.pipeline_status === toStatus);
      if (insertAt === -1) {
        // append to end
        copy.push(item);
      } else {
        // find the exact position among toStatus items
        let count = 0;
        let idx = insertAt;
        while (idx < copy.length && count < newIndex && copy[idx].pipeline_status === toStatus) {
          idx++;
          count++;
        }
        copy.splice(idx, 0, item);
      }
      return copy;
    });

    // Persist ordering to DB with helper
    try {
      setUpdating(activeId);
      await handleReorder({
        allItems: localProjects.map(p => ({
          id: String(p.id),
          pipeline_status: p.pipeline_status,
          pipeline_position: Number(p.pipeline_position || 0),
        })),
        activeId: activeId,
        overId: overId,
        isColumnId: (id: string) => isColumnId(id),
        resolveTargetStatus: (id: string) => resolveTargetStatus(id) ?? "",
      });

      // Optionally refetch or leave optimistic local state; upstream hooks may refresh later.
    } catch (err) {
      console.error("Error persisting pipeline order:", err);
      // Revert local state by resetting from props
      setLocalProjects(projects);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-x-auto px-2" style={{ minHeight: 600 }}>
          {columns.map((column) => (
            <DroppableColumn key={column.id} column={column}>
              <CardHeader className="pb-3 sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-border">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  {column.title}
                  <span className="bg-white/80 px-2 py-1 rounded-full text-xs font-semibold">
                    {localProjects.filter(p => p.pipeline_status === column.id).length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 overflow-y-auto">
                <SortableContext items={localProjects.filter(p => p.pipeline_status === column.id).map(p => p.id)} strategy={verticalListSortingStrategy}>
                  {localProjects.filter(p => p.pipeline_status === column.id).map((project) => (
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

                {localProjects.filter(p => p.pipeline_status === column.id).length === 0 && dragOverColumn === column.id && (
                  <div className="flex items-center justify-center h-20 border-2 border-dashed border-primary rounded-md text-primary font-medium bg-primary/5">
                    Solte aqui
                  </div>
                )}
              </CardContent>
            </DroppableColumn>
          ))}
        </div>

        {/* DragOverlay in portal */}
        {typeof document !== "undefined" ? createPortal(
          <DragOverlay>
            {draggingProject ? <SortableProjectCard project={draggingProject} /> : null}
          </DragOverlay>,
          document.body
        ) : null}
      </DndContext>
    </div>
  );
}

export default PipelineKanban;