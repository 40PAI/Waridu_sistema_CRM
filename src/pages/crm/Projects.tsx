"use client";

import { PipelineKanban } from "@/components/crm/PipelineKanban";
import { useEvents } from "@/hooks/useEvents";
import type { EventProject } from "@/types/crm";
import { MultiSelectServices } from "@/components/MultiSelectServices";
import { useServices } from "@/hooks/useServices";
import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditProjectDialog } from "@/components/crm/EditProjectDialog";
import { ViewProjectDialog } from "@/components/crm/ViewProjectDialog";
import CreateProjectModal from "@/components/crm/CreateProjectModal"; // Import CreateProjectModal
import { useQueryClient } from "@tanstack/react-query"; // Import useQueryClient
import { showSuccess } from "@/utils/toast"; // Import showSuccess

// Ensure no static caching for real-time data consistency
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ProjectsPage() {
  const { events, loading, updateEvent } = useEvents();
  const { services } = useServices();
  const qc = useQueryClient(); // Get query client for invalidation

  // service filter (array of service ids)
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);
  const [openEditProject, setOpenEditProject] = useState(false);
  const [openViewProject, setOpenViewProject] = useState(false);
  const [editingProject, setEditingProject] = useState<EventProject | null>(null);
  const [viewingProject, setViewingProject] = useState<EventProject | null>(null);
  const [openCreateProjectModal, setOpenCreateProjectModal] = useState(false);
  const [defaultPhaseForNewProject, setDefaultPhaseForNewProject] = useState<string | undefined>(undefined);


  const allProjects: EventProject[] = (events || [])
    .filter((e) => !!e.pipeline_status)
    .map((e) => ({
      id: e.id,
      name: e.name ?? `Evento ${e.id}`,
      client_id: (e as any).client_id,
      pipeline_status: (e as any).pipeline_status,
      service_ids: (e as any).service_ids ?? [],
      estimated_value: (e as any).estimated_value,
      startDate: e.startDate,
      endDate: e.endDate ?? e.startDate,
      location: e.location ?? "",
      status: e.status ?? "Planejado",
      tags: e.tags ?? [],
      notes: e.notes ?? "",
      pipeline_phase_id: e.pipeline_phase_id,
      pipeline_phase_label: e.pipeline_phase_label,
      pipeline_rank: e.pipeline_rank,
      updated_at: e.updated_at,
    }));

  // filter projects by selected services (match ANY)
  const filteredProjects = useMemo(() => {
    if (!serviceFilter || serviceFilter.length === 0) return allProjects;
    return allProjects.filter((p) => {
      const svcIds = p.service_ids || [];
      return svcIds.some(id => serviceFilter.includes(id));
    });
  }, [allProjects, serviceFilter]);

  const serviceNameById = useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach(s => (map[s.id] = s.name));
    return map;
  }, [services]);

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

  const onEditProject = (project: EventProject) => {
    setEditingProject(project);
    setOpenEditProject(true);
  };

  const onViewProject = (project: EventProject) => {
    setViewingProject(project);
    setOpenViewProject(true);
  };

  const handleCreateProjectInColumn = (phaseId: string) => {
    setDefaultPhaseForNewProject(phaseId);
    setOpenCreateProjectModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando projetos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Projetos</h1>
        <div />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre projetos por serviços contratados (seleção múltipla)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:gap-4">
            <div className="flex-1">
              <MultiSelectServices selected={serviceFilter} onChange={setServiceFilter} />
            </div>
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <Button variant="outline" onClick={() => setServiceFilter([])}>Limpar filtros</Button>
            </div>
          </div>

          {serviceFilter.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {serviceFilter.map(id => (
                <Badge key={id} variant="secondary" className="inline-flex items-center gap-2">
                  <span>{serviceNameById[id] || id}</span>
                  <button onClick={() => setServiceFilter(prev => prev.filter(x => x !== id))} className="ml-1">
                    ✕
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PipelineKanban
        projects={filteredProjects}
        onUpdateProject={handleUpdateProject}
        onEditProject={onEditProject}
        onViewProject={onViewProject}
        onCreateProjectInColumn={handleCreateProjectInColumn}
      />

      <CreateProjectModal
        open={openCreateProjectModal}
        onOpenChange={setOpenCreateProjectModal}
        onCreated={(id) => {
          showSuccess(`Projeto ${id} criado com sucesso!`);
          qc.invalidateQueries({ queryKey: ['events'] }); // Invalidate events query
        }}
        preselectedClientId={undefined}
        defaultPhaseId={defaultPhaseForNewProject}
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