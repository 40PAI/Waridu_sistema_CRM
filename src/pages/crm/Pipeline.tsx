"use client";

import * as React from "react";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import { CreateProjectDialog } from "@/components/crm/CreateProjectDialog";
import { EditProjectDialog } from "@/components/crm/EditProjectDialog";
import { ViewProjectDialog } from "@/components/crm/ViewProjectDialog";
import useEvents from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { EventProject } from "@/types/crm";

export default function PipelinePage() {
  const { events, updateEvent, loading } = useEvents();
  const { clients } = useClients();
  const { services } = useServices();

  const [openCreateProject, setOpenCreateProject] = React.useState(false);
  const [openEditProject, setOpenEditProject] = React.useState(false);
  const [openViewProject, setOpenViewProject] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<EventProject | null>(null);
  const [viewingProject, setViewingProject] = React.useState<EventProject | null>(null);

  const projects: EventProject[] = React.useMemo(() => {
    return (events || [])
      .filter((e) => !!(e as any).pipeline_status)
      .map((e) => ({
        id: e.id,
        name: e.name || `Evento ${e.id}`,
        client_id: (e as any).client_id,
        pipeline_status: (e as any).pipeline_status,
        service_ids: (e as any).service_ids || [],
        estimated_value: (e as any).estimated_value,
        startDate: e.startDate,
        endDate: e.endDate ?? e.startDate,
        location: e.location ?? "",
        status: e.status ?? "Planejado",
        tags: (e as any).tags ?? [],
        notes: (e as any).notes ?? "",
      }));
  }, [events]);

  const handleUpdateProject = async (updatedProject: EventProject) => {
    const fullEvent: any = {
      id: updatedProject.id,
      name: updatedProject.name,
      startDate: updatedProject.startDate,
      endDate: updatedProject.endDate,
      location: updatedProject.location,
      status: updatedProject.status,
      pipeline_status: updatedProject.pipeline_status,
      estimated_value: updatedProject.estimated_value,
      service_ids: updatedProject.service_ids,
      client_id: updatedProject.client_id,
      notes: updatedProject.notes,
      tags: updatedProject.tags,
      updated_at: new Date().toISOString(),
    };
    await updateEvent(fullEvent);
  };

  const handleEditProject = (project: EventProject) => {
    setEditingProject(project);
    setOpenEditProject(true);
  };

  const handleViewProject = (project: EventProject) => {
    setViewingProject(project);
    setOpenViewProject(true);
  };

  const handleCreateProject = async (payload: any) => {
    const eventPayload = {
      name: payload.name,
      startDate: payload.startDate,
      endDate: payload.endDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
      location: payload.location,
      description: payload.notes,
      pipeline_status: payload.pipeline_status,
      estimated_value: payload.estimated_value,
      service_ids: payload.service_ids,
      client_id: payload.client_id,
      status: "Planejado",
    };
    await updateEvent(eventPayload as any);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <Button onClick={() => setOpenCreateProject(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>
      {loading ? <p>Carregando...</p> : <PipelineKanban projects={projects} onUpdateProject={handleUpdateProject} onEditProject={handleEditProject} onViewProject={handleViewProject} />}

      <CreateProjectDialog
        open={openCreateProject}
        onOpenChange={setOpenCreateProject}
        clients={clients}
        services={services}
        onCreate={handleCreateProject}
      />

      <EditProjectDialog
        open={openEditProject}
        onOpenChange={setOpenEditProject}
        project={editingProject}
        onSave={handleUpdateProject}
      />

      <ViewProjectDialog
        open={openViewProject}
        onOpenChange={setOpenViewProject}
        project={viewingProject}
      />
    </div>
  );
}