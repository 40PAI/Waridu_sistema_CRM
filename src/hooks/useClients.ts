import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export type LifecycleStage = "Lead" | "MQL" | "SQL" | "Ativo" | "Perdido";

export type Client = {
  id: string;
  name: string;
  nif?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  lifecycle_stage?: LifecycleStage;
  sector?: string | null;
  persona?: string | null;
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
        .upsert(payload)
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