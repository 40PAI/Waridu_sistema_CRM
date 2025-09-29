/**
 * Event form mapping utilities for converting UI form data to database format
 */

import type { Database } from "@/utils/clientMappers";
import type { Event } from "@/types";

// Whitelist of fields allowed for events table updates
const EVENTS_UPDATE_FIELDS = [
  'name',
  'start_date', 
  'end_date',
  'start_time',
  'end_time', 
  'location',
  'notes',
  'pipeline_status',
  'service_ids',
  'estimated_value',
  'next_action_date',
  'next_action_time',
  'responsible_id',
  'roster',
  'expenses'
] as const;

/**
 * Maps form input to EventsUpdate format with whitelist validation
 * Only includes fields that exist in the database schema
 */
export function formToEventsUpdate(input: Partial<Event>): Database.EventsUpdate {
  const update: Database.EventsUpdate = {};

  // Map UI field names to database field names with type conversion
  if (input.name !== undefined) {
    update.name = input.name;
  }
  
  if (input.startDate !== undefined) {
    update.start_date = input.startDate;
  }
  
  if (input.endDate !== undefined) {
    update.end_date = input.endDate;
  }
  
  if (input.startTime !== undefined) {
    update.start_time = input.startTime;
  }
  
  if (input.endTime !== undefined) {
    update.end_time = input.endTime;
  }
  
  if (input.location !== undefined) {
    update.location = input.location;
  }
  
  if (input.notes !== undefined) {
    update.notes = input.notes;
  }
  
  if (input.pipeline_status !== undefined) {
    update.pipeline_status = input.pipeline_status;
  }
  
  if (input.service_ids !== undefined) {
    // Convert string[] to number[] as required by database
    update.service_ids = input.service_ids?.map(id => parseInt(id, 10)) || null;
  }
  
  if (input.estimated_value !== undefined) {
    update.estimated_value = input.estimated_value;
  }
  
  if (input.next_action_date !== undefined) {
    update.next_action_date = input.next_action_date;
  }
  
  // next_action_time is only in database, not in Event interface
  // Will be handled separately in RosterDialog or other components
  
  if (input.responsible_id !== undefined) {
    update.responsible_id = input.responsible_id;
  }
  
  if (input.roster !== undefined) {
    update.roster = input.roster;
  }
  
  if (input.expenses !== undefined) {
    update.expenses = input.expenses;
  }

  // Map revenue field (UI) to estimated_value (DB) if not already set
  if (input.revenue !== undefined && update.estimated_value === undefined) {
    update.estimated_value = input.revenue;
  }

  // Only return fields that are whitelisted and defined
  const filteredUpdate: Database.EventsUpdate = {};
  
  for (const [key, value] of Object.entries(update)) {
    if (EVENTS_UPDATE_FIELDS.includes(key as any) && value !== undefined) {
      (filteredUpdate as any)[key] = value;
    }
  }

  return filteredUpdate;
}

/**
 * Maps database event row to UI Event format
 */
export function eventsRowToEvent(row: Database.EventsRow): Event {
  return {
    id: row.id,
    name: row.name || '',
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location || '',
    revenue: row.estimated_value || undefined,
    status: (row.status as any) || 'Planejado',
    description: row.description || undefined,
    roster: row.roster || undefined,
    expenses: row.expenses || undefined,
    pipeline_status: (row.pipeline_status as any) || undefined,
    estimated_value: row.estimated_value || undefined,
    service_ids: row.service_ids?.map(id => String(id)) || undefined,
    client_id: row.client_id || undefined,
    notes: row.notes || undefined,
    tags: row.tags || undefined,
    responsible_id: row.responsible_id || undefined,
    next_action_date: row.next_action_date || undefined,
    updated_at: row.updated_at || undefined,
    pipeline_phase_id: row.pipeline_phase_id || undefined,
    pipeline_phase_label: row.pipeline_phase_label || undefined,
    pipeline_rank: row.pipeline_rank || undefined,
  };
}