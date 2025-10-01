"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ReportsFiltersProps {
  dateRange?: DateRange;
  onDateChange: (date: DateRange | undefined) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  onClear: () => void;
  sectorFilter?: string;
  onSectorChange?: (v: string) => void;
  personaFilter?: string;
  onPersonaChange?: (v: string) => void;
  lifecycleFilter?: string;
  onLifecycleChange?: (v: string) => void;
}

const ReportsFilters: React.FC<ReportsFiltersProps> = ({
  dateRange,
  onDateChange,
  statusFilter,
  onStatusChange,
  onClear,
  sectorFilter = "all",
  onSectorChange,
  personaFilter = "all",
  onPersonaChange,
  lifecycleFilter = "all",
  onLifecycleChange,
}) => {
  return (
    <div className="mb-4">
      <div className="flex gap-4 flex-wrap items-end">
        <div className="min-w-[220px]">
          <DateRangePicker date={dateRange} onDateChange={onDateChange} />
        </div>

        <div>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="1º Contato">1º Contato</SelectItem>
              <SelectItem value="Orçamento">Orçamento</SelectItem>
              <SelectItem value="Negociação">Negociação</SelectItem>
              <SelectItem value="Confirmado">Confirmado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {onSectorChange && (
          <div>
            <Select value={sectorFilter} onValueChange={onSectorChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Setores</SelectItem>
                <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Saúde">Saúde</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {onPersonaChange && (
          <div>
            <Select value={personaFilter} onValueChange={onPersonaChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Personas</SelectItem>
                <SelectItem value="CEO">CEO</SelectItem>
                <SelectItem value="CTO">CTO</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {onLifecycleChange && (
          <div>
            <Select value={lifecycleFilter} onValueChange={onLifecycleChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por ciclo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Ciclos</SelectItem>
                <SelectItem value="Lead">Lead</SelectItem>
                <SelectItem value="MQL">MQL</SelectItem>
                <SelectItem value="SQL">SQL</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button variant="outline" onClick={onClear}>Limpar Filtros</Button>
      </div>
    </div>
  );
};

export default ReportsFilters;