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

const CalendarPage = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const eventDays = React.useMemo(() => {
    return events.map(event => event.date);
  }, []);

  const selectedDayEvents = React.useMemo(() => {
    if (!date) return [];
    return events.filter(event => isSameDay(event.date, date));
  }, [date]);

  const getStatusVariant = (status: Event['status']) => {
    switch (status) {
      case 'Confirmado':
        return 'default';
      case 'Pendente':
        return 'secondary';
      case 'Cancelado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendário de Eventos</CardTitle>
        <CardDescription>
          Selecione uma data para ver os eventos agendados. Os dias com eventos estão sublinhados.
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
              event: eventDays,
            }}
            modifiersStyles={{
              event: {
                textDecoration: 'underline',
              }
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
                <li key={event.id} className="p-3 bg-muted/50 rounded-md border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{event.name}</span>
                    <Badge variant={getStatusVariant(event.status)}>{event.status}</Badge>
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