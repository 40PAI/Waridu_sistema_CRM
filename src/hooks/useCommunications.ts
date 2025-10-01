import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import type { Communication } from "@/types";

export const useCommunications = () => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCommunications();
  }, []);

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setCommunications((data || []) as Communication[]);
    } catch (err: any) {
      console.error("Error fetching communications:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar comunicações.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createCommunication = async (comm: Omit<Communication, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('communications')
        .insert(comm)
        .select()
        .single();

      if (error) throw error;
      setCommunications(prev => [data, ...prev]);
      showSuccess("Comunicação registrada!");
      return data;
    } catch (err: any) {
      console.error("Error creating communication:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao registrar comunicação.";
      showError(errorMessage);
      throw err;
    }
  };

  const updateCommunication = async (id: string, updates: Partial<Communication>) => {
    try {
      const { data, error } = await supabase
        .from('communications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setCommunications(prev => prev.map(c => c.id === id ? data : c));
      showSuccess("Comunicação atualizada!");
      return data;
    } catch (err: any) {
      console.error("Error updating communication:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar comunicação.";
      showError(errorMessage);
      throw err;
    }
  };

  const deleteCommunication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('communications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCommunications(prev => prev.filter(c => c.id !== id));
      showSuccess("Comunicação removida!");
    } catch (err: any) {
      console.error("Error deleting communication:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao remover comunicação.";
      showError(errorMessage);
      throw err;
    }
  };

  return {
    communications,
    loading,
    error,
    createCommunication,
    updateCommunication,
    deleteCommunication,
    refreshCommunications: fetchCommunications
  };
};