import { useState, useEffect } from "react";
import { Event, Roster, Expense } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
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
        expenses: event.expenses
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      showError("Erro ao carregar eventos.");
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (newEventData: Omit<Event, 'id' | 'roster' | 'expenses' | 'status'>) => {
    try {
      const { error } = await supabase
        .from('events')
        .insert({
          name: newEventData.name,
          start_date: newEventData.startDate,
          end_date: newEventData.endDate,
          location: newEventData.location,
          start_time: newEventData.startTime,
          end_time: newEventData.endTime,
          revenue: newEventData.revenue,
          description: newEventData.description,
          status: 'Planejado'
        });

      if (error) throw error;

      showSuccess("Evento criado com sucesso!");
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error("Error adding event:", error);
      showError("Erro ao criar evento.");
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
          revenue: updatedEvent.revenue,
          status: updatedEvent.status,
          description: updatedEvent.description
        })
        .eq('id', updatedEvent.id);

      if (error) throw error;

      showSuccess("Evento atualizado com sucesso!");
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error("Error updating event:", error);
      showError("Erro ao atualizar evento.");
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
      showError("Erro ao salvar detalhes do evento.");
    }
  };

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    updateEventDetails,
    refreshEvents: fetchEvents
  };
};