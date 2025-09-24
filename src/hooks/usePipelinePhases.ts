import { useCallback, useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import type { PipelinePhase } from "@/types";

/**
 * usePipelinePhases
 * - Tries to load phases from pipeline_phases (new primary table).
 * - Falls back to pipeline_stages (older name) if pipeline_phases doesn't exist or errors.
 * - Normalizes records to PipelinePhase shape, and ensures `active` and `sort_order` exist.
 */
export default function usePipelinePhases() {
  const [phases, setPhases] = useState<PipelinePhase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // detectedTableRef.current will be either 'pipeline_phases' or 'pipeline_stages'
  const detectedTableRef = useRef<'pipeline_phases' | 'pipeline_stages'>('pipeline_phases');

  const normalizeRow = (row: any, source: 'pipeline_phases' | 'pipeline_stages'): PipelinePhase => {
    // Normalize booleans and order to stable fields.
    if (source === 'pipeline_phases') {
      const active = Boolean(row.active);
      const sort_order = Number(row.sort_order ?? 0);
      return {
        id: row.id,
        name: row.name,
        active: active,
        color: row.color ?? null,
        canonical_status: row.canonical_status ?? null,
        sort_order: sort_order,
        created_at: row.created_at ?? null,
      };
    }

    // pipeline_stages (older)
    const activeVal = row.is_active ?? row.active ?? false;
    const active = Boolean(activeVal);
    const sort_order = Number(row.sort_order ?? row.order ?? 0);
    return {
      id: row.id,
      name: row.name,
      active: active,
      color: row.color ?? null,
      canonical_status: row.canonical_status ?? null, // Assuming canonical_status might exist or be derived
      sort_order: sort_order,
      created_at: row.created_at ?? null,
    };
  };

  const fetchFromTable = async (table: 'pipeline_phases' | 'pipeline_stages') => {
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

  const fetchPhases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try pipeline_phases first (new primary table)
      try {
        const phasesFromNew = await fetchFromTable('pipeline_phases');
        detectedTableRef.current = 'pipeline_phases';
        setPhases(phasesFromNew);
        return;
      } catch (errNew) {
        // fallback quietly
        console.warn("pipeline_phases read failed, falling back to pipeline_stages:", errNew);
      }

      // Fallback to pipeline_stages (older table)
      try {
        const phasesFromOld = await fetchFromTable('pipeline_stages');
        detectedTableRef.current = 'pipeline_stages';
        setPhases(phasesFromOld);
        return;
      } catch (errOld) {
        console.error("Both pipeline_phases and pipeline_stages reads failed:", errOld);
        throw errOld;
      }
    } catch (err: any) {
      console.error("Error fetching pipeline phases (final):", err);
      const msg = err instanceof Error ? err.message : "Erro ao carregar fases do pipeline.";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhases();
  }, [fetchPhases]);

  // Helper to detect "table not found" errors from PostgREST
  const isTableNotFoundError = (err: any) => {
    if (!err) return false;
    if (err.code === 'PGRST205') return true;
    const msg = String(err.message || err);
    return msg.includes("Could not find the table") || (msg.includes("relation") && msg.includes("does not exist"));
  };

  // Generic write helper: try on preferredTable, if table-not-found then try otherTable and update detection
  const tryWriteWithTableFallback = async (preferredTable: 'pipeline_phases' | 'pipeline_stages', fn: (table: string) => Promise<any>) => {
    try {
      return await fn(preferredTable);
    } catch (err: any) {
      if (isTableNotFoundError(err)) {
        const other: 'pipeline_phases' | 'pipeline_stages' = preferredTable === 'pipeline_phases' ? 'pipeline_stages' : 'pipeline_phases';
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

  const addPhase = useCallback(
    async (name: string, opts?: { color?: string; canonical_status?: string }) => {
      try {
        const table = detectedTableRef.current;
        const maxOrder = phases.reduce((m, p) => Math.max(m, Number(p.sort_order ?? 0)), 0);
        const payload: any = {
          name: name.trim(),
          sort_order: maxOrder + 1,
          active: true, // Default to active for pipeline_phases
          color: opts?.color ?? null,
          canonical_status: opts?.canonical_status ?? null,
        };

        const writeFn = async (writeTable: string) => {
          const body = { ...payload };
          if (writeTable === 'pipeline_stages') {
            // older table expects 'is_active' instead of 'active'
            body.is_active = body.active;
            delete body.active;
          }
          const { data, error } = await supabase.from(writeTable).insert(body).select().single();
          if (error) throw error;
          return data;
        };

        const data = await tryWriteWithTableFallback(table, writeFn);
        showSuccess("Fase adicionada com sucesso!");
        await fetchPhases();
        return normalizeRow(data, detectedTableRef.current);
      } catch (err: any) {
        console.error("Error adding pipeline phase:", err);
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
        const table = detectedTableRef.current;
        const updates: any = { name: name.trim() };
        if (opts?.color !== undefined) updates.color = opts.color;
        if (opts?.canonical_status !== undefined) updates.canonical_status = opts.canonical_status;

        const writeFn = async (writeTable: string) => {
          const { data, error } = await supabase.from(writeTable).update(updates).eq("id", id).select().single();
          if (error) throw error;
          return data;
        };

        const data = await tryWriteWithTableFallback(table, writeFn);
        showSuccess("Fase atualizada com sucesso!");
        await fetchPhases();
        return normalizeRow(data, detectedTableRef.current);
      } catch (err: any) {
        console.error("Error updating pipeline phase:", err);
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
        const table = detectedTableRef.current;
        const writeFn = async (writeTable: string) => {
          const updates: any = writeTable === 'pipeline_stages' ? { is_active: active } : { active };
          const { data, error } = await supabase.from(writeTable).update(updates).eq("id", id).select().single();
          if (error) throw error;
          return data;
        };

        const data = await tryWriteWithTableFallback(table, writeFn);
        showSuccess(active ? "Fase ativada" : "Fase desativada");
        await fetchPhases();
        return normalizeRow(data, detectedTableRef.current);
      } catch (err: any) {
        console.error("Error toggling pipeline phase active:", err);
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
        await fetchPhases();
        return res;
      } catch (err: any) {
        console.error("Error reordering pipeline phases:", err);
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