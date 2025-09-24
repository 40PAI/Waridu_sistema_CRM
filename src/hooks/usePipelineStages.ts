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
  created_at?: string;
}

/**
 * usePipelineStages
 * - Tries to load stages from pipeline_stages (new table).
 * - Falls back to pipeline_phases (older name) if pipeline_stages doesn't exist or errors.
 * - Normalizes records to PipelineStage shape, and ensures both `is_active` and `active` exist and match.
 */
export default function usePipelineStages() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // detectedTableRef.current will be either 'pipeline_stages' or 'pipeline_phases'
  const detectedTableRef = useRef<'pipeline_stages' | 'pipeline_phases'>('pipeline_stages');

  const normalizeRow = (row: any, source: 'pipeline_stages' | 'pipeline_phases'): PipelineStage => {
    // Normalize booleans and order to stable fields.
    if (source === 'pipeline_stages') {
      const isActive = Boolean(row.is_active);
      const order = Number(row.sort_order ?? row.order ?? 0);
      return {
        id: row.id,
        name: row.name,
        order,
        is_active: isActive,
        active: isActive,
        color: row.color ?? null,
        created_at: row.created_at ?? null,
      };
    }

    // pipeline_phases (older)
    const activeVal = row.active ?? row.is_active ?? false;
    const isActive = Boolean(activeVal);
    const order = Number(row.sort_order ?? row.sort_order ?? 0);
    return {
      id: row.id,
      name: row.name,
      order,
      is_active: isActive,
      active: isActive,
      color: row.color ?? null,
      created_at: row.created_at ?? null,
    };
  };

  const fetchFromTable = async (table: 'pipeline_stages' | 'pipeline_phases') => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("sort_order", { ascending: true });

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
        setStages(stagesFromNew);
        return;
      } catch (errNew) {
        // fallback quietly
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

  // Helper to detect "table not found" errors from PostgREST
  const isTableNotFoundError = (err: any) => {
    if (!err) return false;
    if (err.code === 'PGRST205') return true;
    const msg = String(err.message || err);
    return msg.includes("Could not find the table") || (msg.includes("relation") && msg.includes("does not exist"));
  };

  // Generic write helper: try on preferredTable, if table-not-found then try otherTable and update detection
  const tryWriteWithTableFallback = async (preferredTable: 'pipeline_stages' | 'pipeline_phases', fn: (table: string) => Promise<any>) => {
    try {
      return await fn(preferredTable);
    } catch (err: any) {
      if (isTableNotFoundError(err)) {
        const other: 'pipeline_stages' | 'pipeline_phases' = preferredTable === 'pipeline_stages' ? 'pipeline_phases' : 'pipeline_stages';
        try {
          const res = await fn(other);
          detectedTableRef.current = other;
          return res;
        } catch (err2: any) {
          throw err2 || err;
        }
      }
      throw err;
    }
  };

  const addStage = useCallback(
    async (name: string, opts?: { color?: string }) => {
      try {
        const table = detectedTableRef.current;
        const maxOrder = stages.reduce((m, p) => Math.max(m, Number(p.order ?? 0)), 0);
        const payload: any = {
          name: name.trim(),
          sort_order: maxOrder + 1,
          is_active: true,
          color: opts?.color ?? null,
        };

        const writeFn = async (writeTable: string) => {
          const body = { ...payload };
          if (writeTable === 'pipeline_phases') {
            // older table expects 'active' instead of 'is_active'
            body.active = body.is_active;
            delete body.is_active;
          }
          const { data, error } = await supabase.from(writeTable).insert(body).select().single();
          if (error) throw error;
          return data;
        };

        const data = await tryWriteWithTableFallback(table, writeFn);
        showSuccess("Fase adicionada com sucesso!");
        await fetchStages();
        return normalizeRow(data, detectedTableRef.current);
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

        const writeFn = async (writeTable: string) => {
          const { data, error } = await supabase.from(writeTable).update(updates).eq("id", id).select().single();
          if (error) throw error;
          return data;
        };

        const data = await tryWriteWithTableFallback(table, writeFn);
        showSuccess("Fase atualizada com sucesso!");
        await fetchStages();
        return normalizeRow(data, detectedTableRef.current);
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
        const writeFn = async (writeTable: string) => {
          const updates: any = writeTable === 'pipeline_phases' ? { active } : { is_active: active };
          const { data, error } = await supabase.from(writeTable).update(updates).eq("id", id).select().single();
          if (error) throw error;
          return data;
        };

        const data = await tryWriteWithTableFallback(table, writeFn);
        showSuccess(active ? "Fase ativada" : "Fase desativada");
        await fetchStages();
        return normalizeRow(data, detectedTableRef.current);
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
        const writeFn = async (writeTable: string) => {
          const updates = orderedIds.map((id, idx) =>
            supabase.from(writeTable).update({ sort_order: idx + 1 }).eq("id", id),
          );
          const results = await Promise.all(updates);
          const firstErr = results.find((r: any) => r.error);
          if (firstErr && firstErr.error) throw firstErr.error;
          return true;
        };

        const res = await tryWriteWithTableFallback(table, writeFn);
        showSuccess("Ordem das fases atualizada");
        await fetchStages();
        return res;
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