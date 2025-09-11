import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, Wallet, Briefcase, Download } from "lucide-react";
import * as React from "react";
import { TechnicianCategory } from "@/hooks/useTechnicianCategories";
import { Event, EventStatus } from "@/types";
import { Employee } from "@/components/employees/EmployeeDialog";
import { parseISO, format, differenceInDays, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";

// --- Helper Functions ---
const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 2 });
};

const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Concluído': return 'default';
      case 'Planejado': return 'secondary';
      case 'Em Andamento': return 'secondary';
      case 'Cancelado': return 'destructive';
      default: return 'outline';
    }
};

interface FinanceDashboardProps {
  events: Event[];
  employees: Employee[];
  categories: TechnicianCategory[];
}

// --- Main Component ---
const FinanceDashboard = ({ events, employees, categories }: FinanceDashboardProps) => {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = React.useState<EventStatus | "all">("all");

  // Criar mapas para acesso rápido
  const categoryMap = React.useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach(c => map.set(c.id, c.dailyRate));
    return map;
  }, [categories]);

  const employeeMap = React.useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach(e => map.set(e.id, e));
    return map;
  }, [employees]);

  // Função para calcular o custo de pessoal de um evento
  const calculatePersonnelCost = React.useCallback((event: Event): number => {
    if (!event.roster?.teamMembers || event.roster.teamMembers.length === 0) return 0;

    const eventStart = parseISO(event.startDate);
    const eventEnd = parseISO(event.endDate);
    const durationInDays = differenceInDays(eventEnd, eventStart) + 1;
    if (durationInDays <= 0) return 0;

    let totalCost = 0;
    for (const member of event.roster.teamMembers) {
        const employee = employeeMap.get(member.id);
        if (employee?.technicianCategoryId) {
            const dailyRate = categoryMap.get(employee.technicianCategoryId);
            if (dailyRate) {
                totalCost += dailyRate * durationInDays;
            }
        }
    }
    return totalCost;
  }, [employeeMap, categoryMap]);

  // Filtrar eventos com base em data e status
  const filteredEvents = React.useMemo(() => {
    return events.filter(event => {
      const eventStartDate = parseISO(event.startDate);
      const eventEndDate = parseISO(event.endDate);

      const matchesDateRange = dateRange?.from
        ? isWithinInterval(eventStartDate, { start: dateRange.from, end: dateRange.to || eventStartDate }) ||
          isWithinInterval(eventEndDate, { start: dateRange.from, end: dateRange.to || eventEndDate }) ||
          (eventStartDate < dateRange.from && eventEndDate > (dateRange.to || eventEndDate))
        : true;

      const matchesStatus = statusFilter === "all" || event.status === statusFilter;

      return matchesDateRange && matchesStatus;
    });
  }, [events, dateRange, statusFilter]);

  // Processar dados financeiros com base nos eventos filtrados
  const processedFinancialData = React.useMemo(() => {
    const completedEvents = filteredEvents.filter(e => e.status === 'Concluído' && e.revenue);

    const eventProfitability = completedEvents.map(event => {
      const personnelCost = calculatePersonnelCost(event);
      const otherExpenses = event.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
      const totalCost = personnelCost + otherExpenses;
      const profit = (event.revenue || 0) - totalCost;
      return {
        id: event.id,
        name: event.name,
        date: format(parseISO(event.startDate), 'dd/MM/yyyy', { locale: ptBR }),
        revenue: event.revenue || 0,
        cost: totalCost,
        profit: profit,
        status: 'Concluído',
      };
    });

    const monthlyPerformance: Record<string, { receita: number; custos: number; lucro: number }> = {};
    eventProfitability.forEach(event => {
      const eventDate = parseISO(events.find(e => e.id === event.id)!.startDate);
      const monthKey = format(eventDate, 'MMM yyyy', { locale: ptBR });
      if (!monthlyPerformance[monthKey]) {
        monthlyPerformance[monthKey] = { receita: 0, custos: 0, lucro: 0 };
      }
      monthlyPerformance[monthKey].receita += event.revenue;
      monthlyPerformance[monthKey].custos += event.cost;
      monthlyPerformance[monthKey].lucro += event.profit;
    });

    const monthlyPerformanceData = Object.entries(monthlyPerformance)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => parseISO(`01 ${a.month}`)!.getTime() - parseISO(`01 ${b.month}`)!.getTime());

    let totalPersonnelCost = 0;
    let totalOtherExpenses = 0;
    completedEvents.forEach(event => {
      totalPersonnelCost += calculatePersonnelCost(event);
      totalOtherExpenses += event.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    });

    const costBreakdownData = [
      { name: 'Custos de Pessoal', value: totalPersonnelCost },
      { name: 'Outras Despesas', value: totalOtherExpenses },
    ];

    return { eventProfitability, monthlyPerformanceData, costBreakdownData };
  }, [filteredEvents, calculatePersonnelCost, events]);

  const { eventProfitability, monthlyPerformanceData, costBreakdownData } = processedFinancialData;

  const totalRevenue = monthlyPerformanceData.reduce((sum, item) => sum + item.receita, 0);
  const totalCosts = monthlyPerformanceData.reduce((sum, item) => sum + item.custos, 0);
  const averageMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  const handleExport = () => {
    if (eventProfitability.length === 0) {
      showError("Não há dados para exportar com os filtros atuais.");
      return;
    }

    const headers = ["Evento", "Data", "Receita", "Custo", "Lucro", "Status"];
    const rows = eventProfitability.map(event => [
      `"${event.name.replace(/"/g, '""')}"`,
      event.date,
      event.revenue,
      event.cost,
      event.profit,
      event.status
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const formattedDate = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `relatorio_financeiro_${formattedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Visão geral do desempenho financeiro da empresa.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EventStatus | "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="Planejado">Planejado</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
              <SelectItem value="Cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita (Período)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">Faturamento total no período selecionado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custos (Período)</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalCosts)}</div>
              <p className="text-xs text-muted-foreground">Despesas operacionais no período selecionado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido (Período)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue - totalCosts)}</div>
              <p className="text-xs text-muted-foreground">Resultado final no período selecionado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageMargin.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">Margem de lucro média no período</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Desempenho Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(value) => `${(value as number / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="receita" fill="#8884d8" name="Receita" />
                  <Bar dataKey="custos" fill="#82ca9d" name="Custos" />
                  <Bar dataKey="lucro" fill="#ffc658" name="Lucro" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Análise de Custos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={costBreakdownData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {costBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rentabilidade por Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Lucro</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventProfitability.length > 0 ? eventProfitability.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{event.date}</TableCell>
                    <TableCell>{formatCurrency(event.revenue)}</TableCell>
                    <TableCell>{formatCurrency(event.cost)}</TableCell>
                    <TableCell className={event.profit > 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(event.profit)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(event.status)}>{event.status}</Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      Nenhum evento concluído para exibir no período/status selecionado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceDashboard;