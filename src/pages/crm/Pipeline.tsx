import * as React from "react";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import useEvents from "@/hooks/useEvents";
import type { EventProject } from "@/types/crm";
import type { Event } from "@/types";

/**
 * Pipeline page - renders the kanban and persists pipeline status changes via useEvents.updateEvent
 */
export default function PipelinePage() {
  const { events, updateEvent, loading } = useEvents();

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
    // Map EventProject back to app Event shape and call updateEvent to persist pipeline_status and other fields
    const fullEvent: Event = {
      id: updatedProject.id,
      name: updatedProject.name,
      startDate: updatedProject.startDate,
      endDate: updatedProject.endDate,
      location: updatedProject.location,
      status: updatedProject.status as any,
      // keep CRM fields
      pipeline_status: updatedProject.pipeline_status as any,
      estimated_value: updatedProject.estimated_value,
      service_ids: updatedProject.service_ids,
      client_id: updatedProject.client_id,
      notes: updatedProject.notes,
      tags: updatedProject.tags,
      // other optional fields left undefined
      startTime: undefined,
      endTime: undefined,
      revenue: undefined,
      description: undefined,
      roster: undefined,
      expenses: undefined,
      follow_ups: undefined,
      updated_at: new Date().toISOString(),
    } as Event;

    await updateEvent(fullEvent);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pipeline</h1>
      {loading ? <p>Carregando...</p> : <PipelineKanban projects={projects} onUpdateProject={handleUpdateProject} />}
    </div>
  );
}