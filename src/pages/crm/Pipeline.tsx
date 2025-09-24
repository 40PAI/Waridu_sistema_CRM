"use client";

import * as React from "react";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import CreateProjectModal from "@/components/crm/CreateProjectModal";
import useEvents from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { EventProject } from "@/types/crm";
import usePipelinePhases from "@/hooks/usePipelinePhases"; // Import usePipelinePhases

export default function PipelinePage() {
  const { events, updateEvent, loading } = useEvents();
  const { clients } = useClients();
  const { services } = useServices();
  const { phases } = usePipelinePhases(); // Use usePipelinePhases

  const [openCreateProject, setOpenCreateProject] = React.useState(false);
  const [openEditProject, setOpenEditProject] = React.useState(false);
  const [openViewProject, setOpenViewProject] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<EventProject | null>(null);
  const [viewingProject, setViewingProject] = React.useState<EventProject | null>(null);

  const projects: EventProject[] = React.useMemo(() => {
    return (events || [])
      .filter((e) => !!(e as any).pipeline_phase_id) // Filter by pipeline_phase_id
      .map((e) => ({
        id: e.id,
        name: e.name || `Evento ${e.id}`,
        client_id: (e as any).client_id,
        pipeline_status: (e as any).pipeline_status, // Derived from trigger
        pipeline_phase_id: (e as any).pipeline_phase_id, // Use pipeline_phase_id
        service_ids: (e as any).service_ids || [],
        estimated_value: (e as any).estimated_value,
        startDate: e.startDate,
        endDate: e.endDate ?? e.startDate,
        location: e.location ?? "",
        status: e.status ?? "Planejado",
        tags: (e as any).tags ?? [],
        notes: (e as any).notes ?? "",
        responsible_id: (e as any).responsible_id ?? "",
        pipeline_rank: (e as any).pipeline_rank ?? 0, // Include pipeline_rank
        updated_at: e.updated_at ?? "", // Include updated_at
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
      pipeline_status: updatedProject.pipeline_status, // Keep this for trigger
      pipeline_phase_id: updatedProject.pipeline_phase_id, // Send pipeline_phase_id
      pipeline_rank: updatedProject.pipeline_rank, // Send pipeline_rank
      estimated_value: updatedProject.estimated_value,
      service_ids: updatedProject.service_ids,
      client_id: updatedProject.client_id,
      notes: updatedProject.notes,
      tags: updatedProject.tags,
      responsible_id: updatedProject.responsible_id,
      updated_at: new Date().toISOString(), // Let DB trigger handle this
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

      <CreateProjectModal
        open={openCreateProject}
        onOpenChange={setOpenCreateProject}
        onCreated={(id) => {
          // optional hook for parent: could be used to navigate or refresh
          console.log("Project created with id:", id);
        }}
        preselectedClientId={undefined}
      />

      {/* Edit & View dialogs keep existing behavior (not modified in this change) */}
      {/* Existing EditProjectDialog / ViewProjectDialog usages remain unchanged elsewhere */}
    </div>
  );
}