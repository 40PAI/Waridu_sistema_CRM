/**
 * Client Database Mappers, Zod Schema, and Utilities
 * 
 * This file provides type-safe mapping between UI forms and Supabase database
 * for the clients table, along with validation schemas and utility functions.
 */

import { z } from "zod";

// =============================================================================
// DATABASE TYPES (Generated from actual Supabase schema)
// =============================================================================

/**
 * Database schema types for the clients table
 * Based on current Supabase PostgreSQL schema
 */
export namespace Database {
  export interface ClientsRow {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    company: string | null;
    contact_person: string | null;
    notes: string | null;
    created_at: string | null;
    updated_at: string | null;
    nif: string | null;
    lifecycle_stage: string | null;
    sector: string | null;
    persona: string | null;
    position: string | null;
  }

  export interface ClientsInsert {
    id?: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    company?: string | null;
    contact_person?: string | null;
    notes?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    nif?: string | null;
    lifecycle_stage?: string | null;
    sector?: string | null;
    persona?: string | null;
    position?: string | null;
  }

  export interface ClientsUpdate {
    id?: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    company?: string | null;
    contact_person?: string | null;
    notes?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    nif?: string | null;
    lifecycle_stage?: string | null;
    sector?: string | null;
    persona?: string | null;
    position?: string | null;
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

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for validating client inserts
 * Aligns with database constraints and check constraints
 */
export const ClientsInsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  email: z.string().email("Email inválido").max(255, "Email muito longo").optional().nullable(),
  phone: z.string().max(50, "Telefone muito longo").optional().nullable(),
  address: z.string().max(500, "Endereço muito longo").optional().nullable(),
  company: z.string().max(255, "Nome da empresa muito longo").optional().nullable(),
  contact_person: z.string().max(255, "Nome do contacto muito longo").optional().nullable(),
  notes: z.string().optional().nullable(),
  created_at: z.string().datetime().optional().nullable(),
  updated_at: z.string().datetime().optional().nullable(),
  nif: z.string().max(50, "NIF muito longo").optional().nullable(),
  // Database constraint: lifecycle_stage check constraint
  lifecycle_stage: z.enum(['Lead', 'Oportunidade', 'Cliente Ativo', 'Cliente Perdido'])
    .default('Lead')
    .optional()
    .nullable(),
  sector: z.string().max(255, "Setor muito longo").optional().nullable(),
  persona: z.string().max(255, "Persona muito longa").optional().nullable(),
  position: z.string().max(255, "Cargo muito longo").optional().nullable(),
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

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Removes undefined values from an object, keeping null values
 * Useful for cleaning form data before database operations
 */
export function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
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
  
  // Map UI fields to database fields (whitelist approach)
  const dbPayload: Database.ClientsInsert = {
    name: input.fullName, // Map fullName → name
    company: input.company || null,
    email: input.email || null,
    phone: normalizedPhone,
    nif: input.nif || null,
    sector: input.sector || null,
    lifecycle_stage: input.lifecycleStage || 'Lead', // Default to 'Lead' if empty
    notes: input.notes || null,
    // NOTE: roleOrDepartment is intentionally NOT included (UI-only field)
    // NOTE: created_at/updated_at are NOT included (handled by database)
  };

  // Remove undefined values while keeping null values
  return stripUndefined(dbPayload);
}

/**
 * Maps UI form data to database update format
 * Similar to insert but allows partial updates
 */
export function formToClientsUpdate(input: Partial<NewClientForm>): Database.ClientsUpdate {
  const normalizedPhone = input.phone ? normalizePhone(input.phone) : undefined;
  
  const dbPayload: Database.ClientsUpdate = {};
  
  // Only include fields that are present in the input
  if (input.fullName !== undefined) dbPayload.name = input.fullName;
  if (input.company !== undefined) dbPayload.company = input.company || null;
  if (input.email !== undefined) dbPayload.email = input.email || null;
  if (input.phone !== undefined) dbPayload.phone = normalizedPhone;
  if (input.nif !== undefined) dbPayload.nif = input.nif || null;
  if (input.sector !== undefined) dbPayload.sector = input.sector || null;
  if (input.lifecycleStage !== undefined) dbPayload.lifecycle_stage = input.lifecycleStage || null;
  if (input.notes !== undefined) dbPayload.notes = input.notes || null;

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
    // roleOrDepartment is not mapped from database (UI-only field)
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