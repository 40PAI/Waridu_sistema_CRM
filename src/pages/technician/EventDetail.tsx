import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Event, EventStatus } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Clock, Users, Archive, CheckSquare, ArrowLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

type Task = { id: string; title: string; done: boolean };

const getStatusVariant = (status: EventStatus) => {
  switch (status) {
    case 'Planejado': return 'secondary';
    case 'Em Andamento': return 'default';
    case 'Concluído': return 'outline';
    case 'Cancelado': return 'destructive';
    default: return 'secondary';
  }
};

const TechnicianEventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = React.useState<Event | null>(null);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      try {
        setLoading(true);
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;

        if (eventData) {
          const mapped: Event = {
            id: eventData.id,
            name: eventData.name,
            startDate: eventData.start_date,
            endDate: eventData.end_date,
            location: eventData.location,
            startTime: eventData.start_time || undefined,
            endTime: eventData.end_time || undefined,
            revenue: eventData.revenue || undefined,
            status: eventData.status,
            description: eventData.description || undefined,
            roster: eventData.roster || undefined,
            expenses: eventData.expenses || undefined,
          };
          setEvent(mapped);
        } else {
          setEvent(null);
        }

        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, done')
          .eq('event_id', eventId);

        if (tasksError) throw tasksError;
        setTasks((tasksData || []) as Task[]);

      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evento não encontrado</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/technician/events">Voltar para Meus Eventos</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link to="/technician/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Evento #{event.id}</span>
            <Badge variant={getStatusVariant(event.status)}>{event.status}</Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
              <p className="font-semibold">Data</p>
              <p>{format(parseISO(event.startDate), "PPP", { locale: ptBR })} - {format(parseISO(event.endDate), "PPP", { locale: ptBR })}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
              <p className="font-semibold">Horário</p>
              <p>{event.startTime || 'N/A'} - {event.endTime || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
              <p className="font-semibold">Local</p>
              <p>{event.location}</p>
            </div>
          </div>
        </CardContent>
        {event.description && (
          <>
            <Separator />
            <CardContent className="pt-6">
              <p className="font-semibold text-sm">Descrição</p>
              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
            </CardContent>
          </>
        )}
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Equipe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {event.roster?.teamLead && (
              <div>
                <p className="text-sm font-semibold">Responsável</p>
                <p className="text-sm text-muted-foreground">{event.roster.teamMembers.find(m => m.id === event.roster?.teamLead)?.name || 'Não definido'}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold">Membros</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground pl-2 mt-1">
                {event.roster?.teamMembers.map(member => (
                  <li key={member.id}>{member.name} ({member.role})</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Archive className="h-5 w-5" /> Materiais Alocados</CardTitle>
          </CardHeader>
          <CardContent>
            {event.roster?.materials && Object.keys(event.roster.materials).length > 0 ? (
              <ul className="list-disc list-inside text-sm text-muted-foreground pl-2 grid md:grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(event.roster.materials).map(([id, qty]) => (
                  <li key={id}>{id}: {qty} unidade(s)</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum material alocado para este evento.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CheckSquare className="h-5 w-5" /> Tarefas do Evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.length > 0 ? tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 text-sm p-2 border rounded-md">
              <Badge variant={task.done ? "default" : "secondary"}>{task.done ? "Concluída" : "Pendente"}</Badge>
              <span>{task.title}</span>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa específica para este evento.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicianEventDetail;