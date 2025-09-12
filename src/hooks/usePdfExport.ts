import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ExportData {
  title: string;
  events: Array<{
    name: string;
    date: string;
    revenue: number;
    costs: number;
    profit: number;
    status: string;
  }>;
  consolidated: {
    revenue: number;
    costs: number;
    profit: number;
  };
  filters: {
    dateRange?: { from: string; to: string };
    statusFilter: string;
  };
}

export const usePdfExport = () => {
  const exportToPDF = async (data: ExportData) => {
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
      const title = `${data.title} - ${format(new Date(), "MMMM yyyy", { locale: ptBR })}`;
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, 25);

      // Filtros aplicados
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      let yPos = 40;
      
      doc.text("Filtros aplicados:", margin, yPos);
      yPos += 8;
      
      if (data.filters.dateRange) {
        doc.text(`Período: ${data.filters.dateRange.from} - ${data.filters.dateRange.to}`, margin, yPos);
        yPos += 6;
      }
      
      doc.text(`Status: ${data.filters.statusFilter === "all" ? "Todos" : data.filters.statusFilter}`, margin, yPos);
      yPos += 15;

      // Métricas consolidadas
      const metrics = [
        { label: "Receita Total", value: `AOA ${data.consolidated.revenue.toLocaleString("pt-AO")}` },
        { label: "Custos Totais", value: `AOA ${data.consolidated.costs.toLocaleString("pt-AO")}` },
        { label: "Lucro Líquido", value: `AOA ${data.consolidated.profit.toLocaleString("pt-AO")}` },
        { label: "Margem (%)", value: `${((data.consolidated.profit / data.consolidated.revenue) * 100).toFixed(1)}%` }
      ];

      doc.autoTable({
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
      const tableData = data.events.slice(0, 15).map(event => [
        event.name.length > 20 ? `${event.name.substring(0, 17)}...` : event.name,
        event.date,
        `AOA ${event.revenue.toLocaleString("pt-AO")}`,
        `AOA ${event.costs.toLocaleString("pt-AO")}`,
        `AOA ${event.profit.toLocaleString("pt-AO")}`,
        event.status
      ]);

      doc.autoTable({
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
        didDrawPage: (data) => {
          // Footer em todas as páginas
          const pageCount = doc.internal.getNumberOfPages();
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

      return { success: true, fileName };
    } catch (error) {
      console.error("PDF generation error:", error);
      throw new Error("Falha ao gerar PDF");
    }
  };

  return { exportToPDF };
};