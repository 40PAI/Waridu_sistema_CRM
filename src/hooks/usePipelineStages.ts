import { useCallback, useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  is_active: boolean;
  active?: boolean; // keep for backwards compatibility
  color?: string | null;
  canonical_status?: string | null;
  created_at?: string;
}

/**
 * usePipelineStages
 * - Now primarily uses pipeline_phases table as the source of truth
 * - Normalizes records to PipelineStage shape for compatibility
 * - Ensures both `is_active` and `active` exist and match
 */
export default function usePipelineStages() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeRow = (row: any): PipelineStage => {
    const isActive = Boolean(row.active ?? row.is_active ?? false);
    const order = Number(row.sort_order ?? row.order ?? 0);
    return {
      id: row.id,
      name: row.name,
      order,
      is_active: isActive,
      active: isActive,
      color: row.color ?? null,
      canonical_status: row.canonical_status ?? null,
      created_at: row.created_at ?? null,
    };
  };

  const fetchStages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use pipeline_phases as primary source
      const { data, error } = await supabase
        .from("pipeline_phases")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) {
        // Only provide demo data if table doesn't exist (PGRST116)
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log("Pipeline phases table not found, providing demo data for development");
          showSuccess("🚧 Pipeline em Modo Demonstração - Configuração não persistida");
          const demoStages = getDemoStages();
          setStages(demoStages);
          return;
        }
        
        // For other errors, set error state to show user there's a problem
        console.error("Error fetching pipeline phases from Supabase:", error.message);
        const msg = error.message || "Erro ao carregar fases do pipeline.";
        setError(msg);
        showError(msg);
        return;
      }
      
      // Return actual data (even if empty array)
      const normalizedStages = (data || []).map(normalizeRow);
      setStages(normalizedStages);
    } catch (err: any) {
      console.error("Error fetching pipeline phases:", err);
      
      // Only provide demo data if table doesn't exist
      if (err?.code === 'PGRST116' || err?.message?.includes('does not exist')) {
        console.log("Pipeline phases table not found, providing demo data for development");
        showSuccess("🚧 Pipeline em Modo Demonstração - Configuração não persistida");
        const demoStages = getDemoStages();
        setStages(demoStages);
        return;
      }
      
      // For other errors, set error state
      const msg = err instanceof Error ? err.message : "Erro ao carregar fases do pipeline.";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get demo pipeline stages
  const getDemoStages = (): PipelineStage[] => {
    return [
      {
        id: "1",
        name: "1º Contato",
        order: 1,
        is_active: true,
        active: true,
        color: "#f3f4f6",
        canonical_status: "1º Contato",
      },
      {
        id: "2",
        name: "Orçamento",
        order: 2,
        is_active: true,
        active: true,
        color: "#dbeafe",
        canonical_status: "Orçamento",
      },
      {
        id: "3",
        name: "Negociação",
        order: 3,
        is_active: true,
        active: true,
        color: "#fef3c7",
        canonical_status: "Negociação",
      },
      {
        id: "4",
        name: "Confirmado",
        order: 4,
        is_active: true,
        active: true,
        color: "#dcfce7",
        canonical_status: "Confirmado",
      },
      {
        id: "5",
        name: "Cancelado",
        order: 5,
        is_active: true,
        active: true,
        color: "#fee2e2",
        canonical_status: "Cancelado",
      },
    ];
  };

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  const addStage = useCallback(
    async (name: string, opts?: { color?: string; canonical_status?: string }) => {
      try {
        const maxOrder = stages.reduce((m, p) => Math.max(m, Number(p.order ?? 0)), 0);
        const payload: any = {
          name: name.trim(),
          active: true,
          color: opts?.color ?? "#e5e7eb",
          canonical_status: opts?.canonical_status ?? null,
          sort_order: maxOrder + 1,
        };

        const { data, error } = await supabase
          .from("pipeline_phases")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        
        showSuccess("Fase adicionada com sucesso!");
        await fetchStages();
        return normalizeRow(data);
      } catch (err: any) {
        console.error("Error adding pipeline stage:", err);
        const msg = err instanceof Error ? err.message : "Erro ao adicionar fase.";
        showError(msg);
        throw err;
      }
    },
    [fetchStages, stages],
  );

  const updateStage = useCallback(
    async (id: string, name: string, opts?: { color?: string; canonical_status?: string }) => {
      try {
        const updates: any = { name: name.trim() };
        if (opts?.color !== undefined) updates.color = opts.color;
        if (opts?.canonical_status !== undefined) updates.canonical_status = opts.canonical_status;

        const { data, error } = await supabase
          .from("pipeline_phases")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        
        showSuccess("Fase atualizada com sucesso!");
        await fetchStages();
        return normalizeRow(data);
      } catch (err: any) {
        console.error("Error updating pipeline stage:", err);
        const msg = err instanceof Error ? err.message : "Erro ao atualizar fase.";
        showError(msg);
        throw err;
      }
    },
    [fetchStages],
  );

  const toggleStageActive = useCallback(
    async (id: string, active: boolean) => {
      try {
        const { data, error } = await supabase
          .from("pipeline_phases")
          .update({ active })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        
        showSuccess(active ? "Fase ativada" : "Fase desativada");
        await fetchStages();
        return normalizeRow(data);
      } catch (err: any) {
        console.error("Error toggling pipeline stage active:", err);
        const msg = err instanceof Error ? err.message : "Erro ao alterar status.";
        showError(msg);
        throw err;
      }
    },
    [fetchStages],
  );

  const reorderPhases = useCallback(
    async (orderedIds: string[]) => {
      try {
        const updates = orderedIds.map((id, idx) =>
          supabase.from("pipeline_phases").update({ sort_order: idx + 1 }).eq("id", id),
        );
        const results = await Promise.all(updates);
        const firstErr = results.find((r: any) => r.error);
        if (firstErr && firstErr.error) throw firstErr.error;
        
        showSuccess("Ordem das fases atualizada");
        await fetchStages();
        return true;
      } catch (err: any) {
        console.error("Error reordering pipeline stages:", err);
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
    reorderPhases,
  };
}