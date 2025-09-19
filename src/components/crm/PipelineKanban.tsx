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
import { showError, showSuccess } from "@/utils/toast";
import { SortableProjectCard } from "./SortableProjectCard";
import { DroppableColumn } from "./DroppableColumn";
import type { EventProject } from "@/types/crm";
import { supabase } from "@/integrations/supabase/client";
import { usePipelinePhases } from "@/hooks/usePipelinePhases";
import { useState } from "react";
import EditProjectDialog from "./EditProjectDialog";
import ViewProjectDialog from "./ViewProjectDialog";

interface PipelineKanbanProps {
  projects: EventProject[];
  onUpdateProject: (p: EventProject) => Promise<void>;
  onEditProject?: (p: EventProject) => void;
  onViewProject?: (p: EventProject) => void;
}

const slugify = (s?: string) => String(s || "").toLowerCase().replace(/[^a-z0-9-_]/g, "-");

export function PipelineKanban({ projects, onUpdateProject, onEditProject, onViewProject }: PipelineKanbanProps) {
  const { activePhases, loading } = usePipelinePhases();
  const [draggingProject, setDraggingProject] = React.useState<EventProject | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null);
  const [localProjects, setLocalProjects] = React.useState<EventProject[]>(projects);
  const [updating, setUpdating] = React.useState<string | null>(null);
  const [editingProject, setEditingProject] = React.useState<EventProject | null>(null);
  const [viewingProject, setViewingProject] = React.useState<EventProject | null>(null);

  React.useEffect(() => setLocalProjects(projects), [projects]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const projectsByColumn = React.useMemo(() => {
    const grouped: Record<string, EventProject[]> = {};
    activePhases.forEach(p => (grouped[p.name] = []));
    localProjects.forEach(p => {
      const status = p.pipeline_status || "1º Contato";
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(p);
    });
    return grouped;
  }, [localProjects, activePhases]);

  const findColumnByProjectId = (projId: string | number) => {
    const idStr = String(projId);
    for (const phaseName of Object.keys(projectsByColumn)) {
      if ((projectsByColumn[phaseName] || []).some(p => String(p.id) === idStr)) {
        return phaseName;
      }
    }
    return null;
  };

  const getOverColumnId = (over: DragOverEvent["over"]) => {
    if (!over) return null;
    const containerId = (over.data?.current as any)?.sortable?.containerId;
    if (containerId) return String(containerId);
    const overId = String(over.id ?? "");
    if (activePhases.some(p => p.name === overId)) return overId;
    const fromContainer = findColumnByProjectId(overId);
    return fromContainer;
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    const project = localProjects.find((p) => String(p.id) === String(active.id)) ?? null;
    setDraggingProject(project || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const colId = getOverColumnId(event.over);
    setDragOverColumn(colId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingProject(null);
    setDragOverColumn(null);
    if (!over) return;

    const targetPhaseName = getOverColumnId(over);
    if (!targetPhaseName || !activePhases.find(p => p.name === targetPhaseName)) {
      showError("Fase inválida.");
      return;
    }

    const project = localProjects.find((p) => String(p.id) === String(active.id));
    if (!project) return;

    const optimistic: EventProject = { ...project, pipeline_status: targetPhaseName };
    setLocalProjects(prev => prev.map(p => (p.id === project.id ? optimistic : p)));
    setUpdating(String(project.id));

    try {
      await onUpdateProject(optimistic);
      showSuccess("Projeto movido para " + targetPhaseName);
    } catch (error) {
      showError("Erro ao mover projeto. Revertendo...");
      setLocalProjects(projects);
    } finally {
      setUpdating(null);
    }
  };

  // Atualização em tempo real vinda do banco (mantém colunas sincronizadas)
  React.useEffect(() => {
    if (!activePhases.length) return;

    const channel = supabase
      .channel("pipeline-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "events", filter: "pipeline_status IS NOT NULL" },
        (payload) => {
          if (payload.new && payload.new.pipeline_status) {
            setLocalProjects(prev => {
              const idx = prev.findIndex(p => p.id === payload.new.id);
              if (idx !== -1) {
                const updated = { ...prev[idx], pipeline_status: String(payload.new.pipeline_status) };
                const next = [...prev];
                next[idx] = updated;
                return next;
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePhases]);

  // Salvar via modal (edição): aplica atualização otimista para mover imediatamente
  const handleSaveProject = async (updated: EventProject) => {
    setLocalProjects(prev => prev.map(p => (p.id === updated.id ? { ...p, ...updated } : p)));
    setUpdating(String(updated.id));
    try {
      await onUpdateProject(updated);
      showSuccess("Projeto atualizado!");
    } catch (err) {
      showError("Erro ao salvar projeto. Revertendo...");
      setLocalProjects(projects);
      throw err;
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Carregando pipeline...</div>;
  }

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-x-auto px-2" style={{ minHeight: 600 }}>
          {activePhases.map((phase) => {
            const colId = phase.name;
            const colSlug = slugify(colId);
            const columnProjects = projectsByColumn[colId] || [];
            return (
              <DroppableColumn
                key={phase.id}
                column={{ id: colId, title: phase.name, color: phase.color || "#f9fafb" }}
                disabled={!phase.active}
              >
                <CardHeader className="pb-3 sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b">
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: phase.color || "#e5e7eb" }} />
                      {phase.name}
                    </span>
                    <span className="bg-white/80 px-2 py-1 rounded-full text-xs font-semibold">
                      {columnProjects.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 overflow-y-auto" id={`pipeline-column-${colSlug}`}>
                  <SortableContext id={phase.name} items={columnProjects.map((p) => String(p.id))} strategy={verticalListSortingStrategy}>
                    {columnProjects.map((project) => (
                      <div key={project.id} id={`project-${project.id}`} className="mb-3">
                        <SortableProjectCard
                          project={project}
                          onEditClick={(p) => setEditingProject(p)}
                          onViewProject={(p) => setViewingProject(p)}
                        />
                        {updating === String(project.id) && (
                          <div className="text-xs text-muted-foreground mt-1">Atualizando...</div>
                        )}
                      </div>
                    ))}
                  </SortableContext>

                  {columnProjects.length === 0 && dragOverColumn === phase.name && (
                    <div className="flex items-center justify-center h-20 border-2 border-dashed border-primary rounded-md text-primary font-medium bg-primary/5">
                      Solte aqui
                    </div>
                  )}
                </CardContent>
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {draggingProject ? (
            <Card className="shadow-2xl p-3 bg-white rounded-md w-64 border-2 border-primary">
              <CardContent>
                <h3 className="font-semibold text-sm truncate">{draggingProject.name}</h3>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      <EditProjectDialog
        open={!!editingProject}
        onOpenChange={(open) => setEditingProject(open ? editingProject : null)}
        project={editingProject}
        onSave={handleSaveProject}
      />
      <ViewProjectDialog
        open={!!viewingProject}
        onOpenChange={(open) => setViewingProject(open ? viewingProject : null)}
        project={viewingProject}
      />
    </div>
  );
}