import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import type { Event, Roster, Expense } from "@/types";

/**
 * useEvents hook
 *
 * - loads events from Supabase (mapping DB snake_case -> camelCase)
 * - provides updateEvent (full event update) and updateEventDetails (roster/expenses)
 * - returns events, loading, error and helper funcs
 */

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const mapRowToEvent = (row: any): Event => {
    return {
      id: row.id,
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date || row.start_date,
      location: row.location,
      startTime: row.start_time || undefined,
      endTime: row.end_time || undefined,
      revenue: row.revenue ?? undefined,
      status: row.status,
      description: row.description ?? undefined,
      roster: row.roster ?? undefined,
      expenses: row.expenses ?? undefined,
      // CRM fields (may be undefined)
      pipeline_status: row.pipeline_status ?? undefined,
      estimated_value: row.estimated_value ?? undefined,
      service_ids: row.service_ids ?? undefined,
      client_id: row.client_id ?? undefined,
      notes: row.notes ?? undefined,
      tags: row.tags ?? undefined,
      follow_ups: row.follow_ups ?? undefined,
      updated_at: row.updated_at ?? undefined,
      follow_ups_count: row.follow_ups_count ?? undefined,
      follow_ups_completed: row.follow_ups_completed ?? undefined,
    };
  };

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: dbErr } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });

      if (dbErr) throw dbErr;

      const mapped = (data || []).map(mapRowToEvent);
      setEvents(mapped);
    } catch (err: any) {
      console.error("Error fetching events:", err);
      const msg = err instanceof Error ? err.message : "Erro ao carregar eventos.";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    // Note: no realtime subscription here; components can refresh as needed
  }, [fetchEvents]);

  /**
   * updateEvent - persist a full event to Supabase
   * Accepts an Event (app shape) and writes snake_case columns to DB.
   */
  const updateEvent = useCallback(
    async (updatedEvent: Event) => {
      try {
        const payload: any = {
          name: updatedEvent.name,
          start_date: updatedEvent.startDate,
          end_date: updatedEvent.endDate ?? updatedEvent.startDate,
          location: updatedEvent.location ?? null,
          start_time: updatedEvent.startTime ?? null,
          end_time: updatedEvent.endTime ?? null,
          revenue: updatedEvent.revenue ?? null,
          status: updatedEvent.status,
          description: updatedEvent.description ?? null,
          // CRM fields
          pipeline_status: (updatedEvent as any).pipeline_status ?? null,
          estimated_value: (updatedEvent as any).estimated_value ?? null,
          service_ids: (updatedEvent as any).service_ids ?? null,
          client_id: (updatedEvent as any).client_id ?? null,
          notes: (updatedEvent as any).notes ?? null,
          tags: (updatedEvent as any).tags ?? null,
          follow_ups: (updatedEvent as any).follow_ups ?? null,
          updated_at: new Date().toISOString(),
        };

        const { error: updateErr } = await supabase
          .from("events")
          .update(payload)
          .eq("id", updatedEvent.id);

        if (updateErr) throw updateErr;

        showSuccess("Evento atualizado com sucesso!");
        // Optimistically refresh the list
        await fetchEvents();
        return true;
      } catch (err: any) {
        console.error("Error updating event:", err);
        const msg = err instanceof Error ? err.message : "Erro ao atualizar evento.";
        showError(msg);
        setError(msg);
        return false;
      }
    },
    [fetchEvents],
  );

  /**
   * updateEventDetails - update only roster and expenses for an event (used by roster dialog)
   */
  const updateEventDetails = useCallback(
    async (eventId: number, details: { roster: Roster; expenses: Expense[] }) => {
      try {
        const { error: updateErr } = await supabase
          .from("events")
          .update({
            roster: details.roster ?? null,
            expenses: details.expenses ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", eventId);

        if (updateErr) throw updateErr;

        showSuccess("Detalhes do evento salvos!");
        await fetchEvents();
        return true;
      } catch (err: any) {
        console.error("Error updating event details:", err);
        const msg = err instanceof Error ? err.message : "Erro ao salvar detalhes do evento.";
        showError(msg);
        setError(msg);
        return false;
      }
    },
    [fetchEvents],
  );

  // convenience map by id
  const eventsById = useMemo(() => {
    const m: Record<number, Event> = {};
    events.forEach((e) => {
      m[e.id] = e;
    });
    return m;
  }, [events]);

  return {
    events,
    eventsById,
    loading,
    error,
    fetchEvents,
    updateEvent,
    updateEventDetails,
  };
};

export default useEvents;