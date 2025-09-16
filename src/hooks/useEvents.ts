import { useState, useEffect, useMemo } from "react";
import { Event, Roster, Expense } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;

      const formattedEvents: Event[] = (data || []).map((event: any) => ({
        id: event.id,
        name: event.name,
        startDate: event.start_date,
        endDate: event.end_date,
        location: event.location,
        startTime: event.start_time,
        endTime: event.end_time,
        revenue: event.revenue,
        status: event.status,
        description: event.description,
        roster: event.roster,
        expenses: event.expenses,
        // CRM / project-related fields (added)
        pipeline_status: event.pipeline_status,
        estimated_value: event.estimated_value,
        service_ids: event.service_ids,
        client_id: event.client_id,
        notes: event.notes,
        tags: event.tags,
        follow_ups: event.follow_ups,
        updated_at: event.updated_at,
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar eventos.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (newEventData: Omit<Event, 'id' | 'roster' | 'expenses' | 'status'> & Partial<{
    pipeline_status: Event['pipeline_status'];
    estimated_value: number;
    service_ids: string[];
    client_id: string;
    notes: string;
    tags: string[];
    follow_ups: any[];
  }>) => {
    try {
      const insertPayload: any = {
        name: newEventData.name,
        start_date: newEventData.startDate,
        end_date: newEventData.endDate,
        location: newEventData.location,
        start_time: newEventData.startTime,
        end_time: newEventData.endTime,
        revenue: newEventData.revenue ?? null,
        description: newEventData.description ?? null,
        status: 'Planejado',
        // CRM fields
        pipeline_status: newEventData.pipeline_status ?? null,
        estimated_value: newEventData.estimated_value ?? null,
        service_ids: newEventData.service_ids ?? null,
        client_id: newEventData.client_id ?? null,
        notes: newEventData.notes ?? null,
        tags: newEventData.tags ?? null,
        follow_ups: newEventData.follow_ups ?? null,
      };

      const { error } = await supabase
        .from('events')
        .insert(insertPayload);

      if (error) throw error;

      showSuccess("Evento criado com sucesso!");
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error("Error adding event:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar evento.";
      showError(errorMessage);
    }
  };

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
          // CRM fields to persist
          pipeline_status: updatedEvent.pipeline_status ?? null,
          estimated_value: updatedEvent.estimated_value ?? null,
          service_ids: updatedEvent.service_ids ?? null,
          client_id: updatedEvent.client_id ?? null,
          notes: updatedEvent.notes ?? null,
          tags: updatedEvent.tags ?? null,
          follow_ups: updatedEvent.follow_ups ?? null,
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

  const updateEventDetails = async (eventId: number, details: { roster: Roster; expenses: Expense[] }) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          roster: details.roster,
          expenses: details.expenses,
        })
        .eq('id', eventId);

      if (error) throw error;
      
      showSuccess("Detalhes do evento atualizados!");
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error("Error updating event details:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar detalhes do evento.";
      showError(errorMessage);
    }
  };

  const upcomingEvents = useMemo(() => events.filter(e => e.status === 'Planejado' || e.status === 'Em Andamento'), [events]);
  const pastEvents = useMemo(() => events.filter(e => e.status === 'Concluído'), [events]);

  return {
    events,
    upcomingEvents,
    pastEvents,
    loading,
    error,
    addEvent,
    updateEvent,
    updateEventDetails,
    refreshEvents: fetchEvents
  };
};