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

interface PipelineKanbanProps {
  projects: EventProject[];
  onUpdateProject?: (p: EventProject) => Promise<void>;
  onEditProject?: (p: EventProject) => void;
  onViewProject?: (p: EventProject) => void;
}

const columns = [
  { id: "1º Contato", title: "1º Contato", color: "bg-gray-100 border-gray-200" },
  { id: "Orçamento", title: "Orçamento", color: "bg-blue-100 border-blue-200" },
  { id: "Negociação", title: "Negociação", color: "bg-yellow-100 border-yellow-200" },
  { id: "Confirmado", title: "Confirmado", color: "bg-green-100 border-green-200" },
  { id: "Cancelado", title: "Cancelado", color: "bg-red-100 border-red-200" },
] satisfies { id: PipelineStatus; title: string; color: string }[];

const getStatusBadge = (status?: string) => {
  switch (status) {
    case "1º Contato": return "bg-gray-100 text-gray-800";
    case "Orçamento": return "bg-blue-100 text-blue-800";
    case "Negociação": return "bg-yellow-100 text-yellow-800";
    case "Confirmado": return "bg-green-100 text-green-800";
    case "Cancelado": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

function isColumnId(id: string | null | undefined) {
  if (!id) return false;
  return columns.some(c => String(c.id) === String(id));
}

function getProjectById(list: EventProject[], id: string | number) {
  return list.find(p => String(p.id) === String(id)) || null;
}

export function PipelineKanban({ projects, onUpdateProject, onEditProject, onViewProject }: PipelineKanbanProps) {
  const [draggingProject, setDraggingProject] = React.useState<EventProject | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<PipelineStatus | null>(null);
  const [localProjects, setLocalProjects] = React.useState<EventProject[]>(projects);
  const [updating, setUpdating] = React.useState<string | null>(null);

  React.useEffect(() => setLocalProjects(projects), [projects]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const projectsByColumn = React.useMemo(() => {
    const grouped: Record<PipelineStatus, EventProject[]> = {
      "1º Contato": [],
      Orçamento: [],
      Negociação: [],
      Confirmado: [],
      Cancelado: [],
    };
    localProjects.forEach((p) => {
      const key = (p.pipeline_status || "1º Contato") as PipelineStatus;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });
    // ensure stable sort by pipeline_rank asc, then updated_at desc
    Object.keys(grouped).forEach(k => {
      grouped[k as PipelineStatus].sort((a,b) => {
        const ra = Number(a.pipeline_rank ?? 0);
        const rb = Number(b.pipeline_rank ?? 0);
        if (ra !== rb) return ra - rb;
        const ta = new Date(a.startDate || a.updated_at || 0).getTime();
        const tb = new Date(b.startDate || b.updated_at || 0).getTime();
        return tb - ta;
      });
    });
    return grouped;
  }, [localProjects]);

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
      setDragOverColumn(overId as PipelineStatus);
      return;
    }
    const pr = getProjectById(localProjects, overId);
    setDragOverColumn(pr ? (pr.pipeline_status as PipelineStatus) : null);
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

    const fromStatus = activeProject.pipeline_status || "1º Contato";
    // resolve target status: either column id or the status of the project being hovered
    const toStatus = isColumnId(overId) ? (overId as PipelineStatus) : (getProjectById(localProjects, overId)?.pipeline_status || "1º Contato");

    // Build ordered arrays for the destination column AFTER removal of active from origin
    const originList = localProjects.filter(p => (p.pipeline_status || "1º Contato") === fromStatus)
      .sort((a,b) => (Number(a.pipeline_rank ?? 0) - Number(b.pipeline_rank ?? 0)) || (new Date(b.updated_at||0).getTime() - new Date(a.updated_at||0).getTime()));
    const destList = localProjects.filter(p => (p.pipeline_status || "1º Contato") === toStatus)
      .sort((a,b) => (Number(a.pipeline_rank ?? 0) - Number(b.pipeline_rank ?? 0)) || (new Date(b.updated_at||0).getTime() - new Date(a.updated_at||0).getTime()));

    // Remove active from origin representation
    const originIds = originList.map(p => String(p.id));
    const oldIndex = originIds.indexOf(activeId);
    if (oldIndex >= 0) originIds.splice(oldIndex, 1);

    // Prepare destIds (if moved within same column, start from originIds; else from destList)
    const destIds = fromStatus === toStatus ? [...originIds] : destList.map(p => String(p.id));

    // Determine insertion index
    let insertIndex: number;
    if (isColumnId(overId)) {
      insertIndex = destIds.length; // drop into empty area => append
    } else {
      // drop onto a project item -> insert before that item
      const idx = destIds.indexOf(overId);
      insertIndex = idx >= 0 ? idx : destIds.length;
    }

    // Insert activeId into destIds at insertIndex
    destIds.splice(insertIndex, 0, activeId);

    // Determine neighbors for RPC: beforeId = id at index-1, afterId = id at index+1
    const beforeId = insertIndex > 0 ? destIds[insertIndex - 1] : null;
    const afterId = insertIndex < destIds.length - 1 ? destIds[insertIndex + 1] : null;

    // Optimistic UI update: move activeProject into toStatus and recompose localProjects
    const previousLocal = localProjects;
    const movedProject: EventProject = { ...activeProject, pipeline_status: toStatus };

    setLocalProjects(prev => {
      // Remove active from prev list
      const withoutActive = prev.filter(p => String(p.id) !== activeId);
      // Build new destination column array in order
      const newDest = destIds.map(id => (id === activeId ? movedProject : (prev.find(p => String(p.id) === id) || movedProject))).filter(Boolean) as EventProject[];
      // Recompose full list: keep other columns items but replace target column with newDest (maintaining original order of other columns)
      const result: EventProject[] = [];
      prev.forEach(p => {
        if ((p.pipeline_status || "1º Contato") === toStatus) {
          // only add once; skip here because we'll add newDest later
        } else if ((p.pipeline_status || "1º Contato") === fromStatus && fromStatus === toStatus) {
          // within same column; skip old original block (we will append newDest in place)
        } else {
          // add items that are not in target column
          if (String(p.id) !== activeId) result.push(p);
        }
      });
      // Append newDest at end of result where appropriate — a simple approach keeps other columns intact, and places destination column items grouped
      // For display purposes this is acceptable; ordering across columns is determined by pipeline_status grouping.
      // We'll append destination column items at the end (UI groups by column anyway).
      return result.concat(newDest);
    });

    // Single RPC call to persist change: p_event_id, p_new_status, p_before_id, p_after_id
    setUpdating(String(activeProject.id));
    try {
      const rpcRes = await supabase.rpc('rpc_move_event', {
        p_event_id: Number(activeProject.id),
        p_new_status: toStatus,
        p_before_id: beforeId ? Number(beforeId) : null,
        p_after_id: afterId ? Number(afterId) : null,
      });

      if (rpcRes.error) {
        throw rpcRes.error;
      }

      // success
      setUpdating(null);
      showSuccess("Projeto movido com sucesso!");
      // Note: the app may rely on realtime or an explicit fetch elsewhere to reconcile final DB state.
    } catch (err: any) {
      console.error("rpc_move_event error", err);
      showError("Erro ao mover projeto. A posição foi revertida.");
      // rollback optimistic update
      setLocalProjects(previousLocal);
      setUpdating(null);
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
                <Badge className={getStatusBadge(draggingProject.pipeline_status)}>{draggingProject.pipeline_status}</Badge>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}