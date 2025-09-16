"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import { CreateProjectDialog } from "@/components/crm/CreateProjectDialog";
import type { EventProject, CreatePayload } from "@/types/crm";

export default function PipelinePage() {
  const { events, addEvent, updateEvent } = useEvents();
  const { clients } = useClients();
  const { services } = useServices();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  const handleCreate = async (payload: CreatePayload) => {
    try {
      setCreating(true);
      await addEvent({
        name: payload.name,
        startDate: payload.startDate,
        endDate: payload.endDate,
        location: payload.location || "",
        pipeline_status: payload.pipeline_status || "1º Contato",
        estimated_value: payload.estimated_value,
        service_ids: payload.service_ids || [],
        client_id: payload.client_id,
        notes: payload.notes || "",
      });
      showSuccess("Projeto criado com sucesso!");
      setCreateOpen(false);
    } catch (err: any) {
      console.error("Erro ao criar projeto:", err);
      showError(err?.message || "Erro ao criar projeto.");
      throw err;
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateProject = async (updatedProject: EventProject) => {
    await updateEvent(updatedProject);
  };

  // Filtrar apenas projetos com pipeline_status definido
  const projectsWithPipeline: EventProject[] = React.useMemo(() => {
    return events
      .filter((e) => !!e.pipeline_status)
      .map((e) => ({
        id: e.id,
        name: e.name ?? `Evento ${e.id}`,
        client_id: e.client_id,
        pipeline_status: e.pipeline_status as EventProject['pipeline_status'],
        service_ids: e.service_ids ?? [],
        estimated_value: e.estimated_value,
        startDate: e.startDate,
        endDate: e.endDate ?? e.startDate,
        location: e.location ?? "",
        status: e.status ?? "Planejado",
        tags: e.tags ?? [],
        notes: e.notes ?? "",
      }));
  }, [events]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pipeline de Projetos</h1>
        <div>
          <Button onClick={() => setCreateOpen(true)} disabled={creating}>
            <Plus className="h-4 w-4 mr-2" /> Novo Projeto
          </Button>
        </div>
      </div>

      <PipelineKanban
        projects={projectsWithPipeline}
        onUpdateProject={handleUpdateProject}
      />

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
        services={services}
        onCreate={handleCreate}
        loading={creating}
      />
    </div>
  );
}