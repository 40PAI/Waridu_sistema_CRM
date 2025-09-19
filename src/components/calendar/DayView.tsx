import * as React from "react";
import { parseISO, isWithinInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Event, EventStatus } from "@/types";

interface DayViewProps {
  currentDate: Date;
  events: Event[];
}

const getBadgeVariant = (status: EventStatus) => {
  switch (status) {
    case 'Planejado': return 'secondary';
    case 'Em Andamento': return 'default';
    case 'Concluído': return 'destructive';
    case 'Cancelado': return 'destructive';
    default: return 'secondary';
  }
};

const DayView = ({ currentDate, events }: DayViewProps) => {
  const dayEvents = React.useMemo(() => {
    return events
      .filter(event => {
        if (typeof event.startDate !== 'string' || typeof event.endDate !== 'string') {
          return false;
        }
        try {
          return isWithinInterval(currentDate, {
            start: parseISO(event.startDate),
            end: parseISO(event.endDate),
          });
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const aTime = a.startTime
          ? parseISO(`${a.startDate}T${a.startTime}`)
          : parseISO(a.startDate);
        const bTime = b.startTime
          ? parseISO(`${b.startDate}T${b.startTime}`)
          : parseISO(b.startDate);
        return aTime.getTime() - bTime.getTime();
      });
  }, [currentDate, events]);

  return (
    <div className="space-y-4">
      {dayEvents.length > 0 ? (
        dayEvents.map(event => {
          const start = event.startTime || '';
          const end = event.endTime || '';
          return (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle>{event.name}</CardTitle>
                <CardDescription>
                  {start && end
                    ? `${format(parseISO(`${event.startDate}T${start}`), 'HH:mm', { locale: ptBR })} - ${format(parseISO(`${event.endDate}T${end}`), 'HH:mm', { locale: ptBR })}`
                    : format(parseISO(event.startDate), 'PPP', { locale: ptBR })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>{event.location}</div>
                <Badge variant={getBadgeVariant(event.status)}>
                  {event.status}
                </Badge>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum evento neste dia.</p>
      )}
    </div>
  );
};

export default DayView;