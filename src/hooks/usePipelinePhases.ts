import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";

export type PipelinePhase = {
  id: string;
  name: string;
  color?: string | null;
  sort_order: number;
  active: boolean;
};

const DEFAULT_PHASES: Array<{ name: string; color: string }> = [
  { name: "Lead Identificado",        color: "#f3f4f6" },
  { name: "Contato Iniciado",         color: "#c7d2fe" },
  { name: "Proposta Enviada",         color: "#bfdbfe" },
  { name: "Negociação",               color: "#fde68a" },
  { name: "Em Produção/Execução",     color: "#bbf7d0" },
  { name: "Pausado/Em Espera",        color: "#fee2e2" },
  { name: "Fechado – Ganhou",         color: "#86efac" },
  { name: "Fechado – Perdido",        color: "#fecaca" },
];

export function usePipelinePhases() {
  const { user } = useAuth();
  const [phases, setPhases] = useState<PipelinePhase[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.profile?.role === "Admin";

  const fetchPhases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pipeline_phases")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Erro ao carregar fases:", error);
      showError("Erro ao carregar fases do pipeline.");
    } else {
      setPhases((data || []) as PipelinePhase[]);
    }
    setLoading(false);
  };

  // Inserir fases padrão se a tabela estiver vazia (apenas Admin)
  const ensureDefaults = async () => {
    if (!isAdmin) return;
    const { count, error } = await supabase
      .from("pipeline_phases")
      .select("*", { count: "exact", head: true });

    if (error) return;

    if ((count || 0) === 0) {
      const payload = DEFAULT_PHASES.map((p, i) => ({
        name: p.name,
        color: p.color,
        sort_order: i,
        active: true,
      }));
      const { error: insErr } = await supabase.from("pipeline_phases").insert(payload);
      if (!insErr) {
        showSuccess("Fases padrão do pipeline criadas.");
        await fetchPhases();
      }
    }
  };

  useEffect(() => {
    fetchPhases();
  }, []);

  useEffect(() => {
    // apenas quando carrega e está vazio, tenta criar defaults
    if (phases.length === 0) {
      ensureDefaults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phases.length, isAdmin]);

  const activePhases = useMemo(
    () => phases.filter((p) => p.active).sort((a, b) => a.sort_order - b.sort_order),
    [phases]
  );

  const addPhase = async (name: string, color: string) => {
    const nextOrder = phases.length;
    const { error } = await supabase.from("pipeline_phases").insert({
      name,
      color,
      sort_order: nextOrder,
      active: true,
    });
    if (error) {
      showError("Erro ao adicionar fase.");
      return;
    }
    showSuccess("Fase adicionada.");
    await fetchPhases();
  };

  const updatePhase = async (id: string, updates: Partial<PipelinePhase>) => {
    const { error } = await supabase.from("pipeline_phases").update(updates).eq("id", id);
    if (error) {
      showError("Erro ao atualizar fase.");
      return;
    }
    showSuccess("Fase atualizada.");
    await fetchPhases();
  };

  const reorderPhases = async (idsInOrder: string[]) => {
    // Atualiza sort_order em lote
    const updates = idsInOrder.map((id, idx) => ({ id, sort_order: idx }));
    // Supabase não suporta batch diferentes linhas num update; fazemos loop simples sequencial
    for (const up of updates) {
      const { error } = await supabase.from("pipeline_phases").update({ sort_order: up.sort_order }).eq("id", up.id);
      if (error) {
        showError("Erro ao reordenar fases.");
        return;
      }
    }
    showSuccess("Ordem atualizada.");
    await fetchPhases();
  };

  return {
    phases,
    activePhases,
    loading,
    addPhase,
    updatePhase,
    reorderPhases,
    refresh: fetchPhases,
    isAdmin,
  };
}