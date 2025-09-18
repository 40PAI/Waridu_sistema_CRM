const updateEvent = async (updatedEvent: Event) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          name: updatedEvent.name,
          start_date: updatedEvent.startDate,
          end_date: updatedEvent.endDate,
          location: updatedEvent.location,
          start_time: updatedEvent.startTime,
          end_time: updatedEvent.endTime,
          revenue: updatedEvent.revenue ?? null,
          status: updatedEvent.status,
          description: updatedEvent.description ?? null,
          // CRM fields
          pipeline_status: updatedEvent.pipeline_status ?? null,
          estimated_value: updatedEvent.estimated_value ?? null,
          service_ids: updatedEvent.service_ids ?? null,
          client_id: updatedEvent.client_id ?? null,
          notes: updatedEvent.notes ?? null,
          tags: updatedEvent.tags ?? null,
          follow_ups: updatedEvent.follow_ups ?? null,
          updated_at: new Date().toISOString(), // Always update timestamp
        })
        .eq('id', updatedEvent.id);

      if (error) throw error;

      showSuccess("Evento atualizado com sucesso!");
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error("Error updating event:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar evento.";
      showError(errorMessage);
    }
  };