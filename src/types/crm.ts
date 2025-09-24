export type PipelineStatus =
  | "1º Contato"
  | "Orçamento"
  | "Negociação"
  | "Confirmado"
  | "Cancelado";

export interface EventProject {
  id: number;
  name: string;
  client_id?: string;
  pipeline_status: PipelineStatus;
  service_ids: string[];
  estimated_value?: number;
  startDate: string;
  endDate: string;
  location: string;
  status?: string;
  tags?: string[];
  notes?: string;
  // Add responsible_id so forms and dialogs can set/read the commercial responsible user
  responsible_id?: string;
  // Add pipeline_rank for sorting in Kanban
  pipeline_rank?: number;
  // Add updated_at for sorting fallback
  updated_at?: string;
  // Primary FK to pipeline_phases table (source of truth)
  pipeline_phase_id?: string;
  // Derived field from pipeline_phases.name
  pipeline_phase_label?: string;
}

export type CreatePayload = {
  name: string;
  client_id?: string;
  pipeline_status?: PipelineStatus;
  service_ids?: string[];
  estimated_value?: number;
  startDate: string;
  endDate: string;
  startTime?: string; // novo
  endTime?: string;   // novo
  location?: string;
  notes?: string;
  pipeline_phase_id?: string; // Primary FK
  pipeline_rank?: number; // For ordering
};

export type Client = { id: string; name: string };
export type Service = { id: string; name: string };