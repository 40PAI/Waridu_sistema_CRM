import { useCallback, useEffect, useMemo, useState } from "react";
import { showError, showSuccess } from "@/utils/toast";
import type { Event, Roster, Expense } from "@/types";
import { eventsService } from "@/services";
import { useServerState, useMutationWithInvalidation } from "./useServerState";

/**
 * useEvents hook - refactored to use react-query via useServerState and mutation helper.
 *
 * - events are fetched through useServerState with query key ['events']
 * - updateEvent and updateEventDetails use useMutationWithInvalidation to ensure queries are invalidated/refetched
 */

export const useEvents = () => {
  // Use useServerState to fetch events with a standardized query key
  const eventsQuery = useServerState<Event[]>(
    ["events"],
    async () => {
      const data = await eventsService.fetchEvents();
      // map server rows -> Event shape if needed (eventsService already provides rows)
      return (data || []).map((row: any) => ({
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
        pipeline_status: row.pipeline_status ?? undefined,
        estimated_value: row.estimated_value ?? undefined,
        service_ids: row.service_ids ?? undefined,
        client_id: row.client_id ?? undefined,
        notes: row.notes ?? undefined,
        tags: row.tags ?? undefined,
        follow_ups: row.follow_ups ?? undefined,
        responsible_id: row.responsible_id ?? undefined,
        next_action: row.next_action ?? undefined,
        next_action_date: row.next_action_date ?? undefined,
        updated_at: row.updated_at ?? undefined,
        pipeline_phase_id: row.pipeline_phase_id ?? undefined, // Added pipeline_phase_id
      })) as Event[];
    },
    { enabled: true, keepPreviousData: false }
  );

  // mutation for upsert event - invalidates 'events'
  const upsertMutation = useMutationWithInvalidation(
    async (payload: any) => {
      const result = await eventsService.upsertEvent(payload);
      return result;
    },
    ["events"]
  );

  const updateDetailsMutation = useMutationWithInvalidation(
    async ({ eventId, details }: { eventId: number; details: { roster: Roster; expenses: Expense[] } }) => {
      const res = await eventsService.updateEventDetails(eventId, details);
      return res;
    },
    ["events"]
  );

  // Expose convenient wrappers
  const updateEvent = useCallback(
    async (updatedEvent: Event | any) => {
      // Build payload in snake_case to pass down to service
      const payload: any = { ...updatedEvent };
      // call mutateAndInvalidate
      const result = await upsertMutation.mutateAndInvalidate(payload);
      return result;
    },
    [upsertMutation]
  );

  const updateEventDetails = useCallback(
    async (eventId: number, details: { roster: Roster; expenses: Expense[] }) => {
      const result = await updateDetailsMutation.mutateAndInvalidate({ eventId, details });
      return result;
    },
    [updateDetailsMutation]
  );

  const events = eventsQuery.data ?? [];

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
    loading: eventsQuery.isLoading,
    error: eventsQuery.isError ? (eventsQuery.error as Error) : null,
    fetchEvents: () => eventsQuery.refetch(),
    updateEvent,
    updateEventDetails,
  };
};

export default useEvents;