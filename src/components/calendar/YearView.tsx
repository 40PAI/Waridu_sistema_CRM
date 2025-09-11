import * as React from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, 
  format, isSameMonth, isToday, isWithinInterval, parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Event } from "@/types";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface YearViewProps {
  currentDate: Date;
  events: Event[];
  setView: (view: 'month' | 'week' | 'year') => void;
  setCurrentDate: (date: Date) => void;
}

const YearView = ({ currentDate, events, setView, setCurrentDate }: YearViewProps) => {
  const year = currentDate.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  const hasEvents = React.useCallback((day: Date) => {
    return events.some(event => {
      if (typeof event.startDate !== 'string' || typeof event.endDate !== 'string' || !event.startDate || !event.endDate) {
        return false;
      }
      try {
        return isWithinInterval(day, { start: parseISO(event.startDate), end: parseISO(event.endDate) });
      } catch {
        return false;
      }
    });
  }, [events]);

  const handleMonthClick = (monthDate: Date) => {
    setCurrentDate(monthDate);
    setView('month');
  };

  return (
    <div className<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {months.map(monthDate => {
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

        return (
          <div key={format(monthDate, 'yyyy-MM')} className="p-2 border rounded-lg">
            <h3 
              className="text-center font-semibold mb-2 cursor-pointer hover:text-primary"
              onClick={() => handleMonthClick(monthDate)}
            >
              {format(monthDate, 'MMMM', { locale: ptBR })}
            </h3>
            <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => <div key={i}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {calendarDays.map(day => (
                <TooltipProvider key={day.toString()} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "h-6 flex items-center justify-center text-xs rounded-full",
                        !isSameMonth(day, monthDate) && "text-muted-foreground/50",
                        isToday(day) && "bg-primary text-primary-foreground",
                        hasEvents(day) && !isToday(day) && "bg-blue-200 dark:bg-blue-800"
                      )}>
                        {format(day, 'd')}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{format(day, 'PPP', { locale: ptBR })}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default YearView;