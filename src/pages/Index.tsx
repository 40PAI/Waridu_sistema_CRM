import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, CheckCircle, Calendar, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEvents } from "@/hooks/useEvents";
import { useMaterials } from "@/hooks/useMaterials";
import type { Event } from "@/types";
import { parseISO, isWithinInterval, startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

// --- Helper Functions ---
const getMaterialStatusVariant = (status: string) => {
    switch (status) {
      case 'Disponível': return 'default';
      case 'Em uso': return 'secondary';
      case 'Manutenção': return 'destructive';
      default: return 'outline';
    }
};

const getEventStatusVariant = (status: string) => {
    switch (status) {
      case 'Concluído': return 'default';
      case 'Cancelado': return 'destructive';
      default: return 'secondary';
    }
};

// --- Sub-components ---
const MaterialStatusList = ({ materials }: { materials: any[] }) => {
    const activeMaterials = useMemo(() => materials.filter(m => m.status !== 'Disponível'), [materials]);
    return (
        <div className="space-y-4">
            {activeMaterials.length > 0 ? activeMaterials.map((item) => (
                <div className="flex items-center" key={item.id}>
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="ml-auto font-medium">
                        <Badge variant={getMaterialStatusVariant(item.status)}>{item.status}</Badge>
                    </div>
                </div>
            )) : (
                <p className="text-sm text-muted-foreground text-center">Todos os materiais estão disponíveis.</p>
            )}
        </div>
    );
};

// --- Main Dashboard Component ---
const Dashboard = () => {
  const { events } = useEvents();
  const { materials: pageMaterials } = useMaterials();

  // --- Data Processing ---
  const totalItems = useMemo(() => pageMaterials.reduce((sum, item) => sum + item.quantity, 0), [pageMaterials]);
  const availableItems = useMemo(() => pageMaterials.filter(m => m.status === 'Disponível').reduce((sum, item) => sum + item.quantity, 0), [pageMaterials]);

  const now = new Date();
  const startOfThisMonth = startOfMonth(now);
  const endOfThisMonth = endOfMonth(now);
  const totalEventsThisMonth = useMemo(() => events.filter(event => {
      const eventDate = parseISO(event.startDate);
      return isWithinInterval(eventDate, { start: startOfThisMonth, end: endOfThisMonth });
  }).length, [events, startOfThisMonth, endOfThisMonth]);

  const lastFourMonths = useMemo(() => Array.from({ length: 4 }, (_, i) => subMonths(now, i)).reverse(), [now]);
  const financeData = useMemo(() => lastFourMonths.map(monthDate => {
      const monthKey = format(monthDate, 'MMM', { locale: ptBR });
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const revenueForMonth = events
          .filter(e => (e.status === 'Concluído') && isWithinInterval(parseISO(e.startDate), { start, end }))
          .reduce((sum, e) => sum + (e.revenue || 0), 0);
      
      const expensesForMonth = events
          .filter(e => (e.status === 'Concluído') && isWithinInterval(parseISO(e.startDate), { start, end }))
          .reduce((sum, e) => sum + (e.expenses?.reduce((expSum, exp) => expSum + exp.amount, 0) || 0), 0);

      return { name: monthKey, Receita: revenueForMonth, Despesa: expensesForMonth };
  }), [events, lastFourMonths]);

  const totalRevenue = useMemo(() => financeData.reduce((sum, item) => sum + item.Receita, 0), [financeData]);

  const categoryData = useMemo(() => pageMaterials.reduce((acc, item) => {
    const category = acc.find(c => c.name === item.category);
    if (category) {
      category.quantidade += item.quantity;
    } else {
      acc.push({ name: item.category, quantidade: item.quantity });
    }
    return acc;
  }, [] as { name: string; quantidade: number }[]), [pageMaterials]);

  const recentEvents = useMemo(() => events
    .sort((a, b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime())
    .slice(0, 4)
    .map(e => ({
        id: e.id,
        name: e.name,
        date: format(parseISO(e.startDate), 'dd/MM/yyyy', { locale: ptBR }),
        status: e.status
    })), [events]);

  return (
    <div className="flex-1 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Itens totais no inventário</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableItems}</div>
            <p className="text-xs text-muted-foreground">Itens prontos para uso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Este Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEventsThisMonth}</div>
            <p className="text-xs text-muted-foreground">Eventos agendados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AOA {totalRevenue.toLocaleString('pt-AO')}</div>
            <p className="text-xs text-muted-foreground">Últimos 4 meses</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receita vs. Despesas</CardTitle>
            <CardDescription>Comparação mensal dos últimos 4 meses.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `AOA ${value/1000}k`}/>
                <Tooltip formatter={(value) => [`AOA ${Number(value).toLocaleString('pt-AO')}`, ""]} />
                <Legend />
                <Bar dataKey="Receita" fill="#8884d8" name="Receita (AOA)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesa" fill="#82ca9d" name="Despesa (AOA)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Eventos Recentes</CardTitle>
            <CardDescription>Últimos eventos criados.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{event.date}</TableCell>
                    <TableCell>
                      <Badge variant={getEventStatusVariant(event.status)}>{event.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;