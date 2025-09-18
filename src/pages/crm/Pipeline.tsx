const handleUpdateProject = async (updatedProject: EventProject) => {
    const fullEvent: Event = {
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
      // Required fields that may not be in EventProject
      startTime: undefined,
      endTime: undefined,
      revenue: undefined,
      description: undefined,
      roster: undefined,
      expenses: undefined,
      follow_ups: undefined,
      updated_at: new Date().toISOString(),
    };
    await updateEvent(fullEvent);
  };