import { useState, useEffect, useMemo } from "react";
import { Role } from "@/types";
import { Role as ConfigRole } from "@/config/roles";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedRoles: Role[] = (data || []).map((role: any) => ({
        id: role.id,
        name: role.name as ConfigRole
      }));

      setRoles(formattedRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar funções.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addRole = async (roleName: ConfigRole) => {
    try {
      const { error } = await supabase
        .from('roles')
        .insert({ name: roleName });

      if (error) throw error;

      showSuccess("Função adicionada com sucesso!");
      fetchRoles(); // Refresh the list
    } catch (error) {
      console.error("Error adding role:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao adicionar função.";
      showError(errorMessage);
    }
  };

  const updateRole = async (roleId: string, newName: ConfigRole) => {
    try {
      const { error } = await supabase
        .from('roles')
        .update({ name: newName })
        .eq('id', roleId);

      if (error) throw error;

      showSuccess("Função atualizada com sucesso!");
      fetchRoles(); // Refresh the list
    } catch (error) {
      console.error("Error updating role:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar função.";
      showError(errorMessage);
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      showSuccess("Função removida com sucesso!");
      fetchRoles(); // Refresh the list
    } catch (error) {
      console.error("Error deleting role:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao remover função.";
      showError(errorMessage);
    }
  };

  const rolesByName = useMemo(() => {
    const map: Record<string, Role> = {};
    roles.forEach(role => {
      map[role.name] = role;
    });
    return map;
  }, [roles]);

  return {
    roles,
    rolesByName,
    loading,
    error,
    addRole,
    updateRole,
    deleteRole,
    refreshRoles: fetchRoles
  };
};