/**
 * Database Mappers, Zod Schema, and Utilities
 * 
 * This file provides type-safe mapping between UI forms and Supabase database
 * for clients and events tables, along with validation schemas and utility functions.
 */

import { z } from "zod";

// =============================================================================
// DATABASE TYPES (Generated from actual Supabase schema)
// =============================================================================

/**
 * Database schema types for the clients table
 * Based on exact DDL provided - ONLY these fields exist in database
 */
export namespace Database {
  export interface ClientsRow {
    id: string;
    name: string;
    nif: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
    created_at: string | null;
    updated_at: string | null;
    lifecycle_stage: string | null;
    sector: string | null;
    company: string | null;
    job_title: string | null;
  }

  export interface ClientsInsert {
    id?: string;
    name: string;
    nif?: string | null;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    lifecycle_stage?: string | null;
    sector?: string | null;
    company?: string | null;
    job_title?: string | null;
  }

  export interface ClientsUpdate {
    id?: string;
    name?: string;
    nif?: string | null;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    lifecycle_stage?: string | null;
    sector?: string | null;
    company?: string | null;
    job_title?: string | null;
  }

  // Events table types based on actual database schema
  export interface EventsRow {
    id: number;
    name: string | null;
    start_date: string | null; // timestamp with time zone
    end_date: string | null; // timestamp with time zone
    location: string | null;
    start_time: string | null;
    end_time: string | null;
    revenue: number | null; // numeric
    status: string | null;
    description: string | null; // text
    roster: any; // jsonb
    expenses: any; // jsonb
    pipeline_status: string | null;
    estimated_value: number | null; // numeric
    service_ids: number[] | null; // integer array
    client_id: string | null; // uuid
    notes: string | null; // text
    pipeline_phase_id: string | null; // uuid
    pipeline_phase_label: string | null;
    pipeline_rank: number | null; // integer
    tags: string[] | null; // varchar array
    created_at: string | null; // timestamp with time zone
    updated_at: string | null; // timestamp with time zone
    next_action_date: string | null; // timestamp with time zone
  }

  export interface EventsInsert {
    id?: number;
    name?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    location?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    revenue?: number | null;
    status?: string | null;
    description?: string | null;
    roster?: any;
    expenses?: any;
    pipeline_status?: string | null;
    estimated_value?: number | null;
    service_ids?: number[] | null;
    client_id?: string | null;
    notes?: string | null;
    pipeline_phase_id?: string | null;
    pipeline_phase_label?: string | null;
    pipeline_rank?: number | null;
    tags?: string[] | null;
    created_at?: string | null;
    updated_at?: string | null;
    next_action_date?: string | null;
  }

  export interface EventsUpdate {
    id?: number;
    name?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    location?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    revenue?: number | null;
    status?: string | null;
    description?: string | null;
    roster?: any;
    expenses?: any;
    pipeline_status?: string | null;
    estimated_value?: number | null;
    service_ids?: number[] | null;
    client_id?: string | null;
    notes?: string | null;
    pipeline_phase_id?: string | null;
    pipeline_phase_label?: string | null;
    pipeline_rank?: number | null;
    tags?: string[] | null;
    created_at?: string | null;
    updated_at?: string | null;
    next_action_date?: string | null;
  }
}

// =============================================================================
// UI FORM TYPES
// =============================================================================

/**
 * Form data type for the "Novo Cliente" UI form
 * Maps to user interface fields, may contain fields not in database
 */
export interface NewClientForm {
  fullName: string;
  company?: string;
  email?: string;
  phone?: string;
  nif?: string;
  sector?: string;
  lifecycleStage?: 'Lead' | 'Oportunidade' | 'Cliente Ativo' | 'Cliente Perdido';
  roleOrDepartment?: string; // UI-only field, not stored in database
  notes?: string;
}

/**
 * Form data type for the "Novo Projeto" UI form
 * Maps to user interface fields, may contain fields not in database
 */
export interface NewProjectForm {
  fullName: string; // Maps to 'name' in database
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  nextActionDate?: string; // Maps to 'next_action_date' in database
  nextActionTime?: string; // ⚠️ WARNING: This field does NOT exist in database
  location: string;
  estimatedValue?: number;
  clientId: string; // Maps to 'client_id' in database
  services: string[]; // Maps to 'service_ids' in database (note: array of strings, but DB expects integer[])
  notes?: string;
  pipelineStatus: string; // Maps to 'pipeline_status' in database
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for validating client inserts
 * Aligns with database constraints and check constraints from DDL
 */
export const ClientsInsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  nif: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  created_at: z.string().datetime().optional().nullable(),
  updated_at: z.string().datetime().optional().nullable(),
  // Database constraint: lifecycle_stage check constraint
  lifecycle_stage: z.enum(['Lead', 'Oportunidade', 'Cliente Ativo', 'Cliente Perdido'])
    .optional()
    .nullable()
    .default('Lead'),
  sector: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  job_title: z.string().optional().nullable(),
});

/**
 * Zod schema for validating the UI form data
 */
export const NewClientFormSchema = z.object({
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  company: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  nif: z.string().optional(),
  sector: z.string().optional(),
  lifecycleStage: z.enum(['Lead', 'Oportunidade', 'Cliente Ativo', 'Cliente Perdido']).optional(),
  roleOrDepartment: z.string().optional(), // UI-only field
  notes: z.string().optional(),
});

/**
 * Zod schema for validating events inserts
 * Aligns with database constraints and check constraints from DDL
 */
export const EventsInsertSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional().nullable(),
  start_date: z.string().datetime().optional().nullable(),
  end_date: z.string().datetime().optional().nullable(),
  location: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  revenue: z.number().optional().nullable(),
  status: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  roster: z.any().optional(),
  expenses: z.any().optional(),
  pipeline_status: z.string().optional().nullable(),
  estimated_value: z.number().min(0, "Valor estimado deve ser positivo").optional().nullable(),
  service_ids: z.array(z.number()).optional().nullable(),
  client_id: z.string().uuid("Client ID deve ser um UUID válido").optional().nullable(),
  notes: z.string().optional().nullable(),
  pipeline_phase_id: z.string().uuid().optional().nullable(),
  pipeline_phase_label: z.string().optional().nullable(),
  pipeline_rank: z.number().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  created_at: z.string().datetime().optional().nullable(),
  updated_at: z.string().datetime().optional().nullable(),
  next_action_date: z.string().datetime().optional().nullable(),
});

/**
 * Zod schema for validating the UI project form data
 */
export const NewProjectFormSchema = z.object({
  fullName: z.string().min(1, "Nome do projeto é obrigatório"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  nextActionDate: z.string().optional(),
  nextActionTime: z.string().optional(), // UI-only field - does NOT exist in database
  location: z.string().min(1, "Localização é obrigatória"),
  estimatedValue: z.number().min(0, "Valor estimado deve ser positivo").optional(),
  clientId: z.string().uuid("Client ID deve ser um UUID válido"),
  services: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
  notes: z.string().optional(),
  pipelineStatus: z.string().min(1, "Status do pipeline é obrigatório"),
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Removes undefined values from an object, keeping null values
 * Useful for cleaning form data before database operations
 */
export function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  const cleaned: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (cleaned as any)[key] = value;
    }
  }
  return cleaned;
}

/**
 * Normalizes phone number by keeping only digits
 * Removes spaces, dashes, parentheses, and other formatting
 */
export function normalizePhone(phone: string | undefined | null): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const normalized = phone.replace(/\D/g, ''); // Keep only digits
  return normalized.length > 0 ? normalized : null;
}

/**
 * Converts date string and time string to ISO datetime
 * Used for combining separate date/time inputs into database timestamp
 */
export function combineDateTime(dateStr: string, timeStr?: string): string {
  if (!dateStr) {
    throw new Error("Data é obrigatória");
  }
  
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm, ss] = (timeStr || "00:00:00").split(":").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d, hh || 0, mm || 0, ss || 0)).toISOString();
}

// =============================================================================
// UI → DATABASE MAPPERS
// =============================================================================

/**
 * Maps UI form data to database insert format
 * Applies whitelist pattern - only known database fields are included
 * 
 * @param input Form data from the UI
 * @returns Database insert object ready for Supabase
 */
export function formToClientsInsert(input: NewClientForm): Database.ClientsInsert {
  // Apply data transformations
  const normalizedPhone = normalizePhone(input.phone);
  
  // Map UI fields to database fields (whitelist approach - only DDL-approved fields)
  const dbPayload: Partial<Database.ClientsInsert> = {
    name: input.fullName, // Map fullName → name
    lifecycle_stage: input.lifecycleStage || 'Lead', // Default to 'Lead' if empty
  };

  // Only add optional fields if they have meaningful values (DDL fields only)
  if (input.company) dbPayload.company = input.company;
  if (input.email) dbPayload.email = input.email;
  if (normalizedPhone) dbPayload.phone = normalizedPhone;
  if (input.nif) dbPayload.nif = input.nif;
  if (input.sector) dbPayload.sector = input.sector;
  if (input.notes) dbPayload.notes = input.notes;
  if (input.roleOrDepartment) dbPayload.job_title = input.roleOrDepartment;
  // NOTE: created_at/updated_at are NOT included (handled by database defaults)
  // NOTE: Only fields from DDL are included

  return dbPayload as Database.ClientsInsert;
}

/**
 * Maps UI project form data to database events insert format
 * Applies whitelist pattern - only known database fields are included
 * 
 * @param input Form data from the "Novo Projeto" UI
 * @returns Database insert object ready for Supabase events table
 */
export function formToEventsInsert(input: NewProjectForm): Database.EventsInsert {
  // Validate required fields
  if (!input.fullName) {
    throw new Error("Nome do projeto é obrigatório");
  }
  if (!input.startDate) {
    throw new Error("Data de início é obrigatória");
  }
  if (!input.clientId) {
    throw new Error("Cliente é obrigatório");
  }
  if (!input.location) {
    throw new Error("Localização é obrigatória");
  }

  // Convert date/time combinations to ISO timestamps
  const start_date = combineDateTime(input.startDate, input.startTime);
  const end_date = input.endDate ? combineDateTime(input.endDate, input.endTime) : start_date;
  
  // Convert next action date if provided
  const next_action_date = input.nextActionDate ? combineDateTime(input.nextActionDate) : null;
  
  // Convert services array from strings to numbers (database expects integer[])
  const service_ids = input.services.map(serviceId => {
    const numericId = parseInt(serviceId, 10);
    if (isNaN(numericId)) {
      throw new Error(`Service ID inválido: ${serviceId}. Deve ser um número.`);
    }
    return numericId;
  });

  // Map UI fields to database fields (whitelist approach - only DDL-approved fields)
  const dbPayload: Partial<Database.EventsInsert> = {
    name: input.fullName, // Map fullName → name
    start_date: start_date,
    end_date: end_date,
    location: input.location,
    client_id: input.clientId, // Map clientId → client_id
    service_ids: service_ids, // Map services → service_ids (converted to integers)
    pipeline_status: input.pipelineStatus, // Map pipelineStatus → pipeline_status
    status: 'Planejado', // Default status for new projects
    updated_at: new Date().toISOString(),
  };

  // Only add optional fields if they have meaningful values (DDL fields only)
  if (input.startTime !== undefined) dbPayload.start_time = `${input.startTime}:00`; // Map startTime → start_time (include empty strings)
  if (input.endTime !== undefined) dbPayload.end_time = `${input.endTime}:00`; // Map endTime → end_time (include empty strings)
  if (input.estimatedValue !== undefined) dbPayload.estimated_value = input.estimatedValue; // Map estimatedValue → estimated_value
  if (input.notes !== undefined) dbPayload.notes = input.notes; // Map notes → notes (include empty strings)
  dbPayload.next_action_date = next_action_date; // Always include next_action_date (null or timestamp)
  
  // NOTE: nextActionTime field does NOT exist in database - it's ignored
  // NOTE: created_at is handled by database defaults
  // NOTE: Only fields from DDL are included

  return dbPayload as Database.EventsInsert;
}

/**
 * Maps UI form data to database update format
 * Similar to insert but allows partial updates
 */
export function formToClientsUpdate(input: Partial<NewClientForm>): Database.ClientsUpdate {
  const normalizedPhone = input.phone ? normalizePhone(input.phone) : undefined;
  
  const dbPayload: Database.ClientsUpdate = {};
  
  // Only include fields that are present in the input (DDL fields only)
  if (input.fullName !== undefined) dbPayload.name = input.fullName;
  if (input.company !== undefined) dbPayload.company = input.company || null;
  if (input.email !== undefined) dbPayload.email = input.email || null;
  if (input.phone !== undefined) dbPayload.phone = normalizedPhone;
  if (input.nif !== undefined) dbPayload.nif = input.nif || null;
  if (input.sector !== undefined) dbPayload.sector = input.sector || null;
  if (input.lifecycleStage !== undefined) dbPayload.lifecycle_stage = input.lifecycleStage || null;
  if (input.notes !== undefined) dbPayload.notes = input.notes || null;
  if (input.roleOrDepartment !== undefined) dbPayload.job_title = input.roleOrDepartment || null;

  // NOTE: Only DDL-approved fields are included
  return stripUndefined(dbPayload);
}

// =============================================================================
// DATABASE → UI MAPPERS
// =============================================================================

/**
 * Maps database row to UI form format
 * Useful for populating edit forms with existing data
 * 
 * @param row Database row from Supabase
 * @returns Form data ready for UI consumption
 */
export function clientRowToForm(row: Database.ClientsRow): NewClientForm {
  return {
    fullName: row.name, // Map name → fullName
    company: row.company || undefined,
    email: row.email || undefined,
    phone: row.phone || undefined,
    nif: row.nif || undefined,
    sector: row.sector || undefined,
    lifecycleStage: (row.lifecycle_stage as NewClientForm['lifecycleStage']) || undefined,
    notes: row.notes || undefined,
    roleOrDepartment: row.job_title || undefined, // Map job_title → roleOrDepartment
  };
}

// =============================================================================
// SUPABASE USAGE EXAMPLES
// =============================================================================

/**
 * Example usage with Supabase client
 * 
 * // Insert new client
 * const formData: NewClientForm = { fullName: "João Silva", company: "TechCorp" };
 * const insertPayload = formToClientsInsert(formData);
 * const { data, error } = await supabase
 *   .from('clients')
 *   .insert(insertPayload)
 *   .select()
 *   .single();
 * 
 * // Upsert client (insert or update)
 * const { data, error } = await supabase
 *   .from('clients')
 *   .upsert(insertPayload, { onConflict: 'id' })
 *   .select()
 *   .single();
 * 
 * // Update existing client
 * const updatePayload = formToClientsUpdate({ fullName: "João Santos" });
 * const { data, error } = await supabase
 *   .from('clients')
 *   .update(updatePayload)
 *   .eq('id', clientId)
 *   .select()
 *   .single();
 * 
 * // Load client for editing
 * const { data: client } = await supabase
 *   .from('clients')
 *   .select('*')
 *   .eq('id', clientId)
 *   .single();
 * 
 * if (client) {
 *   const formData = clientRowToForm(client);
 *   // Use formData to populate edit form
 * }
 */

// Export types for external use
export type ClientsInsert = Database.ClientsInsert;
export type ClientsRow = Database.ClientsRow;
export type ClientsUpdate = Database.ClientsUpdate;