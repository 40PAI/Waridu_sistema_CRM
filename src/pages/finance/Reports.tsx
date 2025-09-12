import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { useEvents } from "@/hooks/useEvents";
import { useTechnicianCategories } from "@/hooks/useTechnicianCategories";
import { useEmployees } from "@/hooks/useEmployees";
import { parseISO, isWithinInterval, differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Event, EventStatus } from "@/types";
import { Download, TrendingUp, TrendingDown, DollarSign, Calendar as CalendarIcon, PieChart as PieChartIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "react-day-picker";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Reports = () => {
  const { events, loading: eventsLoading } = useEvents();
  const { categories, loading: categoriesLoading } = useTechnicianCategories();
  const { employees, loading: employeesLoading } = useEmployees();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = React.useState<EventStatus | "all">("all");
  const reportRef = React.useRef<HTMLDivElement>(null);

  const rateMap = React.useMemo(() => new Map(categories.map(c => [c.id, c.dailyRate])), [categories]);
  const empMap = React.useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  const calculateEventCosts = React.useCallback((event: Event) => {
    let techCosts = 0;
    if (event.roster?.teamMembers) {
      const days = differenceInDays(parseISO(event.endDate), parseISO(event.startDate)) + 1;
      event.roster.teamMembers.forEach((member: any) => {
        const employee = empMap.get(member.id);
        const categoryId = employee?.technicianCategoryId;
        const rate = categoryId ? rateMap.get(categoryId) || 0 : 0;
        techCosts += rate * days;
      });
    }
    const otherExpenses = event.expenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0;
    return techCosts + otherExpenses;
  }, [rateMap, empMap]);

  const filteredEvents = React.useMemo(() => {
    return events.filter(event => {
      const eventDate = parseISO(event.startDate);
      const withinDateRange =
        !dateRange?.from ||
        !dateRange?.to ||
        isWithinInterval(eventDate, { start: dateRange.from, end: dateRange.to });
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      return withinDateRange && matchesStatus;
    });
  }, [events, dateRange, statusFilter]);

  const consolidatedMetrics = React.useMemo(() => {
    const revenue = filteredEvents.reduce((sum, e) => sum + (e.revenue || 0), 0);
    const costs = filteredEvents.reduce((sum, e) => sum + calculateEventCosts(e), 0);
    const profit = revenue - costs;
    return { revenue, costs, profit };
  }, [filteredEvents, calculateEventCosts]);

  const eventProfitability = React.useMemo(() => {
    return filteredEvents
      .map(event => {
        const revenue = event.revenue || 0;
        const costs = calculateEventCosts(event);
        const profit = revenue - costs;
        return {
          id: event.id,
          name: event.name,
          date: format(parseISO(event.startDate), "dd/MM/yyyy", { locale: ptBR }),
          revenue,
          costs,
          profit,
          status: event.status
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [filteredEvents, calculateEventCosts]);

  const expenseCategories = React.useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    filteredEvents.forEach(event => {
      event.expenses?.forEach((expense: any) => {
        const category = expense.category || "Outros";
        categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0);
      });
    });
    return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
  }, [filteredEvents]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const exportToCSV = () => {
    const csvContent = [
      ["Evento", "Data", "Receita", "Custos", "Lucro", "Status"],
      ...eventProfitability.map(e => [
        e.name,
        e.date,
        e.revenue.toString(),
        e.costs.toString(),
        e.profit.toString(),
        e.status
      ])
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-financeiro-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`relatorio-financeiro-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  if (eventsLoading || categoriesLoading || employeesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Relatórios Financeiros Detalhados</h1>
          <p className="text-muted-foreground">Análise completa da saúde financeira da empresa.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={exportToPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div ref={reportRef}>
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Personalize o período e critérios da análise.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-[200px]">
              <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as EventStatus | "all")}>
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
            <Button variant="outline" onClick={() => { setDateRange(undefined); setStatusFilter("all"); }}>
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
        {/* ... restante do conteúdo (tabelas e gráficos) ... */}
      </div>
    </div>
  );
};

export default Reports;