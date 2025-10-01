import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Calendar, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEvents } from "@/hooks/useEvents";
import { useTechnicianCategories } from "@/hooks/useTechnicianCategories";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import type { Event } from "@/types";

const FinanceDashboard = () => {
  const { events, loading: eventsLoading } = useEvents();
  const { categories, loading: categoriesLoading } = useTechnicianCategories();
  const { user } = useAuth();

  // For simplicity, only consider recorded expenses on the event as costs.
  // Technician category costs are handled in detailed pages.
  const calculateEventCosts = React.useCallback((event: Event) => {
    const otherExpenses = event.expenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0;
    return otherExpenses;
  }, []);

  const currentMonth = React.useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const monthEvents = (events || []).filter(e => // Safely access events
      e.status === "Concluído" && isWithinInterval(parseISO(e.startDate), { start, end })
    );
    const revenue = monthEvents.reduce((sum, e) => sum + (e.revenue || 0), 0);
    const costs = monthEvents.reduce((sum, e) => sum + calculateEventCosts(e), 0);
    const profit = revenue - costs;
    return { revenue, costs, profit };
  }, [events, calculateEventCosts]);

  const projectedCashFlow = React.useMemo(() => {
    const futureEvents = (events || []).filter(e => e.status === "Planejado" || e.status === "Em Andamento"); // Safely access events
    const projectedRevenue = futureEvents.reduce((sum, e) => sum + (e.revenue || 0), 0);
    const projectedCosts = futureEvents.reduce((sum, e) => sum + calculateEventCosts(e), 0);
    return projectedRevenue - projectedCosts;
  }, [events, calculateEventCosts]);

  const chartData = React.useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const monthEvents = (events || []).filter(e => // Safely access events
        e.status === "Concluído" && isWithinInterval(parseISO(e.startDate), { start, end })
      );
      const revenue = monthEvents.reduce((sum, e) => sum + (e.revenue || 0), 0);
      const costs = monthEvents.reduce((sum, e) => sum + calculateEventCosts(e), 0);
      data.push({
        month: format(monthDate, "MMM", { locale: ptBR }),
        Receita: revenue,
        Despesas: costs,
      });
    }
    return data;
  }, [events, calculateEventCosts]);

  const alerts = React.useMemo(() => {
    const alertsList = [];
    if (currentMonth.revenue > 0 && currentMonth.costs > currentMonth.revenue * 0.8) {
      alertsList.push("Despesas excedendo 80% da receita mensal.");
    }
    if (projectedCashFlow < 0) {
      alertsList.push("Fluxo de caixa projetado negativo.");
    }
    return alertsList;
  }, [currentMonth, projectedCashFlow]);

  if (eventsLoading || categoriesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Visão geral das finanças e projeções.</p>
        </div>
        <Badge variant="outline">{user?.profile?.role || "Financeiro"}</Badge>
      </div>

      {alerts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-5 w-5" />
              Alertas Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400">
              {alerts.map((alert, idx) => <li key={idx}>{alert}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AOA {currentMonth.revenue.toLocaleString("pt-AO")}</div>
            <p className="text-xs text-muted-foreground">Eventos concluídos este mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Mensais</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AOA {currentMonth.costs.toLocaleString("pt-AO")}</div>
            <p className="text-xs text-muted-foreground">Custos registrados nos eventos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentMonth.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              AOA {currentMonth.profit.toLocaleString("pt-AO")}
            </div>
            <p className="text-xs text-muted-foreground">Receita - Despesas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluxo Projetado</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${projectedCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
              AOA {projectedCashFlow.toLocaleString("pt-AO")}
            </div>
            <p className="text-xs text-muted-foreground">Eventos futuros</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receita vs. Despesas (Últimos 6 Meses)</CardTitle>
          <CardDescription>Comparação mensal de finanças.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `AOA ${value / 1000}k`} />
              <Tooltip formatter={(value: number) => [`AOA ${value.toLocaleString("pt-AO")}`, ""]} />
              <Legend />
              <Line type="monotone" dataKey="Receita" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey="Despesas" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Rentabilidade Detalhada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Veja lucro por evento.</p>
            <Button asChild variant="outline">
              <Link to="/finance-profitability">Ver Detalhes</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendário Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Eventos com receita.</p>
            <Button asChild variant="outline">
              <Link to="/finance-calendar">Ver Calendário</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Gestão de Custos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Ajuste taxas de técnicos.</p>
            <Button asChild variant="outline">
              <Link to="/finance-costs">Gerenciar Custos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceDashboard;