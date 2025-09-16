import * as React from "react";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import ReportsFilters from "@/components/crm/ReportsFilters";
import MetricsCards from "@/components/crm/MetricsCards";
import PipelinePie from "@/components/crm/PipelinePie";
import ServiceBar from "@/components/crm/ServiceBar";
import ProjectsTable from "@/components/crm/ProjectsTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Download, FileDown } from "lucide-react";
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

  // derive projects that have CRM fields
  const projects = React.useMemo(() => events.filter(e => !!e.pipeline_status), [events]);

  const filteredProjects = React.useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return projects;
    return projects.filter(p => {
      const d = new Date(p.startDate);
      return d >= dateRange.from! && d <= dateRange.to!;
    });
  }, [projects, dateRange]);

  const pipelineStats = React.useMemo(() => {
    const stats: Record<string, number> = { '1º Contato': 0, 'Orçamento': 0, 'Negociação': 0, 'Confirmado': 0 };
    filteredProjects.forEach(p => {
      if (p.pipeline_status && stats[p.pipeline_status] !== undefined) {
        stats[p.pipeline_status] = (stats[p.pipeline_status] || 0) + 1;
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

  const financialMetrics = React.useMemo(() => {
    const totalEstimated = filteredProjects.reduce((s, p) => s + (p.estimated_value || 0), 0);
    const confirmedValue = filteredProjects.filter(p => p.pipeline_status === 'Confirmado').reduce((s, p) => s + (p.estimated_value || 0), 0);
    return { totalEstimated, confirmedValue };
  }, [filteredProjects]);

  const serviceStats = React.useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProjects.forEach(p => {
      if (p.service_ids && Array.isArray(p.service_ids)) {
        p.service_ids.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
      }
    });
    return Object.entries(counts).map(([id, value]) => ({
      name: services.find(s => s.id === id)?.name || id,
      value,
      percentage: filteredProjects.length ? ((value / filteredProjects.length) * 100).toFixed(1) : '0'
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [filteredProjects, services]);

  const recentProjects = React.useMemo(() => filteredProjects.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 5), [filteredProjects]);

  const clientStats = React.useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.updated_at && new Date(c.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
    const highValueClients = clients.filter(c => c.notes?.includes('alto valor') || false).length;
    return { totalClients, activeClients, highValueClients };
  }, [clients]);

  const clientsMap = React.useMemo(() => clients.reduce<Record<string, any>>((acc, c) => { acc[c.id] = c; return acc; }, {}), [clients]);

  const handleClear = () => {
    setDateRange(undefined);
    setStatusFilter("all");
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Projeto", "Cliente", "Status", "Serviços", "Valor Estimado", "Data Início"],
      ...recentProjects.map(p => [
        p.name,
        clients.find(c => c.id === p.client_id)?.name || 'Não definido',
        p.pipeline_status || '',
        p.service_ids?.join(', ') || '',
        p.estimated_value?.toString() || '',
        format(new Date(p.startDate), 'dd/MM/yyyy', { locale: ptBR })
      ])
    ].map(r => r.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `relatorio-crm-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    if (isExportingPDF || recentProjects.length === 0) return;
    setIsExportingPDF(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      const title = `Relatório CRM - ${format(new Date(), "MMMM yyyy", { locale: ptBR })}`;
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, 25);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      let yPos = 40;
      doc.text("Filtros aplicados:", margin, yPos); yPos += 8;
      if (dateRange) {
        doc.text(`Período: ${format(dateRange.from!, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to!, "dd/MM/yyyy", { locale: ptBR })}`, margin, yPos);
        yPos += 6;
      }
      doc.text(`Status: ${statusFilter === "all" ? "Todos" : statusFilter}`, margin, yPos); yPos += 15;
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
        styles: { fontSize: 9, cellPadding: 4, halign: 'left', overflow: 'linebreak' },
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { halign: 'left', fontStyle: 'bold' }, 1: { halign: 'right' } },
        margin: { left: margin, right: margin }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
      const tableData = recentProjects.slice(0, 15).map(project => [
        project.name.length > 20 ? `${project.name.substring(0, 17)}...` : project.name,
        clients.find(c => c.id === project.client_id)?.name || 'Não definido',
        project.pipeline_status || '',
        project.service_ids?.length || 0,
        project.estimated_value ? `AOA ${project.estimated_value.toLocaleString("pt-AO")}` : 'N/A',
        format(new Date(project.startDate), "dd/MM/yyyy", { locale: ptBR })
      ]);
      autoTable(doc, {
        startY: yPos,
        head: [['Projeto', 'Cliente', 'Status', 'Serviços', 'Valor Estimado', 'Data Início']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 3, halign: 'left', overflow: 'ellipsize' },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
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
          doc.text(`Página ${data.pageNumber} de ${pageCount} | Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}`, margin, doc.internal.pageSize.height - 10);
        }
      });
      const fileName = `relatorio-crm-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      doc.save(fileName);
      showSuccess("Relatório CRM PDF exportado com sucesso!");
    } catch (err) {
      console.error("PDF generation error:", err);
      showError("Falha ao gerar relatório PDF.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (eventsLoading || clientsLoading || servicesLoading) {
    return <div className="space-y-6"><div>Carregando...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Relatórios CRM</h1>
          <p className="text-muted-foreground">Análises detalhadas do pipeline e atividades comerciais.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline"><Download className="mr-2 h-4 w-4" />Exportar CSV</Button>
          <Button onClick={handleExportPDF} variant="outline" disabled={isExportingPDF || recentProjects.length === 0}>
            {isExportingPDF ? "Gerando..." : <><FileDown className="mr-2 h-4 w-4" />Exportar PDF</>}
          </Button>
        </div>
      </div>

      <ReportsFilters
        dateRange={dateRange}
        onDateChange={setDateRange}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onClear={() => { setDateRange(undefined); setStatusFilter("all"); }}
      />

      <MetricsCards filteredProjectsCount={filteredProjects.length} metrics={{ totalEstimated: financialMetrics.totalEstimated, confirmedValue: financialMetrics.confirmedValue }} clients={clientStats} />

      <div className="grid gap-6 md:grid-cols-2">
        <PipelinePie data={pipelineData} />
        <ServiceBar data={serviceStats} />
      </div>

      <ProjectsTable projects={recentProjects} clientsMap={clientsMap} />

      <div className="grid gap-4 md:grid-cols-3">
        <div />
        <div />
        <div />
      </div>
    </div>
  );
};

export default Reports;