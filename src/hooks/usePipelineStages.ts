import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  is_active: boolean;
  created_at?: string;
}

export default function usePipelineStages() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("pipeline_stages")
        .select("*")
        .order("order", { ascending: true });

      if (error) throw error;
      
      let stagesData = data || [];
      
      // If no stages exist, create default ones
      if (stagesData.length === 0) {
        const defaultStages = [
          { name: "Lead Identificado", order: 1, is_active: true },
          { name: "Contato Iniciado", order: 2, is_active: true },
          { name: "Proposta Enviada", order: 3, is_active: true },
          { name: "Negociação", order: 4, is_active: true },
          { name: "Em Produção/Execução", order: 5, is_active: true },
          { name: "Pausado/Em Espera", order: 6, is_active: true },
          { name: "Fechado – Ganhou", order: 7, is_active: true },
          { name: "Fechado – Perdido", order: 8, is_active: true },
        ];
        
        const { data: inserted, error: insertError } = await supabase
          .from("pipeline_stages")
          .insert(defaultStages)
          .select();
          
        if (insertError) throw insertError;
        stagesData = inserted || [];
      }
      
      setStages(stagesData as PipelineStage[]);
    } catch (err: any) {
      console.error("Error fetching pipeline stages:", err);
      const msg = err instanceof Error ? err.message : "Erro ao carregar fases.";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  const addStage = useCallback(
    async (name: string, order: number) => {
      try {
        const payload = {
          name: name.trim(),
          order,
          is_active: true,
        };
        const { data, error } = await supabase.from("pipeline_stages").insert(payload).select().single();
        if (error) throw error;
        showSuccess("Fase adicionada com sucesso!");
        await fetchStages();
        return data as PipelineStage;
      } catch (err: any) {
        console.error("Error adding stage:", err);
        const msg = err instanceof Error ? err.message : "Erro ao adicionar fase.";
        showError(msg);
        throw err;
      }
    },
    [fetchStages],
  );

  const updateStage = useCallback(
    async (id: string, updates: Partial<PipelineStage>) => {
      try {
        const { data, error } = await supabase.from("pipeline_stages").update(updates).eq("id", id).select().single();
        if (error) throw error;
        showSuccess("Fase atualizada com sucesso!");
        await fetchStages();
        return data as PipelineStage;
      } catch (err: any) {
        console.error("Error updating stage:", err);
        const msg = err instanceof Error ? err.message : "Erro ao atualizar fase.";
        showError(msg);
        throw err;
      }
    },
    [fetchStages],
  );

  const toggleStageActive = useCallback(
    async (id: string, is_active: boolean) => {
      try {
        const { data, error } = await supabase.from("pipeline_stages").update({ is_active }).eq("id", id).select().single();
        if (error) throw error;
        showSuccess(is_active ? "Fase ativada" : "Fase desativada");
        await fetchStages();
        return data as PipelineStage;
      } catch (err: any) {
        console.error("Error toggling stage active:", err);
        const msg = err instanceof Error ? err.message : "Erro ao alterar status.";
        showError(msg);
        throw err;
      }
    },
    [fetchStages],
  );

  const reorderStages = useCallback(
    async (orderedIds: string[]) => {
      try {
        const updates = orderedIds.map((id, idx) =>
          supabase.from("pipeline_stages").update({ order: idx + 1 }).eq("id", id),
        );
        const results = await Promise.all(updates);
        const firstErr = results.find((r: any) => r.error);
        if (firstErr && firstErr.error) throw firstErr.error;
        showSuccess("Ordem das fases atualizada");
        await fetchStages();
        return true;
      } catch (err: any) {
        console.error("Error reordering stages:", err);
        const msg = err instanceof Error ? err.message : "Erro ao reordenar fases.";
        showError(msg);
        throw err;
      }
    },
    [fetchStages],
  );

  return {
    stages,
    loading,
    error,
    fetchStages,
    addStage,
    updateStage,
    toggleStageActive,
    reorderStages,
  };
}