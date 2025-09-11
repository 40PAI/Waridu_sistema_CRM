import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export type TechnicianCategory = {
  id: string;
  categoryName: string;
  dailyRate: number;
};

export const useTechnicianCategories = () => {
  const [categories, setCategories] = useState<TechnicianCategory[]>([]);
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
        .from("technician_category_rates")
        .select("*")
        .order("category_name", { ascending: true });

      if (error) throw error;

      const formatted: TechnicianCategory[] = (data || []).map((row: any) => ({
        id: row.id,
        categoryName: row.category_name,
        dailyRate: Number(row.daily_rate || 0),
      }));

      setCategories(formatted);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar categorias.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (categoryName: string, dailyRate: number) => {
    try {
      const { error } = await supabase
        .from("technician_category_rates")
        .insert({ category_name: categoryName.trim(), daily_rate: dailyRate });

      if (error) throw error;

      showSuccess("Categoria criada com sucesso!");
      fetchCategories();
    } catch (err: any) {
      console.error("Erro ao criar categoria:", err);
      const errorMessage = err?.message || "Erro ao criar categoria.";
      showError(errorMessage);
    }
  };

  const updateCategory = async (id: string, categoryName: string, dailyRate: number) => {
    try {
      const { error } = await supabase
        .from("technician_category_rates")
        .update({ category_name: categoryName.trim(), daily_rate: dailyRate })
        .eq("id", id);

      if (error) throw error;

      showSuccess("Categoria atualizada com sucesso!");
      fetchCategories();
    } catch (err: any) {
      console.error("Erro ao atualizar categoria:", err);
      const errorMessage = err?.message || "Erro ao atualizar categoria.";
      showError(errorMessage);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from("technician_category_rates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      showSuccess("Categoria removida com sucesso!");
      fetchCategories();
    } catch (err: any) {
      console.error("Erro ao remover categoria:", err);
      const errorMessage = err?.message || "Erro ao remover categoria.";
      showError(errorMessage);
    }
  };

  const categoriesById = useMemo(() => {
    const map: Record<string, TechnicianCategory> = {};
    categories.forEach(category => {
      map[category.id] = category;
    });
    return map;
  }, [categories]);

  return {
    categories,
    categoriesById,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshCategories: fetchCategories,
  };
};