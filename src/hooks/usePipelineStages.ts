import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  is_active: boolean;
  color?: string | null;
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

      let stagesData = (data || []) as PipelineStage[];

      // Bootstrap defaults if table is empty
      if (stagesData.length === 0) {
        const defaults = [
          { name: "Lead Identificado", order: 1, is_active: true, color: "#3b82f6" },
          { name: "Contato Iniciado", order: 2, is_active: true, color: "#10b981" },
          { name: "Proposta Enviada", order: 3, is_active: true, color: "#f59e0b" },
          { name: "Negociação", order: 4, is_active: true, color: "#ef4444" },
          { name: "Em Produção/Execução", order: 5, is_active: true, color: "#8b5cf6" },
          { name: "Pausado/Em Espera", order: 6, is_active: true, color: "#6b7280" },
          { name: "Fechado – Ganhou", order: 7, is_active: true, color: "#059669" },
          { name: "Fechado – Perdido", order: 8, is_active: true, color: "#dc2626" },
        ];
        const { data: inserted, error: insertError } = await supabase
          .from("pipeline_stages")
          .insert(defaults)
          .select();

        if (insertError) throw insertError;
        stagesData = (inserted || []) as PipelineStage[];
      }

      setStages(stagesData);
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
    async (name: string, order: number, color?: string) => {
      try {
        const payload: Partial<PipelineStage> = {
          name: name.trim(),
          order,
          is_active: true,
          color: color || "#e5e7eb",
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