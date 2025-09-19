import { useState, useMemo } from "react";
import { parseISO, isWithinInterval } from "date-fns";

export interface ClientFilters {
  empresa: string;
  cargo: string;
  localizacao: string;
  nif: string;
  cicloVida: string;
  dataCriacao: any;
  ultimaAtividade: any;
  responsavel: string;
  canalOrigem: string;
  numeroProjetos: string;
  statusProjetos: string[];
  receitaMin: string;
  receitaMax: string;
  frequenciaRecorrencia: string;
}

export interface ActiveFilters {
  empresa: boolean;
  cargo: boolean;
  localizacao: boolean;
  nif: boolean;
  cicloVida: boolean;
  dataCriacao: boolean;
  ultimaAtividade: boolean;
  responsavel: boolean;
  canalOrigem: boolean;
  numeroProjetos: boolean;
  statusProjetos: boolean;
  receita: boolean;
  frequenciaRecorrencia: boolean;
}

export const useClientFilters = (clients: any[], clientEventsMap: Record<string, any[]>, clientCommunicationsMap: Record<string, any[]>) => {
  const [filters, setFilters] = useState<ClientFilters>({
    empresa: "",
    cargo: "",
    localizacao: "",
    nif: "",
    cicloVida: "",
    dataCriacao: undefined,
    ultimaAtividade: undefined,
    responsavel: "",
    canalOrigem: "",
    numeroProjetos: "",
    statusProjetos: [],
    receitaMin: "",
    receitaMax: "",
    frequenciaRecorrencia: "",
  });

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    empresa: false,
    cargo: false,
    localizacao: false,
    nif: false,
    cicloVida: false,
    dataCriacao: false,
    ultimaAtividade: false,
    responsavel: false,
    canalOrigem: false,
    numeroProjetos: false,
    statusProjetos: false,
    receita: false,
    frequenciaRecorrencia: false,
  });

  const updateFilter = (key: keyof ClientFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleActiveFilter = (key: keyof ActiveFilters) => {
    setActiveFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const clearFilters = () => {
    setFilters({
      empresa: "",
      cargo: "",
      localizacao: "",
      nif: "",
      cicloVida: "",
      dataCriacao: undefined,
      ultimaAtividade: undefined,
      responsavel: "",
      canalOrigem: "",
      numeroProjetos: "",
      statusProjetos: [],
      receitaMin: "",
      receitaMax: "",
      frequenciaRecorrencia: "",
    });
    setActiveFilters({
      empresa: false,
      cargo: false,
      localizacao: false,
      nif: false,
      cicloVida: false,
      dataCriacao: false,
      ultimaAtividade: false,
      responsavel: false,
      canalOrigem: false,
      numeroProjetos: false,
      statusProjetos: false,
      receita: false,
      frequenciaRecorrencia: false,
    });
  };

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      // Relacionados ao Cliente
      if (activeFilters.empresa && filters.empresa && !(c.company || "").toLowerCase().includes(filters.empresa.toLowerCase())) return false;
      if (activeFilters.cargo && filters.cargo && c.persona !== filters.cargo) return false;
      if (activeFilters.localizacao && filters.localizacao && !(c.address || "").toLowerCase().includes(filters.localizacao.toLowerCase())) return false;
      if (activeFilters.nif && filters.nif && !(c.nif || "").includes(filters.nif)) return false;

      // Relacionamento Comercial
      if (activeFilters.cicloVida && filters.cicloVida && c.lifecycle_stage !== filters.cicloVida) return false;
      if (activeFilters.dataCriacao && filters.dataCriacao?.from && filters.dataCriacao?.to && (!c.created_at || !isWithinInterval(parseISO(c.created_at), { start: filters.dataCriacao.from, end: filters.dataCriacao.to }))) return false;
      const clientComms = clientCommunicationsMap[c.id] || [];
      const lastActivity = clientComms.length > 0 ? clientComms[0].date : null;
      if (activeFilters.ultimaAtividade && filters.ultimaAtividade?.from && filters.ultimaAtividade?.to && (!lastActivity || !isWithinInterval(parseISO(lastActivity), { start: filters.ultimaAtividade.from, end: filters.ultimaAtividade.to }))) return false;
      if (activeFilters.responsavel && filters.responsavel && !c.responsavel?.toLowerCase().includes(filters.responsavel.toLowerCase())) return false; // Placeholder
      if (activeFilters.canalOrigem && filters.canalOrigem && c.canal_origem !== filters.canalOrigem) return false; // Placeholder

      // Projetos Associados
      const clientEvents = clientEventsMap[c.id] || [];
      const numProjetos = clientEvents.length;
      if (activeFilters.numeroProjetos && filters.numeroProjetos) {
        if (filters.numeroProjetos === "0" && numProjetos !== 0) return false;
        if (filters.numeroProjetos === "1" && numProjetos !== 1) return false;
        if (filters.numeroProjetos === "2+" && numProjetos < 2) return false;
      }
      if (activeFilters.statusProjetos && filters.statusProjetos.length > 0 && !clientEvents.some(e => filters.statusProjetos.includes(e.status))) return false;
      const totalRevenue = clientEvents.reduce((sum, e) => sum + (e.estimated_value || 0), 0);
      if (activeFilters.receita && ((filters.receitaMin && totalRevenue < Number(filters.receitaMin)) || (filters.receitaMax && totalRevenue > Number(filters.receitaMax)))) return false;
      if (activeFilters.frequenciaRecorrencia && filters.frequenciaRecorrencia && c.frequencia_recorrencia !== filters.frequenciaRecorrencia) return false; // Placeholder

      return true;
    });
  }, [clients, filters, activeFilters, clientEventsMap, clientCommunicationsMap]);

  const activeFiltersCount = Object.values(activeFilters).filter(Boolean).length;

  return {
    filters,
    activeFilters,
    filteredClients,
    activeFiltersCount,
    updateFilter,
    toggleActiveFilter,
    clearFilters,
  };
};