"use client";

import * as React from "react";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { showError } from "@/utils/toast";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import type { EventStatus } from "@/types";

interface Project {
  id: number;
  name: string;
  client_id?: string;
  pipeline_status: '1º Contato' | 'Orçamento' | 'Negociação' | 'Confirmado';
  service_ids: string[];
  estimated_value?: number;
  startDate: string;
  endDate: string;
  location: string;
  status: EventStatus;
  tags?: string[];
  follow_ups?: any[];
  notes?: string;
}

const PipelinePage = () => {
  const { events, updateEvent } = useEvents();
  const { clients } = useClients();
  const { services } = useServices();

  // Filtrar apenas projetos com pipeline_status definido
  const projects: Project[] = React.useMemo(() => {
    return events.filter(event => !!event.pipeline_status).map(event => ({
      id: event.id,
      name: event.name!, // name is required
      client_id: event.client_id,
      pipeline_status: event.pipeline_status as Project['pipeline_status'],
      service_ids: event.service_ids || [],
      estimated_value: event.estimated_value,
      startDate: event.startDate,
      endDate: event.endDate || event.startDate,
      location: event.location || "",
      status: (event.status as EventStatus) || "Planejado",
      tags: event.tags || [],
      follow_ups: (event as any).follow_ups || [],
      notes: event.notes || "",
    }));
  }, [events]);

  const handleUpdateProject = async (updatedProject: Project) => {
    try {
      // Ensure required fields exist before update
      const fullProject: Project = {
        ...updatedProject,
        name: updatedProject.name!,
        endDate: updatedProject.endDate || updatedProject.startDate,
        location: updatedProject.location || "",
        status: updatedProject.status || "Planejado",
      };
      await updateEvent(fullProject);
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      showError("Erro ao atualizar status do projeto.");
    }
  };

  return (
    <div className="p-4">
      <PipelineKanban 
        projects={projects} 
        onUpdateProject={handleUpdateProject} 
        clients={clients} 
        services={services} 
      />
    </div>
  );
};

export default PipelinePage;