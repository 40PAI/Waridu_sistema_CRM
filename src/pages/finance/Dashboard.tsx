"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AlertCircle, TrendingUp, Wallet, DollarSign, AlertTriangle } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Event } from "@/types";
import { useEvents } from "@/hooks/useEvents";
import { useTechnicianCategories } from "@/hooks/useTechnicianCategories";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";

// Helper to format currency
const formatCurrency = (value: number) => value.toLocaleString("pt-AO", { style: "currency", currency: "AOA" });

// Helper to calculate technician costs for an event
const calculateTechnicianCosts = (event: Event, categories: { id: string; dailyRate: number }[]) => {
  if (!event.roster?.teamMembers || event.roster.teamMembers.length === 0) return 0;
  
  // Assume we have a map of employee to category (simplified; extend if needed)
  const days = differenceInDays(parseISO(event.endDate || event.startDate), parseISO(event.startDate)) + 1;
  return event.roster.teamMembers.reduce((total, member) => {
    // Simplified: assume average rate or fetch per employee; here use first category as example
    const avgRate = categories[0]?.dailyRate || 0;
    return total + (avgRate * days);
  }, 0);
};

const FinanceDashboard = () => {
  const { user } = useAuth();
  const { events, loading: eventsLoading } = useEvents();
  const { categories, loading: categoriesLoading } = useTechnicianCategories();
  const categoriesMap = React.useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  const endOfCurrentMonth = endOfMonth(now);

  // KPIs
  const currentMonthEvents = React.useMemo(() => 
    events.filter(event => {
      const eventDate = parseISO(event.startDate);
      return isWithinInterval(eventDate, { start: startOfCurrentMonth, end: endOfCurrentMonth });
    }), [events, startOfCurrentMonth, endOfCurrentMonth]
  );

  const totalRevenueThisMonth = React.useMemo(() => 
    currentMonthEvents
      .filter(e => e.status === "Concluído")
      .reduce((sum, e) => sum + (e.revenue || 0), 0), 
    [currentMonthEvents]
  );

  const totalExpensesThisMonth = React.useMemo(() => 
    currentMonthEvents
      .filter(e => e.status === "Concluído")
      .reduce((sum, e) => {
        const techCosts = calculateTechnicianCosts(e, categories);
        const otherExpenses = e.expenses?.reduce((expSum, exp) => expSum + exp.amount, 0) || 0;
        return sum + techCosts + otherExpenses;
      }, 0), 
    [currentMonthEvents, categories]
  );

  const profitMargin = React.useMemo(() => 
    totalRevenueThisMonth > 0 ? ((totalRevenueThisMonth - totalExpensesThisMonth) / totalRevenueThisMonth * 100).toFixed(1) : 0, 
    [totalRevenueThisMonth, totalExpensesThisMonth]
  );

  // Projected cash flow: future events
  const futureEvents = React.useMemo(() => 
    events.filter(e => ["Planejado", "Em Andamento"].includes(e.status) && parseISO(e.startDate) > now), 
    [events, now]
  );

  const projectedCashFlow = React.useMemo(() => {
    const projectedRevenue = futureEvents.reduce((sum, e) => sum + (e.revenue || 0), 0);
    const projectedExpenses = futureEvents.reduce((sum, e) => {
      const techCosts = calculateTechnicianCosts(e, categories);
      const otherExpenses = e.expenses?.reduce((expSum, exp) => expSum + exp.amount, 0) || 0;
      return sum + techCosts + otherExpenses;
    }, 0);
    return projectedRevenue - projectedExpenses;
  }, [futureEvents, categories]);

  // Alerts: simple rules
  const alerts = React.useMemo(() => {
    const alertList: { message: string; type: "warning" | "error" }[] = [];
    if (totalExpensesThisMonth > totalRevenueThisMonth * 0.8) {
      alertList.push({ message: "Despesas excedendo 80% da receita este mês!", type: "warning" });
    }
    if (futureEvents.length > 5 && projectedCashFlow < 0) {
      alertList.push({ message: "Fluxo de caixa negativo projetado para eventos futuros!", type: "error" });
    }
    return alertList;
  }, [totalExpensesThisMonth, totalRevenueThisMonth, futureEvents.length, projectedCashFlow]);

  // Chart data: last 6 months
  const lastSixMonths = React.useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthEvents = events.filter(e => {
        const eventDate = parseISO(e.startDate);
        return isWithinInterval(eventDate, { start: monthStart, end: monthEnd });
      });
      const revenue = monthEvents
        .filter(e => e.status === "Concluído")
        .reduce((sum, e) => sum + (e.revenue || 0), 0);
      const expenses = monthEvents
        .filter(e => e.status === "Concluído")
        .reduce((sum, e) => {
          const techCosts = calculateTechnicianCosts(e, categories);
          const otherExpenses = e.expenses?.reduce((expSum, exp) => expSum + exp.amount, 0) || 0;
          return sum + techCosts + otherExpenses;
        }, 0);
      months.push({
        name: format(monthDate, "MMM", { locale: ptBR }),
        Receita: revenue,
        Despesas: expenses,
      });
    }
    return months;
  }, [events, now, categories]);

  if (eventsLoading || categoriesLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
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
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Este Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenueThisMonth)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Este Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">-{formatCurrency(totalExpensesThisMonth)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${parseFloat(profitMargin) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {profitMargin}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluxo Projetado</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${projectedCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(projectedCashFlow)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
            <CardDescription>Atenção para itens que precisam de revisão.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <AlertTriangle className={`h-4 w-4 ${alert.type === "error" ? "text-destructive" : "text-yellow-600"}`} />
                  <span className="text-sm">{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Receita vs. Despesas (Últimos 6 Meses)</CardTitle>
          <CardDescription>Evolução financeira ao longo do tempo.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lastSixMonths}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={formatCurrency} />
              <Legend />
              <Line type="monotone" dataKey="Receita" stroke="#8884d8" name="Receita" />
              <Line type="monotone" dataKey="Despesas" stroke="#82ca9d" name="Despesas" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Acesso Rápido</CardTitle>
          <CardDescription>Navegue para análises detalhadas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" asChild className="justify-start">
              <Link to="/finance-profitability">
                Rentabilidade por Evento
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link to="/finance-calendar">
                Calendário Financeiro
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link to="/finance-costs">
                Gestão de Custos
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link to="/finance/profile">
                Meu Perfil
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceDashboard;