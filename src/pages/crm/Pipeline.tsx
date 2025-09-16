const handleUpdateProject = async (updatedProject: EventProject) => {
    await updateEvent(updatedProject as Event);
  };