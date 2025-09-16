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
  services?: any[]; // Add services prop
  serviceFilter?: string;
  onServiceChange?: (v: string) => void;
}

const ReportsFilters: React.FC<ReportsFiltersProps> = ({ 
  dateRange, 
  onDateChange, 
  statusFilter, 
  onStatusChange, 
  onClear,
  services = [],
  serviceFilter = "all",
  onServiceChange
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

        {onServiceChange && (
          <div>
            <Select value={serviceFilter} onValueChange={onServiceChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Serviços</SelectItem>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
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