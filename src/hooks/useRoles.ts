import { useState, useEffect } from "react";
import { Role } from "@/types";
import { Role as ConfigRole } from "@/config/roles";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
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
      showError("Erro ao carregar funções.");
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
      showError("Erro ao adicionar função.");
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
      showError("Erro ao atualizar função.");
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
      showError("Erro ao remover função.");
    }
  };

  return {
    roles,
    loading,
    addRole,
    updateRole,
    deleteRole,
    refreshRoles: fetchRoles
  };
};