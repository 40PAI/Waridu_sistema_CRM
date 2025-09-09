import * as React from "react";
import { format, addDays, subDays, addMonths, subMonths, addYears, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Event } from "@/App";
import DayView from "@/components/calendar/DayView";
import MonthView from "@/components/calendar/MonthView";
import YearView from "@/components/calendar/YearView";

interface CalendarPageProps {
  events: Event[];
}

type CalendarView = 'day' | 'month' | 'year';

const CalendarPage = ({ events }: CalendarPageProps) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState<CalendarView>('month');

  const handlePrev = () => {
    switch (view) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'year':
        setCurrentDate(subYears(currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (view) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'year':
        setCurrentDate(addYears(currentDate, 1));
        break;
    }
  };

  const getHeaderText = () => {
    switch (view) {
      case 'day':
        return format(currentDate, "PPP", { locale: ptBR });
      case 'month':
        return format(currentDate, "MMMM yyyy", { locale: ptBR });
      case 'year':
        return format(currentDate, "yyyy", { locale: ptBR });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>Calendário de Eventos</CardTitle>
          <CardDescription>
            Visualize e gerencie seus eventos por dia, mês ou ano.
          </CardDescription>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg sm:text-xl font-semibold text-center w-48">
              {getHeaderText()}
            </h2>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => value && setView(value as CalendarView)}
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="day">Dia</ToggleGroupItem>
            <ToggleGroupItem value="month">Mês</ToggleGroupItem>
            <ToggleGroupItem value="year">Ano</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(value) => value && setView(value as CalendarView)}
          className="flex sm:hidden w-full"
        >
          <ToggleGroupItem value="day" className="flex-1">Dia</ToggleGroupItem>
          <ToggleGroupItem value="month" className="flex-1">Mês</ToggleGroupItem>
          <ToggleGroupItem value="year" className="flex-1">Ano</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        {view === 'day' && <DayView currentDate={currentDate} events={events} />}
        {view === 'month' && <MonthView currentDate={currentDate} events={events} />}
        {view === 'year' && (
          <YearView
            currentDate={currentDate}
            events={events}
            setView={setView}
            setCurrentDate={setCurrentDate}
          />
        )}
      </CardContent>
    </Card>
);

export default CalendarPage;