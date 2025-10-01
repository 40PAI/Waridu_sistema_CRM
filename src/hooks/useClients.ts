import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export type LifecycleStage = "Lead" | "Oportunidade" | "Cliente Ativo" | "Cliente Perdido";

export type Client = {
  id: string;
  name: string; // Nome completo (obrigatório)
  company?: string | null; // Empresa
  email?: string | null; // E-mail
  phone?: string | null; // Telefone
  nif?: string | null; // NIF (opcional)
  sector?: string | null; // Setor
  job_title?: string | null; // Cargo/Departamento (mapeado de roleOrDepartment)
  lifecycle_stage?: LifecycleStage; // Ciclo de Vida
  notes?: string | null; // Observações
  created_at?: string | null;
  updated_at?: string | null;
};

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setClients((data || []) as Client[]);
    } catch (err: any) {
      console.error("Error fetching clients:", err);
      const msg = err instanceof Error ? err.message : "Erro ao carregar clientes.";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const upsertClient = async (payload: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .upsert({
          ...payload,
        })
        .select()
        .single();
      if (error) throw error;
      showSuccess("Cliente salvo com sucesso!");
      await fetchClients();
      return data as Client;
    } catch (err: any) {
      console.error("Error upserting client:", err);
      const msg = err instanceof Error ? err.message : "Erro ao salvar cliente.";
      showError(msg);
      throw err;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
      showSuccess("Cliente removido com sucesso!");
      await fetchClients();
    } catch (err: any) {
      console.error("Error deleting client:", err);
      const msg = err instanceof Error ? err.message : "Erro ao remover cliente.";
      showError(msg);
      throw err;
    }
  };

  return {
    clients,
    loading,
    error,
    fetchClients,
    upsertClient,
    deleteClient,
  };
};