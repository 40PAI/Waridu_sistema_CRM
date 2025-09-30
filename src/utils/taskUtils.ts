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
 * Priority: employee_name > name > email > id
 */
function employeeLabel(employee: any): string {
  const name = employee.employee_name ?? employee.name;
  const email = employee.employee_email ?? employee.email;
  const id = employee.employee_id ?? employee.id;
  
  if (name) {
    return email ? `${name} (${email})` : name;
  }
  
  if (email) {
    return email;
  }
  
  // Fallback to ID (truncated if too long)
  return String(id).length > 8 ? `${String(id).substring(0, 8)}...` : String(id);
}

/**
 * Load assignees (technicians) based on selected event
 * - If eventId is null: returns all active technicians from employees table
 * - If eventId is set: returns only active technicians assigned to that event (via event_technicians VIEW)
 */
export async function loadAssigneesByEvent(eventId: number | null): Promise<ProfileOption[]> {
  try {
    if (eventId) {
      // Técnicos ATIVOS escalados para o evento (via VIEW)
      const { data, error } = await supabase
        .from('event_technicians')
        .select('employee_id, employee_name, employee_email')
        .eq('event_id', eventId);
      
      if (error) throw error;
      
      return (data ?? []).map(e => ({
        id: e.employee_id,
        label: employeeLabel(e)
      }));
    }
    
    // Sem evento: todos os técnicos ATIVOS
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, email, role, status')
      .eq('role', 'technician')
      .eq('status', 'Ativo');
    
    if (error) throw error;
    
    return (data ?? []).map(e => ({
      id: e.id,
      label: employeeLabel(e)
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
