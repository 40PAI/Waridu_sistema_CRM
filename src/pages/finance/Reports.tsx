import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { useEvents } from "@/hooks/useEvents";
import { useTechnicianCategories } from "@/hooks/useTechnicianCategories";
import { useEmployees } from "@/hooks/useEmployees";
import { parseISO, isWithinInterval, differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Event, EventStatus } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "react-day-picker";
import { Download, TrendingUp, TrendingDown, DollarSign, Calendar as CalendarIcon, PieChart as PieChartIcon, FileText, FileDown } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Reports = () => {
  const { events, loading: eventsLoading } = useEvents();
  const { categories, loading: categoriesLoading } = useTechnicianCategories();
  const { employees, loading: employeesLoading } = useEmployees();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = React.useState<EventStatus | "all">("all");
  const [isExportingPDF, setIsExportingPDF] = React.useState(false);

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
    return (events || []).filter(event => { // Safely access events
      const eventDate = parseISO(event.startDate);
      const withinDateRange = !dateRange?.from || !dateRange?.to || isWithinInterval(eventDate, { start: dateRange.from, end: dateRange.to });
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
    return filteredEvents.map(event => {
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
    }).sort((a, b) => b.profit - a.profit);
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
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio-financeiro-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    if (isExportingPDF || eventProfitability.length === 0) return;
    
    setIsExportingPDF(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;

      // Título
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      const title = `Relatório Financeiro - ${format(new Date(), "MMMM yyyy", { locale: ptBR })}`;
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, 25);

      // Filtros aplicados
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      let yPos = 40;
      
      doc.text("Filtros aplicados:", margin, yPos);
      yPos += 8;
      
      if (dateRange) {
        doc.text(`Período: ${format(dateRange.from!, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to!, "dd/MM/yyyy", { locale: ptBR })}`, margin, yPos);
        yPos += 6;
      }
      
      doc.text(`Status: ${statusFilter === "all" ? "Todos" : statusFilter}`, margin, yPos);
      yPos += 15;

      // Métricas consolidadas
      const metrics = [
        { label: "Receita Total", value: `AOA ${consolidatedMetrics.revenue.toLocaleString("pt-AO")}` },
        { label: "Custos Totais", value: `AOA ${consolidatedMetrics.costs.toLocaleString("pt-AO")}` },
        { label: "Lucro Líquido", value: `AOA ${consolidatedMetrics.profit.toLocaleString("pt-AO")}` },
        { label: "Margem (%)", value: `${((consolidatedMetrics.profit / consolidatedMetrics.revenue) * 100).toFixed(1)}%` }
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Métrica', 'Valor']],
        body: metrics.map(m => [m.label, m.value]),
        theme: 'grid',
        styles: { 
          fontSize: 9, 
          cellPadding: 4, 
          halign: 'left',
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold' },
          1: { halign: 'right' }
        },
        margin: { left: margin, right: margin }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Tabela de eventos
      const tableData = eventProfitability.slice(0, 15).map(event => [
        event.name.length > 20 ? `${event.name.substring(0, 17)}...` : event.name,
        event.date,
        `AOA ${event.revenue.toLocaleString("pt-AO")}`,
        `AOA ${event.costs.toLocaleString("pt-AO")}`,
        `AOA ${event.profit.toLocaleString("pt-AO")}`,
        event.status
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Evento', 'Data', 'Receita', 'Custos', 'Lucro', 'Status']],
        body: tableData,
        theme: 'striped',
        styles: { 
          fontSize: 8, 
          cellPadding: 3, 
          halign: 'left',
          overflow: 'ellipsize'
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 40, halign: 'left' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 25, halign: 'right' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 20, halign: 'center' }
        },
        didDrawPage: (data: any) => {
          // Footer em todas as páginas
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(128);
          doc.text(
            `Página ${data.pageNumber} de ${pageCount} | Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 
            margin, 
            doc.internal.pageSize.height - 10
          );
        }
      });

      // Salvar arquivo
      const fileName = `relatorio-financeiro-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      doc.save(fileName);

      showSuccess("Relatório PDF exportado com sucesso!");
    } catch (error) {
      console.error("PDF generation error:", error);
      showError("Falha ao gerar relatório PDF. Tente novamente.");
    } finally {
      setIsExportingPDF(false);
    }
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
          <Button 
            onClick={handleExportPDF} 
            variant="outline" 
            disabled={isExportingPDF || eventProfitability.length === 0}
          >
            {isExportingPDF ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                Gerando...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Personalize o período e critérios da análise.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          </div>
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
          <Button variant="outline" onClick={() => { setDateRange(undefined); setStatusFilter("all"); }}>
            Limpar Filtros
          </Button>
        </CardContent>
      </Card>

      {/* Consolidated Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AOA {consolidatedMetrics.revenue.toLocaleString("pt-AO")}</div>
            <p className="text-xs text-muted-foreground">{filteredEvents.length} eventos analisados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AOA {consolidatedMetrics.costs.toLocaleString("pt-AO")}</div>
            <p className="text-xs text-muted-foreground">Equipe + Despesas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${consolidatedMetrics.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              AOA {consolidatedMetrics.profit.toLocaleString("pt-AO")}
            </div>
            <p className="text-xs text-muted-foreground">Receita - Custos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Event Profitability Table */}
        <Card>
          <CardHeader>
            <CardTitle>Rentabilidade por Evento</CardTitle>
            <CardDescription>Análise detalhada de cada evento no período. Ordenado por lucro.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead>Custos</TableHead>
                  <TableHead>Lucro</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventProfitability.length > 0 ? eventProfitability.slice(0, 10).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium max-w-[150px] truncate">{event.name}</TableCell>
                    <TableCell>{event.date}</TableCell>
                    <TableCell>AOA {event.revenue.toLocaleString("pt-AO")}</TableCell>
                    <TableCell>AOA {event.costs.toLocaleString("pt-AO")}</TableCell>
                    <TableCell className={event.profit >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      AOA {event.profit.toLocaleString("pt-AO")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={event.status === 'Concluído' ? 'default' : event.status === 'Cancelado' ? 'destructive' : 'secondary'}>
                        {event.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Nenhum evento encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {eventProfitability.length > 10 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Mostrando os 10 eventos mais rentáveis. Total: {eventProfitability.length} eventos.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Expense Categories Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>Distribuição das despesas totais no período selecionado.</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`AOA ${value.toLocaleString("pt-AO")}`, "Valor"]} 
                    labelFormatter={(label) => `Categoria: ${label}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p>Nenhuma despesa registrada no período selecionado.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Event Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada de Eventos</CardTitle>
          <CardDescription>Comparação visual de receita vs. custos para os eventos filtrados (top 15).</CardDescription>
        </CardHeader>
        <CardContent>
          {eventProfitability.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={eventProfitability.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `AOA ${value/1000}k`} 
                />
                <Tooltip 
                  formatter={(value: number) => [`AOA ${value.toLocaleString("pt-AO")}`, ""]} 
                  labelFormatter={(label) => `Evento: ${label}`}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Receita" />
                <Bar dataKey="costs" fill="#82ca9d" name="Custos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Nenhum evento encontrado para análise detalhada.</p>
                <p className="text-sm mt-2">Ajuste os filtros para ver dados.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;