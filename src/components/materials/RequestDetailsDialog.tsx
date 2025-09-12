"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User, Package, Clock, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react";
import type { MaterialRequest, Event } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface RequestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: MaterialRequest | null;
  event: Event | null;
  materialNameMap: Record<string, string>;
}

export function RequestDetailsDialog({ open, onOpenChange, request, event, materialNameMap }: RequestDetailsDialogProps) {
  if (!request || !event) return null;

  const getStatusIcon = (status: MaterialRequest["status"]) => {
    switch (status) {
      case "Pendente":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "Aprovada":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Rejeitada":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: MaterialRequest["status"]) => {
    switch (status) {
      case "Pendente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Aprovada":
        return "bg-green-100 text-green-800 border-green-200";
      case "Rejeitada":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text(`Requisição #${request.id.slice(-6)}`, 14, 20);
    
    // Informações gerais
    doc.setFontSize(12);
    doc.text(`Status: ${request.status}`, 14, 30);
    doc.text(`Data: ${format(new Date(request.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 37);
    
    // Solicitante
    doc.setFontSize(14);
    doc.text("Solicitante", 14, 47);
    doc.setFontSize(12);
    doc.text(request.requestedBy.name, 14, 54);
    doc.text(request.requestedBy.email, 14, 61);
    doc.text(`Função: ${request.requestedBy.role}`, 14, 68);
    
    // Evento
    doc.setFontSize(14);
    doc.text("Evento Relacionado", 14, 78);
    doc.setFontSize(12);
    doc.text(event.name, 14, 85);
    doc.text(`Status: ${event.status}`, 14, 92);
    doc.text(`${format(new Date(event.startDate), "dd/MM/yyyy", { locale: ptBR })} ${event.startTime || ""}`, 14, 99);
    doc.text(event.location, 14, 106);
    
    // Itens solicitados
    doc.setFontSize(14);
    doc.text(`Itens Solicitados (${request.items.length})`, 14, 116);
    
    // Tabela de itens
    const tableData = request.items.map((item, index) => [
      index + 1,
      materialNameMap[item.materialId] || item.materialId,
      item.quantity
    ]);
    
    (doc as any).autoTable({
      head: [['#', 'Material', 'Quantidade']],
      body: tableData,
      startY: 122,
      styles: {
        fontSize: 10
      },
      headStyles: {
        fillColor: [66, 66, 66]
      }
    });
    
    // Motivo da rejeição (se aplicável)
    if (request.status === "Rejeitada" && request.reason) {
      const finalY = (doc as any).lastAutoTable.finalY;
      doc.setFontSize(14);
      doc.setTextColor(255, 0, 0);
      doc.text("Motivo da Rejeição", 14, finalY + 10);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(request.reason, 14, finalY + 17);
    }
    
    // Salvar PDF
    doc.save(`requisicao-${request.id.slice(-6)}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(request.status)}
            Requisição #{request.id.slice(-6)}
          </DialogTitle>
          <DialogDescription>
            Detalhes da requisição de materiais para o evento "{event.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status da Requisição */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant="outline" className={getStatusColor(request.status)}>
                {request.status}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(request.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </div>

          {/* Informações do Solicitante */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Solicitante
            </h4>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {request.requestedBy.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{request.requestedBy.name}</p>
                <p className="text-sm text-muted-foreground">{request.requestedBy.email}</p>
                <Badge variant="secondary" className="text-xs">
                  {request.requestedBy.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Informações do Evento */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Evento Relacionado
            </h4>
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{event.name}</span>
                <Badge variant="outline">{event.status}</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(event.startDate), "dd/MM/yyyy", { locale: ptBR })}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {event.startTime || "N/A"}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{event.location}</p>
            </div>
          </div>

          {/* Itens Solicitados */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Itens Solicitados ({request.items.length})
            </h4>
            <div className="space-y-2">
              {request.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {materialNameMap[item.materialId] || item.materialId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ID: {item.materialId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{item.quantity} unidade(s)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Motivo da Rejeição (se aplicável) */}
          {request.status === "Rejeitada" && request.reason && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-red-600">Motivo da Rejeição</h4>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{request.reason}</p>
                </div>
              </div>
            </>
          )}

          {/* Data de Decisão */}
          {request.decidedAt && (
            <>
              <Separator />
              <div className="text-xs text-muted-foreground text-center">
                Decidido em {format(new Date(request.decidedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleExportPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}