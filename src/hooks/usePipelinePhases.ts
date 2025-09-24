import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import type { PipelinePhase } from "@/types";

/**
 * usePipelinePhases
 * - loads pipeline_phases from Supabase
 * - provides addPhase, updatePhase, togglePhaseActive and reorderPhases helpers
 *
 * Table assumptions (pipeline_phases):
 *  - id (uuid)
 *  - name (text)
 *  - active (boolean)
 *  - color (text)
 *  - sort_order (integer)
 *  - canonical_status (text)
 */
export default function usePipelinePhases() {
  const [phases, setPhases] = useState<PipelinePhase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("pipeline_phases")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setPhases((data || []) as PipelinePhase[]);
    } catch (err: any) {
      console.error("Error fetching pipeline phases:", err);
      const msg = err instanceof Error ? err.message : "Erro ao carregar fases.";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhases();
  }, [fetchPhases]);

  const addPhase = useCallback(
    async (name: string, opts?: { color?: string; canonical_status?: string }) => {
      try {
        // compute next sort_order
        const maxOrder = phases.reduce((m, p) => Math.max(m, Number((p as any).sort_order ?? 0)), 0);
        const payload: any = {
          name: name.trim(),
          active: true,
          color: opts?.color ?? "#e5e7eb",
          canonical_status: opts?.canonical_status ?? null,
          sort_order: maxOrder + 1,
        };
        const { data, error } = await supabase.from("pipeline_phases").insert(payload).select().single();
        if (error) throw error;
        showSuccess("Fase adicionada com sucesso!");
        await fetchPhases();
        return data as PipelinePhase;
      } catch (err: any) {
        console.error("Error adding phase:", err);
        const msg = err instanceof Error ? err.message : "Erro ao adicionar fase.";
        showError(msg);
        throw err;
      }
    },
    [fetchPhases, phases],
  );

  const updatePhase = useCallback(
    async (id: string, name: string, opts?: { color?: string; canonical_status?: string }) => {
      try {
        const updates: any = { name: name.trim() };
        if (opts?.color !== undefined) updates.color = opts.color;
        if (opts?.canonical_status !== undefined) updates.canonical_status = opts.canonical_status;
        const { data, error } = await supabase.from("pipeline_phases").update(updates).eq("id", id).select().single();
        if (error) throw error;
        showSuccess("Fase atualizada com sucesso!");
        await fetchPhases();
        return data as PipelinePhase;
      } catch (err: any) {
        console.error("Error updating phase:", err);
        const msg = err instanceof Error ? err.message : "Erro ao atualizar fase.";
        showError(msg);
        throw err;
      }
    },
    [fetchPhases],
  );

  const togglePhaseActive = useCallback(
    async (id: string, active: boolean) => {
      try {
        const { data, error } = await supabase.from("pipeline_phases").update({ active }).eq("id", id).select().single();
        if (error) throw error;
        showSuccess(active ? "Fase ativada" : "Fase desativada");
        await fetchPhases();
        return data as PipelinePhase;
      } catch (err: any) {
        console.error("Error toggling phase active:", err);
        const msg = err instanceof Error ? err.message : "Erro ao alterar status.";
        showError(msg);
        throw err;
      }
    },
    [fetchPhases],
  );

  const reorderPhases = useCallback(
    async (orderedIds: string[]) => {
      try {
        // Persist new sort_order by batch with Promise.all
        const updates = orderedIds.map((id, idx) =>
          supabase.from("pipeline_phases").update({ sort_order: idx + 1 }).eq("id", id),
        );
        const results = await Promise.all(updates);
        const firstErr = results.find((r: any) => r.error);
        if (firstErr && firstErr.error) throw firstErr.error;
        showSuccess("Ordem das fases atualizada");
        await fetchPhases();
        return true;
      } catch (err: any) {
        console.error("Error reordering phases:", err);
        const msg = err instanceof Error ? err.message : "Erro ao reordenar fases.";
        showError(msg);
        throw err;
      }
    },
    [fetchPhases],
  );

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
}