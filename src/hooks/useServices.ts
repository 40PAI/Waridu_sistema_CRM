import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  status?: string | boolean | null;
  created_at?: string | null;
  updated_at?: string | null; // added to reflect DB column and avoid TS errors
}

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      // Normalize shape (keep status as-is if present)
      const formatted = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? null,
        status: row.status ?? null,
        created_at: row.created_at ?? null,
        updated_at: row.updated_at ?? null,
      })) as Service[];

      setServices(formatted);
    } catch (err: any) {
      console.error("Error fetching services:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar serviços.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Heuristic to treat a service as active:
  // support a few possible representations (boolean true, 'ativo', 'Ativo', 'active')
  const activeServices = services.filter((s) => {
    if (s.status === undefined || s.status === null) {
      // If status not present, consider it active (backwards compatibility)
      return true;
    }
    if (typeof s.status === "boolean") return s.status === true;
    const st = String(s.status).toLowerCase();
    return st === "ativo" || st === "active" || st === "true" || st === "1";
  });

  return {
    services,
    activeServices,
    loading,
    error,
    refreshServices: fetchServices,
    createService: async (payload: { name: string; description?: string }) => {
      const { data, error } = await supabase.from("services").insert({
        name: payload.name,
        description: payload.description ?? null,
        status: "ativo",
        updated_at: new Date().toISOString(), // Add updated_at on creation
      }).select().single();
      if (error) {
        showError("Erro ao criar serviço.");
        throw error;
      }
      showSuccess("Serviço criado com sucesso!");
      await fetchServices();
      return data as Service;
    },
    updateService: async (id: string, updates: Partial<Service>) => {
      const { data, error } = await supabase.from("services").update({
        ...updates,
        updated_at: new Date().toISOString(),
      }).eq("id", id).select().single();
      if (error) {
        showError("Erro ao atualizar serviço.");
        throw error;
      }
      showSuccess("Serviço atualizado com sucesso!");
      await fetchServices();
      return data as Service;
    },
    deleteService: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) {
        showError("Erro ao remover serviço.");
        throw error;
      }
      showSuccess("Serviço removido com sucesso!");
      await fetchServices();
    }
  };
};