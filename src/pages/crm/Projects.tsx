import { PipelineKanban } from "@/components/crm/PipelineKanban";
import { useEvents } from "@/hooks/useEvents";
import type { EventProject } from "@/types/crm";

export default function ProjectsPage() {
  const { events, updateEvent } = useEvents();

  const projects: EventProject[] = events
    .filter((e) => !!e.pipeline_status)
    .map((e) => ({
      id: e.id,
      name: e.name ?? `Evento ${e.id}`,
      client_id: e.client_id,
      pipeline_status: e.pipeline_status as EventProject['pipeline_status'],
      service_ids: e.service_ids ?? [],
      estimated_value: e.estimated_value,
      startDate: e.startDate,
      endDate: e.endDate ?? e.startDate,
      location: e.location ?? "",
      status: e.status ?? "Planejado",
      tags: e.tags ?? [],
      notes: e.notes ?? "",
    }));

  const handleUpdateProject = async (updatedProject: EventProject) => {
    await updateEvent(updatedProject as any);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Projetos</h1>
      <PipelineKanban
        projects={projects}
        onUpdateProject={handleUpdateProject}
      />
    </div>
  );
}