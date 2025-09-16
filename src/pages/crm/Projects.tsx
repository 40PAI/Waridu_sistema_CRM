"use client";

import * as React from "react";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { showError } from "@/utils/toast";
import { PipelineKanban } from "@/components/crm/PipelineKanban";

const ProjectsPage = () => {
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
      follow_ups: event.follow_ups || [],
      notes: event.notes || "",
    }));
  }, [events]);

  const handleUpdateProject = async (updatedProject: Partial<typeof projects[0]> & { id: number }) => {
    try {
      await updateEvent(updatedProject);
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

export default ProjectsPage;