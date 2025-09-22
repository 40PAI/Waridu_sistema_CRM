import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import type { PipelinePhase } from "@/types"; // Usar o tipo atualizado

export const usePipelinePhases = () => {
  const [phases, setPhases] = useState<PipelinePhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("pipeline_phases")
        .select("id, name, color, active, position, created_at, updated_at, canonical_status") // Incluir canonical_status
        .order("position", { ascending: true, nullsFirst: false })
        .order("updated_at", { ascending: false });

      if (error) throw error;

      setPhases((data || []) as PipelinePhase[]);
    } catch (err: any) {
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
      const { data: inserted, error } = await supabase
        .from("pipeline_phases")
        .insert({ name: name.trim(), active: true })
        .select()
        .single();

      if (error) throw error;
      showSuccess("Fase adicionada com sucesso!");
      await fetchPhases();
      return inserted as PipelinePhase;
    } catch (err: any) {
      console.error("Error adding phase:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar fase.";
      showError(errorMessage);
      throw err;
    }
  };

  const updatePhase = async (id: string, newName: string) => {
    try {
      const { data, error } = await supabase
        .from("pipeline_phases")
        .update({ name: newName.trim(), updated_at: new Date().toISOString() }) // Adicionar updated_at
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      showSuccess("Fase atualizada com sucesso!");
      await fetchPhases();
      return data as PipelinePhase;
    } catch (err: any) {
      console.error("Error updating phase:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar fase.";
      showError(errorMessage);
      throw err;
    }
  };

  const togglePhaseActive = async (id: string, active: boolean) => {
    try {
      const { data, error } = await supabase
        .from("pipeline_phases")
        .update({ active, updated_at: new Date().toISOString() }) // Adicionar updated_at
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      showSuccess(`Fase ${active ? "ativada" : "desativada"} com sucesso!`);
      await fetchPhases();
      return data as PipelinePhase;
    } catch (err: any) {
      console.error("Error toggling phase active status:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao alterar status da fase.";
      showError(errorMessage);
      throw err;
    }
  };

  const reorderPhases = async (orderedIds: string[]) => {
    if (!Array.isArray(orderedIds)) {
      throw new Error("orderedIds must be an array of ids");
    }

    const updates = orderedIds.map((id, idx) => ({ id, position: idx, updated_at: new Date().toISOString() })); // Incluir updated_at

    const chunkSize = 100;
    try {
      for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        const { error } = await supabase
          .from("pipeline_phases")
          .upsert(chunk, { onConflict: "id" });

        if (error) throw error;
      }

      await fetchPhases();
      showSuccess("Ordem das fases salva!");
    } catch (err: any) {
      console.error("Error reordering phases:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao reordenar fases.";
      showError(errorMessage);
      throw err;
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