export interface Client {
  id: string;
  name: string;
  nif?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  lifecycle_stage: 'Lead' | 'MQL' | 'SQL' | 'Ativo' | 'Perdido'; // New
  sector?: string; // New
  persona?: string; // New
}