import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Event, MaterialRequest, ApproveResult } from "@/types";
import { showError, showSuccess } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RequestDetailsDialog } from "@/components/materials/RequestDetailsDialog";

interface MaterialRequestsPageProps {
  requests: MaterialRequest[];
  events: Event[];
  materialNameMap: Record<string, string>;
  onApproveRequest: (requestId: string) => ApproveResult | Promise<ApproveResult>;
  onRejectRequest: (requestId: string, reason: string) => void | Promise<void>;
}

const statusVariant = (status: MaterialRequest["status"]) => {
  switch (status) {
    case "Pendente":
      return "secondary";
    case "Aprovada":
      return "default";
    case "Rejeitada":
      return "destructive";
    default:
      return "secondary";
  }
};

// Type guard for ApproveResult failure shape
function isApproveFailure(res: ApproveResult): res is { ok: false; shortages: { materialId: string; needed: number; available: number }[] } {
  return (res as any)?.ok === false;
}

const MaterialRequestsPage = ({ requests, events, materialNameMap, onApproveRequest, onRejectRequest }: MaterialRequestsPageProps) => {
  const { user } = useAuth();
  const userRole = user?.profile?.role;
  const canManage = !!userRole && hasActionPermission(userRole, "materials:write");

  const [statusFilter, setStatusFilter] = React.useState<MaterialRequest["status"] | "all">("all");
  const [eventFilter, setEventFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectId, setRejectId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const [viewDetailsOpen, setViewDetailsOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<MaterialRequest | null>(null);
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);

  const eventsMap = React.useMemo(() => {
    const map: Record<number, string> = {};
    events.forEach((e) => (map[e.id] = e.name));
    return map;
  }, [events]);

  const filtered = React.useMemo(() => {
    return requests.filter((r) => {
      const byStatus = statusFilter === "all" || r.status === statusFilter;
      const byEvent = eventFilter === "all" || String(r.eventId) === eventFilter;
      const term = search.trim().toLowerCase();
      const bySearch =
        term.length === 0 ||
        r.requestedBy.name.toLowerCase().includes(term) ||
        r.requestedBy.email.toLowerCase().includes(term) ||
        (eventsMap[r.eventId] || "").toLowerCase().includes(term) ||
        r.items.some((it) => (materialNameMap[it.materialId] || it.materialId).toLowerCase().includes(term));
      return byStatus && byEvent && bySearch;
    });
  }, [requests, statusFilter, eventFilter, search, eventsMap, materialNameMap]);

  const handleApprove = async (id: string) => {
    if (processingId) return;
    setProcessingId(id);
    const res = await onApproveRequest(id);

    if (isApproveFailure(res)) {
      const names = res.shortages
        .map((s) => `${materialNameMap[s.materialId] || s.materialId} (precisa ${s.needed}, tem ${s.available})`)
        .join("; ");
      showError(`Estoque insuficiente: ${names}`);
    } else {
      showSuccess("Requisição aprovada e estoque atualizado.");
    }

    setProcessingId(null);
  };

  const openReject = (id: string) => {
    if (processingId) return;
    setRejectId(id);
    setRejectReason("");
    setRejectOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectId) return;
    if (!rejectReason.trim()) {
      showError("Informe o motivo da rejeição.");
      return;
    }
    setProcessingId(rejectId);
    await onRejectRequest(rejectId, rejectReason.trim());
    showSuccess("Requisição rejeitada.");
    setRejectOpen(false);
    setRejectId(null);
    setProcessingId(null);
  };

  const openViewDetails = async (request: MaterialRequest) => {
    setSelectedRequest(request);
    // Fetch event details
    const { data: eventData, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', request.eventId)
      .single();

    if (error) {
      console.error("Error fetching event:", error);
      setSelectedEvent(null);
    } else {
      setSelectedEvent({
        id: eventData.id,
        name: eventData.name,
        startDate: eventData.start_date,
        endDate: eventData.end_date,
        location: eventData.location,
        startTime: eventData.start_time,
        endTime: eventData.end_time,
        revenue: eventData.revenue,
        status: eventData.status,
        description: eventData.description,
        roster: eventData.roster,
        expenses: eventData.expenses
      });
    }
    setViewDetailsOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Requisições de Materiais</CardTitle>
          <CardDescription>
            Gerencie as solicitações de materiais feitas pelos membros da equipe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar por nome, email, evento ou material..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:col-span-2"
            />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as MaterialRequest["status"] | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aprovada">Aprovada</SelectItem>
                <SelectItem value="Rejeitada">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Eventos</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={String(event.id)}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Solicitante</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      <div>{request.requestedBy.name}</div>
                      <div className="text-xs text-muted-foreground">{request.requestedBy.email}</div>
                    </TableCell>
                    <TableCell>{eventsMap[request.eventId] || "Evento não encontrado"}</TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="link" className="p-0 h-auto">
                            Ver itens ({request.items.length})
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="grid gap-2">
                            {request.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{materialNameMap[item.materialId] || item.materialId}</span>
                                <span className="font-medium">{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => openViewDetails(request)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver Detalhes</span>
                      </Button>
                      {request.status === "Pendente" && canManage && (
                        <>
                          <Button size="sm" onClick={() => handleApprove(request.id)} disabled={!!processingId}>
                            {processingId === request.id ? "Processando..." : "Aprovar"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openReject(request.id)} disabled={!!processingId}>
                            Rejeitar
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    Nenhuma requisição encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Requisição</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição desta requisição de materiais.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Motivo da rejeição..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button onClick={confirmReject} disabled={!rejectReason.trim()}>Confirmar Rejeição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RequestDetailsDialog
        open={viewDetailsOpen}
        onOpenChange={setViewDetailsOpen}
        request={selectedRequest}
        event={selectedEvent}
        materialNameMap={materialNameMap}
      />
    </>
  );
};

export default MaterialRequestsPage;