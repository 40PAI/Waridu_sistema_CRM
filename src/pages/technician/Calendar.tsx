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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type CalendarView = "day" | "month";

const TechnicianCalendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [view, setView] = React.useState<CalendarView>("month");
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Carregar eventos do Supabase
  React.useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Buscar eventos onde o técnico está escalado
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('technician_id', user.id);

        if (error) throw error;
        
        // Formatar eventos
        const formattedEvents: Event[] = (data || []).map((event: any) => ({
          id: event.id,
          name: event.name,
          startDate: event.start_date,
          endDate: event.end_date,
          location: event.location,
          startTime: event.start_time,
          endTime: event.end_time,
          revenue: event.revenue,
          status: event.status,
          description: event.description
        }));
        
        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando calendário...</p>
      </div>
    );
  }

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
        {view === "day" && <DayView currentDate={currentDate} events={events} />}
        {view === "month" && <MonthView currentDate={currentDate} events={events} />}
      </CardContent>
    </Card>
  );
};

export default TechnicianCalendar;