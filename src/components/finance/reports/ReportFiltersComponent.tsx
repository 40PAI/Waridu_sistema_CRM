import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import type { DateRange } from "react-day-picker";
import type { EventStatus } from "@/types";

interface ReportFiltersComponentProps {
  dateRange: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  statusFilter: EventStatus | "all";
  onStatusChange: (status: EventStatus | "all") => void;
  onClearFilters: () => void;
}

export const ReportFiltersComponent: React.FC<ReportFiltersComponentProps> = ({
  dateRange,
  onDateChange,
  statusFilter,
  onStatusChange,
  onClearFilters,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
        <CardDescription>Personalize o período e critérios da análise.</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-4 flex-wrap items-end">
        <div className="flex-1 min-w-[200px]">
          <DateRangePicker date={dateRange} onDateChange={onDateChange} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as EventStatus | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="Planejado">Planejado</SelectItem>
            <SelectItem value="Em Andamento">Em Andamento</SelectItem>
            <SelectItem value="Concluído">Concluído</SelectItem>
            <SelectItem value="Cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={onClearFilters}>
          Limpar Filtros
        </Button>
      </CardContent>
    </Card>
  );
};