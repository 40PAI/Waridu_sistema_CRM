import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EventStatus } from "@/types";

type EventRow = {
  id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  status: EventStatus;
  description: string | null;
};

const TechnicianEventDetail = () => {
  const { eventId } = useParams();
  const [event, setEvent] = React.useState<EventRow | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', Number(eventId))
        .maybeSingle();
      if (!error) {
        setEvent(data as EventRow | null);
      } else {
        console.error("Error loading event:", error);
        setEvent(null);
      }
      setLoading(false);
    };
    load();
  }, [eventId]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><p>Carregando...</p></div>;
  }

  if (!event) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evento não encontrado</CardTitle>
          <CardDescription>Verifique o identificador e tente novamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/technician/events" className="underline text-sm">Voltar</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{event.name}</CardTitle>
        <CardDescription>{event.location || "Local não informado"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge variant={event.status === "Concluído" ? "default" : event.status === "Cancelado" ? "destructive" : "secondary"}>
            {event.status}
          </Badge>
        </div>
        {event.description && <p className="text-sm">{event.description}</p>}
        <Link to="/technician/events" className="underline text-sm">Voltar para lista</Link>
      </CardContent>
    </Card>
  );
};

export default TechnicianEventDetail;