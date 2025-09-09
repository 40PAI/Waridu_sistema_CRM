import * as React from "react";
import { addDays, startOfMonth, isSameDay } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

type Event = {
  id: number;
  name: string;
  date: Date;
  status: 'Confirmado' | 'Pendente' | 'Cancelado';
};

const today = new Date();
const startOfCurrentMonth = startOfMonth(today);

const events: Event[] = [
    { id: 1, name: "Conferência de Tecnologia", date: addDays(startOfCurrentMonth, 4), status: 'Confirmado' },
    { id: 2, name: "Workshop de Design", date: addDays(startOfCurrentMonth, 9), status: 'Confirmado' },
    { id: 3, name: "Reunião de Alinhamento", date: addDays(startOfCurrentMonth, 9), status: 'Pendente' },
    { id: 4, name: "Lançamento de Produto", date: addDays(startOfCurrentMonth, 18), status: 'Confirmado' },
    { id: 5, name: "Evento Cancelado", date: addDays(startOfCurrentMonth, 22), status: 'Cancelado' },
];

const getStatusBorderClass = (status: Event['status']) => {
    switch (status) {
        case 'Confirmado': return 'border-l-4 border-green-500';
        case 'Pendente': return 'border-l-4 border-yellow-500';
        case 'Cancelado': return 'border-l-4 border-red-500';
        default: return 'border-l-4 border-transparent';
    }
};

const getStatusBadgeClass = (status: Event['status']) => {
    switch (status) {
        case 'Confirmado': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-800';
        case 'Pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-800';
        case 'Cancelado': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800';
        default: return '';
    }
};

const CalendarPage = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const { confirmedDays, pendingDays, cancelledDays } = React.useMemo(() => {
    const confirmed: Date[] = [];
    const pending: Date[] = [];
    const cancelled: Date[] = [];

    events.forEach(event => {
      if (event.status === 'Confirmado') confirmed.push(event.date);
      else if (event.status === 'Pendente') pending.push(event.date);
      else if (event.status === 'Cancelado') cancelled.push(event.date);
    });
    return { confirmedDays, pendingDays, cancelledDays };
  }, []);

  const selectedDayEvents = React.useMemo(() => {
    if (!date) return [];
    return events.filter(event => isSameDay(event.date, date));
  }, [date]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendário de Eventos</CardTitle>
        <CardDescription>
          Selecione uma data para ver os eventos agendados. Os dias estão coloridos de acordo com o status do evento.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
        <div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            modifiers={{
              confirmed: confirmedDays,
              pending: pendingDays,
              cancelled: cancelledDays,
            }}
            modifiersClassNames={{
              confirmed: 'confirmed',
              pending: 'pending',
              cancelled: 'cancelled',
            }}
          />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Eventos para {date ? date.toLocaleDateString('pt-BR') : 'Nenhuma data selecionada'}
          </h3>
          {selectedDayEvents.length > 0 ? (
            <ul className="space-y-3">
              {selectedDayEvents.map(event => (
                <li key={event.id} className={`p-3 bg-muted/50 rounded-md border ${getStatusBorderClass(event.status)}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{event.name}</span>
                    <Badge variant="outline" className={getStatusBadgeClass(event.status)}>{event.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center h-full p-4 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Nenhum evento para esta data.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarPage;