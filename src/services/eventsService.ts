import { supabase } from "@/integrations/supabase/client";
import type { Event, Roster, Expense } from "@/types";

/**
 * Minimal events service used by hooks/components.
 * - fetchEvents(): returns rows from events table
 * - upsertEvent(payload): insert or update an event row
 * - updateEventDetails(eventId, details): update roster/expenses for an event
 */

export const fetchEvents = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const upsertEvent = async (payload: any): Promise<any> => {
  // If payload contains id -> update, otherwise insert
  if (payload?.id) {
    const { data, error } = await supabase
      .from("events")
      .update(payload)
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("events")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

export const updateEventDetails = async (eventId: number, details: { roster: Roster; expenses: Expense[] }) => {
  const payload: any = {
    roster: details.roster ?? null,
    expenses: details.expenses ?? null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", eventId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export default {
  fetchEvents,
  upsertEvent,
  updateEventDetails,
};