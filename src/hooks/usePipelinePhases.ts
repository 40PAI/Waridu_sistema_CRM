import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import type { PipelinePhase } from "@/types";

export const usePipelinePhases = () => {
  const [phases, setPhases] = useState<PipelinePhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('pipeline_phases')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setPhases(data || []);
    } catch (err) {
      console.error("Error fetching pipeline phases:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar fases do pipeline.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhases();
  }, [fetchPhases]);

  const addPhase = async (name: string) => {
    try {
      const maxOrder = phases.reduce((max, p) => Math.max(max, p.sort_order), 0);
      const { data, error } = await supabase
        .from('pipeline_phases')
        .insert({ name: name.trim(), sort_order: maxOrder + 1, active: true })
        .select()
        .single();

      if (error) throw error;

      setPhases(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
      showSuccess("Fase adicionada com sucesso!");
    } catch (err: any) {
      console.error("Error adding phase:", err);
      const errorMessage = err?.message || "Erro ao adicionar fase.";
      showError(errorMessage);
      throw err;
    }
  };

  const updatePhase = async (id: string, newName: string) => {
    try {
      const { data, error } = await supabase
        .from('pipeline_phases')
        .update({ name: newName.trim() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPhases(prev => prev.map(p => p.id === id ? data : p));
      showSuccess("Fase atualizada com sucesso!");
    } catch (err: any) {
      console.error("Error updating phase:", err);
      const errorMessage = err?.message || "Erro ao atualizar fase.";
      showError(errorMessage);
      throw err;
    }
  };

  const togglePhaseActive = async (id: string, active: boolean) => {
    try {
      const { data, error } = await supabase
        .from('pipeline_phases')
        .update({ active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPhases(prev => prev.map(p => p.id === id ? data : p));
      showSuccess(`Fase ${active ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (err: any) {
      console.error("Error toggling phase active status:", err);
      const errorMessage = err?.message || "Erro ao alterar status da fase.";
      showError(errorMessage);
      throw err;
    }
  };

  const reorderPhases = async (newOrder: PipelinePhase[]) => {
    // Optimistic update
    setPhases(newOrder);

    try {
      const updates = newOrder.map((phase, index) => ({
        id: phase.id,
        sort_order: index,
      }));

      const { error } = await supabase
        .from('pipeline_phases')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;

      showSuccess("Ordem das fases atualizada!");
    } catch (err: any) {
      console.error("Error reordering phases:", err);
      const errorMessage = err?.message || "Erro ao reordenar fases. Revertendo...";
      showError(errorMessage);
      // Revert to previous state on error
      fetchPhases();
    }
  };

  return {
    phases,
    loading,
    error,
    fetchPhases,
    addPhase,
    updatePhase,
    togglePhaseActive,
    reorderPhases,
  };
};