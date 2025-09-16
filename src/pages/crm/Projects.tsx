"use client";

import * as React from "react";
import { useEvents } from "@/hooks/useEvents";
import { showError } from "@/utils/toast";
import { PipelineKanban } from "@/components/crm/PipelineKanban";

const ProjectsPage = () => {
  const { events, updateEvent } = useEvents();

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
    }));
  }, [events]);

  const handleUpdateProject = async (updatedProject: Partial<typeof projects[0]> & { id: number }) => {
    try {
      await updateEvent({
        id: updatedProject.id,
        pipeline_status: updatedProject.pipeline_status,
      });
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      showError("Erro ao atualizar status do projeto.");
    }
  };

  return (
    <div className="p-4">
      <PipelineKanban projects={projects} onUpdateProject={handleUpdateProject} />
    </div>
  );
};

export default ProjectsPage;