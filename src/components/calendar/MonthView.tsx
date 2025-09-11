import * as React from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, 
  format, isSameMonth, isToday, getDay, 
  isWithinInterval, parseISO, differenceInDays,
} from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { Event, EventStatus } from "@/types";
import { cn } from "@/lib/utils";

interface MonthViewProps {
  currentDate: Date;
  events: Event[];
}

const statusColors: Record<EventStatus, string> = {
  'Planejado': 'bg-blue-500 hover:bg-blue-600',
  'Em Andamento': 'bg-green-500 hover:bg-green-600',
  'Concluído': 'bg-gray-500 hover:bg-gray-600',
  'Cancelado': 'bg-red-500 hover:bg-red-600',
};

const statusBadgeColors: Record<EventStatus, string> = {
    'Planejado': 'bg-blue-100 text-blue-800 border-blue-200',
    'Em Andamento': 'bg-green-100 text-green-800 border-green-200',
    'Concluído': 'bg-gray-100 text-gray-800 border-gray-200',
    'Cancelado': 'bg-red-100 text-red-800 border-red-200',
};

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MonthView = ({ currentDate, events }: MonthViewProps) => {
  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const getEventsForDay = React.useCallback((day: Date) => {
    return events.filter(event => {
      if (typeof event.startDate !== 'string' || typeof event.endDate !== 'string' || !event.startDate || !event.endDate) {
        return false;
      }
      try {
        return isWithinInterval(day, { start: parseISO(event.startDate), end: parseISO(event.endDate) });
      } catch (error) {
        console.error("Error parsing event dates:", event, error);
        return false;
      }
    });
  }, [events]);

  return (
    <div className="grid grid-cols-7 border-t border-l">
      {weekDays.map(day => (
        <div key={day} className="text-center font-medium p-2 border-b border-r bg-muted/50">
          {day}
        </div>
      ))}
      {calendarDays.map((day) => {
        const dayEvents = getEventsForDay(day);
        return (
          <div
            key={day.toString()}
            className={cn(
              "relative h-36 border-b border-r p-2 flex flex-col",
              !isSameMonth(day, currentDate) && "bg-muted/20 text-muted-foreground"
            )}
          >
            <span className={cn(
              "font-medium",
              isToday(day) && "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center"
            )}>
              {format(day, "d")}
            </span>
            <div className="mt-1 space-y-1 overflow-y-auto">
              {dayEvents.map(event => {
                const eventStart = parseISO(event.startDate);
                const isFirstDayOfWeekForEvent = getDay(day) === 0 || format(day, 'yyyy-MM-dd') === event.startDate;
                if (!isFirstDayOfWeekForEvent) return null;

                const eventEnd = parseISO(event.endDate);
                const duration = differenceInDays(eventEnd, day) + 1;
                const weekEndDay = 6 - getDay(day);
                const span = Math.min(duration, weekEndDay + 1);

                return (
                  <Popover key={event.id}>
                    <PopoverTrigger asChild>
                      <div
                        className={cn(
                          "text-white text-sm p-1 rounded-md cursor-pointer truncate",
                          statusColors[event.status]
                        )}
                        style={{ width: `calc(${span * 100}% + ${span - 1} * 1px)` }}
                      >
                        {event.name}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">{event.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(eventStart, "dd/MM/yyyy")} - {format(eventEnd, "dd/MM/yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">Status:</span>
                            <Badge variant="outline" className={statusBadgeColors[event.status]}>{event.status}</Badge>
                        </div>
                        {event.description && (
                            <p className="text-sm">{event.description}</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MonthView;