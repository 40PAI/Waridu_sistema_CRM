"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ReportsFiltersProps {
  dateRange?: DateRange;
  onDateChange: (date: DateRange | undefined) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  onClear: () => void;
}

const ReportsFilters: React.FC<ReportsFiltersProps> = ({ dateRange, onDateChange, statusFilter, onStatusChange, onClear }) => {
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

        <Button variant="outline" onClick={onClear}>Limpar Filtros</Button>
      </div>
    </div>
  );
};

export default ReportsFilters;