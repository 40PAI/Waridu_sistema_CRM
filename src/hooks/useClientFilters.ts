import { useState, useMemo } from "react";
import { parseISO, isWithinInterval } from "date-fns";

export interface ClientFilters {
  nome: string; // Pesquisa por nome
  empresa: string;
  setor: string; // Novo filtro por setor
  funcao: string; // Função na empresa (antes cargo)
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
  nome: boolean; // Pesquisa por nome
  empresa: boolean;
  setor: boolean; // Novo filtro por setor
  funcao: boolean; // Função na empresa (antes cargo)
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
    nome: "",
    empresa: "",
    setor: "",
    funcao: "",
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
    nome: false,
    empresa: false,
    setor: false,
    funcao: false,
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
      nome: "",
      empresa: "",
      setor: "",
      funcao: "",
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
      nome: false,
      empresa: false,
      setor: false,
      funcao: false,
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
      // Pesquisa por nome
      if (activeFilters.nome && filters.nome && !(c.name || "").toLowerCase().includes(filters.nome.toLowerCase())) return false;
      
      // Relacionados ao Cliente
      if (activeFilters.empresa && filters.empresa && !(c.company || "").toLowerCase().includes(filters.empresa.toLowerCase())) return false;
      if (activeFilters.setor && filters.setor && !(c.sector || "").toLowerCase().includes(filters.setor.toLowerCase())) return false;
      if (activeFilters.funcao && filters.funcao && !(c.position || "").toLowerCase().includes(filters.funcao.toLowerCase())) return false;
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