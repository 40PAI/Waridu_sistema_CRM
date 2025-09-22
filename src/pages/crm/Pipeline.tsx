"use client";

import * as React from "react";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import CreateProjectModal from "@/components/crm/CreateProjectModal";
import EditProjectDialog from "@/components/crm/EditProjectDialog";
import ViewProjectDialog from "@/components/crm/ViewProjectDialog";
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

  // Refs for columns to enable auto-scroll after creation
  const columnRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

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
        responsible_id: (e as any).responsible_id,
        pipeline_rank: (e as any).pipeline_rank,
        updated_at: (e as any).updated_at,
      }));
  }, [events]);

  const handleUpdateProject = async (updatedProject: EventProject) => {
    const fullEvent: any = {
      id: updatedProject.id,
      name: updatedProject.name,
      startDate: updatedProject.startDate,
      endDate: updatedProject.endDate,
      location: updatedProject.location,
      startTime: undefined,
      endTime: undefined,
      revenue: updatedProject.estimated_value,
      status: updatedProject.status,
      description: updatedProject.notes,
      roster: undefined,
      expenses: undefined,
      pipeline_status: updatedProject.pipeline_status,
      estimated_value: updatedProject.estimated_value,
      service_ids: updatedProject.service_ids,
      client_id: updatedProject.client_id,
      notes: updatedProject.notes,
      tags: updatedProject.tags,
      responsible_id: updatedProject.responsible_id,
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

  const handleProjectCreated = (projectId: number) => {
    // Find the created project to get its status for scrolling
    const createdProject = projects.find(p => p.id === projectId);
    if (createdProject) {
      const status = createdProject.pipeline_status || "1º Contato";
      // Scroll to the column after a short delay to allow DOM update
      setTimeout(() => {
        const columnElement = columnRefs.current[status];
        if (columnElement) {
          columnElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
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
      {loading ? <p>Carregando...</p> : <PipelineKanban 
        projects={projects} 
        onUpdateProject={handleUpdateProject} 
        onEditProject={handleEditProject} 
        onViewProject={handleViewProject}
        columnRefs={columnRefs}
      />}

      <CreateProjectModal
        open={openCreateProject}
        onOpenChange={setOpenCreateProject}
        onCreated={handleProjectCreated}
        preselectedClientId={undefined}
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