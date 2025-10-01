import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileDown } from "lucide-react";
import { parseISO, isWithinInterval, differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Event, EventStatus } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "react-day-picker";
import { showSuccess, showError } from "@/utils/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Import new modular components
import { ReportFiltersComponent } from "@/components/finance/reports/ReportFiltersComponent";
import { ConsolidatedMetricsCard } from "@/components/finance/reports/ConsolidatedMetricsCard";
import { EventProfitabilityTable } from "@/components/finance/reports/EventProfitabilityTable";
import { ExpenseCategoriesChart } from "@/components/finance/reports/ExpenseCategoriesChart";
import { DetailedEventAnalysisChart } from "@/components/finance/reports/DetailedEventAnalysisChart";

// Hooks
import { useEvents } from "@/hooks/useEvents";
import { useTechnicianCategories } from "@/hooks/useTechnicianCategories";
import { useEmployees } from "@/hooks/useEmployees";

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
      const days = differenceInDays(parseISO(event.endDate || event.startDate), parseISO(event.startDate)) + 1;
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
    return (events || []).filter(event => {
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
      <ReportFiltersComponent
        dateRange={dateRange}
        onDateChange={setDateRange}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onClearFilters={() => { setDateRange(undefined); setStatusFilter("all"); }}
      />

      {/* Consolidated Metrics */}
      <ConsolidatedMetricsCard
        revenue={consolidatedMetrics.revenue}
        costs={consolidatedMetrics.costs}
        profit={consolidatedMetrics.profit}
        eventsCount={filteredEvents.length}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Event Profitability Table */}
        <EventProfitabilityTable data={eventProfitability} />

        {/* Expense Categories Chart */}
        <ExpenseCategoriesChart data={expenseCategories} />
      </div>

      {/* Detailed Event Analysis */}
      <DetailedEventAnalysisChart data={eventProfitability} />
    </div>
  );
};

export default Reports;