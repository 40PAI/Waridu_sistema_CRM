/**
 * Centralized application types.
 *
 * This file exports the shapes referenced across the codebase so imports like `import { Event } from "@/types"` work.
 * Keep these definitions lightweight and aligned with how data is read/written to Supabase (mostly `string` fields and optional fields).
 */

/* Roles used in the app */
export type Role = 'Admin' | 'Coordenador' | 'Gestor de Material' | 'Financeiro' | 'Técnico' | 'Comercial';

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

  // CRM/project-specific fields (optional)
  pipeline_status?: PipelineStatus | null;
  estimated_value?: number | null;
  service_ids?: string[] | null;
  client_id?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  follow_ups?: any[] | null;
  updated_at?: string | null;
}

/* Material related types */
export type MaterialStatus = 'Disponível' | 'Em uso' | 'Manutenção';

export interface InventoryMaterial {
  id: string;
  name: string;
  category?: string;
  description?: string | null;
  status: MaterialStatus;
  // map of locationId -> quantity
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

/* Utility exports that some modules expect (aliases) */
export { Expense as EventExpense };

/* Export any additional small helpers if needed later (placeholders) */
export type TechnicianCategory = {
  id: string;
  categoryName: string;
  dailyRate: number;
};