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
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PipelineKanbanProps {
  projects: EventProject[];
  onUpdateProject: (p: EventProject) => Promise<void>;
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

const getOverColumnId = (over: DragOverEvent["over"]) => {
  if (!over) return null;
  if (columns.some((c) => c.id === over.id)) return String(over.id) as PipelineStatus;
  return (over.data?.current as any)?.sortable?.containerId ?? null;
};

export function PipelineKanban({ projects, onUpdateProject, onEditProject, onViewProject }: PipelineKanbanProps) {
  const [draggingProject, setDraggingProject] = React.useState<EventProject | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<PipelineStatus | null>(null);
  const [updating, setUpdating] = React.useState(false);
  const [localProjects, setLocalProjects] = React.useState<EventProject[]>(projects);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setLocalProjects(projects), [projects]);

  // Detectar mudanças comparando com o estado original
  React.useEffect(() => {
    const originalMap = new Map(projects.map(p => [p.id, p.pipeline_status]));
    const hasAnyChange = localProjects.some(p => originalMap.get(p.id) !== p.pipeline_status);
    setHasChanges(hasAnyChange);
  }, [localProjects, projects]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const projectsByColumn = React.useMemo(() => {
    const grouped: Record<PipelineStatus, EventProject[]> = {
      "1º Contato": [],
      Orçamento: [],
      Negociação: [],
      Confirmado: [],
      Cancelado: [],
    };
    localProjects.forEach((p) => grouped[p.pipeline_status]?.push(p));
    return grouped;
  }, [localProjects]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    const project = localProjects.find((p) => p.id === active.id) ?? null;
    setDraggingProject(project);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const colId = getOverColumnId(event.over) as PipelineStatus | null;
    setDragOverColumn(colId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingProject(null);
    setDragOverColumn(null);
    if (!over || updating) return;

    const targetColumnId = getOverColumnId(over) as PipelineStatus | null;
    if (!targetColumnId) return;

    const project = localProjects.find((p) => p.id === Number(active.id));
    if (!project) return;

    // UI otimista
    setLocalProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, pipeline_status: targetColumnId } : p)));
  };

  const handleSavePipeline = async () => {
    if (!hasChanges || saving) return;

    console.log("🚀 Iniciando salvamento do pipeline...");
    setSaving(true);

    try {
      // Coletar projetos modificados
      const originalMap = new Map(projects.map(p => [p.id, p.pipeline_status]));
      const modifiedProjects = localProjects.filter(p => originalMap.get(p.id) !== p.pipeline_status);

      console.log("📝 Projetos modificados:", modifiedProjects);

      if (modifiedProjects.length === 0) {
        console.log("ℹ️ Nenhum projeto foi modificado");
        setSaving(false);
        return;
      }

      // Preparar updates em lote
      const updates = modifiedProjects.map(project => ({
        id: project.id,
        pipeline_status: project.pipeline_status,
        updated_at: new Date().toISOString(),
      }));

      console.log("🔄 Enviando updates para Supabase:", updates);

      // Executar updates em lote
      const updatePromises = updates.map(update =>
        supabase
          .from('events')
          .update({
            pipeline_status: update.pipeline_status,
            updated_at: update.updated_at
          })
          .eq('id', update.id)
      );

      const results = await Promise.all(updatePromises);

      // Verificar se houve erros
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error("❌ Erros no salvamento:", errors);
        throw new Error(`Falha ao salvar ${errors.length} projeto(s)`);
      }

      console.log("✅ Salvamento concluído com sucesso");

      // Atualizar estado original para refletir mudanças
      setLocalProjects(localProjects);
      setHasChanges(false);

      showSuccess("Alterações salvas com sucesso!");
    } catch (error: any) {
      console.error("💥 Erro ao salvar pipeline:", error);
      showError(`Erro ao salvar alterações: ${error.message || "Tente novamente"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Botão Salvar Alterações */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {hasChanges ? `${localProjects.filter(p => projects.find(op => op.id === p.id)?.pipeline_status !== p.pipeline_status).length} projeto(s) modificado(s)` : "Nenhuma alteração pendente"}
        </div>
        <Button
          onClick={handleSavePipeline}
          disabled={!hasChanges || saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-x-auto px-2" style={{ minHeight: 600 }}>
          {columns.map((column) => (
            <DroppableColumn key={column.id} column={column} disabled={updating}>
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
                      <SortableProjectCard project={project} onEditClick={onEditProject} onViewClick={onViewProject} />
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