/**
 * Pure utility functions for task management with Supabase
 */

import { supabase } from "@/integrations/supabase/client";

export interface ProfileOption {
  id: string;
  label: string;
}

export interface EventOption {
  id: number;
  name: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assigned_to: string;
  event_id?: number | null;
}

/**
 * Build employee label from available fields
 * Priority: name > email > id
 */
function employeeLabel(employee: any): string {
  if (employee.name) {
    return employee.email ? `${employee.name} (${employee.email})` : employee.name;
  }
  
  if (employee.email) {
    return employee.email;
  }
  
  // Fallback to truncated ID
  return employee.id.length > 8 ? `${employee.id.substring(0, 8)}...` : employee.id;
}

/**
 * Load assignees (technicians) based on selected event
 * - If eventId is null: returns all active technicians from employees table
 * - If eventId is set: returns only active technicians assigned to that event (via roster.teamMembers)
 */
export async function loadAssigneesByEvent(eventId: number | null): Promise<ProfileOption[]> {
  try {
    let employeeIds: string[] | null = null;

    // If event is selected, get technicians assigned to that event from roster
    if (eventId !== null) {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('roster')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Extract employee IDs from roster.teamMembers
      const teamMembers = eventData?.roster?.teamMembers || [];
      employeeIds = teamMembers.map((m: any) => m.id);
      
      // If no team members assigned to event, return empty array
      if (employeeIds.length === 0) {
        return [];
      }
    }

    // Build query for employees
    let query = supabase
      .from('employees')
      .select('id, name, email')
      .eq('role', 'Técnico')
      .eq('status', 'Ativo');

    // Filter by event team members if event selected
    if (employeeIds !== null) {
      query = query.in('id', employeeIds);
    }

    // Execute query
    const { data, error } = await query.order('name', { ascending: true });

    if (error) throw error;

    // Map to ProfileOption
    return (data || []).map(employee => ({
      id: employee.id,
      label: employeeLabel(employee)
    }));
  } catch (error) {
    console.error('Error loading assignees by event:', error);
    throw error;
  }
}

/**
 * Load events from Supabase for task association
 * Returns events with id and name (if available)
 */
export async function loadEvents(): Promise<EventOption[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id, name')
      .order('start_date', { ascending: false })
      .limit(100);

    if (error) throw error;

    return (data || []).map(event => ({
      id: event.id,
      name: event.name || `Evento #${event.id}`
    }));
  } catch (error) {
    console.error('Error loading events:', error);
    throw error;
  }
}

/**
 * Create a new task in Supabase
 * Does NOT send created_by - the trigger fills it automatically
 */
export async function createTask(payload: CreateTaskPayload): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: payload.title,
        description: payload.description || null,
        assigned_to: payload.assigned_to,
        event_id: payload.event_id || null,
        done: false
      })
      .select()
      .single();

    if (error) {
      // Enhanced error handling
      if (error.code === 'PGRST301' || error.code === '42501') {
        throw new Error('SEM_PERMISSAO');
      }
      if (error.code === '23503') {
        throw new Error('SELECAO_INVALIDA');
      }
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error creating task:', error);
    throw error;
  }
}
