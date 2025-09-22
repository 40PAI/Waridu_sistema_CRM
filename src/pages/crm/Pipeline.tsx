"use client";

import * as React from "react";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import useEvents from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useMemo, useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { EventProject } from "@/types/crm";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CreateProjectForm from "@/components/crm/CreateProjectForm"; // Import the new form component

export default function PipelinePage() {
  const { events, updateEvent, fetchEvents } = useEvents();
  const { clients } = useClients();
  const { services } = useServices();
  const navigate = useNavigate();
  const location = useLocation();

  // refs to pipeline columns (passed down to kanban)
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [activeTab, setActiveTab] = useState("pipeline"); // State to manage active tab
  const [editingProject, setEditingProject] = useState<EventProject | null>(null);
  const [viewingProject, setViewingProject] = useState<EventProject | null>(null);

  const projects: EventProject[] = useMemo(() => {
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

  // Navigate to new project page
  const handleNewProject = () => {
    setActiveTab("new-project"); // Switch to the new project tab
  };

  // If we return from create with createdProjectId in location.state, scroll to that column
  useEffect(() => {
    const createdProjectId = (location.state as any)?.createdProjectId;
    if (!createdProjectId) return;

    // find project in list
    const created = projects.find(p => String(p.id) === String(createdProjectId));
    if (!created) {
      // maybe events haven't refreshed yet; wait and retry when projects change
      return;
    }

    const status = created.pipeline_status || "1º Contato";
    const colEl = columnRefs.current[status];
    if (colEl) {
      colEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Clean history state so refresh doesn't trigger again
    // replace state without createdProjectId
    try {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    } catch {
      // ignore
    }
    setActiveTab("pipeline"); // Switch back to pipeline view after creation
  }, [location, projects]);

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
    // ensure list is fresh
    await fetchEvents();
  };

  const handleEditProject = (project: EventProject) => {
    setEditingProject(project);
  };

  const handleViewProject = (project: EventProject) => {
    setViewingProject(project);
  };

  const handleProjectCreated = (projectId: number) => {
    // After project is created, refresh events and switch back to pipeline tab
    fetchEvents();
    setActiveTab("pipeline");
    navigate("/crm/pipeline", { state: { createdProjectId: projectId } }); // Pass ID for scrolling
  };

  const handleCancelCreate = () => {
    setActiveTab("pipeline"); // Switch back to pipeline tab
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <div>
          <Button onClick={handleNewProject}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="new-project">➕ Novo Projeto</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <PipelineKanban
            projects={projects}
            onUpdateProject={handleUpdateProject}
            onEditProject={handleEditProject}
            onViewProject={handleViewProject}
            columnRefs={columnRefs}
          />
        </TabsContent>

        <TabsContent value="new-project">
          <CreateProjectForm onCreated={handleProjectCreated} onCancel={handleCancelCreate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}