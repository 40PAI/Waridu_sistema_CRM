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
 * Load profiles from Supabase for task assignment
 * Tries to build label from available fields: full_name > name > email > id
 */
export async function loadProfiles(): Promise<ProfileOption[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .order('first_name', { ascending: true });

    if (error) throw error;

    return (data || []).map(profile => {
      // Try to build a label from available fields
      const firstName = profile.first_name || '';
      const lastName = profile.last_name || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
      
      let label = fullName || profile.email || profile.id;
      
      // If we have email and name, show both
      if (fullName && profile.email) {
        label = `${fullName} (${profile.email})`;
      } else if (!fullName && profile.email) {
        label = profile.email;
      } else if (!fullName && !profile.email) {
        // Truncate ID for display if it's all we have
        label = profile.id.length > 8 ? `${profile.id.substring(0, 8)}...` : profile.id;
      }

      return {
        id: profile.id,
        label
      };
    });
  } catch (error) {
    console.error('Error loading profiles:', error);
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
