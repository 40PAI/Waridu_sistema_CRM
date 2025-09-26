/**
 * Centralized application types.
 *
 * This file exports the shapes referenced across the codebase so imports like `import { Event } from "@/types"` work.
 * Keep these definitions lightweight and aligned with how data is read/written to Supabase (mostly `string` fields and optional fields).
 */

/* Role name union (use where only the canonical role string is needed) */
export type RoleName =
  | 'Admin'
  | 'Coordenador'
  | 'Gestor de Material'
  | 'Financeiro'
  | 'Técnico'
  | 'Comercial';

/* Role record as stored in DB / returned by API (id + name).
   Some parts of the app expect Role objects with id/name, so export this interface. */
export interface Role {
  id: string;
  name: RoleName | string;
}

/* PipelinePhase: represents a phase row in pipeline_phases table */
export interface PipelinePhase {
  id: string;
  name: string;
  active: boolean;
  color?: string | null;
  canonical_status?: string | null;
  sort_order?: number; // Changed from position to sort_order
  created_at?: string | null;
  updated_at?: string | null;
}

/* Event statuses (operational) */
export type EventStatus = 'Planejado' | 'Em Andamento' | 'Concluído' | 'Cancelado';

/* Pipeline statuses (commercial funnel) */
export type PipelineStatus = '1º Contato' | 'Orçamento' | 'Negociação' | 'Confirmado' | 'Cancelado';

/* Roster & related */
export interface RosterMember {
  id: string;
  name: string;
  role?: string;
}

export interface Roster {
  teamLead?: string | null;
  teamMembers: RosterMember[];
  materials?: Record<string, number>; // materialId -> quantity
}

/* Expense shape used inside events */
export interface Expense {
  id?: string;
  description?: string;
  amount: number;
  category?: string;
}

/* Event shape used in many components/hooks */
export interface Event {
  id: number;
  name: string;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
  location?: string;
  startTime?: string | null;
  endTime?: string | null;
  revenue?: number;
  status: EventStatus;
  description?: string;
  roster?: Roster | null;
  expenses?: Expense[] | null;

  // CRM/project-specific fields
  pipeline_status?: PipelineStatus | null;
  estimated_value?: number | null;
  service_ids?: string[] | null;
  client_id?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  follow_ups?: Array<{ action: string; date: string; notes?: string }> | null;
  responsible_id?: string;
  next_action?: string;
  next_action_date?: string;
  updated_at?: string | null;
  pipeline_phase_id?: string | null; // Primary FK to pipeline_phases
  pipeline_phase_label?: string | null; // Derived field
  pipeline_rank?: number | null; // BIGINT for ordering
  follow_ups_count?: number;
  follow_ups_completed?: number;
}

/* Material related types */
export type MaterialStatus = 'Disponível' | 'Em uso' | 'Manutenção';

export interface InventoryMaterial {
  id: string;
  name: string;
  category?: string;
  description?: string | null;
  status: MaterialStatus;
  // map of locationId -> quantity (numbers)
  locations: Record<string, number>;
}

export interface PageMaterial extends InventoryMaterial {
  // convenience computed field used in UI
  quantity?: number;
}

/* Locations */
export interface Location {
  id: string;
  name: string;
}

/* Material Request types */
export type MaterialRequestStatus = 'Pendente' | 'Aprovada' | 'Rejeitada';

export interface MaterialRequestItem {
  materialId: string;
  quantity: number;
}

export interface MaterialRequest {
  id: string;
  eventId: number;
  requestedBy: { name: string; email: string; role?: string };
  status: MaterialRequestStatus;
  reason?: string | null;
  createdAt: string;
  decidedAt?: string | null;
  items: MaterialRequestItem[];
}

/* Approve result used by request approval flow:
   - ok true means success
   - ok false returns shortages array with materialId, needed, available
*/
export type ApproveResult =
  | { ok: true }
  | { ok: false; shortages: { materialId: string; needed: number; available: number }[] };

/* Export a type alias for Expense if other modules expect EventExpense */
export type { Expense as EventExpense };

/* Small helper type for technician categories */
export type TechnicianCategory = {
  id: string;
  categoryName: string;
  dailyRate: number;
};

/* Client types for CRM */
export type LifecycleStage = "Lead" | "Oportunidade" | "Cliente Ativo" | "Cliente Perdido";

export interface Client {
  id: string;
  name: string;
  company?: string | null;
  nif?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  sector?: string | null;
  job_title?: string | null; // Cargo/Departamento (mapeado de roleOrDepartment)
  service_ids?: string[]; // Changed from tags to service_ids
  lifecycle_stage?: LifecycleStage;
  created_at?: string | null;
  updated_at?: string | null;
}

/* Service types */
export interface Service {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean; // Alterado de status para is_active
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null; // Adicionado para soft delete
}

/* Communication types */
export interface Communication {
  id: string;
  client_id?: string;
  project_id?: number;
  type: 'email' | 'call' | 'meeting' | 'note';
  date: string;
  subject?: string;
  notes?: string;
  user_id: string;
  created_at: string;
  // provider information (e.g. gmail) — optional, included when synced from provider
  provider?: string;
  provider_meta?: {
    threadId?: string;
    messageId?: string;
    headers?: Record<string, string>;
    [key: string]: any;
  } | null;
  is_internal?: boolean;
}

/* Task types */
export interface Task {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  assigned_to: string;
  event_id?: number;
  created_at: string;
  updated_at: string;
}

/* Notification types */
export interface Notification {
  id: string;
  title: string;
  description: string | null;
  type: 'task' | 'event' | 'system' | 'issue' | 'material';
  read: boolean;
  user_id: string;
  created_at: string;
}