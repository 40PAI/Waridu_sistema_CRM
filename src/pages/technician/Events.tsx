import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import type { Event, EventStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const getStatusVariant = (status: EventStatus) => {
  switch (status) {
    case 'Planejado': return 'secondary';
    case 'Em Andamento': return 'default';
    case 'Concluído': return 'outline';
    case 'Cancelado': return 'destructive';
    default: return 'secondary';
  }
};

const TechnicianEvents = () => {
  const { user } = useAuth();
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
          .eq('technician_id', user.id)
          .order('start_date', { ascending: true });

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
          description: event.description,
          roster: event.roster,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando eventos...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Eventos</CardTitle>
        <CardDescription>
          Lista de eventos em que você está escalado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length > 0 ? (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>
                    {format(parseISO(event.startDate), "dd/MM/yyyy", { locale: ptBR })}
                    {event.endDate && event.endDate !== event.startDate && (
                      <> - {format(parseISO(event.endDate), "dd/MM/yyyy", { locale: ptBR })}</>
                    )}
                  </TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(event.status)}>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="icon" asChild>
                      <Link to={`/technician/events/${event.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver Detalhes</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  Nenhum evento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TechnicianEvents;