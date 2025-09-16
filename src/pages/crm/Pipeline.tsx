"use client";

import * as React from "react";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { showError } from "@/utils/toast";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import type { Event } from "@/types"; // keep Event type
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreateProjectDialog from "@/components/crm/CreateProjectDialog";

export default function PipelinePage() {
  const { events, addEvent, updateEvent } = useEvents();
  const { clients } = useClients();
  const { services } = useServices();

  const [createOpen, setCreateOpen] = React.useState(false);

  const handleCreate = async (payload: {
    name: string;
    client_id?: string;
    pipeline_status?: any;
    service_ids?: string[];
    estimated_value?: number;
    startDate: string;
    endDate: string;
    location?: string;
    notes?: string;
  }) => {
    try {
      await addEvent({
        name: payload.name,
        startDate: payload.startDate,
        endDate: payload.endDate,
        location: payload.location || "",
        startTime: "",
        endTime: "",
        revenue: undefined,
        description: payload.notes || "",
        pipeline_status: payload.pipeline_status,
        estimated_value: payload.estimated_value,
        service_ids: payload.service_ids,
        client_id: payload.client_id,
        notes: payload.notes,
      } as any);
      showError; // keep parity with prior behavior
    } catch (err: any) {
      console.error("Erro ao criar projeto:", err);
      showError(err?.message || "Erro ao criar projeto.");
      throw err;
    }
  };

  const handleUpdateProject = async (updatedProject: any) => {
    await updateEvent(updatedProject);
  };

  // Local Project type matching PipelineKanban expected shape
  type Project = {
    id: number;
    name: string;
    client_id?: string;
    // allow 'Cancelado' as well so mapping from events doesn't fail when pipeline_status === 'Cancelado'
    pipeline_status: '1º Contato' | 'Orçamento' | 'Negociação' | 'Confirmado' | 'Cancelado';
    service_ids: string[];
    estimated_value?: number;
    startDate: string;
    endDate: string;
    location: string;
    status: string;
    tags?: string[];
    follow_ups?: any[];
    notes?: string;
  };

  // Map events with pipeline_status into Project[] and provide defaults for required fields
  const projectsWithPipeline: Project[] = React.useMemo(() => {
    return events
      .filter((e) => !!e.pipeline_status)
      .map((e) => ({
        id: e.id,
        name: e.name ?? `Evento ${e.id}`,
        client_id: e.client_id,
        pipeline_status: (e.pipeline_status as Project['pipeline_status']),
        service_ids: e.service_ids ?? [],
        estimated_value: e.estimated_value,
        startDate: e.startDate,
        endDate: e.endDate ?? e.startDate,
        location: e.location ?? "",
        status: e.status ?? "Planejado",
        tags: e.tags ?? [],
        follow_ups: e.follow_ups ?? [],
        notes: e.notes ?? "",
      }));
  }, [events]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pipeline de Projetos</h1>
        <div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>
      </div>

      <PipelineKanban
        projects={projectsWithPipeline}
        onUpdateProject={handleUpdateProject}
        clients={clients}
        services={services}
      />

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
        services={services}
        onCreate={handleCreate}
      />
    </div>
  );
}