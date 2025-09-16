"use client";

import * as React from "react";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import CreateProjectDialog from "@/components/crm/CreateProjectDialog";
import { showSuccess, showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PipelineKanban } from "@/components/crm/PipelineKanban";

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
      // addEvent already refreshes events; show feedback
      showSuccess("Projeto criado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao criar projeto:", err);
      showError(err?.message || "Erro ao criar projeto.");
      throw err;
    }
  };

  const handleUpdateProject = async (updatedProject: any) => {
    await updateEvent(updatedProject);
  };

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
        projects={events.filter(e => !!e.pipeline_status)}
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