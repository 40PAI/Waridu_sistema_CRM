"use client";

import * as React from "react";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import type { EventProject } from "@/types/crm";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { CreateProjectDialog } from "@/components/crm/CreateProjectDialog";
import { ProjectEditDialog } from "@/components/crm/ProjectEditDialog";

export default function PipelinePage() {
  const { events, updateEvent, addEvent } = useEvents();
  const { clients } = useClients();
  const { services } = useServices();

  const projects: EventProject[] = events
    .filter((e) => !!e.pipeline_status)
    .map((e) => ({
      id: e.id,
      name: e.name ?? `Evento ${e.id}`,
      client_id: e.client_id || undefined,
      pipeline_status: (e.pipeline_status || "1º Contato") as EventProject["pipeline_status"],
      service_ids: (e.service_ids || []) as string[],
      estimated_value: e.estimated_value || undefined,
      startDate: e.startDate,
      endDate: e.endDate || e.startDate,
      location: e.location || "",
      status: e.status || "Planejado",
      tags: (e.tags || []) as string[],
      notes: e.notes || "",
    }));

  // Novo projeto
  const [openCreate, setOpenCreate] = React.useState(false);

  // Edição
  const [openEdit, setOpenEdit] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<EventProject | null>(null);

  const handleEditProject = (p: EventProject) => {
    setEditingProject(p);
    setOpenEdit(true);
  };

  const handleSaveProject = async (p: EventProject) => {
    // Reaproveita updateEvent (já persiste campos CRM no hook)
    await updateEvent(p as any);
  };

  const handleCreateProject = async (payload: {
    name: string;
    client_id?: string;
    pipeline_status?: EventProject["pipeline_status"];
    service_ids?: string[];
    estimated_value?: number;
    startDate: string;
    endDate: string;
    location?: string;
    notes?: string;
  }) => {
    await addEvent({
      name: payload.name,
      startDate: payload.startDate,
      endDate: payload.endDate,
      location: payload.location || "",
      startTime: "",
      endTime: "",
      revenue: undefined,
      // CRM
      pipeline_status: payload.pipeline_status,
      estimated_value: payload.estimated_value,
      service_ids: payload.service_ids,
      client_id: payload.client_id,
      notes: payload.notes,
      tags: [],
      follow_ups: [],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projetos</h1>
        <Button onClick={() => setOpenCreate(true)} aria-label="Novo Projeto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <PipelineKanban
        projects={projects}
        onUpdateProject={async (p) => updateEvent(p as any)}
        onEditProject={handleEditProject}
      />

      {/* Criar Projeto */}
      <CreateProjectDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        services={services.map((s) => ({ id: s.id, name: s.name }))}
        onCreate={handleCreateProject}
      />

      {/* Editar Projeto */}
      <ProjectEditDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        project={editingProject as any}
        onSave={handleSaveProject}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        services={services.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}