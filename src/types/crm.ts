export type PipelineStatus =
  | "1º Contato"
  | "Orçamento"
  | "Negociação"
  | "Confirmado"
  | "Cancelado";

export type EventProject = {
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
};

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
};

export type Client = { id: string; name: string };
export type Service = { id: string; name: string };