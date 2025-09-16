import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { parseISO, isWithinInterval, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Event } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "react-day-picker";
import { Download, TrendingUp, TrendingDown, DollarSign, Calendar as CalendarIcon, PieChart as PieChartIcon, FileText, FileDown, Users, Target, BarChart3 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Link } from "react-router-dom";

const Reports = () => {
  const { events, loading: eventsLoading } = useEvents();
  const { clients, loading: clientsLoading } = useClients();
  const { services, loading: servicesLoading } = useServices();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [isExportingPDF, setIsExportingPDF] = React.useState(false);

  const projects = React.useMemo(() => events.filter((event) => !!event.pipeline_status), [events]);

  // Filter by date range
  const filteredProjects = React.useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return projects;
    return projects.filter((project) => {
      const projectDate = parseISO(project.startDate);
      return isWithinInterval(projectDate, { start: dateRange.from!, end: dateRange.to! });
    });
  }, [projects, dateRange]);

  // Pipeline metrics
  const pipelineStats = React.useMemo(() => {
    const stats = {
      '1º Contato': 0,
      'Orçamento': 0,
      'Negociação': 0,
      'Confirmado': 0
    } as Record<string, number>;

    filteredProjects.forEach(project => {
      if (project.pipeline_status && stats[project.pipeline_status] !== undefined) {
        stats[project.pipeline_status] = (stats[project.pipeline_status] || 0) + 1;
      }
    });

    return stats;
  }, [filteredProjects]);

  const pipelineData = React.useMemo(() => {
    return Object.entries(pipelineStats).map(([name, value]) => ({
      name,
      value,
      percentage: projects.length > 0 ? ((value / projects.length) * 100).toFixed(1) : '0'
    }));
  }, [pipelineStats, projects.length]);

  // Financial metrics for CRM (estimated values)
  const financialMetrics = React.useMemo(() => {
    const totalEstimated = filteredProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0);
    const confirmedValue = filteredProjects
      .filter(p => p.pipeline_status === 'Confirmado')
      .reduce((sum, p) => sum + (p.estimated_value || 0), 0);

    return { totalEstimated, confirmedValue };
  }, [filteredProjects]);

  // Clients by status or activity
  const clientStats = React.useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.updated_at && new Date(c.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
    const highValueClients = clients.filter(c => c.notes?.includes('alto valor') || false).length;

    return { totalClients, activeClients, highValueClients };
  }, [clients]);

  // Services most requested
  const serviceStats = React.useMemo(() => {
    const serviceCounts: Record<string, number> = {};
    filteredProjects.forEach(project => {
      if (project.service_ids && Array.isArray(project.service_ids)) {
        project.service_ids.forEach(serviceId => {
          serviceCounts[serviceId] = (serviceCounts[serviceId] || 0) + 1;
        });
      }
    });

    return Object.entries(serviceCounts)
      .map(([serviceId, count]) => ({
        name: services.find(s => s.id === serviceId)?.name || serviceId,
        value: count,
        percentage: filteredProjects.length > 0 ? ((count / filteredProjects.length) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredProjects, services]);

  // Recent projects
  const recentProjects = React.useMemo(() => {
    return filteredProjects
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 5);
  }, [filteredProjects]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const exportToCSV = () => {
    const csvContent = [
      ["Projeto", "Cliente", "Status", "Serviços", "Valor Estimado", "Data Início"],
      ...recentProjects.map(p => [
        p.name,
        clients.find(c => c.id === p.client_id)?.name || 'Não definido',
        p.pipeline_status,
        p.service_ids?.join(', ') || '',
        p.estimated_value?.toString() || '',
        format(new Date(p.startDate), 'dd/MM/yyyy', { locale: ptBR })
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio-crm-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    if (isExportingPDF || recentProjects.length === 0) return;

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
      const title = `Relatório CRM - ${format(new Date(), "MMMM yyyy", { locale: ptBR })}`;
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
        { label: "Projetos Totais", value: filteredProjects.length.toString() },
        { label: "Valor Estimado Total", value: `AOA ${financialMetrics.totalEstimated.toLocaleString("pt-AO")}` },
        { label: "Valor Confirmado", value: `AOA ${financialMetrics.confirmedValue.toLocaleString("pt-AO")}` },
        { label: "Clientes Totais", value: clients.length.toString() },
        { label: "Clientes Ativos (30d)", value: clientStats.activeClients.toString() },
        { label: "Clientes Alto Valor", value: clientStats.highValueClients.toString() }
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

      // Tabela de projetos recentes
      const tableData = recentProjects.slice(0, 15).map(project => [
        project.name.length > 20 ? `${project.name.substring(0, 17)}...` : project.name,
        clients.find(c => c.id === project.client_id)?.name || 'Não definido',
        project.pipeline_status,
        project.service_ids?.length || 0,
        project.estimated_value ? `AOA ${project.estimated_value.toLocaleString("pt-AO")}` : 'N/A',
        format(new Date(project.startDate), "dd/MM/yyyy", { locale: ptBR })
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Projeto', 'Cliente', 'Status', 'Serviços', 'Valor Estimado', 'Data Início']],
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
          1: { cellWidth: 30, halign: 'left' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 25, halign: 'center' }
        },
        didDrawPage: (data: any) => {
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

      const fileName = `relatorio-crm-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      doc.save(fileName);

      showSuccess("Relatório CRM PDF exportado com sucesso!");
    } catch (error) {
      console.error("PDF generation error:", error);
      showError("Falha ao gerar relatório CRM PDF. Tente novamente.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case '1º Contato': return <Badge className="bg-gray-100 text-gray-800">1º Contato</Badge>;
      case 'Orçamento': return <Badge className="bg-blue-100 text-blue-800">Orçamento</Badge>;
      case 'Negociação': return <Badge className="bg-yellow-100 text-yellow-800">Negociação</Badge>;
      case 'Confirmado': return <Badge className="bg-green-100 text-green-800">Confirmado</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">1º Contato</Badge>;
    }
  };

  if (eventsLoading || clientsLoading || servicesLoading) {
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
          <h1 className="text-2xl font-bold">Relatórios CRM</h1>
          <p className="text-muted-foreground">Análises detalhadas do pipeline e atividades comerciais.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            disabled={isExportingPDF || recentProjects.length === 0}
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

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Personalize o período e critérios da análise.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as string)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="1º Contato">1º Contato</SelectItem>
              <SelectItem value="Orçamento">Orçamento</SelectItem>
              <SelectItem value="Negociação">Negociação</SelectItem>
              <SelectItem value="Confirmado">Confirmado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setDateRange(undefined); setStatusFilter("all"); }}>
            Limpar Filtros
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Totais</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProjects.length}</div>
            <p className="text-xs text-muted-foreground">Projetos no pipeline</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Estimado Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AOA {financialMetrics.totalEstimated.toLocaleString("pt-AO")}</div>
            <p className="text-xs text-muted-foreground">Soma de todos os projetos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Confirmado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financialMetrics.confirmedValue >= 0 ? "text-green-600" : "text-red-600"}`}>
              AOA {financialMetrics.confirmedValue.toLocaleString("pt-AO")}
            </div>
            <p className="text-xs text-muted-foreground">Projetos confirmados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição do Pipeline</CardTitle>
            <CardDescription>Status atual dos projetos no pipeline.</CardDescription>
          </CardHeader>
          <CardContent>
            {pipelineData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pipelineData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} projetos`, "Quantidade"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Nenhum projeto no pipeline ainda.</p>
                <p className="text-sm mt-2">Comece criando seu primeiro projeto!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Serviços Mais Solicitados</CardTitle>
            <CardDescription>Projetos por tipo de serviço.</CardDescription>
          </CardHeader>
          <CardContent>
            {serviceStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={serviceStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value} projetos`, "Quantidade"]} />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Nenhum serviço solicitado ainda.</p>
                <p className="text-sm mt-2">Adicione serviços aos projetos.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projetos Recentes</CardTitle>
          <CardDescription>Últimos projetos adicionados ao pipeline.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects.length > 0 ? recentProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{project.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    {format(new Date(project.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusBadge(project.pipeline_status || '1º Contato')}
                  {project.estimated_value && (
                    <div className="text-right">
                      <p className="font-medium">AOA {project.estimated_value.toLocaleString('pt-AO')}</p>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Nenhum projeto recente.</p>
                <p className="text-sm mt-2">Comece criando seu primeiro projeto!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Adicione e organize seus clientes.</p>
            <Button asChild variant="outline">
              <Link to="/crm/clients">Ver Clientes</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Pipeline de Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Acompanhe o progresso dos projetos.</p>
            <Button asChild variant="outline">
              <Link to="/crm/projects">Ver Projetos</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Relatórios Detalhados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Análises do pipeline e conversões.</p>
            <Button asChild variant="outline">
              <Link to="/crm/reports">Ver Relatórios</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;