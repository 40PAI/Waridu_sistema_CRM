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
      console.log("Fetching material categories..."); // Debug log
      const { data, error } = await supabase
        .from('material_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error); // Debug log
        throw error;
      }

      console.log("Fetched categories:", data); // Debug log
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
      console.log("Adding category:", { name, description }); // Debug log
      const { data, error } = await supabase
        .from('material_categories')
        .insert({ name, description })
        .select()
        .single();

      if (error) {
        console.error("Error adding category:", error); // Debug log
        throw error;
      }

      console.log("Category added successfully:", data); // Debug log
      showSuccess("Categoria adicionada com sucesso!");
      // Update local state immediately
      setCategories(prev => [...prev, data]);
    } catch (err: any) {
      console.error("Error adding category:", err);
      const errorMessage = err?.message || "Erro ao adicionar categoria. Verifique permissões ou conexão.";
      showError(errorMessage);
      throw err; // Re-throw to handle in component
    }
  };

  const updateCategory = async (id: string, name: string, description?: string) => {
    try {
      console.log("Updating category:", { id, name, description }); // Debug log
      const { data, error } = await supabase
        .from('material_categories')
        .update({ name, description })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Error updating category:", error); // Debug log
        throw error;
      }

      console.log("Category updated successfully:", data); // Debug log
      showSuccess("Categoria atualizada com sucesso!");
      // Update local state immediately
      setCategories(prev => prev.map(cat => cat.id === id ? data : cat));
    } catch (err: any) {
      console.error("Error updating category:", err);
      const errorMessage = err?.message || "Erro ao atualizar categoria.";
      showError(errorMessage);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      console.log("Deleting category:", id); // Debug log
      const { error } = await supabase
        .from('material_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting category:", error); // Debug log
        throw error;
      }

      console.log("Category deleted successfully"); // Debug log
      showSuccess("Categoria removida com sucesso!");
      // Update local state immediately
      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (err: any) {
      console.error("Error deleting category:", err);
      const errorMessage = err?.message || "Erro ao remover categoria.";
      showError(errorMessage);
      throw err;
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