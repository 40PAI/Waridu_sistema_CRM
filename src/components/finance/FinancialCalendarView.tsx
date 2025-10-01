"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@/types";
import { parseISO, isSameDay, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 2 });
};

interface FinancialCalendarViewProps {
  events: Event[];
}

const FinancialCalendarView = ({ events }: FinancialCalendarViewProps) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

  const eventDays = React.useMemo(() => {
    const dates = new Set<number>();
    events.forEach(event => {
      // Highlight days with events that have revenue
      if (event.revenue && event.revenue > 0) {
        dates.add(startOfDay(parseISO(event.startDate)).getTime());
      }
    });
    return Array.from(dates).map(time => new Date(time));
  }, [events]);

  const eventsForSelectedDay = React.useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(event => isSameDay(parseISO(event.startDate), selectedDate));
  }, [selectedDate, events]);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border p-0"
          numberOfMonths={2}
          locale={ptBR}
          modifiers={{ eventDays: eventDays }}
          modifiersClassNames={{
            eventDays: "bg-primary/20 text-primary rounded-md font-bold",
          }}
        />
      </div>
      <div className="md:col-span-1">
        <h3 className="font-semibold mb-4">
          {selectedDate ? format(selectedDate, 'PPP', { locale: ptBR }) : "Selecione uma data"}
        </h3>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {eventsForSelectedDay.length > 0 ? (
            eventsForSelectedDay.map(event => (
              <div key={event.id} className="p-3 border rounded-md bg-muted/50">
                <p className="text-sm font-medium">{event.name}</p>
                <p className="text-xs text-muted-foreground">{event.location}</p>
                <div className="flex justify-between items-center mt-2">
                  <Badge variant={event.status === 'Concluído' ? 'default' : 'secondary'}>{event.status}</Badge>
                  <span className="text-sm font-semibold">{formatCurrency(event.revenue || 0)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center pt-8">Nenhum evento com receita para este dia.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialCalendarView;