import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Nome completo é obrigatório").max(200, "Nome muito longo"),
  company: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  nif: z.string().optional(),
  sector: z.string().max(100, "Setor muito longo").optional(),
  position: z.string().max(100, "Função muito longa").optional(), // Função na Empresa
  lifecycle_stage: z.enum(["Lead", "Oportunidade", "Cliente Ativo", "Cliente Perdido"]).optional(),
  service_ids: z.array(z.string()).optional(), // Serviços de Interesse
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;