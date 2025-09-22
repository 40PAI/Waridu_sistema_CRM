import { useCallback, useEffect, useState, useRef } from "react";
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

/**
 * usePipelineStages
 * - Tries to load stages from pipeline_stages (new table).
 * - Falls back to pipeline_phases (older name) if pipeline_stages doesn't exist or errors.
 * - Normalizes records to PipelineStage shape.
 * - Performs writes against the detected table so the UI works regardless of which table exists.
 */
export default function usePipelineStages() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // detectedTableRef.current will be either 'pipeline_stages' or 'pipeline_phases'
  const detectedTableRef = useRef<'pipeline_stages' | 'pipeline_phases'>('pipeline_stages');

  const normalizeRow = (row: any, source: 'pipeline_stages' | 'pipeline_phases'): PipelineStage => {
    if (source === 'pipeline_stages') {
      return {
        id: row.id,
        name: row.name,
        order: Number(row.sort_order ?? row.order ?? 0),
        is_active: Boolean(row.is_active),
        color: row.color ?? null,
        created_at: row.created_at ?? null,
      };
    }

    // pipeline_phases shape (older)
    return {
      id: row.id,
      name: row.name,
      order: Number(row.sort_order ?? row.sort_order ?? 0),
      is_active: Boolean(row.active ?? row.is_active),
      color: row.color ?? null,
      created_at: row.created_at ?? null,
    };
  };

  const fetchFromTable = async (table: 'pipeline_stages' | 'pipeline_phases') => {
    // attempt sensible columns and ordering; tolerate absence of some columns
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(table === 'pipeline_stages' ? "sort_order" : "sort_order", { ascending: true });

      if (error) throw error;
      const rows = data || [];
      return rows.map((r: any) => normalizeRow(r, table));
    } catch (err) {
      throw err;
    }
  };

  const fetchStages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try pipeline_stages first
      try {
        const stagesFromNew = await fetchFromTable('pipeline_stages');
        detectedTableRef.current = 'pipeline_stages';
        // If the table exists but is empty, we still accept it (it exists)
        setStages(stagesFromNew);
        return;
      } catch (errNew) {
        // If table missing or permission error, fallback quietly to pipeline_phases
        console.warn("pipeline_stages read failed, falling back to pipeline_phases:", errNew);
      }

      // Fallback to pipeline_phases
      try {
        const stagesFromOld = await fetchFromTable('pipeline_phases');
        detectedTableRef.current = 'pipeline_phases';
        setStages(stagesFromOld);
        return;
      } catch (errOld) {
        console.error("Both pipeline_stages and pipeline_phases reads failed:", errOld);
        throw errOld;
      }
    } catch (err: any) {
      console.error("Error fetching pipeline stages (final):", err);
      const msg = err instanceof Error ? err.message : "Erro ao carregar fases do pipeline.";
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
    async (name: string, opts?: { color?: string }) => {
      try {
        const table = detectedTableRef.current;
        // compute max order based on current state
        const maxOrder = stages.reduce((m, s) => Math.max(m, Number(s.order ?? 0)), 0);
        const payload: any = {
          name: name.trim(),
          sort_order: maxOrder + 1,
          is_active: true,
          color: opts?.color ?? null,
        };

        // adapt payload keys for pipeline_phases (uses active & sort_order)
        if (table === 'pipeline_phases') {
          payload.active = payload.is_active;
          delete payload.is_active;
        }

        const { data, error } = await supabase.from(table).insert(payload).select().single();
        if (error) throw error;
        showSuccess("Fase adicionada com sucesso!");
        await fetchStages();
        return normalizeRow(data, table);
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
    async (id: string, name: string, opts?: { color?: string }) => {
      try {
        const table = detectedTableRef.current;
        const updates: any = { name: name.trim() };
        if (opts?.color !== undefined) updates.color = opts.color;
        // adapt no-op: column names similar (sort_order used separately)
        const { data, error } = await supabase.from(table).update(updates).eq("id", id).select().single();
        if (error) throw error;
        showSuccess("Fase atualizada com sucesso!");
        await fetchStages();
        return normalizeRow(data, table);
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
        const table = detectedTableRef.current;
        const updates: any = table === 'pipeline_phases' ? { active } : { is_active: active };
        const { data, error } = await supabase.from(table).update(updates).eq("id", id).select().single();
        if (error) throw error;
        showSuccess(active ? "Fase ativada" : "Fase desativada");
        await fetchStages();
        return normalizeRow(data, table);
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
        const table = detectedTableRef.current;
        // Persist new sort_order by batching updates
        const updates = orderedIds.map((id, idx) => {
          const payload = table === 'pipeline_phases' ? { sort_order: idx + 1 } : { sort_order: idx + 1 };
          return supabase.from(table).update(payload).eq("id", id);
        });
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