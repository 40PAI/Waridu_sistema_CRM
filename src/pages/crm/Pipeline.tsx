"use client";

import * as React from "react";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import CreateProjectModal from "@/components/crm/CreateProjectModal";
import { EditProjectDialog } from "@/components/crm/EditProjectDialog";
import { ViewProjectDialog } from "@/components/crm/ViewProjectDialog";
import useEvents from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { EventProject } from "@/types/crm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Ensure no static caching for real-time data consistency
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
        pipeline_phase_id: e.pipeline_phase_id,
        pipeline_phase_label: e.pipeline_phase_label,
        pipeline_rank: e.pipeline_rank,
        updated_at: e.updated_at,
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
      pipeline_phase_id: updatedProject.pipeline_phase_id,
      pipeline_rank: updatedProject.pipeline_rank,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando pipeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <Button onClick={() => setOpenCreateProject(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="new-project">Novo Projeto</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <PipelineKanban 
            projects={projects} 
            onUpdateProject={handleUpdateProject} 
            onEditProject={handleEditProject} 
            onViewProject={handleViewProject} 
          />
        </TabsContent>

        <TabsContent value="new-project">
          <CreateProjectModal
            open={true} // Always open when this tab is active
            onOpenChange={() => {}} // No-op as it's controlled by tab
            onCreated={(id) => {
              showSuccess(`Projeto ${id} criado com sucesso!`);
              // Optionally switch back to kanban view or refresh
            }}
            preselectedClientId={undefined}
          />
        </TabsContent>
      </Tabs>

      <CreateProjectModal
        open={openCreateProject}
        onOpenChange={setOpenCreateProject}
        onCreated={(id) => {
          console.log("Project created with id:", id);
        }}
        preselectedClientId={undefined}
      />

      <EditProjectDialog
        open={openEditProject}
        onOpenChange={(open) => {
          setOpenEditProject(open);
          if (!open) setEditingProject(null);
        }}
        project={editingProject}
        onSave={handleUpdateProject}
      />

      <ViewProjectDialog
        open={openViewProject}
        onOpenChange={(open) => {
          setOpenViewProject(open);
          if (!open) setViewingProject(null);
        }}
        project={viewingProject}
      />
    </div>
  );
}