import { useMemo } from "react";
import { Role as RoleType } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useServerState, useMutationWithInvalidation } from "./useServerState";

/**
 * useRoles
 * - Fetch roles via useServerState (react-query wrapper) with no caching
 * - Mutations (add/update/delete) use useMutationWithInvalidation to invalidate ['roles']
 */

export const useRoles = () => {
  // Fetcher: always query roles ordered by name
  const fetcher = async (): Promise<RoleType[]> => {
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    const formattedRoles: RoleType[] = (data || []).map((role: any) => ({
      id: role.id,
      name: role.name,
    }));

    return formattedRoles;
  };

  const rolesQuery = useServerState<RoleType[]>(
    ["roles"],
    fetcher,
    { enabled: true, keepPreviousData: false }
  );

  const addRoleMutation = useMutationWithInvalidation(
    async (roleName: string) => {
      const { data, error } = await supabase
        .from("roles")
        .insert({ name: roleName })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    ["roles"]
  );

  const updateRoleMutation = useMutationWithInvalidation(
    async ({ roleId, newName }: { roleId: string; newName: string }) => {
      const { data, error } = await supabase
        .from("roles")
        .update({ name: newName })
        .eq("id", roleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    ["roles"]
  );

  const deleteRoleMutation = useMutationWithInvalidation(
    async (roleId: string) => {
      const { error } = await supabase
        .from("roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;
      return true;
    },
    ["roles"]
  );

  // Convenience wrappers that surface to components
  const addRole = async (roleName: string) => {
    try {
      await addRoleMutation.mutateAndInvalidate(roleName);
      showSuccess("Função adicionada com sucesso!");
    } catch (err: any) {
      console.error("Error adding role:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar função.";
      showError(errorMessage);
      throw err;
    }
  };

  const updateRole = async (roleId: string, newName: string) => {
    try {
      await updateRoleMutation.mutateAndInvalidate({ roleId, newName });
      showSuccess("Função atualizada com sucesso!");
    } catch (err: any) {
      console.error("Error updating role:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar função.";
      showError(errorMessage);
      throw err;
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      await deleteRoleMutation.mutateAndInvalidate(roleId);
      showSuccess("Função removida com sucesso!");
    } catch (err: any) {
      console.error("Error deleting role:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao remover função.";
      showError(errorMessage);
      throw err;
    }
  };

  return {
    roles: rolesQuery.data ?? [],
    rolesByName: useMemo(() => {
      const map: Record<string, RoleType> = {};
      (rolesQuery.data || []).forEach((role) => { // Safely access data
        map[role.name] = role;
      });
      return map;
    }, [rolesQuery.data]),
    loading: rolesQuery.isLoading,
    error: rolesQuery.isError ? (rolesQuery.error as Error) : null,
    addRole,
    updateRole,
    deleteRole,
    refreshRoles: () => rolesQuery.refetch(),
  };
};