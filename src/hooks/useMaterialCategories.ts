import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export interface MaterialCategory {
  id: string;
  name: string;
  description?: string;
}

export const useMaterialCategories = () => {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('material_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar categorias.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (name: string, description?: string) => {
    try {
      const { error } = await supabase
        .from('material_categories')
        .insert({ name, description });

      if (error) throw error;

      showSuccess("Categoria adicionada com sucesso!");
      fetchCategories();
    } catch (err) {
      console.error("Error adding category:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar categoria.";
      showError(errorMessage);
    }
  };

  const updateCategory = async (id: string, name: string, description?: string) => {
    try {
      const { error } = await supabase
        .from('material_categories')
        .update({ name, description })
        .eq('id', id);

      if (error) throw error;

      showSuccess("Categoria atualizada com sucesso!");
      fetchCategories();
    } catch (err) {
      console.error("Error updating category:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar categoria.";
      showError(errorMessage);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('material_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showSuccess("Categoria removida com sucesso!");
      fetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao remover categoria.";
      showError(errorMessage);
    }
  };

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshCategories: fetchCategories
  };
};