import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useServerState, useMutationWithInvalidation } from "./useServerState"; // Importar useServerState e useMutationWithInvalidation

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  status?: string | boolean | null;
  created_at?: string | null;
  updated_at?: string | null; // added to reflect DB column and avoid TS errors
}

export const useServices = () => {
  // Usar useServerState para buscar serviços com uma chave de consulta padronizada
  const servicesQuery = useServerState<Service[]>(
    ["services"],
    async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      // Normalizar forma (manter status como está, se presente)
      const formatted = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? null,
        status: row.status ?? null,
        created_at: row.created_at ?? null,
        updated_at: row.updated_at ?? null,
      })) as Service[];

      return formatted;
    },
    { enabled: true, keepPreviousData: false }
  );

  // Mutações para criar, atualizar e deletar serviços
  const createServiceMutation = useMutationWithInvalidation(
    async (payload: { name: string; description?: string }) => {
      const { data, error } = await supabase.from("services").insert({
        name: payload.name,
        description: payload.description ?? null,
        status: "ativo",
        updated_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return data;
    },
    ["services"]
  );

  const updateServiceMutation = useMutationWithInvalidation(
    async ({ id, updates }: { id: string; updates: Partial<Service> }) => {
      const { data, error } = await supabase.from("services").update({
        ...updates,
        updated_at: new Date().toISOString(),
      }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    ["services"]
  );

  const deleteServiceMutation = useMutationWithInvalidation(
    async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
    ["services"]
  );

  // Heurística para tratar um serviço como ativo:
  // suporta algumas representações possíveis (booleano true, 'ativo', 'Ativo', 'active')
  const activeServices = (servicesQuery.data || []).filter((s) => {
    if (s.status === undefined || s.status === null) {
      // Se o status não estiver presente, considere-o ativo (compatibilidade com versões anteriores)
      return true;
    }
    if (typeof s.status === "boolean") return s.status === true;
    const st = String(s.status).toLowerCase();
    return st === "ativo" || st === "active" || st === "true" || st === "1";
  });

  return {
    services: servicesQuery.data ?? [],
    activeServices,
    loading: servicesQuery.isLoading,
    error: servicesQuery.isError ? (servicesQuery.error as Error) : null,
    refreshServices: () => servicesQuery.refetch(),
    createService: async (payload: { name: string; description?: string }) => {
      try {
        const result = await createServiceMutation.mutateAndInvalidate(payload);
        showSuccess("Serviço criado com sucesso!");
        return result;
      } catch (err: any) {
        showError("Erro ao criar serviço.");
        throw err;
      }
    },
    updateService: async (id: string, updates: Partial<Service>) => {
      try {
        const result = await updateServiceMutation.mutateAndInvalidate({ id, updates });
        showSuccess("Serviço atualizado com sucesso!");
        return result;
      } catch (err: any) {
        showError("Erro ao atualizar serviço.");
        throw err;
      }
    },
    deleteService: async (id: string) => {
      try {
        await deleteServiceMutation.mutateAndInvalidate(id);
        showSuccess("Serviço removido com sucesso!");
        return true;
      } catch (err: any) {
        showError("Erro ao remover serviço.");
        throw err;
      }
    }
  };
};