import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, DollarSign, Users, Archive, CalendarDays, Bell } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Event } from "@/types";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTechnicianCategories } from "@/hooks/useTechnicianCategories";

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const { categories } = useTechnicianCategories();
  const technicianName = user?.profile?.first_name || user?.email || "Técnico";
  
  const [events, setEvents] = React.useState<Event[]>([]);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Carregar dados do Supabase
  React.useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Buscar eventos onde o técnico está escalado
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('technician_id', user.id)
          .order('start_date', { ascending: true });

        if (eventsError) throw eventsError;
        
        // Formatar eventos
        const formattedEvents: Event[] = (eventsData || []).map((event: any) => ({
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
        
        // Buscar notificações do técnico
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (notificationsError) throw notificationsError;
        
        setNotifications(notificationsData || []);
        setUnreadCount((notificationsData || []).filter((n: any) => !n.read).length);
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Calcular ganhos dinamicamente com base nos eventos e categoria do técnico
  const earnings = React.useMemo(() => {
    if (!user?.profile?.technician_category_id) return [];
    
    const category = categories.find(c => c.id === user.profile.technician_category_id);
    if (!category) return [];
    
    const concludedEvents = events.filter(e => e.status === 'Concluído');
    return concludedEvents.map(event => ({
      name: event.name,
      Ganho: category.dailyRate * 1 // Assumindo 1 dia por evento; ajuste conforme necessário
    }));
  }, [events, categories, user]);

  // Filter events for this technician
  const upcomingEvents = React.useMemo(() => events.filter(e => e.status === 'Planejado' || e.status === 'Em Andamento'), [events]);
  const pastEvents = React.useMemo(() => events.filter(e => e.status === 'Concluído'), [events]);
  
  const totalUpcoming = upcomingEvents.length;
  const totalPast = pastEvents.length;
  const totalEarnings = earnings.reduce((sum, item) => sum + item.Ganho, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Bem-vindo, {technicianName}!</h1>
          <p className="text-muted-foreground">Aqui está um resumo das suas atividades.</p>
        </div>
        <Button variant="outline" size="icon" asChild>
          <Link to="/technician/notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs">
                {unreadCount}
              </Badge>
            )}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Futuros</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUpcoming}</div>
            <p className="text-xs text-muted-foreground">Eventos agendados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPast}</div>
            <p className="text-xs text-muted-foreground">Eventos finalizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganhos Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AOA {totalEarnings.toLocaleString('pt-AO')}</div>
            <p className="text-xs text-muted-foreground">Nos últimos eventos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Itens na checklist</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ganhos por Evento</CardTitle>
            <CardDescription>Seu ganho em cada evento concluído.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={earnings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `AOA ${value/1000}k`}/>
                <Tooltip formatter={(value) => [`AOA ${Number(value).toLocaleString('pt-AO')}`, 'Ganho']} />
                <Legend />
                <Bar dataKey="Ganho" fill="#8884d8" name="Ganho (AOA)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
            <CardDescription>Navegue rapidamente para as áreas mais importantes.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link to="/technician/calendar">
              <Button variant="outline" className="w-full justify-start">
                <CalendarDays className="mr-2 h-4 w-4" />
                Meu Calendário
              </Button>
            </Link>
            <Link to="/technician/events">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Lista de Eventos
              </Button>
            </Link>
            <Link to="/technician/tasks">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="mr-2 h-4 w-4" />
                Minhas Tarefas
              </Button>
            </Link>
            <Link to="/technician/profile">
              <Button variant="outline" className="w-full justify-start">
                <Archive className="mr-2 h-4 w-4" />
                Meu Perfil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TechnicianDashboard;