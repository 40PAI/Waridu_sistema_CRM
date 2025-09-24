"use client";

import * as React from "react";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import CreateProjectModal from "@/components/crm/CreateProjectModal";
import useEvents from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { EventProject } from "@/types/crm";
import ViewProjectDialog from "@/components/crm/ViewProjectDialog";
import { EditProjectDialog } from "@/components/crm/EditProjectDialog";

export default function PipelinePage() {
  const { events, updateEvent, loading } = useEvents();
  const { clients } = useClients();
  const { services } = useServices();

  const [openCreateProject, setOpenCreateProject] = React.useState(false);
  const [openEditProject, setOpenEditProject] = React.useState(false);
  const [openViewProject, setOpenViewProject] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<EventProject | null>(null);
  const [viewingProject, setViewingProject] = React.useState<EventProject | null>(null);

  const projects: EventProject[] = useMemo(() => {
    return (events || [])
      .filter((e) => !!(e as any).pipeline_status || !!(e as any).pipeline_phase_id)
      .map((e) => ({
        id: e.id,
        name: e.name || `Evento ${e.id}`,
        client_id: (e as any).client_id,
        pipeline_status: (e as any).pipeline_status || "1º Contato",
        service_ids: (e as any).service_ids || [],
        estimated_value: (e as any).estimated_value,
        startDate: e.startDate,
        endDate: e.endDate ?? e.startDate,
        location: e.location ?? "",
        status: e.status ?? "Planejado",
        tags: (e as any).tags ?? [],
        notes: (e as any).notes ?? "",
        responsible_id: (e as any).responsible_id,
        pipeline_phase_id: (e as any).pipeline_phase_id,
        pipeline_rank: (e as any).pipeline_rank,
        updated_at: e.updated_at,
      }));
  }, [events]);

  const handleUpdateProject = async (updatedProject: EventProject) => {
    const fullEvent: any = {
      id: updatedProject.id,
      name: updatedProject.name,
      start_date: updatedProject.startDate,
      end_date: updatedProject.endDate,
      location: updatedProject.location,
      status: updatedProject.status,
      pipeline_phase_id: updatedProject.pipeline_phase_id,
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <div />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Kanban</CardTitle>
          <CardDescription>Arraste projetos entre fases</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p>Carregando...</p> : (
            <PipelineKanban
              projects={projects}
              onUpdateProject={handleUpdateProject}
              onEditProject={handleEditProject}
              onViewProject={handleViewProject}
            />
          )}
        </CardContent>
      </Card>

      <CreateProjectModal
        open={openCreateProject}
        onOpenChange={setOpenCreateProject}
        onCreated={(id) => {
          console.log("Project created with id:", id);
        }}
        preselectedClientId={undefined}
      />

      {/* Edit Dialog */}
      <EditProjectDialog
        open={openEditProject}
        onOpenChange={(open) => {
          setOpenEditProject(open);
          if (!open) setEditingProject(null);
        }}
        project={editingProject}
        onSave={async (p) => {
          await handleUpdateProject(p);
        }}
      />

      {/* View Dialog */}
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