import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useServerState, useMutationWithInvalidation } from "./useServerState"; // Importar useServerState e useMutationWithInvalidation
import { format } from "date-fns"; // Importar format para formatação de datas

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean; // Adicionado
  created_at?: string | null;
  updated_at?: string | null; // Adicionado
  deleted_at?: string | null; // Adicionado para soft delete
}

export const useServices = () => {
  // Usar useServerState para buscar serviços com uma chave de consulta padronizada
  const servicesQuery = useServerState<Service[]>(
    ["services"],
    async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, is_active, created_at, updated_at, deleted_at") // Incluir novas colunas
        .is('deleted_at', null) // Filtrar por soft delete
        .order("name", { ascending: true });

      if (error) throw error;

      // Normalizar forma
      const formatted = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? null,
        is_active: row.is_active, // Usar is_active
        created_at: row.created_at ?? null,
        updated_at: row.updated_at ?? null,
        deleted_at: row.deleted_at ?? null,
      })) as Service[];

      return formatted;
    },
    { enabled: true, keepPreviousData: false }
  );

  // Mutações para criar, atualizar e deletar serviços
  const createServiceMutation = useMutationWithInvalidation(
    async (payload: { name: string; description?: string; is_active?: boolean }) => {
      const { data, error } = await supabase.from("services").insert({
        name: payload.name,
        description: payload.description ?? null,
        is_active: payload.is_active ?? true, // Padrão para ativo
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
      // Soft delete: atualizar deleted_at
      const { error } = await supabase.from("services").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      return true;
    },
    ["services"]
  );

  // Heurística para tratar um serviço como ativo:
  const activeServices = (servicesQuery.data || []).filter((s) => s.is_active);

  return {
    services: servicesQuery.data ?? [],
    activeServices,
    loading: servicesQuery.isLoading,
    error: servicesQuery.isError ? (servicesQuery.error as Error) : null,
    refreshServices: () => servicesQuery.refetch(),
    createService: async (payload: { name: string; description?: string; is_active?: boolean }) => {
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
    toggleServiceActive: async (id: string, is_active: boolean) => {
      try {
        const result = await updateServiceMutation.mutateAndInvalidate({ id, updates: { is_active } });
        showSuccess(`Serviço ${is_active ? "ativado" : "desativado"} com sucesso!`);
        return result;
      } catch (err: any) {
        showError("Erro ao atualizar status do serviço.");
        throw err;
      }
    },
    deleteService: async (id: string) => {
      try {
        await deleteServiceMutation.mutateAndInvalidate(id);
        showSuccess("Serviço eliminado (soft delete) com sucesso!");
        return true;
      } catch (err: any) {
        showError("Erro ao eliminar serviço.");
        throw err;
      }
    }
  };
};