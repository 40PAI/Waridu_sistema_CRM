import * as React from "react";
import { format, addDays, subDays, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Event } from "@/types";
import DayView from "@/components/calendar/DayView";
import MonthView from "@/components/calendar/MonthView";

// Mock data - will be replaced with real data from props
const mockEvents: Event[] = [
  { id: 1, name: "Conferência Anual de Tecnologia", startDate: "2024-08-15", endDate: "2024-08-17", location: "Centro de Convenções", startTime: "09:00", endTime: "18:00", revenue: 50000, status: 'Concluído', description: 'Evento anual para discutir as novas tendências em tecnologia.' },
  { id: 2, name: "Lançamento do Produto X", startDate: "2024-09-01", endDate: "2024-09-01", location: "Sede da Empresa", startTime: "19:00", endTime: "22:00", revenue: 25000, status: 'Planejado' },
  { id: 5, name: "Imersão de Vendas Q3", startDate: "2024-09-09", endDate: "2024-09-13", location: "Hotel Fazenda", status: "Em Andamento", description: "Treinamento intensivo para a equipe de vendas." },
];

type CalendarView = "day" | "month";

const TechnicianCalendar = () => {
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [view, setView] = React.useState<CalendarView>("month");

  const handlePrev = () => {
    if (view === "day") {
      setCurrentDate(subDays(currentDate, 1));
    } else if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const getHeaderText = () => {
    if (view === "day") return format(currentDate, "PPP", { locale: ptBR });
    if (view === "month") return format(currentDate, "MMMM yyyy", { locale: ptBR });
    return "";
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Meu Calendário</CardTitle>
          <CardDescription>Eventos em que você está escalado.</CardDescription>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg sm:text-xl font-semibold text-center w-48">{getHeaderText()}</h2>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as CalendarView)} className="hidden sm:flex">
            <ToggleGroupItem value="day">Dia</ToggleGroupItem>
            <ToggleGroupItem value="month">Mês</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as CalendarView)} className="flex sm:hidden w-full">
          <ToggleGroupItem value="day" className="flex-1">Dia</ToggleGroupItem>
          <ToggleGroupItem value="month" className="flex-1">Mês</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        {view === "day" && <DayView currentDate={currentDate} events={mockEvents} />}
        {view === "month" && <MonthView currentDate={currentDate} events={mockEvents} />}
      </CardContent>
    </Card>
  );
};

export default TechnicianCalendar;