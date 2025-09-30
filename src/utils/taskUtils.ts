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
 * Build profile label from available fields
 * Priority: full_name > name > email > id
 */
function profileLabel(profile: any): string {
  const firstName = profile.first_name || '';
  const lastName = profile.last_name || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const name = profile.name || '';
  
  // Try full_name first
  if (fullName) {
    return profile.email ? `${fullName} (${profile.email})` : fullName;
  }
  
  // Try name field
  if (name) {
    return profile.email ? `${name} (${profile.email})` : name;
  }
  
  // Try email
  if (profile.email) {
    return profile.email;
  }
  
  // Fallback to truncated ID
  return profile.id.length > 8 ? `${profile.id.substring(0, 8)}...` : profile.id;
}

/**
 * Load assignees based on selected event
 * - If eventId is null: returns all profiles except current user
 * - If eventId is set: returns only event_staff profiles for that event, excluding current user
 */
export async function loadAssigneesByEvent(eventId: number | null): Promise<ProfileOption[]> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    let profileIds: string[] | null = null;

    // If event is selected, get staff assigned to that event
    if (eventId !== null) {
      const { data: staffData, error: staffError } = await supabase
        .from('event_staff')
        .select('profile_id')
        .eq('event_id', eventId);

      if (staffError) throw staffError;

      profileIds = (staffData || []).map(s => s.profile_id);
      
      // If no staff assigned to event, return empty array
      if (profileIds.length === 0) {
        return [];
      }
    }

    // Build query for profiles
    let query = supabase
      .from('profiles')
      .select('id, first_name, last_name, name, email');

    // Filter by event staff if event selected
    if (profileIds !== null) {
      query = query.in('id', profileIds);
    }

    // Execute query
    const { data, error } = await query.order('first_name', { ascending: true });

    if (error) throw error;

    // Filter out current user and map to ProfileOption
    return (data || [])
      .filter(profile => profile.id !== currentUserId)
      .map(profile => ({
        id: profile.id,
        label: profileLabel(profile)
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
