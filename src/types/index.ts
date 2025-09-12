import type { Role as ConfigRole } from "@/config/roles";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category?: string;
}

export interface Roster {
  teamLead: string;
  teamMembers: { id: string; name: string; role: string }[];
  materials: Record<string, number>;
}

export type EventStatus = 'Planejado' | 'Em Andamento' | 'Concluído' | 'Cancelado';

export interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  startTime?: string;
  endTime?: string;
  revenue?: number;
  roster?: Roster;
  expenses?: Expense[];
  status: EventStatus;
  description?: string;
}

export interface Role {
  id: string;
  name: ConfigRole;
}

export interface Location {
  id: string;
  name: string;
}

export type MaterialStatus = 'Disponível' | 'Em uso' | 'Manutenção';

export interface InventoryMaterial {
  id: string;
  name: string;
  status: MaterialStatus;
  category: string;
  description: string;
  locations: Record<string, number>;
}

export interface AllocationHistoryEntry {
  id: string;
  date: string;
  eventId: number;
  eventName: string;
  materials: Record<string, number>;
}

export type MaterialRequestStatus = 'Pendente' | 'Aprovada' | 'Rejeitada';

export interface MaterialRequestItem {
  materialId: string;
  quantity: number;
}

export interface MaterialRequest {
  id: string;
  eventId: number;
  items: MaterialRequestItem[];
  requestedBy: { name: string; email: string; role: string };
  status: MaterialRequestStatus;
  reason?: string;
  createdAt: string;
  decidedAt?: string;
}

export type ApproveResult =
  | { ok: true }
  | { ok: false; shortages: { materialId: string; needed: number; available: number }[] };

export interface TechnicianCategory {
  id: string;
  categoryName: string;
  dailyRate: number;
}

export interface PageMaterial {
  id: string;
  name: string;
  quantity: number;
  status: MaterialStatus;
  category: string;
  description: string;
  locations: Record<string, number>;
}