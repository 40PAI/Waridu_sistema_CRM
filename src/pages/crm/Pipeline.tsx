"use client";

import * as React from "react";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { showError } from "@/utils/toast";
import { PipelineKanban } from "@/components/crm/PipelineKanban";

const PipelinePage = () => {
  const { events, updateEvent } = useEvents();
  const { clients } = useClients();
  const { services } = useServices();

  // Filtrar apenas projetos com pipeline_status definido
  const projects = React.useMemo(() => {
    return events.filter(event => !!event.pipeline_status).map(event => ({
      id: event.id,
      name: event.name,
      client_id: event.client_id,
      pipeline_status: event.pipeline_status as '1º Contato' | 'Orçamento' | 'Negociação' | 'Confirmado',
      service_ids: event.service_ids || [],
      estimated_value: event.estimated_value,
      startDate: event.startDate,
      tags: event.tags || [],
      follow_ups: (event as any).follow_ups || [], // cast to any to avoid TS error
      notes: event.notes || "",
      // Provide required fields for Event type
      endDate: event.endDate || event.startDate,
      location: event.location || "",
      status: event.status || "Planejado",
    }));
  }, [events]);

  const handleUpdateProject = async (updatedProject: Partial<typeof projects[0]> & { id: number }) => {
    try {
      // Ensure required fields exist before update
      const fullProject = {
        ...updatedProject,
        endDate: updatedProject.endDate || updatedProject.startDate || "",
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