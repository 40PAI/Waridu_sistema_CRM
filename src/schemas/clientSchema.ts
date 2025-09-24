import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  nif: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  sector: z.enum(["Tecnologia", "Financeiro", "Saúde"]).optional(),
  persona: z.enum(["CEO", "CTO", "Marketing"]).optional(),
  // service_ids: z.array(z.string()).optional(), // Removed from schema
});

export type ClientFormData = z.infer<typeof clientSchema>;